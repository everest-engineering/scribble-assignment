# Implementation Plan: Round Play and Scoring

**Branch**: `003-round-play-scoring` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-round-play-scoring/spec.md`

## Summary

Implement active-round gameplay by extending the existing in-memory room state
with a fixed active-round roster, per-player scores initialized at 0, freehand
canvas marks with color and stroke size, clear-canvas state, guess submission and
history, and deterministic 100-point scoring for each guesser's first correct
guess. The backend will expose validated REST commands for drawing, clearing,
and guessing while polling continues to return the current room snapshot. The
frontend will use the existing room store and game-page layout to render the
canvas, drawer controls, guess form, activity history, and scoreboard.

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

**Performance Goals**: Canvas state, guess history, and scores normally appear
in connected clients within 3 seconds through polling; drawer interactions feel
immediate in the drawer's own view

**Constraints**: HTTP REST requests and polling only; no WebSockets, no
databases, no authentication, no sessions; no new top-level dependencies

**Scale/Scope**: Scenario-driven lab feature for one active in-memory round per
room; freehand drawing with colors and stroke sizes, clear, guessing, history,
and scoring are in scope; timers, round completion, later-round rotation, final
results, room cleanup, undo, shape tools, fill tools, and erasers are out of
scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

- TypeScript/ESM gate: Pass. Planned changes stay in existing TypeScript
  frontend/backend files and retain ES Modules.
- REST/in-memory gate: Pass. Synchronization uses REST commands plus polling,
  and all room/game state remains in the in-memory room store.
- Scope gate: Pass. No WebSockets, Socket.io, server-sent events,
  authentication, sessions, JWT, OAuth, deployment, Docker, or unrelated
  dependencies are planned.
- Game-rule gate: Pass. Active-round roster, drawer-only drawing, guess
  validation, case-insensitive comparison, and scoring are deterministic and
  specified.
- Frontend resilience gate: Pass. Empty guesses, unauthorized draw/guess
  attempts, late joins, missing room data, and polling failures are planned to
  surface clear feedback or safe navigation.
- Traceability gate: Pass. This plan is tied to the clarified spec and will
  produce research, data model, contract, and quickstart artifacts.

### Post-Design Check

- TypeScript/ESM gate: Pass. Design artifacts reference only existing TypeScript
  frontend/backend ownership areas and a local canvas component.
- REST/in-memory gate: Pass. Contract adds only REST endpoints and keeps canvas,
  guesses, scores, and roster state in memory.
- Scope gate: Pass. Contracts and quickstart exclude databases, authentication,
  push protocols, deployment, and unrelated dependencies.
- Game-rule gate: Pass. Data model defines score initialization, drawer-only
  canvas mutation, guess validation, one award per guesser, and room isolation.
- Frontend resilience gate: Pass. Quickstart and contracts include invalid guess
  feedback, late-join rejection, unauthorized command handling, and polling
  recovery behavior.
- Traceability gate: Pass. Design artifacts map requirements to source files,
  REST contracts, and validation steps.

## Project Structure

### Documentation (this feature)

```text
specs/003-round-play-scoring/
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
API, state, canvas, guessing, activity, scoreboard, and page behavior changes
stay under `frontend/src/`. Add `frontend/src/components/DrawingCanvas.tsx` for
the freehand canvas UI if no equivalent component already exists. Feature
artifacts stay under `specs/003-round-play-scoring/`.

## Phase 0: Research Summary

See [research.md](./research.md).

Key decisions:

- Represent freehand canvas state as ordered drawing marks with points, color,
  stroke size, and sequence order.
- Keep drawer interactions locally responsive, then persist each completed mark
  or clear action through REST commands.
- Keep the active-round roster fixed once the round starts and reject new joins.
- Store scores per active-round participant and award 100 points once per
  guesser per round.
- Store ordered guess history for all valid guesses and reject empty guesses
  before recording.
- Continue using polling snapshots as the only synchronization mechanism.

## Phase 1: Design Summary

See [data-model.md](./data-model.md), [rooms.openapi.yaml](./contracts/rooms.openapi.yaml),
and [quickstart.md](./quickstart.md).

Implementation sequence:

1. Extend backend game types with active-round roster, scores, drawing marks,
   canvas state, guess history, and score-award tracking.
2. Add backend schemas for draw-mark, clear-canvas, and submit-guess requests,
   including Zod validation for participant identity, trimmed guesses, colors,
   stroke sizes, and point arrays.
3. Extend `roomStore` with drawer-only draw/clear commands, guesser-only guess
   submission, case-insensitive comparison, first-correct award tracking,
   late-join rejection, and viewer-safe snapshots.
4. Add REST routes under `/rooms/{code}/round/*` for drawing marks, clearing the
   canvas, and submitting guesses.
5. Update frontend API types and methods for active-round canvas state, guess
   history, scores, draw, clear, and guess commands.
6. Update frontend room store with command methods and polling-friendly snapshot
   updates.
7. Add or update game UI components so the drawer can draw with color/stroke
   controls and clear, while guessers see the canvas, submit guesses, and view
   synchronized activity and scores.
8. Add focused backend and frontend tests, then validate manually with two
   browser sessions.

## Complexity Tracking

No constitution violations or complexity exceptions are planned.
