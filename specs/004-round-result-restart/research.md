# Research: Round Result and Restart

## State Machine Evolution

**Decision**: Replace `"round_ended"` status with `"results"` and add `lobby → playing → results → lobby` cycle.

**Rationale**: Spec 003 introduced `"round_ended"` as the terminal state. Spec 004 needs a non-terminal post-round state that can transition back to lobby. Rather than adding a parallel state, we rename `"round_ended"` to `"results"` since:
- Both states have identical behavior (show word to all, reject actions)
- `"results"` better describes the user-facing purpose
- Makes the full cycle clear: `lobby → playing → results → lobby`

**Alternatives considered**: Keeping `"round_ended"` and adding `"results"` as a separate state (unnecessary indirection), or keeping `"round_ended"` terminal and adding a separate restart path (breaks the clean state machine).

## Restart Mechanism

**Decision**: Single `playAgain()` service function that resets round-scoped fields while preserving the player list and host.

**Rationale**: The simplest approach. The function:
- Validates the room exists and the requester is a participant
- Sets `status` to `"lobby"`
- Clears `drawerId`, `secretWord`, `strokes`, `clearVersion`, `guesses`, `scores`
- Preserves `participants`, `hostId`, `code`
- Uses the existing `saveRoom()` / `rooms.set()` pattern

**Alternatives considered**: Creating a new room with same players (too complex, breaks room code), soft-reset with a flag (unnecessary indirection).

## Idempotency

**Decision**: `playAgain()` is idempotent — if the room is already in `"lobby"`, return success with no changes.

**Rationale**: Multiple players may click "Play Again" in the same poll cycle. The first request transitions the room; subsequent requests find status already `"lobby"` and return the current snapshot. No additional coordination needed.

## Frontend Navigation Flow

**Decision**: The existing `GamePage` navigation logic handles the restart flow automatically.

**Rationale**: `GamePage.tsx` already has `if (room.status === "lobby") navigate("/lobby")`. When polling picks up the restart → lobby transition, the page auto-navigates. No new routing logic needed.

## Results Data Exposure

**Decision**: The existing `toRoomSnapshot()` behavior for `"round_ended"` already shows the secret word to all players. This transfers directly to `"results"`.

**Rationale**: No changes needed to the snapshot projection logic for results display — only the status string changes.
