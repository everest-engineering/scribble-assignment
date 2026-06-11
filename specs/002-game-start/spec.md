# Scenario 2: Game Start and Host Assignment

## Objective
Make sure the host is assigned correctly, player names are trimmed, and the secret word selection is deterministic.

## Acceptance Criteria
- Room creation and join requests trim `playerName` before storage.
- The host remains the first participant created in the room.
- The host can start the game via `POST /api/rooms/:code/start`.
- Starting the game sets `room.status` to `active` and assigns `drawerId`.
- The secret word is chosen deterministically from the room code using a fixed hash function.
- Drawer sees the actual secret word; guessers see only masked placeholders.

## Contracts
- Backend contract: `POST /api/rooms/:code/start` accepts `{ participantId }`.
- Backend contract: `RoomSnapshot.word` returns either actual secret or masked string depending on `viewerParticipantId`.
- Frontend contract: `frontend/src/pages/GamePage.tsx` should hide the guess input for the drawer.

## Files
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/api/rooms.ts`
- `backend/src/api/schemas.ts`
- `backend/src/models/game.ts`
