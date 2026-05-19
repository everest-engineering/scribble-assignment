# Implementation Plan: Room Setup and Lobby

**Branch**: `main` | **Date**: 2026-05-19 | **Spec**: specs/001-room-setup-lobby/spec.md

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement Room Setup and Lobby (Scenario 1): host tracking on room creation,
join validation with clear errors, multi-room isolation, automatic lobby polling
(~2s), and host-only game start with a 2-player minimum. Builds on the existing
scaffold which already has basic room CRUD, lobby participant display, and
manual refresh.

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022 backend / ESNext frontend)

**Primary Dependencies**: Backend: Express 4, cors, zod. Frontend: React 18,
React Router 6, Vite 5

**Storage**: In-memory (Map in `backend/src/services/roomStore.ts`)

**Testing**: Manual two-tab multiplayer validation per constitution (no test
framework configured)

**Target Platform**: Node.js 18+ (backend), modern browsers (frontend)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Room creation <3s, join validation error <2s, lobby
refresh ~2s, API responses <200ms p95

**Constraints**: No WebSockets, no database, no authentication, no new
state-management or routing libraries

**Scale/Scope**: Max 100 rooms, max 8 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| **I. TypeScript-First & Type Safety** | ✅ All new code fully typed, Zod for validation |
| **II. Spec-Driven Workflow** | ✅ Following prescribed workflow; Spec Kit artifacts kept consistent |
| **III. Immutability & Error Handling** | ✅ Centralized error handlers, user-visible feedback for join/create failures |
| **IV. Incremental Delivery & Validation** | ✅ Implementing Scenario 1 first; two-tab testing; build before handoff |
| **V. AI-Assisted Development Discipline** | ✅ All AI output human-reviewed before commit |
| **Additional Constraints** | ✅ No WebSockets/DB/auth; uses existing stack; README is source of truth |

**Gate result: PASS** — No violations. Complexity tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # Participant, Room, RoomSnapshot types
│   ├── services/
│   │   └── roomStore.ts     # In-memory room storage & helpers
│   ├── api/
│   │   ├── router.ts        # Main router + error handlers
│   │   ├── rooms.ts         # Room routes (create, join, get)
│   │   └── schemas.ts       # Zod validation schemas
│   └── server.ts            # Entry point

frontend/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Card.tsx
│   │   ├── PageHeader.tsx
│   │   ├── RoomCodeBadge.tsx
│   │   ├── GuessForm.tsx
│   │   ├── Scoreboard.tsx
│   │   └── ResultPanel.tsx
│   ├── pages/
│   │   ├── StartPage.tsx
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   └── api.ts           # REST client
│   ├── state/
│   │   └── roomStore.ts     # Context + useSyncExternalStore
│   ├── styles/
│   │   └── app.css
│   ├── App.tsx
│   └── main.tsx
```

**Structure Decision**: Option 2 — Web application with `backend/` and
`frontend/` subdirectories. Matches the existing project layout.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations found. Complexity tracking not required.
