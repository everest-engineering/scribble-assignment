# Technical Implementation Plan - Game Start & Drawer Flow (Slice 2)

## Overview
This document describes the technical plan for Slice 2: managing player name trimming and validation on room creation/join, assigning the drawer on game start, choosing the secret word deterministically, and securing word visibility based on roles.

---

## Proposed Changes

### 1. Model Updates (Shared)

#### [MODIFY] [backend/src/models/game.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/models/game.ts)
- Add optional fields to `Room` and `RoomSnapshot` interfaces:
  - `drawerId?: string` (tracks the participant ID of the drawer).
  - `secretWord?: string` (holds the secret word).

#### [MODIFY] [frontend/src/services/api.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/services/api.ts)
- Align the `RoomSnapshot` interface:
  ```typescript
  export interface RoomSnapshot {
    code: string;
    status: "lobby" | "active";
    participants: Participant[];
    availableWords: string[];
    roles: ParticipantRole[];
    hostId: string;
    drawerId?: string;
    secretWord?: string; // Present only if this player is the drawer
  }
  ```

---

### 2. Backend Logic & Services

#### [MODIFY] [backend/src/services/roomStore.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/services/roomStore.ts)
- **`createRoom(playerName)` & `joinRoom(code, playerName)`**:
  - Double check that `playerName.trim()` is performed before storing participant names (this guarantees they are clean in memory).
- **Deterministic Word Selection**:
  - Implement a helper function to select a word deterministically from `STARTER_WORDS` using the room code (e.g. summing ASCII char codes modulo the array length):
    ```typescript
    export function getDeterministicWord(code: string): string {
      const sum = code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return STARTER_WORDS[sum % STARTER_WORDS.length];
    }
    ```
- **`startGame(code, hostParticipantId)`**:
  - Assign the drawer: `room.drawerId = room.participants[0].id` (first player in the list).
  - Select the word: `room.secretWord = getDeterministicWord(code)`.
- **`toRoomSnapshot(room, viewerParticipantId)`**:
  - Include `drawerId: room.drawerId`.
  - Populate `secretWord: room.secretWord` if and only if `viewerParticipantId === room.drawerId`. Otherwise, omit it from the returned snapshot.

---

### 3. Frontend Pages & Store

#### [MODIFY] [frontend/src/pages/GamePage.tsx](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/pages/GamePage.tsx)
- Identify current user role:
  - `const isDrawer = room.drawerId === participantId;`
- Retrieve the drawer's name:
  - `const drawerName = room.participants.find(p => p.id === room.drawerId)?.name || "Someone";`
- Update UI headers and details:
  - Show role status under Player Info: `"Drawer"` vs `"Guesser"`.
  - Add a banner or notice displaying the secret word if `isDrawer` is true (e.g. *"Your secret word: **ROCKET**"*).
  - If the player is a guesser, display *"**[drawerName]** is drawing. Guess the word!"*

---

## Verification Plan

### Automated Tests
- Run `npm test` inside the backend directory to check validations and schema constraints.
- Write tests in `backend/src/services/roomStore.test.ts` to verify:
  - Trimmed names are saved.
  - Non-drawers do not receive `secretWord` in the snapshot.
  - The drawer does receive the `secretWord`.
  - Deterministic word selection behaves as expected for a given room code.

### Manual Verification Flow (2 Browser Tabs)
1. **Lobby Start**:
   - Host Tab A (`Alice`) and Guest Tab B (`Bob`) assemble in the lobby.
2. **Start Game**:
   - Host clicks "Start Game".
   - Both tabs are redirected to `/game`.
3. **Role Check**:
   - Tab A shows: role is `Drawer`, secret word is visible (e.g. `guitar`).
   - Tab B shows: role is `Guesser`, secret word is NOT visible (hidden/undefined in snapshot). Shows status message: *"Alice is drawing. Guess the word!"*.
