from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password
from app.models.organization import Organization
from app.schemas.auth import OrganizationRegister

def get_organization_by_email(db: Session, email: str) -> Organization | None:
    return db.scalar(select(Organization).where(Organization.email == email.lower()))

def create_organization(db: Session, payload: OrganizationRegister) -> Organization | None:
    email = str(payload.email).lower()
    if get_organization_by_email(db, email):
        return None
    organization = Organization(name=payload.name, email=email, password_hash=hash_password(payload.password))
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization

def authenticate_organization(db: Session, email: str, password: str) -> Organization | None:
    organization = get_organization_by_email(db, email)
    return organization if organization and verify_password(password, organization.password_hash) else None

