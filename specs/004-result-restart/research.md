# Research: Result, Restart & Final Validation

**Feature**: 004-result-restart — Scenario 4
**Date**: 2026-06-05
**Prerequisites**: Scenarios 1–3 fully implemented.

---

## Decision 1 — End Round API

**Decision**: New endpoint `POST /rooms/:code/end` — body `{ participantId }`.
Validates `participantId === room.hostId` (403 otherwise), validates
`room.status === "active"` (400 otherwise), sets `room.status = "result"`, calls
`saveRoom`.

**Rationale**: Matches the pattern of `POST /rooms/:code/start` from Scenario 1.
Single host-gated action; simple and consistent.

**Alternatives considered**:
- Auto-end when all guessers have guessed correctly — introduces complex round-end
  logic and is out of scope per README.
- Inline with restart as a single endpoint — mixes two different state transitions;
  makes it harder to test each independently.

---

## Decision 2 — Restart API

**Decision**: New endpoint `POST /rooms/:code/restart` — body `{ participantId }`.
Validates host, validates `room.status === "result"` (400 otherwise), clears
`canvasStrokes`, `guesses`, `scores`, `currentWord`, `drawerId`, sets
`room.status = "lobby"`, calls `saveRoom`.

**Rationale**: Clean separation from the end-round action. Preserves `participants`,
`hostId`, `code`, `createdAt`. Resets everything else to the pre-game state.

**Alternatives considered**:
- Reuse `POST /rooms` (create a new room) — loses participants; requires re-joining.
- Reset via a PATCH — semantically weaker; requires the client to know which fields to
  clear.

---

## Decision 3 — RoomStatus Extension

**Decision**: Add `"result"` to `RoomStatus` in `backend/src/models/game.ts` and mirror
it in `frontend/src/services/api.ts`.

**Rationale**: The polling loops on all screens already check `room.status` to decide
navigation. Adding `"result"` makes the result screen reachable from the game screen
polling without any new infrastructure.

**Alternatives considered**:
- A separate `resultReady: boolean` flag — redundant; status is the existing mechanism.

---

## Decision 4 — Result Screen Navigation via Polling

**Decision**: The existing game-screen polling (`setInterval` in `GamePage`) already
calls `fetchRoom()` every ~2 s. Add a check: if `room.status === "result"`, navigate to
a new `/result` route (or conditionally render the result view within `GamePage`).

**Chosen**: Add a `/result` route and a `ResultPage` component. The polling in
`GamePage` navigates to `/result` on status change. `ResultPage` shows the result
content and the host's Restart button.

**Rationale**: A dedicated route gives a clean URL, avoids conditional rendering
complexity in `GamePage`, and is consistent with the pattern used for `/lobby` and
`/game`. `ResultPage` also needs its own polling to detect the restart and navigate
back to `/lobby`.

**Alternatives considered**:
- Conditional render inside `GamePage` — works but `GamePage` is already large after
  Scenario 3 changes.

---

## Decision 5 — Restart Navigation via Polling

**Decision**: `ResultPage` runs a `setInterval` (~2 000 ms) calling `fetchRoom()`. If
`room.status === "lobby"` (after restart), it navigates to `/lobby`. This mirrors the
lobby polling from Scenario 1 exactly.

**Rationale**: Consistent polling-driven navigation across all screens. No new
mechanism needed.

**Alternatives considered**:
- Host calls navigate directly on button click — works for the host but not for
  non-host players who need to be notified via polling.
