# Implementation Plan: Result, Restart, and Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-result-restart-validation/spec.md`

## Summary

Add two backend endpoints (`POST /rooms/:code/end`, `POST /rooms/:code/restart`), extend the `RoomStatus` type with a `"result"` state, update `toRoomSnapshot` to expose result-state data, and add a new `ResultPage` on the frontend that all clients navigate to when polling detects `"result"`. The host's Game screen gains an "End Game" button; the host's Result screen gains a "Play Again" button. Polling in both `GamePage` and `LobbyPage` is updated to handle the `"result"` transition.

## Technical Context

**Language/Version**: TypeScript (strict mode) — Node.js 18+ backend, React 18 frontend

**Primary Dependencies**: Express (backend), Vite + React + React Router (frontend), Zod (validation — already in use)

**Storage**: In-memory `Map<string, Room>` — existing pattern, unchanged

**Testing**: Extend existing `api.test.ts` and `roomStore.test.ts` with new endpoint and service cases

**Target Platform**: Local dev — Node.js server + Vite dev server

**Project Type**: Brownfield web application (frontend + backend)

**Performance Goals**: 2-second polling cycle — unchanged from prior features

**Constraints**: No new top-level npm dependencies; no WebSockets; in-memory only; TypeScript strict mode; both `npm run build` must pass before any task is marked done

**Scale/Scope**: Single game session, small player count (2–6), in-memory; no persistence

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Brownfield discipline: existing code read before extending | PASS | Read `game.ts`, `roomStore.ts`, `rooms.ts`, `schemas.ts`, `GamePage.tsx`, `LobbyPage.tsx`, `api.ts`, `state/roomStore.ts`, `routes/index.tsx`, `ResultPanel.tsx` |
| No wholesale rewrites of starter code | PASS | Extending existing models and files only; `ResultPanel` placeholder is replaced with a real page component; no files deleted |
| Scope bounded by README "Explicitly Out Of Scope" | PASS | No WebSockets, no persistence, no authentication; restart and result flows are in scope per spec 004 |
| Spec-driven development order followed | PASS | spec → clarify → plan → tasks → implement |
| Deterministic game rules | PASS | No new randomness; scoring rules carry over unchanged |
| No new top-level npm dependencies | PASS | All UI built with existing React + React Router; no new packages |
| TypeScript strict mode | PASS | All new code follows strict mode; `any` prohibited |
| Polling at 2-second intervals | PASS | Existing polling loops extended to handle `"result"` state; interval unchanged |
| Host-only access for end/restart: identity via `playerName` body field | PASS | Host is `participants[0].name`; validated server-side using `playerName` in request body |

**Post-design re-check**: All gates pass. `"result"` is an additive state value. Two new endpoints are purely additive. `RoomSnapshot` type gains `"result"` in the `status` union. `ResultPage` is a new file; existing pages receive minimal additions only.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions and rationale
├── data-model.md        # Phase 1 — entity and state-machine extensions
├── quickstart.md        # Phase 1 — validation scenarios
├── contracts/
│   └── api.md           # Phase 1 — endpoint contracts for /end and /restart
└── tasks.md             # Phase 2 — /speckit-tasks output (not yet created)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # extend RoomStatus union ("result"); extend RoomSnapshot.status
│   ├── api/
│   │   ├── schemas.ts           # add endGameSchema, restartSchema (playerName body)
│   │   └── rooms.ts             # add POST /:code/end and POST /:code/restart routes
│   └── services/
│       └── roomStore.ts         # add endGame(), restartGame(); extend toRoomSnapshot() for result state

frontend/
├── src/
│   ├── services/
│   │   └── api.ts               # extend RoomSnapshot.status union; add api.endGame(), api.restartGame()
│   ├── state/
│   │   └── roomStore.ts         # add endGame(), restartGame() actions
│   ├── pages/
│   │   ├── GamePage.tsx         # add "End Game" button for host; handle "result" state in poll
│   │   ├── LobbyPage.tsx        # handle "result" state in poll (navigate to /result)
│   │   └── ResultPage.tsx       # NEW — shows secret word, scores, guess history, Play Again (host)
│   └── routes/
│       └── index.tsx            # add /result route pointing to ResultPage
```

## Complexity Tracking

No constitution violations. No justification required.

---

## Phase 0 Outputs

See [research.md](research.md) for all decisions and rationale. Key resolved questions:

- **"result" state exposure in snapshot**: `toRoomSnapshot` always includes `secretWord`, `drawerName`, `guesses`, `scores` when status is `"result"` (no viewer-based filtering needed — round is over)
- **Host identity validation**: `playerName` from request body matched against `room.participants[0].name`; consistent with existing guess/stroke identity pattern
- **Restart clears**: `secretWord`, `drawerName`, `guesses`, `scores`, `strokes` all cleared; `participants` preserved
- **Polling navigation**: `GamePage` poll detects `"result"` → navigate to `/result`; `LobbyPage` poll detects `"result"` → navigate to `/result` (edge case: player joins late after end)
- **`ResultPanel` placeholder**: replaced by routing to a dedicated `ResultPage`; the `ResultPanel` component in `GamePage` sidebar can be removed

---

## Phase 1 Outputs

- [data-model.md](data-model.md) — `RoomStatus` extension, `Room`/`RoomSnapshot` changes, state-machine diagram
- [contracts/api.md](contracts/api.md) — request/response contracts for `/end` and `/restart`
- [quickstart.md](quickstart.md) — 6 end-to-end validation scenarios
