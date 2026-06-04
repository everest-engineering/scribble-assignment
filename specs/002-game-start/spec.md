# 002 – Game Start & Drawer Flow

## Acceptance Criteria

- Player names are trimmed on submission; empty or whitespace-only names are rejected
- A drawer is assigned when the game starts (first participant in the room)
- A secret word is selected deterministically from the provided starter word list
- The secret word is visible only to the drawer (included in snapshot when `viewerParticipantId === drawerId`)
- Guessers see `null` instead of the secret word

## Implementation Details

- `backend/src/services/roomStore.ts`: `pickDeterministicWord()` uses a deterministic index based on participant count; `startGame()` sets `drawerId` to `participants[0].id` and `secretWord` from the deterministic selection
- `backend/src/services/roomStore.ts`: `toRoomSnapshot()` checks `viewerParticipantId === room.drawerId` to decide whether to include `secretWord`
- `backend/src/api/schemas.ts`: `z.string().trim().min(1).optional()` on playerName fields rejects empty/whitespace-only inputs
- `frontend/src/pages/GamePage.tsx`: Drawer sees a yellow banner with the word; guessers see "Guessing" status
- `backend/src/seed/starterData.ts`: Contains `["rocket", "pizza", "castle", "guitar", "sunflower"]`

## Dependencies

- Depends on: 001-room-setup (room must exist with participants)
- Used by: 003-gameplay (drawer must be assigned before gameplay)
