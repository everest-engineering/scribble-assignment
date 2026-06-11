# Group 2 — Game Start & Drawer Flow Plan

## State Model Additions
- RoomStatus: add `"playing"`
- Room: add `drawerId: string | null`, `secretWord: string | null`

## Data Flow
1. Host clicks "Start Game" on lobby page.
2. Frontend sends `POST /rooms/:code/start` with participantId.
3. Backend validates: host-only, min 2 players, status must be "lobby".
4. Backend assigns drawer = first participant, selects word deterministically `(count-1) % words.length`.
5. Room status → "playing". All polling clients see the update and navigate to game page.

## Word Visibility Rule
- In `toRoomSnapshot`: if viewer's participantId === drawerId, include `secretWord`.
- Otherwise, `secretWord` is `null`.

## File-Level Changes

### Backend
1. `src/models/game.ts` — Add RoomStatus "playing", drawerId, secretWord fields
2. `src/services/roomStore.ts` — Implement startGame logic (assign drawer, select word)
3. Update `toRoomSnapshot`: word visibility rules

### Frontend
1. `src/pages/GamePage.tsx` — Show drawer indicator, secret word for drawer
2. Navigate from lobby to game when status = "playing"
3. Show "You are the drawer!" / "Waiting for drawer..." based on role
