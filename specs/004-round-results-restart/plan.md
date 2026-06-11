# Implementation Plan: Round Results & Restart

**Branch**: `004-round-results-restart` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-round-results-restart/spec.md`

## Summary

Implement the ended-round experience by extending the in-memory room state with
a distinct results phase, an immutable round-result snapshot containing the
correct word, final scores, and ordered guess history, and a Host-only restart
command. Polling will continue to return the current room snapshot so all
clients converge on the same result view. Restarting from results preserves the
room code, player membership, player display names, and Host identity while
clearing round-specific drawing, guessing, scoring, drawer, and secret-word
state so the room returns to the lobby ready for a new game start.

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

**Performance Goals**: Result state and restart-to-lobby state normally appear
in connected clients within 3 seconds through polling under local conditions

**Constraints**: HTTP REST requests and polling only; no WebSockets, no
databases, no authentication, no sessions; no new top-level dependencies

**Scale/Scope**: Scenario-driven lab feature for one ended in-memory round per
room; result display, final-state protection, Host-only restart, and
round-specific state reset are in scope; timers, automatic round-end triggers,
multi-round history retention, player removal, and automatic next-round start
are out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

- TypeScript/ESM gate: Pass. Planned changes stay in existing TypeScript
  frontend/backend files and retain ES Modules.
- REST/in-memory gate: Pass. Synchronization uses REST restart commands plus
  polling snapshots, and all result/restart state remains in backend memory.
- Scope gate: Pass. No WebSockets, Socket.io, server-sent events,
  authentication, sessions, JWT, OAuth, deployment, Docker, databases, or
  unrelated dependencies are planned.
- Game-rule gate: Pass. Ended-round result visibility, final-state protection,
  Host-only restart, membership preservation, and reset behavior are specified.
- Frontend resilience gate: Pass. Non-host restart attempts, unavailable actions
  after round end, late joins during results, missing room data, and polling
  failures are planned to show clear feedback or safe navigation.
- Traceability gate: Pass. This plan is tied to the 004 spec and produces
  research, data model, contract, and quickstart artifacts.

### Post-Design Check

- TypeScript/ESM gate: Pass. Design artifacts reference only existing
  TypeScript frontend/backend ownership areas and typed room/result models.
- REST/in-memory gate: Pass. Contract adds REST polling/restart behavior and
  keeps round-result state in memory only.
- Scope gate: Pass. Contracts and quickstart exclude push protocols,
  persistence, authentication, deployment, and unrelated dependencies.
- Game-rule gate: Pass. Data model defines `results` room state, immutable
  result snapshots, rejected ended-round mutations, Host-only restart, and reset
  transitions.
- Frontend resilience gate: Pass. Quickstart includes non-host restart feedback,
  ended-round command rejection, late-join rejection, polling consistency, and
  restart-to-lobby validation.
- Traceability gate: Pass. Design artifacts map requirements to source files,
  REST contracts, and validation steps.

## Project Structure

### Documentation (this feature)

```text
specs/004-round-results-restart/
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
│   │   ├── DrawingCanvas.tsx
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

**Structure Decision**: Use the existing monorepo layout. Backend model,
validation, route, and room-store changes stay under `backend/src/`. Frontend
API, state, result display, restart action, and page behavior changes stay under
`frontend/src/`. Reuse `ResultPanel.tsx`, `Scoreboard.tsx`, and `GamePage.tsx`
for the result view instead of adding a new page unless implementation
discovery shows the existing structure cannot support the state.

## Phase 0: Research Summary

See [research.md](./research.md).

Key decisions:

- Capture an immutable `roundResult` snapshot when a round enters results.
- Use a distinct `results` room status so clients and services can reliably
  disable play actions and show the result view.
- Preserve current room membership and Host identity on restart while clearing
  all round-specific state.
- Reject late joins while results are displayed; normal joining rules resume
  after restart returns the room to lobby.
- Continue using polling snapshots for result consistency across clients.
- Keep the round-end trigger outside this feature while exposing a service-level
  transition for the lifecycle code to call.

## Phase 1: Design Summary

See [data-model.md](./data-model.md), [rooms.openapi.yaml](./contracts/rooms.openapi.yaml),
and [quickstart.md](./quickstart.md).

Implementation sequence:

1. Extend backend game types with `results` room status, `RoundResult`,
   final-score records, and restart command responses.
2. Add backend schemas for result snapshots and Host restart requests.
3. Extend `roomStore` with a round-ended transition that captures correct word,
   final scores, and guess history; ended-round command rejection; late-join
   rejection during results; and Host-only restart back to lobby.
4. Update room routes so polling returns result state, restart is validated, and
   active play commands cannot mutate ended rounds.
5. Update frontend API types and methods for result snapshots and restart.
6. Update frontend room store with polling-friendly result state, restart
   command state, and clear non-host/invalid-action feedback.
7. Update the game UI so results show the correct word, final scores, complete
   guess history, and a Host-only restart action; restart routes all players
   back to the lobby view.
8. Add focused backend and frontend tests, then validate manually with two
   browser sessions.

## Complexity Tracking

No constitution violations or complexity exceptions are planned.
