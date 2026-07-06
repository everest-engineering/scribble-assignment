# Quickstart — Result, Restart, and Final Validation

## Implementation Order

### 0. Backend — Snapshot + Existing Endpoints (Critical Fixes)

- **`toRoomSnapshot`** in `backend/src/services/roomStore.ts`: when `room.status === "result"`, include `room.secretWord` for ALL viewers (not just `viewerParticipantId === room.currentDrawerId`)
- **`addCanvasStroke`**, **`clearCanvas`**, **`nextWord`**: add `if (room.status === "result")` guard returning 400 "Game has ended" — these functions currently don't check room status at all

### 1. Backend — Model
- Extend `RoomStatus` type in `backend/src/models/game.ts`: add `"result"` to the union
- Widen `RoomSnapshot.status` to include `"result"` where needed

### 2. Backend — Service
- Add `endGame(code, requesterId)` in `backend/src/services/roomStore.ts`:
  - Validate room exists (404)
  - Validate status is "drawing" (400)
  - Validate requester is current drawer (403)
  - Set `room.status = "result"`, update timestamp
  - Return cloned room
- Add `restartGame(code, requesterId)` in `backend/src/services/roomStore.ts`:
  - Validate room exists (404)
  - Validate status is "result" (400)
  - Validate requester is host (403)
  - Reset: scores → {}, guesses → [], canvasStrokes → [], currentRound → 0, currentDrawerId → "", secretWord → null, correctGuessersInRound → []
  - Set `room.status = "lobby"`
  - Preserve participants array
  - Return cloned room

### 3. Backend — Routes
- Add `POST /:code/end-game` in `backend/src/api/rooms.ts` with `participantId` query param
- Add `POST /:code/restart` with `participantId` query param
- Wire to service methods

### 4. Frontend — API
- Widen `RoomSnapshot.status` type in `frontend/src/services/api.ts` from `"lobby" | "drawing"` to `"lobby" | "drawing" | "result"`
- Add `endGame(code, participantId)` method
- Add `restartGame(code, participantId)` method

### 5. Frontend — Store
- Add `endGame()` method in `frontend/src/state/roomStore.ts`
- Add `restartGame()` method

### 6. Frontend — Components
- Create `ResultView.tsx` component showing:
  - Correct word from final round
  - Final scores (Scoreboard)
  - Guess history (ResultPanel)
  - "Restart" button (host only, hidden for others)
- Update `GamePage.tsx`:
  - Add "End Game" button (drawer only, during drawing status)
  - Add result state rendering: show ResultView when `status === "result"`
  - Add navigation to lobby on restart (navigate when poll detects lobby after restart)

### 7. Verification
- `npm run build` in both backend/ and frontend/
- `npm test` in both
- Two-browser test: play game → end → see results → restart → lobby with same players
