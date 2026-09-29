
# IncidentMind

> **An incident-response agent that remembers what happened, learns from
> how incidents were resolved, and uses that experience when the next
> incident arrives.**

IncidentMind is built around a simple operational problem:

**production systems do not fail in isolation, but most
incident-response tooling treats every incident as a new event.**

An engineer may face the same database saturation, connection-pool
exhaustion, API latency spike, deployment regression, or dependency
failure months after the original incident. The organization may already
have solved it before, but the useful knowledge is usually scattered
across incident tickets, Slack threads, dashboards, postmortems, logs,
and the memories of whoever happened to be on call.

IncidentMind turns those past incidents into **persistent operational
experience**.

The key technology enabling that behavior is
[Hindsight](https://github.com/vectorize-io/hindsight), an agent memory
system designed to help agents **learn over time rather than simply
remember conversation history**.

------------------------------------------------------------------------

<img width="1600" height="900" alt="hing sight" src="https://github.com/user-attachments/assets/88c86b4d-af99-47fe-bf4a-658176494930" />


## Why Hindsight makes IncidentMind possible

A conventional incident assistant can retrieve documents or incident
records, but retrieval alone does not give an agent a durable
understanding of how an organization has experienced failures.

Hindsight provides a memory model built around three operations:

``` text
                    ┌──────────────────────┐
                    │   IncidentMind       │
                    │   Incident Agent     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
           RETAIN            RECALL           REFLECT
          Learn from       Find relevant     Reason over
          resolved         past incidents    accumulated
          incidents       and experience     experience
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    Better incident response
                    on future incidents
```

Hindsight's [retain](https://hindsight.vectorize.io/developer/retain)
operation stores information and extracts structured facts, entities,
relationships, and temporal information.
[Recall](https://hindsight.vectorize.io/developer/retrieval) retrieves
relevant memories using multiple strategies, including semantic,
keyword, graph, and temporal retrieval.
[Reflect](https://hindsight.vectorize.io/developer/reflect) performs
deeper reasoning over existing memories.

That is a much better match for incident response than treating every
historical incident as an unrelated text chunk.

### The important distinction

``` text
Traditional RAG

Incident → Search documents → Retrieve chunks → Generate answer


IncidentMind + Hindsight

New Incident
     │
     ├── Current incident facts
     │
     ├── Recall previous incidents
     │      ├── Similar symptoms
     │      ├── Same service/entity
     │      ├── Related infrastructure
     │      ├── Relevant time/history
     │      └── Previous resolutions
     │
     ├── Reflect on accumulated experience
     │
     └── Generate investigation guidance
                 │
                 ▼
             Resolution
                 │
                 ▼
             Retain outcome
                 │
                 ▼
       Future incidents become easier
```

Hindsight's documentation describes this as persistent, structured
memory rather than a plain vector store. Its recall pipeline combines
semantic, BM25 keyword, graph, and temporal retrieval, then fuses and
reranks the results. See the [Hindsight retrieval
documentation](https://hindsight.vectorize.io/developer/retrieval) and
[RAG vs. Hindsight
comparison](https://hindsight.vectorize.io/developer/rag-vs-hindsight).

------------------------------------------------------------------------

## The real-world incident problem

Incident response is rarely difficult because nobody has ever seen the
failure before.

It is difficult because **the organization cannot reliably connect
today's symptoms to yesterday's experience fast enough**.

Consider a production incident:

> API response times suddenly increase.

An engineer might initially see:

``` text
API latency ↑
      │
      ├── Database CPU?
      ├── Connection pool?
      ├── Network?
      ├── Recent deployment?
      ├── Dependency?
      └── Traffic spike?
```

Now imagine that three months earlier the organization experienced:

``` text
PostgreSQL connection pool exhaustion
        ↓
Database connections saturated
        ↓
API requests waited for connections
        ↓
API response time increased
        ↓
Pool configuration was corrected
        ↓
Incident resolved
```

The information may exist in an old postmortem, but a stateless
assistant may not connect the two situations.

IncidentMind is designed to make that connection.

------------------------------------------------------------------------

# The IncidentMind learning loop

<img width="1023" height="526" alt="image" src="https://github.com/user-attachments/assets/1cefec01-3d24-42f9-a281-0b6b883b2a27" />


IncidentMind follows a continuous operational learning cycle.

``` text
        ┌─────────────────────────┐
        │     New Incident        │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │       INVESTIGATE       │
        │                         │
        │ Current incident +      │
        │ Hindsight recall        │
        │ + reflection            │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │      Investigation      │
        │      Recommendation     │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │       Resolution        │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │          LEARN          │
        │                         │
        │ Retain investigation,  │
        │ root cause, resolution, │
        │ lesson and outcome      │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │   Hindsight Memory      │
        │   Bank for the Org      │
        └────────────┬────────────┘
                     │
                     └──────► Future incidents
```

The memory cycle behind those two moments is:


This is the core **Retain → Recall → Reflect** model that IncidentMind uses to turn completed incidents into reusable experience.

The agent therefore has two important moments:

### 1. Investigate

When an incident occurs, IncidentMind uses the current incident context
and searches the organization's accumulated incident experience.

It can look for:

-   similar symptoms
-   previously affected services
-   recurring infrastructure components
-   previous root causes
-   previous remediation steps
-   related incidents
-   temporal patterns
-   connected entities
-   previous lessons and outcomes

### 2. Learn

After an incident is resolved, IncidentMind stores the useful outcome
back into memory.

A completed incident can contribute:

``` text
Investigation
Root cause
Resolution
Lesson learned
Success / failure outcome
Relevant context
```

The next incident is therefore not starting from an empty memory.

------------------------------------------------------------------------

# Why ordinary incident databases are not enough

PostgreSQL remains the **operational source of truth** for IncidentMind.

It stores the current structured state of the system:

``` text
Organization
    │
    └── Incidents
          ├── title
          ├── description
          ├── severity
          ├── status
          ├── timestamps
          └── ownership
```

But a relational incident record answers questions such as:

> "What incidents exist?"

It does not automatically provide the agent with a learned network of
experience such as:

> "This looks similar to the PostgreSQL connection-pool incident we had
> previously, and that incident eventually traced the API latency to
> exhausted database connections."

That is the role of Hindsight.

<img width="1600" height="900" alt="hing sight" src="https://github.com/user-attachments/assets/6e7a6170-48fc-4092-a071-22bc2549b312" />


The idea is simple: IncidentMind should preserve the **story and relationships around an incident**, not merely store another isolated database row.

### IncidentMind separates the responsibilities

  -----------------------------------------------------------------------
  Layer                               Responsibility
  ----------------------------------- -----------------------------------
  **PostgreSQL**                      Current operational truth and
                                      structured incident records

  **Hindsight**                       Persistent incident experience and
                                      learned context

  **LLM / Agent**                     Reasoning over current evidence and
                                      recalled experience

  **FastAPI**                         Authentication, API orchestration
                                      and application boundary
  -----------------------------------------------------------------------

This separation keeps the system understandable instead of turning one
database into a magical bucket containing every thought humanity has
ever had.

------------------------------------------------------------------------

# Hindsight memory model


<img width="6755" height="3097" alt="hindsight-memory" src="https://github.com/user-attachments/assets/482644aa-0520-4e0e-a98a-56a3748f3efd" />


Hindsight organizes memories into different forms rather than treating
everything as a flat list.

The important concepts for IncidentMind are:

-   **World facts**: facts about the environment and systems
-   **Experiences**: what happened during previous incidents
-   **Observations**: consolidated, evidence-backed knowledge formed
    from multiple memories
-   **Mental models**: higher-level understanding that can evolve as new
    memories arrive

See the official [Hindsight core
concepts](https://hindsight.vectorize.io/developer/mental-models) and
[observations
documentation](https://hindsight.vectorize.io/developer/observations).

This is particularly useful for incident response because operational
knowledge changes.

For example:

``` text
Incident A:
"API failed because PostgreSQL connections were exhausted."

Incident B:
"API latency increased because PostgreSQL connections were exhausted."

Incident C:
"Pool size was increased, but latency returned during a traffic spike."
```

A useful memory system should not merely keep three disconnected text
records.

It should be able to build a stronger observation around the accumulated
evidence and revise that understanding when new evidence contradicts or
extends it.

Hindsight's observation system is designed to consolidate related facts
while preserving supporting evidence and evolving the observation as new
information arrives.

------------------------------------------------------------------------

# Multi-strategy incident recall

Incident investigation often depends on more than semantic similarity.

Suppose an engineer asks:

> "What happened the last time the PostgreSQL connection pool caused API
> latency?"

Different signals matter:

  -----------------------------------------------------------------------
  Signal                              IncidentMind use
  ----------------------------------- -----------------------------------
  **Semantic**                        Find incidents describing similar
                                      behavior

  **Keyword / BM25**                  Match exact service names, error
                                      messages, identifiers

  **Graph**                           Follow relationships between
                                      services, databases, incidents and
                                      causes

  **Temporal**                        Find incidents from a specific
                                      period or sequence

  **Reranking**                       Prioritize the most relevant
                                      memories
  -----------------------------------------------------------------------

Hindsight's recall system runs complementary retrieval strategies and
combines their results before reranking. This is documented in the
[Recall
architecture](https://hindsight.vectorize.io/developer/retrieval).

This matters because an incident query such as:

``` text
"What happened in the March PostgreSQL outage?"
```

contains both **what** and **when**.

A query such as:

``` text
"Why did checkout-api fail after deployment 42?"
```

may depend on entities, exact identifiers, relationships and causal
history.

A single vector similarity search is not guaranteed to represent all of
that.

------------------------------------------------------------------------

# IncidentMind memory isolation

<img width="1600" height="805" alt="WhatsApp Image 2026-09-29 at 10 41 49 PM" src="https://github.com/user-attachments/assets/704ac0d4-c6c3-4fdf-a520-ae73bd1d1bb4" />


Each organization gets its own Hindsight memory bank.

``` text
Organization A
    └── incidentmind-org-A
          ├── experiences
          ├── observations
          └── learned incident knowledge

Organization B
    └── incidentmind-org-B
          ├── experiences
          ├── observations
          └── learned incident knowledge
```

The application uses a bank identifier derived from the authenticated
organization:

``` text
incidentmind-org-{organization_id}
```

This keeps the memory boundary aligned with the application's
organization boundary.

Hindsight's documentation describes banks as isolated memory stores for
a user, agent or project. See the [memory bank
documentation](https://hindsight.vectorize.io/developer/mental-models)
and the [per-user memory
pattern](https://github.com/vectorize-io/hindsight/blob/main/hindsight-docs/src/pages/cookbook/recipes/per-user-memory.md).

------------------------------------------------------------------------

# Architecture

``` text
                         ┌───────────────────────┐
                         │        Client         │
                         │  Dashboard / API UI   │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │       FastAPI         │
                         │                       │
                         │ Auth + API + Agent    │
                         └───────────┬───────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
        ┌──────────────────┐                   ┌──────────────────┐
        │   PostgreSQL     │                   │    IncidentMind  │
        │                  │                   │      Agent       │
        │ Organizations    │                   │                  │
        │ Incidents        │                   │ Investigate      │
        │ Structured state │                   │ Learn            │
        └──────────────────┘                   └────────┬─────────┘
                                                        │
                                      ┌─────────────────┼─────────────────┐
                                      │                 │                 │
                                      ▼                 ▼                 ▼
                                   Recall            Reflect           Retain
                                      │                 │                 │
                                      └─────────────────┼─────────────────┘
                                                        ▼
                                             ┌────────────────────┐
                                             │      Hindsight     │
                                             │    Memory Bank     │
                                             │                    │
                                             │ Experiences        │
                                             │ Observations       │
                                             │ Relationships      │
                                             │ Temporal context   │
                                             └────────────────────┘
```

------------------------------------------------------------------------

# Current backend structure

IncidentMind was intentionally started with a small FastAPI backend
before introducing the agent layer.

``` text
incidentmind/
├── main.py
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── incidents.py
│   │       └── agent.py
│   │
│   ├── agent/
│   │   ├── agent.py
│   │   ├── memory.py
│   │   ├── prompts.py
│   │   ├── tools.py
│   │   ├── orchestrator.py
│   │   └── models.py
│   │
│   ├── models/
│   │   ├── organization.py
│   │   └── incident.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── incident.py
│   │   └── agent.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   └── agent_service.py
│   │
│   └── core/
│       ├── config.py
│       ├── security.py
│       └── database.py
│
├── tests/
├── .env
├── requirements.txt
└── README.md
```

The project deliberately keeps the application database simple:

### `organizations`

Stores organization authentication and identity.

### `incidents`

Stores the organization's structured incident records.

The memory layer is intentionally separated from these tables instead of
trying to reproduce Hindsight inside the application's own database.

------------------------------------------------------------------------

# API flow

## Authentication

``` text
POST /api/v1/auth/register
POST /api/v1/auth/login
```

Authentication establishes the organization context used by the rest of
the API.

## Incident operations

Incident records belong to the authenticated organization.

## Agent

``` text
POST /api/v1/agent/investigate
POST /api/v1/agent/learn
```

### Investigate

Conceptually:

``` text
Current Incident
      │
      ├── PostgreSQL context
      │
      └── Hindsight Recall
              │
              ▼
        Relevant memories
              │
              ▼
        Hindsight Reflect
              │
              ▼
        Agent reasoning
              │
              ▼
     Investigation guidance
```

### Learn

Conceptually:

``` text
Resolved Incident
      │
      ├── Investigation
      ├── Root cause
      ├── Resolution
      ├── Lesson
      └── Outcome
              │
              ▼
      Hindsight Retain
              │
              ▼
       Future memory
```

------------------------------------------------------------------------

# Demonstration: an incident that remembers

The current Hindsight memory visualization already shows the type of
connected incident knowledge IncidentMind is intended to build.

Example memories visible in the demonstration include relationships
around:

``` text
Incident #7
   │
   ├── PostgreSQL server
   │
   ├── Connection pool size
   │
   └── API response times
```

Instead of seeing only one incident row, the memory layer exposes a
connected network of related information.

That is the behavior IncidentMind is trying to demonstrate:

> **An incident response agent should not only remember the previous
> incident. It should remember the relationships between symptoms,
> systems, causes and outcomes.**

------------------------------------------------------------------------

# Hindsight demonstration videos

The following videos are the Hindsight demonstrations referenced by this
project.

### Hindsight learning demonstration

[Watch the Hindsight learning
demonstration](https://github.com/user-attachments/assets/923b798d-3581-4897-bb62-9cfa5a931682)

### Hindsight Retain demonstration

[Watch the Hindsight Retain
demonstration](https://github.com/user-attachments/assets/0555177d-6635-467d-97cb-9dcddb999b15)

### Hindsight Reflect demonstration

[Watch the Hindsight Reflect
demonstration](https://github.com/user-attachments/assets/1dd8aa20-5ad0-4536-823e-0fadf8051d57)

------------------------------------------------------------------------

# Example incident lifecycle

Imagine IncidentMind receives:

``` json
{
  "title": "Checkout API latency spike",
  "description": "Checkout requests are taking more than 8 seconds.",
  "severity": "high",
  "status": "investigating"
}
```

The agent does not immediately treat this as an isolated problem.

### Step 1: Understand the current incident

``` text
Checkout API
Latency spike
Current severity: HIGH
```

### Step 2: Recall previous experience

The memory layer searches for:

``` text
checkout latency
API latency
database connection pool
PostgreSQL
previous outages
similar symptoms
```

### Step 3: Connect related memories

The agent may discover previous experiences involving:

``` text
PostgreSQL
      ↓
Connection pool exhaustion
      ↓
Request queueing
      ↓
API latency
```

### Step 4: Reflect

The agent reasons over the relevant memories and current incident
context.

The result is not simply:

> "Here are five similar documents."

Instead, it can produce investigation guidance such as:

``` text
Previous incidents show that this service has experienced
latency caused by database connection exhaustion.

Investigate:
1. Current PostgreSQL connection utilization.
2. Connection-pool saturation.
3. Waiting requests.
4. Recent pool configuration changes.
5. Traffic compared with the previous incident.
```

### Step 5: Resolve

The engineering team investigates the suggested paths and resolves the
incident.

### Step 6: Learn

The final investigation and resolution are retained.

The next occurrence now has more experience available to it.

------------------------------------------------------------------------

# What IncidentMind is designed to improve

  -----------------------------------------------------------------------
  Traditional incident workflow       IncidentMind
  ----------------------------------- -----------------------------------
  Every incident starts with limited  Past incident experience is
  context                             recalled

  Engineers search old tickets        Agent retrieves relevant memories
  manually                            

  Knowledge remains scattered         Experience is consolidated into
                                      memory

  Similarity is mostly document-based Semantic + keyword + graph +
                                      temporal retrieval

  Resolved incidents become static    Resolved incidents become future
  records                             experience

  Tribal knowledge disappears when    Organizational incident knowledge
  people change teams                 persists

  Root causes are hard to connect     Relationships between entities and
  across incidents                    incidents can be recalled

  Historical context is often ignored Historical context becomes part of
                                      investigation
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# Problems IncidentMind targets

### 1. Repeated incidents

Organizations often encounter variations of the same failure.

IncidentMind attempts to surface previous experiences instead of forcing
engineers to rediscover the same investigation path.

### 2. Lost tribal knowledge

The engineer who remembers exactly how a previous outage was fixed may
not be available during the next incident.

IncidentMind aims to preserve that operational experience in the
organization's memory bank.

### 3. Context fragmentation

The useful explanation may be distributed across:

``` text
Incident ticket
    +
Logs
    +
Postmortem
    +
Resolution notes
    +
Previous incidents
```

IncidentMind's memory layer is designed to connect retained information
rather than treating every record as an isolated fact.

### 4. Time-dependent incidents

Incident response frequently depends on chronology:

``` text
Deployment
    ↓
Configuration change
    ↓
Error rate increase
    ↓
Latency spike
    ↓
Rollback
    ↓
Recovery
```

Hindsight's temporal retrieval and memory model provide a foundation for
reasoning over this kind of history.

### 5. Evolving operational knowledge

The correct explanation can change as new incidents occur.

Hindsight observations are designed to evolve when new evidence
supports, contradicts, or extends existing knowledge.

------------------------------------------------------------------------

# What IncidentMind is not

IncidentMind is **not** intended to replace:

-   monitoring systems
-   logs
-   metrics
-   traces
-   incident-management systems
-   human incident commanders
-   production safeguards

It is an **intelligence and memory layer** that helps an
incident-response workflow use accumulated experience.

The source of truth for the current application state remains
PostgreSQL. Hindsight supplies persistent memory and learned context.

------------------------------------------------------------------------

# Technology stack

  ----------------------------------------------------------------------------------------------------
  Component                           Technology
  ----------------------------------- ----------------------------------------------------------------
  Backend                             [FastAPI](https://fastapi.tiangolo.com/)

  Language                            [Python](https://www.python.org/)

  Database                            [PostgreSQL](https://www.postgresql.org/)

  ORM                                 [SQLAlchemy](https://www.sqlalchemy.org/)

  Validation                          [Pydantic](https://docs.pydantic.dev/)

  Authentication                      JWT

  Password security                   Password hashing

  Agent memory                        [Hindsight](https://github.com/vectorize-io/hindsight)

  Hindsight client                    [hindsight-client](https://pypi.org/project/hindsight-client/)

  Memory architecture                 Retain → Recall → Reflect

  API server                          Uvicorn
  ----------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# Running the project

## 1. Clone the repository

``` bash
git clone <YOUR_REPOSITORY_URL>
cd incidentmind
```

## 2. Create a virtual environment

``` bash
python -m venv .venv
```

### Windows

``` bash
.venv\Scripts\activate
```

### Linux / macOS

``` bash
source .venv/bin/activate
```

## 3. Install dependencies

``` bash
pip install -r requirements.txt
```

## 4. Configure environment variables

Create a `.env` file:

``` env
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/incidentmind

JWT_SECRET_KEY=<your-secret>
JWT_ALGORITHM=HS256

HINDSIGHT_API_URL=http://localhost:8888
HINDSIGHT_API_KEY=<your-key-if-required>

OPENAI_API_KEY=<your-key>
```

Do not commit `.env` to Git.

## 5. Start Hindsight

The official Hindsight documentation provides Docker, Python, Kubernetes
and managed deployment options.

For local Docker:

``` bash
docker run -it --pull always \
  --name hindsight \
  --restart unless-stopped \
  -p 8888:8888 \
  -p 9999:9999 \
  -e HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY \
  -v hindsight-data:/home/hindsight/.pg0 \
  ghcr.io/vectorize-io/hindsight:latest
```

Then:

``` text
Hindsight API → http://localhost:8888
Hindsight UI  → http://localhost:9999
```

See the official [Hindsight installation
documentation](https://hindsight.vectorize.io/developer/installation).

## 6. Start IncidentMind

The project keeps `main.py` at the repository root:

``` bash
uvicorn main:app --reload
```

------------------------------------------------------------------------

# Hindsight resources

-   [Hindsight GitHub
    repository](https://github.com/vectorize-io/hindsight)
-   [Hindsight documentation](https://hindsight.vectorize.io/)
-   [Hindsight
    Cookbook](https://github.com/vectorize-io/hindsight-cookbook)
-   [Python SDK](https://hindsight.vectorize.io/sdks/python)
-   [REST API reference](https://hindsight.vectorize.io/api-reference)
-   [Retain
    documentation](https://hindsight.vectorize.io/developer/retain)
-   [Recall
    documentation](https://hindsight.vectorize.io/developer/retrieval)
-   [Reflect
    documentation](https://hindsight.vectorize.io/developer/reflect)
-   [Observations](https://hindsight.vectorize.io/developer/observations)
-   [Mental
    models](https://hindsight.vectorize.io/developer/mental-models)
-   [RAG vs
    Hindsight](https://hindsight.vectorize.io/developer/rag-vs-hindsight)
-   [LongMemEval benchmarks](https://benchmarks.hindsight.vectorize.io/)
-   [Hindsight paper](https://arxiv.org/abs/2512.12818)

------------------------------------------------------------------------

# Project philosophy

IncidentMind is built around one idea:

> **The next incident should benefit from the incidents that came before
> it.**

A traditional incident system records history.

An incident assistant can search history.

**IncidentMind is designed to learn from history.**

The goal is not to make an AI that merely says:

> "I found a similar incident."

The goal is to build an agent that can use accumulated incident
experience to answer:

> **"What have we learned from incidents like this, what relationships
> matter, and what should we investigate now?"**

That is the difference between an incident database and an incident
memory agent.

------------------------------------------------------------------------

## License

This project is intended as a hackathon / experimental AI-agent project.
Add the project's final license here when the repository license is
decided.

------------------------------------------------------------------------

## Acknowledgements

IncidentMind uses [Hindsight](https://github.com/vectorize-io/hindsight)
by [Vectorize.io](https://vectorize.io/) as its long-term agent memory
layer.

Hindsight's open-source project provides the memory infrastructure that
makes the IncidentMind learning loop possible.
