# Implementation Plan: Game Start & Drawer Flow

## State Model Changes

```typescript
type RoomStatus = "lobby" | "playing" | "result";

interface Participant { score: number; /* existing */ }

interface Room {
  status: RoomStatus;
  drawerId?: string;
  secretWord?: string;
  strokes: Stroke[];
  guesses: Guess[];
}

interface RoomSnapshot {
  status: RoomStatus;
  drawerId?: string;
  secretWord?: string;  // only when viewer is drawer and status is playing
}
```

## Word Selection Algorithm

```typescript
function selectWord(code: string): string {
  const sum = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return STARTER_WORDS[sum % STARTER_WORDS.length];
}
```

## File Changes

### Backend
- `models/game.ts` — extend status, add score, strokes, guesses types
- `services/roomStore.ts` — name trim/reject; startGame sets drawerId, secretWord, status playing
- `toRoomSnapshot` — filter secretWord by viewer
- `api/schemas.ts` — required trimmed playerName

### Frontend
- CreateRoomPage, JoinRoomPage — trim name, reject empty client-side
- GamePage — show drawer badge, secret word panel for drawer only
- LobbyPage — auto-navigate to /game when status playing

## Data Flow

Start game → backend: status=playing, drawerId=hostId, secretWord=selectWord(code), scores=0 → all clients poll → navigate to game → drawer sees word

## Testing

- Backend: empty name rejected; secretWord absent for non-drawer snapshot
- Manual: drawer tab sees word, guesser tab does not
