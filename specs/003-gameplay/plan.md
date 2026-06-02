# Plan

## State Model Changes

### Backend Types (`backend/src/models/game.ts`)

```
Stroke {
  points: { x: number; y: number }[]
}

Guess {
  participantId: string
  playerName: string
  text: string
  correct: boolean
  timestamp: string
}
```

## Data Flow

```
Frontend                    Backend
--------                    -------
                            rooms: Map<string, Room>

POST /rooms/:code/draw      addStroke(code, participantId, stroke)
  → { stroke }                → verify: drawer, status=playing
  ← snapshot                  → append stroke, return snapshot

POST /rooms/:code/clear     clearDrawing(code, participantId)
  → room                      → verify: drawer, status=playing
  ← snapshot                  → reset strokes array, return snapshot

POST /rooms/:code/guess     addGuess(code, participantId, { text })
  → { text }                  → verify: guesser, status=playing
  ← snapshot                  → trim, compare case-insensitive
                                → if correct: +100, status=finished
                                → append guess, return snapshot
```

## Implementation Sequence

### Phase 3 — Gameplay Interaction
1. Create `DrawingCanvas.tsx` component (HTML5 Canvas with mouse events)
2. Add draw/clear to backend store and routes
3. Add draw/clear to frontend API and store
4. Implement guess logic in backend store
5. Add guess endpoint and frontend wiring
6. Update `GuessForm`, `Scoreboard`, `ResultPanel` with real data
7. Wire GamePage polling
8. Validate Scenario 3

## Testing Strategy
- Backend unit tests for store functions (start, guess, scoring, restart)
- Frontend unit tests for API methods
- Manual validation with 2 browser tabs for each scenario
- Build check (`npm run build`) before each commit

## Risks
- Canvas polling may feel laggy without WebSockets — acceptable for this lab
- Large canvas stroke data could grow the snapshot — mitigated by clear canvas
- Race condition: two guessers submit correct guess simultaneously — handled by server check of status before accepting
