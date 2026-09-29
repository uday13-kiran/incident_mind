from __future__ import annotations

import json
from functools import lru_cache

from groq import AsyncGroq

from app.core.config import settings


@lru_cache
def get_groq_client() -> AsyncGroq:
    return AsyncGroq(api_key=settings.groq_api_key)


async def investigate_incident(incident: object, memories: list[dict[str, str]]) -> dict:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    memory_text = "\n".join(
        f"- [{item['type']}] {item['text']}"
        for item in memories
    ) or "No relevant historical memories were found."

    prompt = f"""
Current incident:
ID: {incident.id}
Title: {incident.title}
Service: {incident.service}
Severity: {incident.severity}
Status: {incident.status}
Description: {incident.description}
Root cause already recorded: {incident.root_cause or 'none'}
Resolution already recorded: {incident.resolution or 'none'}

Relevant historical memories from Hindsight:
{memory_text}

Act as an incident investigation assistant. Use the historical memories as context, but do not invent facts.
Return JSON only with exactly these keys:
summary, likely_root_cause, recommended_actions, confidence, related_memory_ids
Where recommended_actions is an array of short actionable strings, confidence is one of low/medium/high,
and related_memory_ids is an array of memory IDs from the supplied memories.
"""

    response = await get_groq_client().chat.completions.create(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": "You are IncidentMind, a careful SRE incident investigation assistant. Be concise and evidence-based.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {
            "summary": raw,
            "likely_root_cause": "Unable to parse a structured root cause.",
            "recommended_actions": [],
            "confidence": "low",
            "related_memory_ids": [],
        }

    return {
        "summary": str(data.get("summary", "")),
        "likely_root_cause": str(data.get("likely_root_cause", "")),
        "recommended_actions": [str(item) for item in data.get("recommended_actions", [])],
        "confidence": str(data.get("confidence", "low")),
        "related_memory_ids": [str(item) for item in data.get("related_memory_ids", [])],
    }
