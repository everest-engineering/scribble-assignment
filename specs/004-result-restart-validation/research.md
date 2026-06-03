# Research: Scribble Game Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-03

## Decision Log

---

### D-001: Restart Mechanism — New Endpoint vs Re-using startRoom

**Decision**: Add a new `POST /rooms/:code/restart` endpoint backed by a new `restartRoom()` service function.

**Rationale**: `startRoom()` assigns the caller as drawer, requires ≥ 2 players, and initialises scores from scratch. A `restartRoom()` function can cleanly express the different semantics: preserve participants, clear round state (canvas, guesses, scores, word, drawerId, roundStartedAt), and transition status back to `"lobby"`. Re-using `startRoom` would require caller-supplied guard bypasses or overloaded logic.

**Alternatives considered**:
- Reusing `POST /rooms/:code/start`: rejected — semantic mismatch; `startRoom` expects `"lobby"` status and initialises a new drawer assignment immediately.
- Client-side reset only: rejected — other clients would not see the state change; server is source of truth.

---

### D-002: Revealing `currentWord` to All Players on Results Screen

**Decision**: Modify `toRoomSnapshot()` to expose `currentWord` to all viewers (not just the drawer) when `room.status === "finished"`.

**Rationale**: FR-001 requires all players to see the correct word when the round ends. Currently `toRoomSnapshot` only passes `currentWord` through if `viewerParticipantId === room.drawerId`. A status check resolves this with a one-line change.

**Alternatives considered**:
- Separate `POST /rooms/:code/results` endpoint: rejected — over-engineering; existing `GET /rooms/:code` polling already delivers all room state; adding word to the snapshot is sufficient.
- Store revealed word separately: rejected — `currentWord` is already on the Room model; duplication unnecessary.

---

### D-003: Drawer Scoring — Where to Apply

**Decision**: Apply drawer scoring inside `restartRoom()` rather than modifying `submitGuess()`.

**Rationale**: Drawer points (50 pts × number of correct guessers at round end) are a round-end summary calculation, not a per-guess event. Computing them at restart time (when `correctGuessers.size` is final) avoids incrementally crediting the drawer mid-round, which would leak partial scores to the results screen before the round ends. The results screen is display-only (per spec Assumption 3), so scores shown are already final when status transitions to `"finished"`.

**Alternatives considered**:
- Compute drawer score when status becomes `"finished"` inside `submitGuess` / `checkRoundExpiry`: possible but confusing — drawer score would appear mid-results polling cycle at an unpredictable time.
- Compute and store in `toRoomSnapshot` (computed field, not stored): rejected — snapshot should mirror stored state; computing on every poll is wasteful and creates stale-snapshot risk.

**Updated approach**: Compute and store drawer score in `roomStore.submitGuess()` at the moment the round transitions to `"finished"` (either all-correct or timer expiry), and also in `checkRoundExpiry()`. This ensures `scores[drawerId]` is correct when the results screen first renders.

---

### D-004: Auto-Advance Timer (30-second lobby return)

**Decision**: Implement the 30-second auto-advance entirely server-side by adding a `resultExpiresAt: string | null` field to the `Room` model, and checking it lazily in `GET /rooms/:code` (the polling endpoint) using a new `checkResultExpiry()` helper analogous to `checkRoundExpiry()`.

**Rationale**: The frontend polls every 2 seconds. A server-side expiry checked at poll time means the auto-advance fires within 2 seconds of the 30-second mark for all clients simultaneously, without requiring a server-side timer (setInterval on the server). This is consistent with how `checkRoundExpiry` already works — lazy evaluation at read time.

**Alternatives considered**:
- Client-side countdown + client-initiated restart: rejected — race condition if the host triggers restart at the same moment the timer fires; requires each client to independently call restart.
- Server-side `setInterval` to auto-restart: rejected — adds stateful timer management complexity; process restart clears timers; lazy check is simpler and already an established pattern in this codebase.

---

### D-005: Results Screen UI — New Component vs Extending GamePage

**Decision**: Add a new `ResultsScreen` component rendered conditionally in `GamePage` when `room.status === "finished"`.

**Rationale**: The results screen has distinct content (word reveal, score table, countdown, restart button) that would clutter `GamePage`. A dedicated component keeps `GamePage` as a compositor and `ResultsScreen` independently testable. This follows the existing pattern: `DrawingCanvas`, `Scoreboard`, `GuessForm`, `ResultPanel` are all separate components mounted by `GamePage`.

**Alternatives considered**:
- Separate `/results` route: rejected — game state is in the `RoomStore` and the same URL; a route transition would add navigation complexity without benefit.
- Inline expansion of GamePage JSX: rejected — makes `GamePage` harder to test and read.

---

### D-006: Countdown Display — Client-Side vs Server-Side

**Decision**: Compute the countdown client-side using `resultExpiresAt` from the room snapshot (ISO timestamp), via a `useCountdown` hook or local `setInterval`.

**Rationale**: `resultExpiresAt` is an absolute ISO timestamp delivered by the server on the first poll after `status === "finished"`. The client can compute `secondsRemaining = Math.max(0, Math.ceil((new Date(resultExpiresAt).getTime() - Date.now()) / 1000))` locally without extra polling. This avoids hammering the server for countdown ticks and decouples the display refresh from the 2-second poll interval.

**Alternatives considered**:
- Server returning `secondsRemaining` in every snapshot: rejected — stale by the time the client renders; requires server-side time awareness on every request.

---

### D-007: Polling Continuation Through "finished" Status

**Decision**: Extend the `GamePage` polling `useEffect` to also poll when `room.status === "finished"`, stopping only when the room transitions back to `"lobby"` (at which point navigate to `/lobby`).

**Rationale**: Currently `GamePage` stops polling when status is not `"in-progress"`. With the auto-advance mechanism, the room status will change from `"finished"` to `"lobby"` server-side. Without continued polling, clients will not detect this transition and will remain frozen on the results screen.

**Implementation note**: The polling effect dependency should change from `room.status` to a condition that keeps the interval alive for both `"in-progress"` and `"finished"` states. Navigate to `/lobby` when the polled status becomes `"lobby"`.

---

## Schema Additions (to `shared/schemas/room.ts`)

```
roomSnapshotSchema additions:
  - resultExpiresAt: z.string().nullable()  // ISO timestamp 30s after round ends

Room model additions (backend/src/models/game.ts):
  - resultExpiresAt: string | null
```

## New Backend Endpoint

```
POST /rooms/:code/restart
Body: { participantId: string }
Success: 200 { room: RoomSnapshot }
Errors:
  - 404 not_found
  - 403 not_host
  - 400 not_finished (can only restart from "finished" state)
```

## New Frontend Artifacts

```
frontend/src/components/ResultsScreen.tsx   (new)
frontend/src/components/ResultsScreen.test.tsx  (new)
```

## Files Touched Summary

| File | Change |
|------|--------|
| `shared/schemas/room.ts` | Add `resultExpiresAt` field to `roomSnapshotSchema` |
| `backend/src/models/game.ts` | Add `resultExpiresAt: string \| null` to `Room` |
| `backend/src/services/roomStore.ts` | Add `restartRoom()`, `checkResultExpiry()`; update `submitGuess()` and `checkRoundExpiry()` for drawer scoring; update `toRoomSnapshot()` for word reveal and `resultExpiresAt`; update `startRoom()` to initialise `resultExpiresAt: null` |
| `backend/src/services/roomStore.test.ts` | TDD tests for all new functions |
| `backend/src/api/rooms.ts` | Add `POST /:code/restart` route |
| `backend/src/api/schemas.ts` | Add `restartRoomSchema` |
| `frontend/src/services/api.ts` | Add `restartGame()` |
| `frontend/src/state/roomStore.ts` | Add `restartGame()` action |
| `frontend/src/components/ResultsScreen.tsx` | New component |
| `frontend/src/components/ResultsScreen.test.tsx` | New tests |
| `frontend/src/pages/GamePage.tsx` | Mount `ResultsScreen`; extend polling to `"finished"`; navigate to `/lobby` on status `"lobby"` |
| `frontend/src/pages/GamePage.test.tsx` | Tests for results screen rendering and lobby navigation |
