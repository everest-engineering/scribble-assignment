# Research: Result, Restart & Final Validation

## Round-End Trigger: Guess-Driven vs. Timer-Driven

**Decision**: Round ends exclusively when a correct guess is submitted (i.e., inside
`submitGuess()` on the server). Timer-driven expiry is out of scope.

**Rationale**: The existing architecture has no server-side timer — there is no `setTimeout`
or background process in `roomStore.ts`. Introducing a server-side timer would require a
task-runner pattern and is disproportionate for a lab demo. The spec only mandates results on
round end; the trigger mechanism is an implementation detail.

**Alternatives considered**: Client-side timer that POSTs a "timeout" event — rejected because
it relies on one client being authoritative, which is unreliable in a multi-player polling model.

---

## How to Reveal the Secret Word to All Players

**Decision**: Change `toRoomSnapshot()` to include `secretWord` when `room.status === "completed"`,
not just for the drawer. The snapshot is what every polling client receives; no new endpoint needed.

**Rationale**: The existing `GET /rooms/:code` polling endpoint already delivers `RoomSnapshot` to
all clients every 2 seconds. Changing the reveal condition from `isDrawer` to
`isDrawer || status === "completed"` propagates the word to every client at the moment the room
transitions to `"completed"` with zero extra round-trips.

**Alternatives considered**: A dedicated `GET /rooms/:code/results` endpoint — rejected as
unnecessary; the polling snapshot already carries all result data.

---

## Cumulative Score Strategy: Per-Round vs. Running Total

**Decision**: Store a separate `roundScores: Record<string, number>` field on `Room` alongside
the existing `scores` (which becomes the cumulative total across restarts). On `restartGame()`,
clear `drawerId`, `secretWord`, `guesses`, and `roundScores` but keep `scores` unchanged.
On `startGame()`, reset `roundScores` to zero for all participants without touching `scores`.

**Rationale**: The spec (US-3, FR-009, FR-010) requires both per-round scores (visible on the
results screen) and cumulative totals (preserved across restarts). Keeping two fields in the model
is the simplest approach that satisfies both without complicating the snapshot or the frontend.

**Alternatives considered**: Deriving round scores from the guess log — rejected because it
requires re-scanning all guesses and becomes incorrect if a future feature adds partial credit or
bonus scoring. Keeping only cumulative and resetting on restart — rejected because the spec
explicitly requires cumulative scores to survive restart.

---

## Restart Endpoint Design

**Decision**: `POST /rooms/:code/restart?participantId=<id>` — validates the caller is the host,
transitions status back to `"lobby"`, clears round state (drawerId, secretWord, guesses,
roundScores), preserves participants and cumulative scores, and returns the updated snapshot.

**Rationale**: Matches the established pattern of `POST /:code/start` (query-param auth, returns
snapshot). No session tokens or cookies are in use; participantId-as-host-proof is the existing
auth pattern.

**Alternatives considered**: `DELETE /rooms/:code/round` — semantically less clear; REST-DELETE
also implies removing a resource, not transitioning state.

---

## Routing: New `/results` Page vs. Inline State on GamePage

**Decision**: New `ResultsPage` at route `/results` — polled clients navigate there when
`room.status === "completed"`; `LobbyPage` already navigates away when `status === "active"`,
so `/lobby` serves as the restart destination without changes.

**Rationale**: Matches the existing page-per-route pattern (`StartPage`, `LobbyPage`, `GamePage`).
Keeping results as a separate route means browser history works and avoids conditional render
complexity in `GamePage`.

**Alternatives considered**: Conditional render inside `GamePage` — rejected because it mixes
two distinct UX states in one component and violates Single Responsibility.

---

## Polling Behavior on Results and Lobby Post-Restart

**Decision**: `ResultsPage` polls at 2 s (same as `GamePage`). When it detects
`room.status === "lobby"` it navigates to `/lobby`. `LobbyPage` already navigates to `/game`
when it sees `"active"`, so the full cycle is covered by existing logic with one new branch
in `LobbyPage` (status `"completed"` → `/results`).

**Rationale**: Reusing the polling infrastructure avoids adding WebSockets or a push mechanism.
The 2 s polling latency satisfies SC-001 (≤3 s) and SC-003 (≤2 s with one poll cycle margin).

**Alternatives considered**: Long-polling or SSE — rejected; disproportionate for a lab demo.
