# Plan

## Findings

The starter is a brownfield project with working room create/join flows but no game logic. All scaffolding for a game exists as placeholders. The key gaps are: host tracking, name validation, auto-polling, game lifecycle (start → playing → finished), drawing, guessing, scoring, and restart.

### Bug
- `frontend/src/services/api.ts:22`: Default API URL has spurious `/bug` suffix.

## State Model Changes

### Backend Types (`backend/src/models/game.ts`)

```
RoomStatus: "lobby" | "playing" | "finished"

Room {
  code: string
  status: RoomStatus
  hostId: string                               // NEW
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
  hostId: string                               // NEW
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
Frontend                    Backend
--------                    -------
                            rooms: Map<string, Room>

POST /rooms                 createRoom(name)
  → participantId, room       → generate code, create participant, set hostId
  ← snapshot                  → store room, return snapshot

POST /rooms/:code/join     joinRoom(code, name)
  → participantId, room       → validate name, find room, add participant
  ← snapshot                  → return snapshot

GET /rooms/:code            getRoom(code, viewerParticipantId)
  ?participantId=xyz          → find room, filter snapshot for viewer role
  ← snapshot                  → return viewer-scoped snapshot
```

## Implementation Sequence

### Phase 1 — Room Setup & Lobby
1. Fix URL bug in `api.ts`
2. Update `game.ts` models (add hostId, expand status)
3. Update `roomStore.ts` (host tracking, name validation, host in snapshot)
4. Update `schemas.ts` (name validation)
5. Update frontend types (`api.ts`, `roomStore.ts`)
6. Update `LobbyPage.tsx` (auto-polling, host gating, start button)
7. Validate Scenario 1

## Testing Strategy
- Backend unit tests for store functions (start, guess, scoring, restart)
- Frontend unit tests for API methods
- Manual validation with 2 browser tabs for each scenario
- Build check (`npm run build`) before each commit

## Risks
- Canvas polling may feel laggy without WebSockets — acceptable for this lab
- Large canvas stroke data could grow the snapshot — mitigated by clear canvas
- Race condition: two guessers submit correct guess simultaneously — handled by server check of status before accepting
