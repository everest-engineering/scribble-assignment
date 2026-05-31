# Quickstart: Game Start & Drawer Flow

## Backend Changes

### 1. Add types to `backend/src/models/game.ts`
- Add `Round` interface (number, drawerId, secretWord, status)
- Add `currentRound: number` and `rounds: Round[]` to `Room`
- Add `currentRound`, `drawerId`, `secretWord` to `RoomSnapshot`

### 2. Update `backend/src/services/roomStore.ts`
- `startGame()`: After setting status, create Round 1, assign host as drawer, select word
- `selectWord(roundNumber)`: Deterministic word from `STARTER_WORDS`
- `toRoomSnapshot()`: Include `currentRound`, `drawerId` for all; `secretWord` only if viewer is drawer

## Frontend Changes

### 1. Update types in `frontend/src/services/api.ts`
- Add new fields to `RoomSnapshot` (currentRound, drawerId, secretWord)

### 2. Update `frontend/src/pages/GamePage.tsx`
- Display "You are the drawer!" or "Waiting for drawer..." based on identity
- Show secret word prominently if the player is the drawer
- Show who the drawer is if the player is a guesser

## Testing

- Update `roomStore.test.ts`: Verify `startGame()` creates round 1 with host as drawer
- Add test for `selectWord()` deterministic behavior
- Add test for `toRoomSnapshot()` drawer vs guesser word visibility
