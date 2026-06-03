# Implementation Plan: Results and Restart

## Scope

This feature slice finalizes the one-round game by showing shared results and allowing the host to restart the room. It does not implement multiple rounds, timers, drawer rotation, persistent history, or authentication.

## Technical Approach

- Use the correct-guess path in `submitGuess` to move the room to result state.
- Keep the ended round data available while the room is in result state.
- Update room snapshots so result state exposes the secret word to all participants.
- Add `canRestart` to snapshots for host-only restart UI.
- Implement `restartRoom(code, participantId)` in the room store.
- Enforce host-only restart and reject restart unless the room is in result state.
- Clear round state by setting `round` to null and status back to lobby.
- Preserve room code, host participant id, and participants during restart.
- Add `POST /rooms/:code/restart`.
- Keep polling active in result state so all players observe restart and navigate back to lobby.

## Files

- `backend/src/services/roomStore.ts`
- `backend/src/api/rooms.ts`
- `backend/src/services/roomStore.test.ts`
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/pages/GamePage.test.tsx`
- `frontend/src/services/api.test.ts`
- `frontend/src/state/roomStore.test.ts`

## Risks

- Restart could accidentally discard participants if room-level and round-level state are not separated. The implementation clears only round state.
- Non-host UI might show restart incorrectly if it relies only on local role inference. The server-provided `canRestart` flag remains authoritative.

## Validation Plan

- Backend tests for result snapshots, host-only restart, non-host rejection, participant preservation, and cleared round state.
- Frontend tests for result view, restart button state, API request shape, and store transition to lobby.
- Manual two-browser validation for result synchronization and host restart.
