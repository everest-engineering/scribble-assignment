# Research: Post Game Experience

**Feature**: Post Game Experience | **Date**: 2026-06-09 | **Plan**: `specs/004-post-game-experience/plan.md`

## Decisions

### 1. Round-End Trigger

**Decision**: The round ends immediately when any guesser submits a correct guess. The `submitGuess()` function already detects correct guesses; the new behavior is that on a correct guess, the round phase transitions to `"finished"` instead of remaining in `"drawing"`.

**Rationale**: Simplest approach — the correct-guess detection already exists. Adding a phase transition is a small, well-contained change.

**Alternatives considered**:
- *Timer-based end*: Would require additional timer infrastructure. Out of scope.
- *All-correct end*: Wait until all guessers guess correctly. Less common in party games.

### 2. Result Screen State

**Decision**: The `"finished"` phase is a shared state visible to all players via existing polling. The result screen renders based on the phase, showing secret word, standings, and guess log from the room snapshot. No new API endpoints needed for reading the result.

**Rationale**: The existing `GET /rooms/:code` polling endpoint already returns the room snapshot including `secretWord`, `guesses`, and participant data. The only change is that the secret word is now visible to all players (not just the drawer) when the phase is `"finished"`.

**Alternatives considered**:
- *Separate result endpoint*: Unnecessary duplication — room snapshot already has all needed data.

### 3. Secret Word Visibility After Round End

**Decision**: The `toRoomSnapshot()` function currently hides the secret word from guessers. When the phase is `"finished"`, the secret word is revealed to all players.

```typescript
function toRoomSnapshot(room, viewerParticipantId) {
  const revealSecret = isDrawer || room.round?.phase === "finished";
  // ...
  secretWord: revealSecret ? room.round!.secretWord : null,
}
```

**Rationale**: The result screen must show the secret word to everyone. This is a simple conditional in the existing snapshot function.

**Alternatives considered**:
- *Client-side reveal*: Less secure — determined players could inspect network traffic.

### 4. Restart Mechanism

**Decision**: A `POST /rooms/:code/restart` endpoint that resets the room to `"lobby"` status, clears the round (including strokes, guesses, word selection), but preserves the full participant list. Only the host can restart.

```text
Before restart:  Room{ status: "finished", participants: [A,B,C], round: {...} }
After restart:   Room{ status: "lobby",    participants: [A,B,C], round: null }
```

**Rationale**: Simple state mutation. The existing lobby polling (2s) picks up the reset state automatically. Host-only check reuses the existing `hostId` pattern.

**Alternatives considered**:
- *New game from result screen*: Similar to restart but could trigger game start immediately. Less flexible — players might need a moment between rounds.

### 5. Polling Behavior During Finished Phase

**Decision**: During the `"finished"` phase, polling continues at 2s (same as lobby), not 500ms (drawing speed). The result screen updates passively.

**Rationale**: No need for fast updates during the result screen. Reduces server load.

### 6. Player Standings Calculation

**Decision**: Standings are computed client-side from the guess data in the room snapshot:
- Each guesser: has `isCorrect: true` if any of their guesses is correct
- The drawer: count of distinct guessers who guessed correctly

**Rationale**: All needed data is already in the room snapshot `guesses` array. Client-side computation avoids adding server logic for presentation. Correctness visibility is already unfiltered for the individual guesser during the round, and will be unfiltered for everyone when phase is `"finished"`.

**Alternatives considered**:
- *Server-side standings*: Would require a new computed field. More complex for no clear benefit.

### 7. Canvas Visibility After Round End

**Decision**: The final drawing remains visible on the result screen. Strokes are already included in the room snapshot and are not cleared on round end.

**Rationale**: Players should see what was drawn. No data cleanup needed since strokes are stored in the round object, which is preserved during the finished phase and only cleared on restart.
