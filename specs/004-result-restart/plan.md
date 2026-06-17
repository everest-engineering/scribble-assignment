# Group 4 — Result, Restart & Final Validation Plan

## State Model Additions
- RoomStatus: add `"result"`

## Data Flow (Result & Restart)
1. When status = "result", `secretWord` is visible to all in snapshot (drawer and guessers).
2. `POST /rooms/:code/restart` (host-only) clears drawing, guesses, scores, secretWord, drawerId.
3. Status returns to "lobby". Participants and hostId preserved.
4. All polling clients see the status transition and auto-navigate to lobby.

## Word Visibility Rule (Result)
- In `toRoomSnapshot`: if room.status === "result", include `secretWord` for all viewers.

## File-Level Changes

### Backend
1. `src/models/game.ts` — Add RoomStatus "result"
2. `src/services/roomStore.ts` — Implement restartGame (clear round state, preserve participants)
3. `src/api/rooms.ts` — Add POST /:code/restart endpoint
4. Update `toRoomSnapshot`: reveal secret word to all when status = "result"

### Frontend
1. `src/pages/GamePage.tsx` — Show result view (word, scores, guess history) when status = "result"
2. Add restart button for host on result screen
3. Navigate to lobby on restart
