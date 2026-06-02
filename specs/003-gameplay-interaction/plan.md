# Plan: Gameplay Interaction

## State Model Changes

```typescript
interface StrokePoint { x: number; y: number }
interface Stroke { points: StrokePoint[]; color: string; width: number }
interface Guess {
  participantId: string
  name: string
  text: string
  correct: boolean
  createdAt: string
}

Room additions:
  strokes: Stroke[]
  guesses: Guess[]
```

RoomSnapshot includes `strokes`, `guesses`, `scores`.

## Backend Changes

### `roomStore.ts`
- `addStroke(code, participantId, stroke)`: drawer + playing only
- `clearCanvas(code, participantId)`: drawer + playing only
- `submitGuess(code, participantId, text)`: non-drawer + playing; trim; case-insensitive match; score update; transition to result on correct

### `schemas.ts`
- `strokeSchema`: { participantId, stroke: { points, color, width } }
- `guessSchema`: { participantId, guess: z.string().trim().min(1) }
- `participantActionSchema`: { participantId }

### `rooms.ts`
- `POST /:code/strokes`, `POST /:code/clear`, `POST /:code/guess`

## Frontend Changes

### `components/DrawingCanvas.tsx` (new)
- HTML canvas; pointer events → stroke API on pointerup
- Read-only mode for non-drawers; redraw all strokes from snapshot on each update
- Clear button for drawer

### `GuessForm.tsx`
- Wire onSubmit to roomStore.submitGuess
- Disable for drawer

### `Scoreboard.tsx`
- Display scores from room.scores keyed by participant names

### `GamePage.tsx`
- Replace placeholder with DrawingCanvas
- Enable polling during playing and result
- Show guess history list

## Data Flow

```
Drawer draws → POST strokes → poll → all redraw
Guesser submits → POST guess → poll → history + score update
Correct guess → status=result → poll → all see result (Feature 004 UI)
```

## Testing

- Unit: submitGuess scoring, case-insensitivity, round end
- Unit: addStroke/clearCanvas authorization
- Manual: draw sync, guess flow, correct guess ends round
