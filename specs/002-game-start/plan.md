# Technical Plan: Game Start & Drawer Flow

## Overview
This feature ensures that player names are properly validated and trimmed, the drawer is correctly assigned on game start, and the secret word is visible only to the drawer. The implementation builds on the existing room store and adds name validation logic to both frontend and backend.

---

## Frontend Architecture

### Pages
- Join Room Page: Validate name input before submission
- Lobby Page: Display game start transition
- Game Page: Display role-specific content (word visibility)

### Components
- Join Room Form: Validate and trim player name
- Game Page: Show secret word to drawer, hide from guessers
- Result Panel: Accessible after game ends

### State Management
- roomStore: Manage room state including currentDrawerId and currentWord
- useRoomState hook: Expose viewer-specific word visibility

---

## Backend Architecture

### Existing Endpoints Used
- POST /rooms/:code/start: Already assigns drawer and word
- GET /rooms/:code: Already returns viewer-specific snapshots

### Validation Layer
- `joinRoomSchema` in api/schemas.ts: Validate and trim playerName
- Display name logic: Reject empty/whitespace-only strings

### Room State Model

#### Name Validation
```ts
// Input: "  Alice  " or "" or "   "
// Output: "Alice" or Error
function validatePlayerName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Player name cannot be empty");
  }
  return trimmed;
}
```

#### Drawer Assignment
```ts
// In startGame: first participant becomes drawer
const drawer = room.participants[0];
room.currentDrawerId = drawer.id;
room.currentWord = STARTER_WORDS[0]; // "rocket"
room.participants.forEach(p => {
  p.role = p.id === drawer.id ? "drawer" : "guesser";
});
```

#### Snapshot Visibility
```ts
// In toRoomSnapshot:
currentWord: 
  viewerParticipantId === room.currentDrawerId
    ? room.currentWord 
    : undefined
```

---

## File-Level Implementation Plan

### Backend
1. **api/schemas.ts**: Add validation to trim playerName in joinRoomSchema
2. **services/roomStore.ts**: Ensure startGame assigns drawer and sets currentWord (already done)
3. **api/rooms.ts**: Validate participantId in start endpoint (already done)

### Frontend
1. **pages/JoinRoomPage.tsx**: Add name validation before submit
2. **pages/GamePage.tsx**: Display word to drawer, hide from guessers
3. **components/GuessForm.tsx**: Show role indicator
4. **state/roomStore.ts**: Ensure currentWord is properly exposed

---

## Data Flow

```
User Input (Join Room Form)
  ↓
Frontend: Validate & trim name
  ↓
API: POST /rooms/:code/join { playerName: "Alice" }
  ↓
Backend: Validate, trim, add participant
  ↓
Host clicks "Start Game"
  ↓
API: POST /rooms/:code/start
  ↓
Backend: Assign drawer (first participant), set word, assign roles
  ↓
Frontend: Poll GET /rooms/:code
  ↓
RoomSnapshot returned with currentWord hidden from guessers
  ↓
GamePage renders: drawer sees word, guessers see hint
```

---

## Dependencies
- Scenario 001 (Room Setup & Lobby) must be complete
- Backend POST /rooms/:code/start must be functional
- Frontend polling must be active
