# IncidentMind — Hackathon Full Stack

This package keeps the existing IncidentMind organization-authentication and incident CRUD backend and adds the AI memory layer plus a React frontend.

## Architecture

React/Vite → FastAPI → PostgreSQL/SQLite for structured incident state
                   ↘ Hindsight for persistent memory
                   ↘ Groq for investigation reasoning

## Important

Do not put GROQ_API_KEY or HINDSIGHT_API_KEY in the frontend. They belong only in `backend/.env`.

## Start backend

```bash
cd backend
cp .env.example .env
# fill DATABASE_URL, GROQ_API_KEY and HINDSIGHT_API_KEY
uv sync
uvicorn app.main:app --reload
```

## Start frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend defaults to `http://localhost:8000/api/v1`.

## What was added

Backend:
- `services/hindsight_service.py`
- `services/groq_service.py`
- `schemas/ai.py`
- `api/v1/ai.py`
- Hindsight/Groq settings and CORS

Frontend:
- Authentication
- Dashboard
- Incident list/filter/create
- Incident detail
- AI Investigator
- Hindsight Memory search
- Reports
- Settings
- Butter-yellow + royal-iris skeuomorphic visual theme

## API flow

`POST /api/v1/ai/investigate/{incident_id}`:
1. Load the organization-owned incident.
2. Retain current incident context in the organization's Hindsight bank.
3. Recall similar historical memories.
4. Send the incident + retrieved memories to Groq.
5. Return summary, likely cause, recommendations, confidence and relevant memories.

`GET /api/v1/ai/memory?query=...` searches the organization's Hindsight bank.
