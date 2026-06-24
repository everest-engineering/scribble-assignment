# Plan: Game Start & Drawer Flow (Scenario 2)

## State Model Changes

### Room (backend, server-only fields)
```typescript
interface Room {
  // existing fields...
  drawerId: string | null;
  secretWord: string | null;
  scores: Record<string, number>;
  guesses: Guess[];  // prepare for Phase 3, init empty
}
```

### Participant in snapshot (viewer-enriched)
```typescript
interface ParticipantView {
  id: string;
  name: string;
  joinedAt: string;
  role: ParticipantRole;
  score: number;
}
```

### RoomSnapshot additions
- `drawerId: string | null`
- `secretWord?: string` (drawer viewer only)
- participants include role and score

## Deterministic Word Selection

```typescript
function selectWord(roomCode: string): string {
  const hash = roomCode.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return STARTER_WORDS[hash % STARTER_WORDS.length];
}
```

## Data Flow

```
startGame():
  drawerId = hostId
  secretWord = selectWord(room.code)
  scores = { [p.id]: 0 for each participant }
  status = "playing"

toRoomSnapshot(room, viewerParticipantId):
  for each participant: role = id === drawerId ? "drawer" : "guesser"
  if viewerParticipantId === drawerId: include secretWord
  else: omit secretWord
```

## File-Level Changes

### Backend
| File | Change |
|------|--------|
| `models/game.ts` | Add drawerId, secretWord, scores, Guess; extend ParticipantView |
| `services/roomStore.ts` | Name validation, word selection, startGame assigns drawer/word/scores |
| `api/schemas.ts` | Validate playerName trim/non-empty |
| `api/rooms.ts` | No new routes |

### Frontend
| File | Change |
|------|--------|
| `services/api.ts` | Extend types |
| `pages/CreateRoomPage.tsx` | Trim + validate name |
| `pages/JoinRoomPage.tsx` | Trim + validate name |
| `pages/GamePage.tsx` | Show drawer role, secret word for drawer, poll while playing |

## Implementation Sequence

1. Backend name validation in create/join
2. Extend Room model with game-round fields
3. Update startGame to assign drawer, word, scores
4. Implement viewer-specific toRoomSnapshot
5. Frontend name validation on forms
6. GamePage shows role and secret word
7. GamePage polling while status is "playing"
8. Tests for word selection and snapshot visibility
