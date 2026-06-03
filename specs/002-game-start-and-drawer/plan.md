# Implementation Plan: Game Start and Drawer

**Branch**: `002-game-start-and-drawer` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-and-drawer/spec.md`

## Summary

Deliver Scenario 2 on the brownfield stack: add `playing` room status, `startRound` in `roomStore.ts` with host-only gating and 2-player minimum, deterministic word selection (A1), drawer = first participant (A2), viewer-aware `toRoomSnapshot` masking (closes G6), `POST /rooms/:code/start`, frontend `startGame` API + store action, lobby Start calls backend then navigates, game page polling plus drawer word card vs guesser hint. No canvas, guesses, scoring, or restart.

## Technical Context

**Language/Version**: TypeScript (Node 18+, strict) on backend and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest

**Storage**: In-memory `Map` in `roomStore.ts` only

**Testing**: Vitest — extend `roomStore.test.ts`, `schemas.test.ts`, `api.test.ts`; add masking tests per constitution

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`

**Project Type**: Web application (Express REST + React SPA)

**Performance Goals**: 2000 ms polling on lobby and game; endpoints < 50 ms p95 locally

**Constraints**: HTTP polling only; snapshot purity via `toRoomSnapshot`; no WebSockets/DB/auth

**Scale/Scope**: Scenario 2 start + drawer visibility only; round index 0

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Scenario 2 compliance |
|-----------|----------------------|
| I. Code Quality | `startRound` + `pickWord` in `roomStore.ts`; typed snapshots; deterministic A1/A2 |
| II. Testing | startRound happy/reject; snapshot masking drawer vs guesser; `startRoomSchema` tests; `api.startGame` test |
| III. UX | Start shows loading; drawer word card / guesser hint; role visible on game page |
| IV. Performance | Reuse `useRoomPolling` on game page; no new intervals |
| Non-negotiable | No canvas/guess/score/restart; no forbidden deps |

**Gate status**: PASS — no constitutional exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-and-drawer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-api.md
├── spec.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/
├── models/game.ts              # RoomStatus playing; CurrentRound; snapshot viewer block
├── services/roomStore.ts         # pickWord, startRound, masked toRoomSnapshot
├── services/roomStore.test.ts
├── api/schemas.ts              # startRoomSchema
├── api/schemas.test.ts
└── api/rooms.ts                # POST /:code/start

frontend/src/
├── services/api.ts             # playing types; startGame client
├── services/api.test.ts
├── state/roomStore.ts          # startGame action
├── pages/LobbyPage.tsx         # backend start + navigate
└── pages/GamePage.tsx          # polling, word card, hint
```

## State Model Changes

### Room (backend `game.ts`)

| Field | Change |
|-------|--------|
| `status` | `"lobby" \| "playing"` |
| `currentRound` | **Add** when playing — `{ roundIndex, drawerParticipantId, secretWord }` |

### RoomSnapshot

| Field | Change |
|-------|--------|
| `status` | Includes `"playing"` |
| `currentRound` | **Add** — `{ roundIndex, drawerParticipantId, secretWord: string \| null }` (null when viewer not drawer) |
| `viewer` | **Add** — `{ participantId, isDrawer }` when `participantId` query provided |

### Transitions

```text
lobby --startRound (host, 2+ players)--> playing (round 0, drawer = participants[0])
playing --(Scenario 4 restart)--> lobby  [OUT OF SCOPE]
```

## Data Flow

```text
LobbyPage --POST /rooms/:code/start { participantId }--> startRound
  --> status=playing, currentRound set
  --> navigate /game
GamePage --useRoomPolling 2000ms--> GET /rooms/:code?participantId=
  --> toRoomSnapshot masks secretWord for non-drawer
GamePage --isDrawer--> word card | hint card
```

## File-Level Implementation Sequence

1. Backend model types (`game.ts`)
2. `pickWord` + `startRound` + snapshot masking (`roomStore.ts`)
3. Error classes + route (`rooms.ts`, `schemas.ts`)
4. Backend tests
5. Frontend API types + `startGame`
6. `roomStore.startGame`
7. `LobbyPage` + `GamePage` UI/polling
8. Frontend tests
9. Build + test + precheck

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
