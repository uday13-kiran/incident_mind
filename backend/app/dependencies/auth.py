from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.security import JWTError, decode_access_token
from app.database.database import get_db
from app.models.organization import Organization

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})

def get_current_organization(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Organization:
    try:
        subject = decode_access_token(token).get("sub")
        organization_id = int(subject) if subject is not None else None
    except (JWTError, TypeError, ValueError):
        raise credentials_exception
    if organization_id is None or (organization := db.get(Organization, organization_id)) is None:
        raise credentials_exception
    return organization

