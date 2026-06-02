# Plan

## State Model Changes

### Backend Types (`backend/src/models/game.ts`)

```
RoomStatus: "lobby" | "playing" | "finished"

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

Room {
  code: string
  status: RoomStatus
  hostId: string
  drawerId: string | null                      // NEW
  secretWord: string | null                    // NEW
  scores: Record<string, number>               // NEW
  canvasStrokes: Stroke[]                      // NEW
  guesses: Guess[]                             // NEW
  participants: Participant[]
  createdAt: string
  updatedAt: string
}

RoomSnapshot {
  code, status, participants
  hostId: string
  drawerId: string | null                      // NEW
  myRole: ParticipantRole | null               // NEW
  secretWord: string | null                    // NEW (filtered per viewer)
  scores: Record<string, number>               // NEW
  canvasStrokes: Stroke[]                      // NEW
  guesses: Guess[]                             // NEW
  availableWords: string[]
  roles: ParticipantRole[]
}
```

## Data Flow

```
Frontend                    Backend
--------                    -------
                            rooms: Map<string, Room>

POST /rooms/:code/start     startGame(code, participantId)
  → room                      → verify: host, ≥2 players, status=lobby
  ← snapshot                  → assign drawer, pick word, status=playing
```

## Implementation Sequence

### Phase 2 — Game Start & Drawer Flow
1. Add `startGame()` to `roomStore.ts`
2. Add `POST /rooms/:code/start` route
3. Update `toRoomSnapshot()` for viewer-specific filtering
4. Update frontend API and store with startGame
5. Wire LobbyPage start button to API
6. Validate Scenario 2
