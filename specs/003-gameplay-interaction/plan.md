## Scenario 3 — Gameplay Interaction

### State Model Changes

**Backend — Room type additions:**
```
drawingData: string   // JSON string of strokes
guesses: Guess[]      // array of guess objects
```

**Guess type:**
```
{ participantId: string, participantName: string, text: string, correct: boolean, timestamp: string }
```

**RoomSnapshot additions:**
```
drawingData: string
guesses: Guess[]
scores: Record<string, number>  // participantId -> score
```

### File-Level Changes

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add Guess interface, drawing/guesses/scores to Room and RoomSnapshot |
| `backend/src/services/roomStore.ts` | Add drawing save/clear, guess submission, scoring logic |
| `backend/src/api/schemas.ts` | Add guess submission schema |
| `backend/src/api/rooms.ts` | Add POST /rooms/:code/draw, POST /rooms/:code/guess, POST /rooms/:code/clear |
| `frontend/src/services/api.ts` | Add draw/guess/clear API methods |
| `frontend/src/state/roomStore.ts` | Add draw/guess/clear actions |
| `frontend/src/pages/GamePage.tsx` | Replace canvas placeholder with real `<canvas>`; conditional drawing |
| `frontend/src/components/GuessForm.tsx` | Wire up API call, validation |
| `frontend/src/components/Scoreboard.tsx` | Render real scores from snapshot |
| `frontend/src/components/ResultPanel.tsx` | Render guess history from snapshot |
