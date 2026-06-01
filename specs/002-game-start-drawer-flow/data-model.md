# Phase 1: Data Model Updates

## Entities

### 1. Room (Updates)
- `status`: Now supports transition from `'Lobby'` to `'Game'`.
- `currentRound`: (New) Object tracking the active round state.

### 2. Player (Updates)
- `role`: (New) Player roles can be `'Host'`, `'Drawer'`, or `'Guesser'`. (Or derived: if `playerId === currentRound.drawerId` they are the drawer).

### 3. Round (New Entity within Room)
- `drawerId`: `string` (ID of the player assigned to draw).
- `wordOptions`: `string[]` (Array of 3 words presented to the drawer. Kept secret).
- `secretWord`: `string | null` (The chosen word, null until chosen. Kept secret).
- `roundStatus`: `'SelectingWord' | 'Drawing' | 'Ended'`
- `roundEndTime`: `number | null` (Timestamp of when the round ends, set after word is selected).

## Validation Rules (Zod)
- The Zod schemas for room state will define `wordOptions` and `secretWord` as optional strings/arrays, as they are conditionally stripped for Guessers.
- `drawerId` must match an active player in the `Room.players` map.
- `wordOptions` must be an array of exactly 3 strings when generated.
