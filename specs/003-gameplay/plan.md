# Technical Plan: Gameplay Interaction

## Overview
This feature implements interactive drawing on a canvas (drawer only), guess submission and validation (guessers only), real-time sync via polling, and deterministic scoring. The backend already has guess and canvas submission logic; the frontend must provide the UI and polling integration.

---

## Frontend Architecture

### Pages
- Game Page: Main gameplay interface

### Components
- Canvas (interactive drawing)
- Clear Canvas Button
- Guess Form (input + submit)
- Guess History Display
- Scoreboard
- Role Indicator

### State Management
- roomStore: Manages room state including guesses and canvasLines
- useState: Local canvas state before sync
- useEffect: Polling integration for guess/canvas sync

---

## Backend Architecture

### Existing Endpoints
- POST /rooms/:code/canvas: Save canvas lines
- POST /rooms/:code/guess: Submit guess
- GET /rooms/:code: Poll for updates

### Validation in Schemas
- submitGuessSchema: Validate message (non-empty after trim)
- saveCanvasSchema: Validate lines (array of strings)

### Logic in roomStore
- submitGuess: Validate, compare case-insensitively, score
- saveCanvas: Update canvas only if drawer

---

## Room State Model

```ts
interface Room {
  canvasLines: string[];  // Updated by drawer
  guesses: Guess[];       // Appended by guessers
}

interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  message: string;        // Trimmed input
  isCorrect: boolean;     // Case-insensitive comparison
  createdAt: string;
}

interface Participant {
  score: number;          // Incremented on correct guess
}
```

---

## Canvas Implementation

### Drawing Mechanism
- HTML5 Canvas or SVG-based drawing library
- Store serialized line data (e.g., stroke paths)
- Sync to backend via POST /rooms/:code/canvas
- Drawer only; guessers receive read-only view

### Canvas Sync Flow
```
Drawer draws → Local canvas state updates
  ↓
Drawer completes line → POST /rooms/:code/canvas
  ↓
Backend: Validate drawer, update room.canvasLines
  ↓
All players poll GET /rooms/:code
  ↓
Frontend: Update canvasLines in roomStore
  ↓
Canvas component re-renders with new lines
```

---

## Guess Flow

### Guess Submission
```
Guesser types "Rocket" in form
  ↓
Guesser clicks Submit
  ↓
Frontend: Validate non-empty after trim
  ↓
POST /rooms/:code/guess { message: "Rocket" }
  ↓
Backend: 
  - Validate guesser role
  - Trim message
  - Compare "rocket".toLowerCase() === "rocket".toLowerCase()
  - Set isCorrect: true
  - Award 100 points
  - Append to guesses array
  ↓
Response includes updated guesses and participant.score
  ↓
All players poll GET /rooms/:code
  ↓
Frontend: Render updated guesses and scoreboard
```

### Validation Rules
- Empty message rejected: "Guess cannot be empty"
- Whitespace trimmed: "  hello  " → "hello"
- Case-insensitive: "RoCkEt" compared to "rocket"

---

## File-Level Implementation Plan

### Backend
1. **api/schemas.ts**: Ensure submitGuessSchema validates non-empty, saveCanvasSchema validates
2. **services/roomStore.ts**: 
   - submitGuess already validates and scores (verify AC-20 through AC-25)
   - saveCanvas already restricts to drawer (verify AC-18)

### Frontend
1. **components/Canvas.tsx** (or integrate into GamePage):
   - HTML5 canvas or drawing library
   - Drawer mode: interactive drawing
   - Guesser mode: display only
   - Handle line serialization
2. **components/GuessForm.tsx**:
   - Input validation (trim, non-empty check)
   - Submit handler calling POST /rooms/:code/guess
   - Error display
3. **pages/GamePage.tsx**:
   - Integrate polling to fetch canvas and guesses
   - Display role indicator
   - Pass room state to components
4. **state/roomStore.ts**:
   - Add submitGuess method (POST /rooms/:code/guess)
   - Add saveCanvas method (POST /rooms/:code/canvas)
   - Expose guesses and canvasLines from room snapshot

---

## Data Flow

```
Room Snapshot (every 2 seconds)
  ├─ canvasLines: Updated by drawer's saveCanvas calls
  ├─ guesses: Appended by guesser's submitGuess calls
  ├─ participants.*.score: Incremented by backend on correct guess
  └─ participants.*.role: "drawer" or "guesser"
```

---

## Dependencies
- Scenario 001 (Room Setup & Lobby)
- Scenario 002 (Game Start & Drawer Flow)
- Backend endpoints already implemented
