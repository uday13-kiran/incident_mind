from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentUpdate

def create_incident(db: Session, organization_id: int, payload: IncidentCreate) -> Incident:
    incident = Incident(organization_id=organization_id, title=payload.title, service=payload.service, severity=payload.severity.value, description=payload.description, status="open")
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

def list_incidents(db: Session, organization_id: int) -> list[Incident]:
    query = select(Incident).where(Incident.organization_id == organization_id).order_by(Incident.created_at.desc(), Incident.id.desc())
    return list(db.scalars(query))

def get_incident(db: Session, organization_id: int, incident_id: int) -> Incident | None:
    return db.scalar(select(Incident).where(Incident.id == incident_id, Incident.organization_id == organization_id))

def update_incident(db: Session, incident: Incident, payload: IncidentUpdate) -> Incident:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(incident, field, value.value if hasattr(value, "value") else value)
    db.commit()
    db.refresh(incident)
    return incident

def delete_incident(db: Session, incident: Incident) -> None:
    db.delete(incident)
    db.commit()

