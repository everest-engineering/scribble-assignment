# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Implement the first Scribble scenario: the room creator becomes host, room-code errors are
clear, lobby state remains isolated by room code, lobby clients refresh by HTTP polling
about every two seconds, and only the host can start when at least two players are present.
The implementation extends the existing in-memory room model, validates room inputs with
Zod, adds a start-game transition, and updates the lobby UI/state flow without adding
WebSockets, persistence, authentication, or new top-level dependencies.

## Technical Context

**Language/Version**: TypeScript 5.6; Node.js 18+ backend; React 18 frontend

**Primary Dependencies**: Backend uses Express, Zod, cors, tsx, Vitest. Frontend uses
React, React Router v6, Vite, Vitest, and the existing custom room store.

**Storage**: In-memory backend `Map` only. Rooms are temporary and cleared on backend
restart.

**Testing**: Vitest for backend services/API schemas and frontend services/state where
practical; two-browser manual validation for lobby polling, isolation, and host-only start.

**Target Platform**: Local web app with backend on `localhost:3001` and frontend on
`localhost:5173`.

**Project Type**: Monorepo web application with Express backend and Vite React frontend.

**Performance Goals**: Lobby participant changes appear in another open lobby within
three seconds under normal local testing.

**Constraints**: No WebSockets, Socket.io, Server-Sent Events, long polling, databases,
file persistence, authentication, sessions, JWT, OAuth, or new state-management/routing
libraries. Polling cadence is approximately two seconds.

**Scale/Scope**: Single feature group covering Room Setup & Lobby only. Drawing, scoring,
results, restart, drawer assignment, and secret-word visibility remain out of this plan.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- HTTP polling only: PASS. Lobby sync uses periodic `GET /rooms/:code` fetches from the
  existing frontend store. No push protocols are introduced.
- In-memory room state only: PASS. Host identity, room status, and participants remain in
  the existing backend room store. No database, file persistence, queues, or external state
  services are introduced.
- TypeScript and Zod contracts: PASS. Backend room-code, viewer, and start-game inputs
  will be validated with Zod; frontend service types will mirror returned snapshots.
- Scenario traceability: PASS. This plan maps only to README Scenario 1: Room setup and
  lobby.
- Incremental review: PASS. Verification includes focused Vitest coverage, backend and
  frontend builds, and two-browser manual checks for host identity, polling, isolation,
  and start permissions.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── room-setup-lobby.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Created by /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   ├── schemas.ts
│   │   └── schemas.test.ts
│   ├── models/
│   │   └── game.ts
│   └── services/
│       ├── roomStore.ts
│       └── roomStore.test.ts
└── package.json

frontend/
├── src/
│   ├── pages/
│   │   ├── JoinRoomPage.tsx
│   │   └── LobbyPage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   ├── state/
│   │   └── roomStore.ts
│   └── styles/
│       └── app.css
└── package.json
```

**Structure Decision**: Use the existing web application structure. Backend business logic
stays in `backend/src/services/roomStore.ts`, API handling and Zod validation stay under
`backend/src/api`, frontend HTTP access stays in `frontend/src/services/api.ts`, and lobby
state/UI changes stay in `frontend/src/state/roomStore.ts` and
`frontend/src/pages/LobbyPage.tsx`.

## Phase 0: Research

Research is captured in [research.md](./research.md). All planning unknowns are resolved:
host identity is stored as a participant id, start-game state is represented as a minimal
room status transition, room-code validation is handled before lookup, and polling remains
owned by the lobby view lifecycle.

## Phase 1: Design and Contracts

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/room-setup-lobby.md](./contracts/room-setup-lobby.md)
- [quickstart.md](./quickstart.md)

Post-design Constitution Check:

- HTTP polling only: PASS. The contract uses normal room fetches and a start command; the
  quickstart verifies polling by observing lobby updates after another player joins.
- In-memory room state only: PASS. The data model contains no persistence objects.
- TypeScript and Zod contracts: PASS. Contract fields identify request validation and
  response snapshot shape changes.
- Scenario traceability: PASS. Each model and contract change maps to host identity,
  join errors, isolation, polling, or host-only start.
- Incremental review: PASS. Quickstart includes build/test commands plus browser checks.

## Complexity Tracking

No constitution violations or added complexity require justification.
