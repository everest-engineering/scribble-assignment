# Implementation Plan: Round Start Setup

**Branch**: `002-round-start-setup` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-round-start-setup/spec.md`

## Summary

Implement first-round setup for the drawing game by enforcing trimmed,
non-empty player names, creating deterministic first-round state when the game
begins, marking the assigned drawer in room snapshots, and exposing the secret
word only in the assigned drawer's viewer-specific room state. The backend will
keep this state in the existing in-memory room store and validated REST
boundaries, while the frontend will use the existing room store and game page to
display drawer status, waiting state, and validation feedback.

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

**Performance Goals**: Accepted names, first-round drawer assignment, and
drawer-only word visibility appear in connected clients within 3 seconds under
normal local conditions

**Constraints**: HTTP REST requests and polling only; no WebSockets, no
databases, no authentication, no sessions; no new top-level dependencies

**Scale/Scope**: Scenario-driven lab feature for active in-memory rooms,
covering name validation and first-round setup only; drawing input, guessing,
scoring, timers, later-round controls, and results remain out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

- TypeScript/ESM gate: Pass. Planned changes stay in existing TypeScript
  frontend/backend files and retain ES Modules.
- REST/in-memory gate: Pass. Synchronization uses REST polling and the existing
  in-memory room store.
- Scope gate: Pass. No WebSockets, Socket.io, server-sent events,
  authentication, sessions, JWT, OAuth, deployment, Docker, or unrelated
  dependencies are planned.
- Game-rule gate: Pass. Trimmed name validation, first drawer assignment,
  deterministic word selection, and drawer-only word exposure are specified.
- Frontend resilience gate: Pass. Invalid names, missing room state, refresh
  failures, and unavailable first-round setup will surface clear UI feedback or
  safe navigation.
- Traceability gate: Pass. This plan is tied to the clarified spec and will
  produce research, data model, contract, and quickstart artifacts.

### Post-Design Check

- TypeScript/ESM gate: Pass. Design artifacts reference only existing TypeScript
  frontend/backend ownership areas.
- REST/in-memory gate: Pass. Contract uses REST endpoints and stores all
  first-round state in the room snapshot backed by in-memory room state.
- Scope gate: Pass. Contracts and quickstart exclude databases, authentication,
  push protocols, deployment, and unrelated dependencies.
- Game-rule gate: Pass. Data model defines trimmed player names, first-round
  drawer selection, deterministic starter-word selection, and viewer-specific
  secret-word exposure.
- Frontend resilience gate: Pass. Quickstart and contracts include invalid-name
  feedback and safe behavior for missing room, missing word list, and non-drawer
  views.
- Traceability gate: Pass. Design artifacts map each requirement to source
  files, REST contracts, and validation steps.

## Project Structure

### Documentation (this feature)

```text
specs/002-round-start-setup/
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
│   │   ├── schemas.test.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   ├── seed/
│   │   └── starterData.ts
│   ├── services/
│   │   ├── roomStore.test.ts
│   │   └── roomStore.ts
│   ├── app.ts
│   └── server.ts
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── Card.tsx
│   │   ├── GuessForm.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ResultPanel.tsx
│   │   ├── RoomCodeBadge.tsx
│   │   └── Scoreboard.tsx
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── GamePage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── StartPage.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   ├── api.test.ts
│   │   └── api.ts
│   ├── state/
│   │   └── roomStore.ts
│   └── styles/
│       └── app.css
└── package.json
```

**Structure Decision**: Use the existing monorepo layout. Backend game types,
request validation, route handling, starter-word usage, and room-store behavior
stay under `backend/src/`. Frontend API types, room state, create/join error
flows, lobby start flow, and game UI state stay under `frontend/src/`. Feature
artifacts stay under `specs/002-round-start-setup/`.

## Phase 0: Research Summary

See [research.md](./research.md).

Key decisions:

- Trim and reject player names at backend request boundaries and preserve the
  trimmed value in room state and snapshots.
- Model first-round setup as room-owned state created when the game begins.
- Assign the first-round drawer to the Host when eligible; otherwise use the
  first eligible participant by stable join order.
- Select the first-round secret word as the first entry in the ordered starter
  word list.
- Return viewer-specific room snapshots so only the assigned drawer receives the
  `secretWord` field.
- Keep later-round rotation as documented future behavior rather than implement
  next-round controls in this feature.

## Phase 1: Design Summary

See [data-model.md](./data-model.md), [rooms.openapi.yaml](./contracts/rooms.openapi.yaml),
and [quickstart.md](./quickstart.md).

Implementation sequence:

1. Update backend game types to include `playing` status if not already present,
   host ownership, participant snapshots, and optional first-round state.
2. Tighten backend Zod schemas for trimmed non-empty `playerName`, room-code
   parameters, viewer queries, and start-game requests.
3. Extend `roomStore` so create/join store trimmed names, start-game creates
   first-round state, drawer selection follows Host-first fallback behavior, and
   snapshots expose `secretWord` only to the drawer.
4. Update room routes so create/join/start/fetch return validated,
   viewer-specific room snapshots and clear error messages.
5. Update frontend API types and methods for `lobby | playing`, host/drawer
   markers, `currentRound`, and `startGame`.
6. Update frontend room store and lobby flow to preserve viewer identity, call
   start-game from the Host, and poll/fetch viewer-specific game state.
7. Update create/join pages to show clear name validation feedback, and update
   game UI to mark the drawer and show either the secret word or a waiting state.
8. Add focused backend and frontend tests, then validate manually with two
   browser sessions.

## Complexity Tracking

No constitution violations or complexity exceptions are planned.
