# Plan — Gameplay Interaction

## Data Flow

```
[Drawer draws on canvas]
  → Every stroke-end: POST /rooms/:code/strokes { participantId, strokes }
  ← 200

[Guesser submits guess]
  → POST /rooms/:code/guess { participantId, text: "..." }
  ← 200 { isCorrect: boolean, score: number }

[All players poll]
  → GET /rooms/:code?participantId=X
  ← RoomSnapshot with latest strokes, guesses, scores
```

---

## File-Level Plan

| Step | File | Change |
|------|------|--------|
| 3.1 | `backend/src/services/roomStore.ts` | Add `submitGuess()`: trim, case-insensitive compare, score 100 if correct, record guess |
| 3.2 | `backend/src/services/roomStore.ts` | Add `saveStrokes()`: append strokes to room |
| 3.3 | `backend/src/api/schemas.ts` | Add guess schema (non-empty string) and stroke schema |
| 3.4 | `backend/src/api/rooms.ts` | Add `POST /rooms/:code/guess` and `POST /rooms/:code/strokes` |
| 3.5 | `frontend/src/services/api.ts` | Add `api.submitGuess()`, `api.saveStrokes()` |
| 3.6 | `frontend/src/state/roomStore.ts` | Add `submitGuess()`, `saveStrokes()` methods |
| 3.7 | `frontend/src/pages/GamePage.tsx` | Add polling loop to auto-refresh game state |
| 3.8 | `frontend/src/components/Scoreboard.tsx` | Render scores from `RoomSnapshot.scores` |
| 3.9 | `frontend/src/components/GuessForm.tsx` | Wire submit to `roomStore.submitGuess()`, show validation |
| 3.10 | Frontend: replace canvas placeholder | Implement HTML5 Canvas with mouse drawing for drawer; read-only rendering for guessers; "Clear Canvas" button |
