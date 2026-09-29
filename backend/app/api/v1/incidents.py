from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.dependencies.auth import get_current_organization
from app.models.organization import Organization
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate
from app.services import incident_service

router = APIRouter(prefix="/incidents", tags=["incidents"])

def owned_or_404(db: Session, organization: Organization, incident_id: int):
    incident = incident_service.get_incident(db, organization.id, incident_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return incident

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create(payload: IncidentCreate, db: Session = Depends(get_db), organization: Organization = Depends(get_current_organization)) -> IncidentResponse:
    return incident_service.create_incident(db, organization.id, payload)

@router.get("", response_model=list[IncidentResponse])
def list_all(db: Session = Depends(get_db), organization: Organization = Depends(get_current_organization)) -> list[IncidentResponse]:
    return incident_service.list_incidents(db, organization.id)

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_one(incident_id: int, db: Session = Depends(get_db), organization: Organization = Depends(get_current_organization)) -> IncidentResponse:
    return owned_or_404(db, organization, incident_id)

@router.put("/{incident_id}", response_model=IncidentResponse)
def update(incident_id: int, payload: IncidentUpdate, db: Session = Depends(get_db), organization: Organization = Depends(get_current_organization)) -> IncidentResponse:
    return incident_service.update_incident(db, owned_or_404(db, organization, incident_id), payload)

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(incident_id: int, db: Session = Depends(get_db), organization: Organization = Depends(get_current_organization)) -> Response:
    incident_service.delete_incident(db, owned_or_404(db, organization, incident_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)

