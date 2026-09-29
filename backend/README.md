# IncidentMind Backend

FastAPI + SQLAlchemy backend for the IncidentMind hackathon application.

## Added in this version

- Existing organization registration/login and incident CRUD preserved.
- Hindsight persistent memory service.
- Groq investigation service.
- `POST /api/v1/ai/investigate/{incident_id}` for memory-assisted incident analysis.
- `GET /api/v1/ai/memory?query=...` for memory search.
- CORS for the Vite frontend.

## Run

1. Copy `.env.example` to `.env` and fill in the API keys.
2. Install dependencies with `uv sync` or `pip install -e .`.
3. Run `uvicorn app.main:app --reload` from the backend folder.

The frontend expects the API at `http://localhost:8000` by default.
