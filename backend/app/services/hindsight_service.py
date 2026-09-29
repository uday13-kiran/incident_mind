from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache

from hindsight_client import Hindsight

from app.core.config import settings


@lru_cache
def get_hindsight_client() -> Hindsight:
    kwargs = {"base_url": settings.hindsight_api_url, "timeout": 30.0}
    if settings.hindsight_api_key:
        kwargs["api_key"] = settings.hindsight_api_key
    return Hindsight(**kwargs)


def bank_id_for_organization(organization_id: int) -> str:
    return f"org-{organization_id}"


def ensure_bank(organization_id: int) -> str:
    bank_id = bank_id_for_organization(organization_id)
    client = get_hindsight_client()
    try:
        client.create_bank(bank_id=bank_id, name=f"IncidentMind Organization {organization_id}")
    except Exception:
        # The bank may already exist. The following recall/retain call will
        # surface a real connection or authentication problem if one exists.
        pass
    return bank_id


def retain_incident(organization_id: int, incident: object, event: str = "incident_update") -> None:
    bank_id = ensure_bank(organization_id)
    content = (
        f"Incident #{incident.id}: {incident.title}. "
        f"Service: {incident.service}. Severity: {incident.severity}. "
        f"Status: {incident.status}. Description: {incident.description}. "
        f"Root cause: {incident.root_cause or 'not known'}. "
        f"Resolution: {incident.resolution or 'not resolved'}."
    )
    get_hindsight_client().retain(
        bank_id=bank_id,
        content=content,
        context=event,
        timestamp=datetime.now(timezone.utc),
        metadata={"incident_id": str(incident.id), "organization_id": str(organization_id)},
    )


def recall_incident_memories(organization_id: int, query: str, max_tokens: int = 3500) -> list[dict[str, str]]:
    bank_id = ensure_bank(organization_id)
    result = get_hindsight_client().recall(
        bank_id=bank_id,
        query=query,
        max_tokens=max_tokens,
        budget="mid",
    )
    return [
        {"id": str(memory.id), "type": str(memory.type), "text": memory.text, "context": str(memory.context or "")}
        for memory in result.results
    ]
