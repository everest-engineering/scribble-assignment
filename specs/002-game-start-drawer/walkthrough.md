# Implementation Walkthrough - Game Start & Drawer Flow (Slice 2)

This walkthrough documents the technical details of the changes implemented for Slice 2, how they conform to the specification, and how to verify them.

---

## Changes Implemented

### 1. Model Extensions
- **[models/game.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/models/game.ts)**:
  - Extended `Room` and `RoomSnapshot` to support `drawerId?: string` and `secretWord?: string`.
- **[services/api.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/services/api.ts)**:
  - Aligned frontend type definition `RoomSnapshot` to match.

### 2. Backend Logic (RoomStore Service)
- **[services/roomStore.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/services/roomStore.ts)**:
  - Ensured player names are trimmed in both `createRoom()` and `joinRoom()`.
  - Added deterministic word selection `getDeterministicWord(code)` based on the room code (ASCII summation modulo word length).
  - Updated `startGame()` to:
    - Set the `drawerId` to the first participant's ID.
    - Set `secretWord` to the selected word.
  - Implemented a privacy guard in `toRoomSnapshot()` so that only the drawer can view the `secretWord` in the snapshot returned to the client.

### 3. Frontend Integration
- **[pages/GamePage.tsx](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/pages/GamePage.tsx)**:
  - Added role detection (`const isDrawer = room.drawerId === participantId`).
  - Added a 2-second background polling loop using `setInterval` to periodically refresh the game room snapshot.
  - Custom-tailored the Canvas card depending on role:
    - **Drawer**: Shows their secret word clearly (e.g. `guitar`) and prompts them to draw.
    - **Guesser**: Displays the name of the current drawer (e.g. `"Alice is drawing..."`) and keeps the secret word hidden.
  - Updated Player Info Card to display the player's role (Drawer/Guesser).

---

## Automated Verification Results
- Ran all unit tests in the backend package.
- 6 unit test scenarios pass successfully in `roomStore.test.ts` (verifying trimming, deterministic selection, drawer assignment, and snapshot privacy guards).
