# Atom Goal Management Portal

Atom is a role-based performance management system for defining goals, approving submissions, tracking quarterly achievements, handling escalations, and generating analytics.

The application is built on Next.js App Router with Prisma and PostgreSQL, and includes AI-assisted goal drafting and quality review workflows.

## Table of Contents
- [Core Capabilities](#core-capabilities)
- [Role Model](#role-model)
- [Architecture](#architecture)
- [Goal and Escalation Lifecycles](#goal-and-escalation-lifecycles)
- [Data Model](#data-model)
- [API Surface](#api-surface)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Runbook](#runbook)
- [Documentation Folder](#documentation-folder)

## Core Capabilities
- Goal creation with UoM models (`MIN`, `MAX`, `TIMELINE`, `ZERO`)
- Weightage governance (minimum goal weightage and 100% total allocation checks)
- Manager approval and rework loop (`DRAFT -> SUBMITTED -> APPROVED/REWORK`)
- Quarterly achievement logging and manager check-in comments
- Shared goal distribution to multiple recipients with recipient-level weightage
- Rule-based escalation engine with resolution workflow
- Admin cycle controls (active FY, goal window, check-in window)
- Analytics dashboard with filters and CSV/XLSX export
- In-app AI assistant and goal quality tools

## Role Model
| Role | Typical Responsibilities |
|---|---|
| `EMPLOYEE` | Create and submit goals, log quarterly achievements, monitor notifications |
| `MANAGER` | Approve/rework goals, review check-ins, push shared goals, monitor team metrics |
| `ADMIN` | Manage cycles, unlock goals, configure escalation rules, resolve escalations, system oversight |

## Architecture

### System Architecture
```mermaid
flowchart TD
    U["Users<br/>Employee / Manager / Admin"] --> UI["Next.js Web App<br/>App Router + Client Components"]

    UI --> AUTH["Auth Routes<br/>/api/auth/catch-all-nextauth"]
    UI --> DOMAIN["Domain APIs<br/>Goals, Check-ins, Shared Goals, Reports, Admin"]
    UI --> AIAPI["AI API<br/>/api/chat"]

    AUTH --> PRISMA["Prisma Client<br/>PrismaPg Adapter"]
    DOMAIN --> PRISMA

    DOMAIN --> ESC["Escalation Engine<br/>lib/escalation + lib/escalationScheduler"]
    ESC --> PRISMA

    PRISMA --> DB[("PostgreSQL")]
    AIAPI --> GROQ[("Groq LLM Provider")]

    DOMAIN --> EXPORTS["Export Layer<br/>CSV + XLSX"]
```

### Runtime Layout
```mermaid
flowchart LR
    A["App Layout<br/>src/app/(app)/layout.tsx"] --> B["Sidebar"]
    A --> C["AppShell"]
    A --> D["AtomAssistant"]
    C --> E["Feature Pages"]
    E --> F["Route Handlers<br/>src/app/api/*"]
    F --> G["Prisma + PostgreSQL"]
```

## Goal and Escalation Lifecycles

### Goal Lifecycle
```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> SUBMITTED: employee submits
    SUBMITTED --> APPROVED: manager/admin approves
    SUBMITTED --> REWORK: manager/admin requests rework
    REWORK --> SUBMITTED: employee resubmits
    APPROVED --> APPROVED: quarterly achievements + check-ins
```

### Escalation Lifecycle
```mermaid
stateDiagram-v2
    [*] --> OPEN
    OPEN --> OPEN: threshold breach re-evaluated
    OPEN --> RESOLVED: admin resolves with comment
    RESOLVED --> OPEN: optionally reopened
```

## Data Model

### Domain ER Diagram
```mermaid
erDiagram
    User ||--o{ Goal : owns
    User ||--o{ User : manages
    Goal ||--o{ Achievement : tracks
    Achievement ||--o{ CheckIn : receives
    Goal ||--o{ SharedGoal : published_as
    User ||--o{ SharedGoal : receives
    Goal ||--o{ AuditLog : appears_in
    User ||--o{ AuditLog : performs
    Goal ||--o{ GoalUnlock : unlock_events
    User ||--o{ GoalUnlock : unlocked_by
    User ||--o{ EscalationEvent : subject
    Goal ||--o{ EscalationEvent : escalates
    EscalationEvent ||--o{ EscalationDispatch : dispatches
    User ||--o{ EscalationDispatch : recipient
```

Primary models are defined in `prisma/schema.prisma`.

## API Surface

### Authentication
- `GET/POST /api/auth/[...nextauth]`

### Goals and Progress
- `GET /api/goals`
- `POST /api/goals`
- `GET /api/goals/[id]`
- `PATCH /api/goals/[id]`
- `POST /api/achievements`
- `POST /api/checkins`

### Shared Goals
- `GET /api/shared-goals`
- `POST /api/shared-goals`
- `PATCH /api/shared-goals/[id]`

### Cycles and Reporting
- `GET /api/cycle`
- `GET /api/reports`
- `GET /api/notifications`

### AI
- `POST /api/chat`

### Admin Operations
- `GET /api/admin/cycles`
- `POST /api/admin/cycles`
- `PATCH /api/admin/cycles/[id]`
- `GET /api/admin/unlocks`
- `POST /api/admin/unlocks`
- `GET /api/admin/escalation-rules`
- `PATCH /api/admin/escalation-rules`
- `GET /api/admin/escalations`
- `POST /api/admin/escalations`
- `PATCH /api/admin/escalations/[id]`

## Project Structure
```text
src/
  app/
    (app)/                     # Authenticated UI routes
      dashboard/
      goals/
      checkin/
      reports/
      notifications/
      admin/
    api/                       # Route handlers
      auth/
      goals/
      achievements/
      checkins/
      shared-goals/
      reports/
      notifications/
      admin/
  components/                  # Reusable UI + shell components
  lib/                         # Auth, Prisma, cycle, escalation, utilities
prisma/
  schema.prisma               # Data model
  seed.ts                     # Seed data
doc/
  FEATURES_AND_USAGE_GUIDE.md # Detailed functional handbook
```

## Configuration
Create `.env` with required variables:

```env
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
GROQ_API_KEY=...
SMTP_USER=...
APP_PASSWORD=...
```

Notes:
- `DATABASE_URL` is used by runtime queries.
- `DIRECT_URL` is used by Prisma config/migrations.
- If credentials include reserved URL characters, URL-encode them.

## Runbook

### Install
```bash
npm install
```

### Generate Prisma Client (automatic on postinstall)
```bash
npx prisma generate
```

### Seed Initial Data
```bash
npm run seed
```

### Start Development Server
```bash
npm run dev
```

### Build Production Bundle
```bash
npm run build
npm run start
```

### Static Type Validation
```bash
npx tsc --noEmit
```

## Documentation Folder
Detailed functional documentation is available in:

- `doc/FEATURES_AND_USAGE_GUIDE.md`

This document expands on each screen, role behavior, workflows, and operational usage patterns.
