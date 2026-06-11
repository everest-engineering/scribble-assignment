# Implementation Plan: Room Setup and Lobby

**Branch**: `001-room-lobby-flow` | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-lobby-flow/spec.md`

## Summary

Implement the room setup and lobby flow by extending the existing in-memory room
model with host ownership, lobby/game status, viewer-aware start eligibility,
automatic lobby refresh, and a host-only start-game transition. The backend will
continue to expose REST endpoints backed by the current room store, while the
frontend will use the existing room store pattern to create, join, poll, gate
Start Game, and navigate players into the game screen when the room status
changes.

## Technical Context

**Language/Version**: TypeScript with ES Modules for both frontend and backend

**Primary Dependencies**: Frontend: Vite, React 18, React Router v6; Backend:
Node.js, Express, Zod

**Storage**: In-memory room/game state only; databases and persistent storage are
out of scope

**Testing**: Vitest for focused frontend/backend tests; build validation with
npm scripts

**Target Platform**: Browser client plus local Node.js REST service

**Project Type**: Brownfield web app with `frontend/` client and `backend/`
service

**Performance Goals**: Lobby updates normally appear in connected clients within
3 seconds; host start transitions all players in the room into the game state
within 3 seconds

**Constraints**: HTTP polling only; no WebSockets, no databases, no
authentication, no sessions; no new top-level dependencies

**Scale/Scope**: Scenario-driven lab feature covering room creation, joining,
lobby isolation, lobby polling, host-only start, and transition into the game
state; no player-count limit is introduced in this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

- TypeScript/ESM gate: Pass. Planned changes stay in existing TypeScript frontend
  and backend files and retain ES Modules.
- REST/in-memory gate: Pass. Synchronization uses HTTP polling and the existing
  backend in-memory room store.
- Scope gate: Pass. No WebSockets, Socket.io, server-sent events,
  authentication, sessions, JWT, OAuth, deployment, Docker, or unrelated
  dependencies are planned.
- Game-rule gate: Pass. Host assignment, room isolation, room-code validation,
  start-game gating, and lobby-to-game transition are deterministic and specified.
- Frontend resilience gate: Pass. Invalid join attempts, refresh failures, and
  missing room data are planned to surface clear UI feedback or safe navigation.
- Traceability gate: Pass. This plan is tied to the current spec, research,
  data model, contract, quickstart, and existing source files.

### Post-Design Check

- TypeScript/ESM gate: Pass. Design artifacts reference only existing TypeScript
  frontend/backend ownership areas.
- REST/in-memory gate: Pass. Contract adds only REST endpoints and keeps state in
  the backend room store.
- Scope gate: Pass. Contracts and quickstart exclude databases, authentication,
  push protocols, deployment, and unrelated dependencies.
- Game-rule gate: Pass. Data model defines host ownership, status transitions,
  room isolation, and start eligibility.
- Frontend resilience gate: Pass. Quickstart and contracts include validation
  behavior and refresh-failure handling.
- Traceability gate: Pass. Design artifacts map each requirement to source files,
  contracts, and validation steps.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-lobby-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms.openapi.yaml
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   ├── router.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   ├── services/
│   │   ├── roomStore.ts
│   │   └── roomStore.test.ts
│   ├── app.ts
│   └── server.ts
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── Card.tsx
│   │   ├── PageHeader.tsx
│   │   └── RoomCodeBadge.tsx
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   ├── state/
│   │   └── roomStore.ts
│   └── styles/
│       └── app.css
└── package.json
```

**Structure Decision**: Use the existing monorepo layout. Backend model,
validation, route, and room-store changes stay under `backend/src/`. Frontend
API, state, and page behavior changes stay under `frontend/src/`. Feature
artifacts stay under `specs/001-room-lobby-flow/`.

## Phase 0: Research Summary

See [research.md](./research.md).

Key decisions:

- Track the Host through `Room.hostParticipantId` and expose host markers in
  snapshots.
- Add `RoomStatus` transition from `lobby` to `playing` for this feature.
- Add a host-only `POST /rooms/{code}/start` endpoint.
- Poll lobby state from the frontend every 2 seconds and navigate to `/game`
  when the room status becomes `playing`.
- Preserve room isolation by mutating only the room addressed by the room code.

## Phase 1: Design Summary

See [data-model.md](./data-model.md), [rooms.openapi.yaml](./contracts/rooms.openapi.yaml),
and [quickstart.md](./quickstart.md).

Implementation sequence:

1. Update backend game types to include host ownership, participant snapshots,
   `lobby | playing` status, and start eligibility.
2. Tighten backend Zod validation for player names, room codes, viewer queries,
   and start-game requests.
3. Extend `roomStore` with trimmed names, room-code normalization, host
   assignment, viewer-aware snapshots, isolated joins, and `startGame`.
4. Add route handling for start-game and clear error messages for empty,
   invalid, and non-existent room codes.
5. Update frontend API types and methods for new snapshot fields and start-game.
6. Update frontend room store with `startGame`, refresh error state, and polling
   friendly fetch behavior.
7. Update lobby UI to show Host/non-host roles, poll approximately every 2
   seconds, gate Start Game, and navigate all players to `/game` after start.
8. Add focused backend and frontend tests, then validate with two browser tabs.

## Complexity Tracking

No constitution violations or complexity exceptions are planned.
