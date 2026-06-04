# Plan: Game Start & Drawer Flow

## Files to Modify

- `backend/src/services/roomStore.ts` — `startGame()` with deterministic word selection, `toRoomSnapshot()` with viewer-aware logic
- `backend/src/models/game.ts` — Add `drawerId`, `secretWord`, `RoomStatus` values
- `backend/src/api/rooms.ts` — Wire up start endpoint
- `frontend/src/pages/GamePage.tsx` — Show secret word to drawer, game header

## Implementation Order

1. Add `drawerId` and `secretWord` to Room model
2. Implement `startGame()` with deterministic word selection
3. Implement viewer-aware `toRoomSnapshot()`
4. Add start endpoint to rooms router
5. Proper word selection approach
6. Update GamePage to show secret word to drawer
7. Add name validation tests

## Key Design Decision

Secret word is selected deterministically (always the first word `"rocket"`) rather than randomly, to ensure predictable behavior across game instances.
