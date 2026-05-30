# Technical Plan: Result, Restart & Final Validation

## Overview
This feature implements the result display screen, score management, guess history review, and a clean restart mechanism that resets round state while preserving the room and participant list. The backend needs a restart endpoint; the frontend needs a result screen component and restart flow.

---

## Frontend Architecture

### Pages
- Result Page: Display final answer, scores, guess history
- Navigate back to Lobby Page after restart

### Components
- Result Panel: Show final answer, guess history, scores
- Scoreboard: Final scores display
- Guess History List: Complete game record
- Restart Button (host only)

### State Management
- roomStore: Manage room.status transitions
- useRoomState: Expose room state for result display
- Polling: Continue polling until restart is triggered

---

## Backend Architecture

### New Endpoints
- POST /rooms/:code/restart: Reset round state, return to lobby

### Existing Endpoints Used
- GET /rooms/:code: Already polls for current room state

### Logic in roomStore
- startGame: Sets initial drawer and word
- submitGuess: Already scores correctly
- New restart logic: Reset guesses, canvas, scores, roles, currentWord

---

## Room State Model

### Before Restart
```ts
{
  status: "playing",
  round: 1,
  currentDrawerId: "alice-id",
  currentWord: "rocket",
  guesses: [
    { id: "...", playerName: "Bob", message: "rocket", isCorrect: true, ... },
    { id: "...", playerName: "Carol", message: "fire", isCorrect: false, ... },
  ],
  canvasLines: ["line1", "line2", ...],
  participants: [
    { id: "alice-id", name: "Alice", role: "drawer", score: 0 },
    { id: "bob-id", name: "Bob", role: "guesser", score: 100 },
    { id: "carol-id", name: "Carol", role: "guesser", score: 0 },
  ]
}
```

### After Restart
```ts
{
  status: "lobby",
  round: 2,
  currentDrawerId: undefined,
  currentWord: undefined,
  guesses: [],
  canvasLines: [],
  participants: [
    { id: "alice-id", name: "Alice", role: undefined, score: 0 },
    { id: "bob-id", name: "Bob", role: undefined, score: 0 },
    { id: "carol-id", name: "Carol", role: undefined, score: 0 },
  ]
}
```

---

## Result Screen Flow

```
Game in progress:
  ├─ Drawer draws
  ├─ Guessers submit guesses
  ├─ Backend matches and scores
  └─ Polling keeps everyone in sync

Host triggers end (manual or automatic):
  (For now: no automatic end; host must restart)

Frontend: Navigate to Result page
  ├─ Display currentWord
  ├─ Display final scores
  ├─ Display complete guesses
  └─ Show restart button (host only)

Host clicks Restart:
  ├─ POST /rooms/:code/restart { participantId }
  ├─ Backend: Reset round state
  ├─ Backend: Return room with status: "lobby"
  ├─ Frontend: Navigate to Lobby
  └─ Next round begins when host clicks Start
```

---

## Restart Logic

### Backend
```ts
export function restartGame(code: string, participantId?: string) {
  const room = rooms.get(code);
  
  if (!room) return null;
  if (room.hostId !== participantId) {
    throw new Error("Only host can restart");
  }
  
  // Reset round state
  room.status = "lobby";
  room.round += 1;
  room.guesses = [];
  room.canvasLines = [];
  room.currentDrawerId = undefined;
  room.currentWord = undefined;
  
  // Reset participant state
  room.participants = room.participants.map(p => ({
    ...p,
    role: undefined,
    score: 0
  }));
  
  room.updatedAt = now();
  rooms.set(room.code, room);
  
  return cloneRoom(room);
}
```

---

## File-Level Implementation Plan

### Backend
1. **api/rooms.ts**: Add POST /rooms/:code/restart endpoint
2. **services/roomStore.ts**: Implement restartGame function
3. **api/schemas.ts**: Extend validation as needed

### Frontend
1. **pages/ResultPage.tsx** (new):
   - Display result heading
   - Show currentWord
   - List all participants with final scores
   - Display guess history
   - Show restart button (host only)
2. **routes/index.tsx**: Add route for /result
3. **pages/GamePage.tsx**: Add logic to detect round end and navigate to /result
4. **state/roomStore.ts**: Add restartGame method
5. **App.tsx**: Add conditional routing to result page

---

## Navigation Flow

```
Lobby → (start game) → Game → (round ends) → Result → (restart) → Lobby
```

---

## Data Transitions

### Polling and Status Checks
```
GamePage useEffect:
  - Poll GET /rooms/:code every 2 seconds
  - Check room.status
  - If status === "playing" and all guesses made, manually trigger end
    (or wait for host action)
  
  - If some external trigger (e.g., timer, all correct), show Result
  
  ResultPage useEffect:
  - Display results
  - If host clicks restart, call roomStore.restartGame()
  - Receive updated room with status: "lobby"
  - Navigate to /lobby
```

---

## Edge Cases Handled

1. **No guesses**: Show "No guesses were made"
2. **Empty canvas**: Show blank canvas
3. **Non-host restart**: Throw error, display message
4. **Multiple restarts**: Each increments round counter
5. **Participant list preserved**: No participants removed/added on restart

---

## Dependencies
- Scenario 001 (Room Setup & Lobby)
- Scenario 002 (Game Start & Drawer Flow)
- Scenario 003 (Gameplay Interaction)
- Backend endpoint must be implemented
