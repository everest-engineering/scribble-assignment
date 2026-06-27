# Research: Result, Restart & Final Validation

## Unknowns Resolved

### 1. Disconnect Detection Mechanism

- **Question**: How to detect disconnected participants without WebSockets?
- **Decision**: Add `lastSeenAt: string` (ISO timestamp) to the `Participant` model. Update on every `GET /:code` request from that participant. Compute disconnect status server-side in `toRoomSnapshot()` by comparing `lastSeenAt` against current time.
- **Rationale**: Only option compatible with polling-only constraint. No background timers or WebSocket heartbeats needed. Disconnect is "observed" during polls, not "detected" in real-time.
- **Alternatives considered**: Client-side heartbeat POST (unnecessary extra requests), WebSocket (forbidden by constitution).

### 2. Disconnect Threshold

- **Question**: What threshold value for considering a participant disconnected?
- **Decision**: 30 seconds (15 missed polls at 2s interval, accounting for network jitter).
- **Rationale**: Long enough to avoid false positives from slow polls (~2s), short enough that players aren't waiting too long.
- **Alternatives considered**: 10s (too aggressive — single slow poll triggers false positive), 60s (too long — players wait a full minute).

### 3. `lastSeenAt` Initial Value on Join

- **Question**: What value does `lastSeenAt` have for a newly joined participant?
- **Decision**: Set to the participant's `joinedAt` timestamp on creation. This means they appear "disconnected" 30s after joining if they never poll.
- **Rationale**: Simple. No special-casing needed. In practice, all clients start polling immediately after joining.
- **Alternatives considered**: Set to `now()` at join time (same effect, since joinedAt is also `now()`). Set to far future (would mask real disconnection).

### 4. `skipSuggested` State Lifecycle

- **Question**: When is `skipSuggested` cleared?
- **Decision**: Cleared on `advanceRound()` (normal round advance or skip-round) and on `restartGame()`.
- **Rationale**: Once a round is skipped or the game restarts, the suggestion is no longer relevant.
- **Alternatives considered**: Clear on timer (unnecessary complexity), never clear (stale state).

### 5. Race Condition: claim-host Concurrent Requests

- **Question**: What happens if two participants call claim-host simultaneously?
- **Decision**: Node.js single-threaded event loop serializes them. Last write wins — both succeed, but only the second one's hostId persists.
- **Rationale**: Simple, deterministic. No mutex needed.
- **Alternatives considered**: First-write-wins with conditional check (extra complexity for no real benefit in single-threaded in-memory system).

### 6. Skip-round After Correct Guess

- **Question**: How to handle skip-round call when round already ended?
- **Decision**: Check for existing correct guess in `guessHistory`. If present, return 400 "Round already ended".
- **Rationale**: Prevents double-advance. Simple gating check.
- **Alternatives considered**: Let advanceRound run again (double-advance bug), make advanceRound idempotent (complex, extra state).

### 7. Name Resolution in Scores Table

- **Question**: How to correctly display names for participants who never guessed?
- **Decision**: Pass `participants[]` array to `RoundResultCard`. Resolve names by matching `participantId` against participants list.
- **Rationale**: `guessHistory` only contains entries for guessers. Drawer and inactive players have no guess entries and would show raw UUID otherwise.
- **Alternatives considered**: Include participant name in scores map (data duplication), derive from snapshot participants (clean, single source of truth).

### 8. Continue Button Re-display Prevention

- **Question**: After clicking Continue, should the result overlay reappear on next poll?
- **Decision**: No. Client suppresses re-display by tracking a `resultDismissed` flag. The server still has `lastRoundResult` until restart, but the client ignores it.
- **Rationale**: Players should not have to dismiss the overlay on every poll. On restart, server clears `lastRoundResult` and the overlay disappears naturally.
- **Alternatives considered**: Server-side dismiss tracking (unnecessary server state), auto-dismiss after N polls (user might not have finished reading).

## Technology Choices

### Backend Pattern

- **Disconnect detection**: Computed in `toRoomSnapshot()` using `lastSeenAt` comparison. Not a separate polling or timer process.
- **lastSeenAt update**: In the `GET /:code` route handler, before calling `toRoomSnapshot()`. The requesting participant's ID comes from the `?participantId=` query param.

### Frontend Pattern

- **DrawerDisconnectedBanner**: Same pattern as the existing `RoundResultCard` overlay — fixed position, full-screen backdrop. Accepts `onNotifyHost` callback.
- **HostDisconnectedBanner**: Same pattern. Accepts `onClaimHost` callback.
- **Local dismissal**: `roomStore` tracks `resultDismissed: boolean`. `fetchRoom()` sets `lastRoundResult` to null if `resultDismissed` is true (regardless of server state).
- **Skip Round badge**: CSS class toggle on the Skip Round button when `skipSuggested` is true. Simple pulse animation defined in `app.css`.
