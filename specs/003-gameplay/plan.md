# Plan: Gameplay Interaction (Scenario 3)

## Backend Service Functions

- `addStroke(code, participantId, stroke)` — drawer only, status playing
- `clearDrawing(code, participantId)` — drawer only
- `submitGuess(code, participantId, text)` — guesser only, trim, compare, score, maybe end round

## File Changes

| File | Change |
|------|--------|
| `roomStore.ts` | addStroke, clearDrawing, submitGuess |
| `rooms.ts` | 3 new POST routes |
| `schemas.ts` | stroke and guess schemas |
| `DrawingCanvas.tsx` | NEW interactive canvas component |
| `GamePage.tsx` | wire canvas, guess form, guess history |
| `GuessForm.tsx` | call API on submit |
| `api.ts` | new methods |

## Canvas Sync

Drawer sends strokes on pointer-up. All clients poll `drawingStrokes` and render via SVG/canvas paths.

## Scoring

```typescript
if (trimmedGuess.toLowerCase() === secretWord.toLowerCase()) {
  scores[participantId] += 100;
  status = "result";
}
```
