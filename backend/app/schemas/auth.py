from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class OrganizationRegister(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not (value := value.strip()):
            raise ValueError("name must not be blank")
        return value

class OrganizationResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

