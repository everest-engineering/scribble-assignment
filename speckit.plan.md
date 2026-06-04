# Plan

## State Model

### Room (backend store, in-memory Map)
```typescript
interface Room {
  code: string;
  status: "lobby" | "playing" | "finished";
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  guesses: GuessEntry[];
  scores: Record<string, number>;    // participantId → score
  createdAt: string;
  updatedAt: string;
}
```

### GuessEntry
```typescript
interface GuessEntry {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}
```

### RoomSnapshot (returned to frontend)
```typescript
interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "finished";
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;          // only populated for drawer
  guesses: GuessEntry[];
  scores: Record<string, number>;
  availableWords: string[];
  roles: ParticipantRole[];
  viewerRole: ParticipantRole | null;  // computed per-viewer
}
```

## Data Flow

### Create Room
```
Frontend (POST /rooms { playerName }) 
  → Backend validates name (trim, reject empty) 
  → Creates Room with hostId = participantId, status = "lobby" 
  → Returns RoomSnapshot with viewerRole = "drawer" (first player)
```

### Join Room
```
Frontend (POST /rooms/:code/join { playerName })
  → Backend validates name, finds room by code
  → Adds participant, returns RoomSnapshot
```

### Lobby Polling
```
Frontend (GET /rooms/:code?participantId=xxx every ~2s)
  → Backend returns current RoomSnapshot
  → Frontend updates state
  → When status changes to "playing", navigate to /game
  → When status changes to "lobby" (after restart), navigate to /lobby
```

### Start Game
```
Frontend (POST /rooms/:code/start { participantId })
  → Backend validates host, player count, current status
  → Assigns drawer (index 0), picks word deterministically
  → Sets status = "playing"
  → Returns RoomSnapshot (word visible only to drawer)
```

### Submit Guess
```
Frontend (POST /rooms/:code/guess { participantId, text })
  → Backend validates guess (trim, reject empty, check status)
  → Compares case-insensitively against secretWord
  → If correct: scores 100, sets status = "finished"
  → If incorrect: scores 0, records guess
  → Returns updated RoomSnapshot
```

### Restart
```
Frontend (POST /rooms/:code/restart { participantId })
  → Backend validates host, current status
  → Clears drawerId, secretWord, guesses, scores
  → Sets status = "lobby"
  → Returns updated RoomSnapshot
```

## File-Level Plan

### Backend Changes

1. **`backend/src/models/game.ts`** — Extend types:
   - Add `hostId: string` to `Room`
   - Add `drawerId: string | null`, `secretWord: string | null`, `guesses: GuessEntry[]`, `scores: Record<string, number>` to `Room`
   - Add `GuessEntry` interface
   - Extend `RoomStatus` to `"lobby" | "playing" | "finished"`
   - Add `viewerRole` and `hostId`/`drawerId`/`guesses`/`scores`/`secretWord` to `RoomSnapshot`

2. **`backend/src/api/schemas.ts`** — Add schemas:
   - `submitGuessSchema` with `z.object({ participantId: z.string(), text: z.string() })`
   - `startGameSchema` with `z.object({ participantId: z.string() })`
   - `restartGameSchema` with `z.object({ participantId: z.string() })`

3. **`backend/src/services/roomStore.ts`** — Add game logic:
   - Modify `createRoom`: accept playerName validation, set hostId
   - Add `startGame(code, participantId)`: validate host, assign drawer, pick word
   - Add `submitGuess(code, participantId, text)`: validate, compare, score
   - Add `restartGame(code, participantId)`: validate host, reset state
   - Modify `toRoomSnapshot`: compute viewerRole, filter secretWord per role

4. **`backend/src/api/rooms.ts`** — Add routes:
   - `POST /:code/start` → `startGame`
   - `POST /:code/guess` → `submitGuess`
   - `POST /:code/restart` → `restartGame`

5. **`backend/src/api/schemas.test.ts`** — Add tests for new schemas
6. **`backend/src/services/roomStore.test.ts`** — Add tests for game logic

### Frontend Changes

7. **`frontend/src/services/api.ts`** — Fix base URL, update types, add API methods:
   - Fix `API_BASE_URL` default (remove `/bug`)
   - Add `startGame`, `submitGuess`, `restartGame` methods
   - Update `RoomSnapshot` type with new fields

8. **`frontend/src/state/roomStore.ts`** — Add store methods:
   - `startGame()`, `submitGuess(text)`, `restartGame()`, `clearError()`

9. **`frontend/src/pages/LobbyPage.tsx`** — Auto-polling, host controls:
   - Add `useEffect` with `setInterval` (2s) for polling
   - Navigate to `/game` when status changes to "playing"
   - Navigation guard back to lobby on restart
   - Host-only "Start Game" button, disabled until ≥2 players

10. **`frontend/src/pages/CreateRoomPage.tsx`** — Add name validation
11. **`frontend/src/pages/JoinRoomPage.tsx`** — Add name validation

12. **`frontend/src/pages/GamePage.tsx`** — Full game layout:
    - Drawing canvas (for drawer)
    - Secret word display (for drawer)
    - Guess form (for guessers)
    - Scoreboard with scores
    - Result panel with word, scores, history
    - Restart button (for host, when finished)
    - Auto-polling for state sync

13. **`frontend/src/components/GuessForm.tsx`** — Wire to API, validate
14. **`frontend/src/components/Scoreboard.tsx`** — Accept and display scores
15. **`frontend/src/components/ResultPanel.tsx`** — Accept and display results

16. **`frontend/src/components/Canvas.tsx`** — New drawing component

17. **`frontend/src/styles/app.css`** — Add canvas and game styles
