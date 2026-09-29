from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field

class IncidentStatus(str, Enum):
    open = "open"
    investigating = "investigating"
    resolved = "resolved"
    closed = "closed"

class IncidentSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class IncidentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    service: str = Field(min_length=1, max_length=255)
    severity: IncidentSeverity
    description: str = Field(min_length=1)

class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    service: str | None = Field(default=None, min_length=1, max_length=255)
    severity: IncidentSeverity | None = None
    description: str | None = Field(default=None, min_length=1)
    status: IncidentStatus | None = None
    root_cause: str | None = None
    resolution: str | None = None

class IncidentResponse(BaseModel):
    id: int
    organization_id: int
    title: str
    service: str
    severity: IncidentSeverity
    description: str
    status: IncidentStatus
    root_cause: str | None
    resolution: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

