# Plan: Result, Restart & Final Validation

## Source

- Discovery: `speckit/discovery.md`
- Spec: `specs/004-results-restart/spec.md`
- Prior feature: `specs/003-gameplay-interaction/spec.md`
- Constitution: `speckit/constitution.md`

## Goal

Complete the result and restart slice: expose a result state with correct word, final scores, and complete guess history; allow only the host to restart; preserve players and host identity; clear all round-specific state; and return everyone to lobby through HTTP polling.

## Current State

Feature Group 3 stores active round scores, drawing state, and guess history while the room is `playing`. Correct guesses are recorded, but there is no completed/result status yet. The game page has a scoreboard, activity list, canvas, and guess controls, but no result view or restart control.

## Backend Plan

1. Extend the room status model in `backend/src/models/game.ts`.
   - Add a result status, such as `result`.
   - Keep `lobby` and `playing` behavior unchanged.

2. Add result data to room snapshots.
   - Expose `correctWord` only when the room is in result state.
   - Continue exposing final scores and complete guess history.
   - Keep lobby snapshots free of prior round word, drawing, scores, and guesses after restart.

3. Transition to result state.
   - When a correct guess is submitted, mark the room as `result`.
   - Preserve scores, guess history, drawing state, drawer identity, and selected word for result display.
   - Disable further drawing, clear, and guess mutations once the room is in result state.

4. Add restart validation in `backend/src/api/schemas.ts`.
   - Restart payload requires `participantId`.
   - Use existing room-code validation.

5. Add restart service logic in `backend/src/services/roomStore.ts`.
   - Reject unknown rooms.
   - Reject unknown participants.
   - Reject non-host participants.
   - Reject restart unless room status is `result`.
   - Preserve room code, host id, participant list, created timestamp, and participant order.
   - Set status to `lobby`.
   - Clear drawer id, word, drawing state, scores, guess history, and result word exposure.
   - Update `updatedAt`.

6. Add restart route in `backend/src/api/rooms.ts`.
   - Use `POST /rooms/:code/restart`.
   - Return the updated lobby room snapshot.

## Frontend Plan

1. Update frontend room status and snapshot types in `frontend/src/services/api.ts`.
   - Add `result` room status.
   - Add nullable `correctWord`.
   - Add `restartGame(code, participantId)`.

2. Update room store in `frontend/src/state/roomStore.ts`.
   - Add `restartGame()`.
   - Keep snapshot replacement as the source of truth.

3. Update game-page polling and navigation.
   - Continue polling while room is `playing` or `result`.
   - Do not leave the game page just because status becomes `result`.
   - When polling sees `lobby`, navigate everyone back to `/lobby`.

4. Add result UI.
   - Display correct word in result state.
   - Display final scores from the existing scores snapshot.
   - Display complete guess history from the existing guess history snapshot.
   - Show restart control only to host in result state.
   - Disable or hide restart for non-host participants.

5. Disable active gameplay controls in result state.
   - Canvas remains visible/read-only.
   - Clear canvas is unavailable.
   - Guess form is disabled.

## Data Flow

1. Correct guess ends the round.
   - Guesser submits correct guess.
   - Backend scores the guess and transitions room status to `result`.
   - Polling clients receive `result`, `correctWord`, final scores, and full guess history.

2. Host restarts.
   - Host calls restart endpoint.
   - Backend verifies host and result state.
   - Backend clears round state and returns lobby snapshot.
   - Polling clients observe `lobby` and navigate back to lobby.

3. Next game start.
   - Existing participants remain in the lobby.
   - Host can start again through Feature Group 1 behavior.
   - Feature Group 2 and 3 initialization creates fresh drawer, word, scores, drawing, and guesses.

## Testing Plan

1. Backend room-store tests.
   - Correct guess transitions room to result.
   - Result snapshots include correct word, final scores, and full guess history.
   - Further drawing, clear, and guess actions are rejected in result state.
   - Non-host restart is rejected.
   - Unknown participant restart is rejected.
   - Restart outside result state is rejected.
   - Host restart preserves code, host, participants, and participant order.
   - Host restart clears drawer, word, drawing, scores, and guess history.
   - Restarted lobby snapshot does not expose previous correct word.

2. Backend schema/API tests.
   - Restart schema requires participant id.
   - Restart route rejects invalid room codes and unauthorized callers.

3. Frontend tests.
   - API restart method calls expected endpoint.
   - Result state renders correct word, final scores, and guess history if component tests are available.

4. Manual validation.
   - Start a 2-player game.
   - Submit a correct guess.
   - Confirm both players see result state with correct word, scores, and full history.
   - Confirm only host can restart.
   - Restart and confirm both players return to lobby.
   - Confirm players and host are preserved.
   - Confirm prior round word, drawing, guesses, and scores are cleared.

## Risks

1. Result state changes existing `playing` assumptions in frontend navigation and backend mutation guards.
2. Restart must clear all round-specific fields without removing players.
3. Correct-word visibility must be limited to result state so restarted lobbies do not leak prior words.
4. Frontend and backend duplicated snapshot types must stay aligned.

## Out Of Scope

1. Multiple rounds or drawer rotation.
2. Timers, countdowns, speed bonuses, or drawer bonuses.
3. Persistent history after restart.
4. WebSockets, databases, authentication, or deployment.
