from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.security import create_access_token
from app.database.database import get_db
from app.schemas.auth import OrganizationRegister, OrganizationResponse, Token
from app.services.auth_service import authenticate_organization, create_organization

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def register(payload: OrganizationRegister, db: Session = Depends(get_db)) -> OrganizationResponse:
    organization = create_organization(db, payload)
    if organization is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    return organization

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    organization = authenticate_organization(db, form_data.username, form_data.password)
    if organization is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    return Token(access_token=create_access_token(organization.id))

