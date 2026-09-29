from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_organization
from app.models.organization import Organization
from app.schemas.ai import InvestigationResponse, InvestigateRequest, MemoryItem
from app.services.groq_service import investigate_incident
from app.services.hindsight_service import recall_incident_memories, retain_incident
from app.services.incident_service import get_incident

router = APIRouter(prefix="/ai", tags=["AI investigator"])


@router.post("/investigate/{incident_id}", response_model=InvestigationResponse)
async def investigate(
    incident_id: int,
    payload: InvestigateRequest | None = None,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
) -> InvestigationResponse:
    incident = get_incident(db, organization.id, incident_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    query = (payload.query if payload else None) or (
        f"Find previous incidents similar to '{incident.title}' for service '{incident.service}', "
        f"especially incidents with severity '{incident.severity}', and explain what resolved them."
    )

    try:
        await asyncio.to_thread(retain_incident, organization.id, incident, "current_incident_investigation")
        memories = await asyncio.to_thread(recall_incident_memories, organization.id, query)
        analysis = await investigate_incident(incident, memories)
        await asyncio.to_thread(
            retain_incident,
            organization.id,
            incident,
            "ai_investigation_completed",
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI investigation failed: {exc}") from exc

    return InvestigationResponse(
        incident_id=incident.id,
        memories=[MemoryItem(**memory) for memory in memories],
        **analysis,
    )


@router.get("/memory", response_model=list[MemoryItem])
def memory_search(
    query: str,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
) -> list[MemoryItem]:
    del db
    try:
        memories = recall_incident_memories(organization.id, query)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Memory search failed: {exc}") from exc
    return [MemoryItem(**memory) for memory in memories]
