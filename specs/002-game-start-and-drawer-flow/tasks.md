# Tasks — Game Start & Drawer Flow

## Backend
1. Add `"playing"` status to Room model
2. Assign first participant as drawer on game start
3. Deterministically select word from STARTER_WORDS (hash of room code)
4. Filter `word` field per-viewer in `toRoomSnapshot`

## Frontend
5. Display word to drawer, "Waiting for drawer..." placeholder to guessers
6. Show role label (Drawer/Guesser) in player info

## Dependencies
- Group 1 must be complete
