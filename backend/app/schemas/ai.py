from pydantic import BaseModel, Field


class InvestigateRequest(BaseModel):
    query: str | None = Field(default=None, max_length=1000)


class MemoryItem(BaseModel):
    id: str
    type: str
    text: str
    context: str


class InvestigationResponse(BaseModel):
    incident_id: int
    summary: str
    likely_root_cause: str
    recommended_actions: list[str]
    confidence: str
    related_memory_ids: list[str]
    memories: list[MemoryItem]
