# Research: Result, Restart, and Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-10

## Decision Log

### 1. Result state exposure in RoomSnapshot

**Decision**: When `room.status === "result"`, `toRoomSnapshot` always includes `secretWord`, `drawerName`, `guesses`, and `scores` — no viewer-based filtering.

**Rationale**: The round is over. Concealing the secret word from guessers is only meaningful during active play. Once the game ends, all players see the full result together. Removing the viewer filter for `"result"` state is the simplest correct approach and requires no new parameters.

**Alternatives considered**:
- Keep viewer filtering for result state → unnecessary complexity; no gameplay reason to hide the word after the round ends.

---

### 2. Host identity validation strategy

**Decision**: The `POST /rooms/:code/end` and `POST /rooms/:code/restart` endpoints accept a `playerName` field in the JSON request body. The server validates that `playerName === room.participants[0].name` (the first participant is always the host).

**Rationale**: Consistent with the existing identity pattern used in `submitGuess` (which also accepts `playerName` in the body). No session tokens or cookies exist in this project. The host is always `participants[0]` — established when `createRoom` sets `isHost: true` on the first participant and never changes.

**Alternatives considered**:
- UI-only restriction (no server guard) → rejected; FR-001a and FR-008a explicitly require server-side rejection.
- `participantId` in body → would work but the existing guess endpoint uses `playerName`; consistency favours `playerName`.

---

### 3. What restart clears

**Decision**: `restartGame()` clears `secretWord`, `drawerName`, `guesses`, `scores`, and `strokes`. It preserves `participants` and sets `status` back to `"lobby"`.

**Rationale**: A new round starts fresh. Scores are per-round, not cumulative (per spec assumption). Strokes from the previous round must not persist into the new lobby. Participants are preserved so players don't need to rejoin.

**Alternatives considered**:
- Carry scores across rounds → explicitly out of scope per spec Assumptions.

---

### 4. Polling navigation for "result" state

**Decision**: Both `GamePage` and `LobbyPage` polling loops handle the `"result"` state by navigating to `/result`. `ResultPage` does not poll (static display until host triggers restart, at which point the room returns to `"lobby"` and the next `pollRoom` in other pages handles it).

**Rationale**: `GamePage` is the primary source of `"result"` detection (drawer ends game during play). `LobbyPage` handles the edge case where a player had not yet transitioned to the game. `ResultPage` introduces its own `scheduleNextPoll` loop watching for the room returning to `"lobby"` state, mirroring the `LobbyPage` pattern exactly.

**Alternatives considered**:
- Only poll in `GamePage` → breaks the edge case of a late-joining player who is still on the lobby/result screen.

---

### 5. ResultPanel placeholder

**Decision**: The `ResultPanel` component in `GamePage`'s sidebar is removed. It was a placeholder for game activity. The real result experience is the dedicated `ResultPage`.

**Rationale**: The placeholder adds visual noise. `ResultPage` is the correct place for results. `GamePage` already has the "Guess History" card in the right sidebar for in-game activity.

**Alternatives considered**:
- Keep `ResultPanel` and populate it → rejected; the sidebar space is already used by Scoreboard and the game history card. A dedicated full page is cleaner.

---

### 6. ResultPage route

**Decision**: Add `/result` as a new route in `routes/index.tsx` pointing to a new `ResultPage` component.

**Rationale**: Consistent with the existing `/lobby`, `/game` route pattern. All navigation is declarative via React Router `navigate()` calls triggered by polling state detection.

**Alternatives considered**:
- Reuse `/game` route and render result UI conditionally → would couple game and result rendering; harder to test independently per constitution principle V.
