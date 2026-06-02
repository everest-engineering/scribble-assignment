# Plan

## State Model Changes

### Backend Types (`backend/src/models/game.ts`)

```
RoomStatus: "lobby" | "playing" | "finished"

Room {
  code: string
  status: RoomStatus
  hostId: string
  drawerId: string | null
  secretWord: string | null
  scores: Record<string, number>
  canvasStrokes: Stroke[]
  guesses: Guess[]
  participants: Participant[]
  createdAt: string
  updatedAt: string
}

RoomSnapshot {
  code, status, participants
  hostId: string
  drawerId: string | null
  myRole: ParticipantRole | null
  secretWord: string | null
  scores: Record<string, number>
  canvasStrokes: Stroke[]
  guesses: Guess[]
  availableWords: string[]
  roles: ParticipantRole[]
}
```

## Data Flow

```
POST /rooms/:code/restart   restartGame(code, participantId)
  → room                      → verify: host, status=finished
  ← snapshot                  → reset word, drawer, scores, strokes, guesses
                                → status=lobby, return snapshot
```

## Implementation Sequence

### Phase 4 — Result, Restart & Final Validation
1. End round on correct guess (status → "finished")
2. Add `restartGame()` to backend
3. Add restart endpoint and frontend wiring
4. Update GamePage result view and restart button
5. Auto-navigate to lobby on restart
6. Validate Scenario 4 end-to-end

## Testing Strategy
- Backend unit tests for store functions (start, guess, scoring, restart)
- Frontend unit tests for API methods
- Manual validation with 2 browser tabs for each scenario
- Build check (`npm run build`) before each commit

## Risks
- Canvas polling may feel laggy without WebSockets — acceptable for this lab
- Large canvas stroke data could grow the snapshot — mitigated by clear canvas
- Race condition: two guessers submit correct guess simultaneously — handled by server check of status before accepting
