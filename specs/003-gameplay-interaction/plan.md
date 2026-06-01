# Implementation Plan: Gameplay Interaction

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Implement Scenario 3 by enabling backend-validated guess submission, deterministic scoring, and guess history synchronization through the existing polling mechanism. The drawer will retain an interactive local canvas with a clear action, while the backend validates guesses, scores them as `100` or `0`, appends them to the active round history, and returns viewer-safe snapshots for all players.

## Technical Context

**Language/Version**: TypeScript 5.6; Node.js 18+ backend; React 18 frontend

**Primary Dependencies**: Express, Zod, `tsx`, React, React Router v6, Vite, Vitest

**Storage**: In-memory room store only

**Testing**: Vitest unit and integration tests for backend and frontend; manual two-browser validation

**Target Platform**: Local web application with backend on `localhost:3001` and frontend on `localhost:5173`

**Project Type**: Monorepo web application with REST backend and React frontend

**Performance Goals**: Guess submission and history refresh through polling remain responsive within the existing ~2 second cadence; drawer canvas interactions remain immediate.

**Constraints**: TypeScript-only; ES Modules; Zod validation for request/response boundaries; HTTP polling only; no WebSockets; no databases; no authentication; minimal in-memory state.

**Scale/Scope**: Single active round per room, drawer-local canvas only, shared guess history, deterministic 100/0 scoring; no restart flow, result screen, multiplayer stroke sync, or persistent storage.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript First**: PASS. New model and API contract types are explicit and typed.
- **Test-First Development**: PASS. Backend and frontend tests are required for all new behaviors.
- **Immutability & Pure Functions**: PASS. Round state updates remain localized and explicit.
- **Error Handling**: PASS. Clear API validation errors and UI error handling are part of the design.
- **Strict Backend & Frontend Architecture**: PASS. The feature fits within `backend/src/services`, `backend/src/api`, `frontend/src/services`, `frontend/src/state`, and `frontend/src/pages`.
- **Technology Constraints**: PASS. No WebSockets, databases, or authentication.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── http-api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── rooms.ts
│   ├── models/
│   │   └── game.ts
│   ├── seed/
│   │   └── starterData.ts
│   └── services/
│       ├── roomStore.ts
│       └── roomStore.test.ts
frontend/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Card.tsx
│   │   ├── GuessForm.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ResultPanel.tsx
│   │   ├── RoomCodeBadge.tsx
│   │   └── Scoreboard.tsx
│   ├── pages/
│   │   ├── GamePage.tsx
│   │   └── LobbyPage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
```

**Structure Decision**: Use the existing backend/frontend monorepo structure. Backend implements guess validation and active round mutation logic. Frontend implements drawer canvas UI, guess submission, and polling-driven guess history updates.

## Phase 0: Research

Research output is captured in [research.md](./research.md). All technical decisions are resolved:

- Drawer canvas state remains frontend-local for this scenario.
- `POST /rooms/:code/guesses` is the dedicated guess submission endpoint.
- Guesses are trimmed and compared case-insensitively.
- Correct guesses score `100`; incorrect guesses score `0`.
- Guess history is returned as part of the shared room snapshot.
- Existing polling handles guess history synchronization.

## Phase 1: Design & Contracts

Design output is captured in:

- [data-model.md](./data-model.md)
- [contracts/http-api.md](./contracts/http-api.md)
- [quickstart.md](./quickstart.md)

Key design decisions:

- `Round.guessHistory` stores normalized, scored guesses.
- `Guess` includes `participantId`, raw/normalized text, correctness, and score.
- `RoomSnapshot.currentRound` exposes `guessHistory` to all players while keeping `secretWord` drawer-only.
- Canvas state remains frontend-only in this feature.
- A dedicated guess submission route keeps write behavior separate from room reads.

## Post-Design Constitution Check

- **TypeScript First**: PASS.
- **Test-First Development**: PASS.
- **Immutability & Pure Functions**: PASS.
- **Error Handling**: PASS.
- **Strict Backend & Frontend Architecture**: PASS.
- **Technology Constraints**: PASS.

## Complexity Tracking

No constitution violations require justification.
