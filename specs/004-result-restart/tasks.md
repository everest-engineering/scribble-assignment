# Tasks: Result, Restart & Final Validation

---

### T1: Backend — extend RoomStatus to include "finished"

**File**: `backend/src/models/game.ts`

- Change `RoomStatus` to `"lobby" | "playing" | "finished"`

**Verify**: `npm run build` passes

---

### T2: Backend — end round on correct guess, add restart

**Files**: `backend/src/api/schemas.ts`, `backend/src/services/roomStore.ts`

- Add `restartSchema` with `participantId: z.string()`
- In `submitGuess`: if guess is correct, set `room.status = "finished"`
- Add `restartGame(code, participantId)`:
  - Verify host (403 if not)
  - Reset: `guesses = []`, `scores = {}`, `drawerId = ""`, `secretWord = ""`, `round = 0`
  - Set `status = "lobby"`
  - Save and return snapshot
- In `toRoomSnapshot`: reveal secretWord if status is "finished" (in addition to drawer viewing)

**Verify**: `npm run build` passes

---

### T3: Backend — restart route

**File**: `backend/src/api/rooms.ts`

- Add `POST /:code/restart` route

**Verify**: `npm run build` passes

---

### T4: Frontend — types, API, store

**Files**: `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`

- Extend `RoomStatus` to include "finished"
- Add `restartGame(code, participantId)` to api
- Add `restartGame()` to store

**Verify**: `npm run build` passes

---

### T5: Frontend — result view in GamePage

**File**: `frontend/src/pages/GamePage.tsx`

- When status is "finished":
  - Disable canvas drawing
  - Show result card with: correct word, final scores, full guess history
  - Show "Play Again" button (host-only) that calls restartGame and navigates to /lobby
  - Show "Exit to Lobby" button for all players
  - Disable GuessForm

**Verify**: `npm run build` passes; test with two browser tabs

---

### T6: Verify with two browser tabs

- Tab A (drawer) + Tab B (guesser) in game
- Tab B submits correct word → both tabs show result state
- Both tabs see the correct word, scores, history
- Tab B cannot see Play Again button
- Tab A clicks Play Again → both tabs land on lobby with players intact
- Re-start the game from lobby and confirm clean round state
