# Implementation Plan: Gameplay Interaction

## Endpoints

| Method | Path | Body | Auth |
|--------|------|------|------|
| POST | `/rooms/:code/strokes` | `{ participantId, stroke: { points } }` | drawer only |
| POST | `/rooms/:code/clear` | `{ participantId }` | drawer only |
| POST | `/rooms/:code/guess` | `{ participantId, guess }` | guessers only |

## Stroke Model

```typescript
interface Stroke {
  points: { x: number; y: number }[];
}
```

Coordinates normalized 0–1 relative to canvas size for resolution independence.

## File Changes

### Backend
- `roomStore.ts` — `addStroke`, `clearCanvas`, `submitGuess` (trim, compare, score, end round)
- `api/rooms.ts` — three new routes
- `api/schemas.ts` — stroke and guess schemas

### Frontend
- `components/DrawingCanvas.tsx` — HTML5 canvas, mouse events, POST strokes on pointer up
- `components/GuessForm.tsx` — wired to API
- `components/Scoreboard.tsx` — live scores from snapshot
- `components/ResultPanel.tsx` — guess history list
- `GamePage.tsx` — compose canvas, polling, role-based UI
- `hooks/useRoomPolling.ts` — reuse on game page

## Data Flow

Drawer draws → pointer up → POST stroke → poll → all clients render strokes from snapshot
Guesser guesses → POST guess → poll → history + score update → correct → status result

## Testing

- Unit: correct guess +100, wrong +0, case insensitive, empty rejected
- Manual: two tabs draw/guess sync
