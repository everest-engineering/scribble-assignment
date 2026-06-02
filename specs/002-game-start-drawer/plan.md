# Plan: Game Start & Drawer Flow

## State Model Changes

```typescript
type RoomStatus = "lobby" | "playing" | "result"

Room additions:
  drawerId?: string
  secretWord?: string
  scores: Record<string, number>  // participantId → score

RoomSnapshot additions:
  drawerId?: string
  secretWord?: string      // only for drawer during playing
  revealedWord?: string    // for all during result (Feature 004)
  scores: Record<string, number>
```

## Backend Changes

### `roomStore.ts`
- `selectWord(code)`: hash room code → index into STARTER_WORDS
- `startGame(code, participantId)`: verify host, ≥2 players, lobby status; set playing, drawerId, secretWord, scores=0
- `toRoomSnapshot(room, viewerId)`: include secretWord only if viewer is drawer and status is playing

### `schemas.ts`
- `playerNameSchema`: z.string().trim().min(1, "Player name is required")
- `startGameSchema`: { participantId: z.string().uuid() }

### `rooms.ts`
- `POST /:code/start` → startGame → return viewer-aware snapshot

## Frontend Changes

### `api.ts`
- Extend types for playing status, drawerId, secretWord, scores
- Add `startGame(code, participantId)`

### `roomStore.ts`
- `startGame()` method
- After start, update snapshot and navigate handled by LobbyPage

### `CreateRoomPage.tsx` / `JoinRoomPage.tsx`
- Trim name; reject empty client-side before API call

### `GamePage.tsx`
- Role-based UI: drawer sees word, guessers see drawing placeholder
- Redirect to lobby if status is lobby
- Poll during playing (hook from Feature 001)

## Data Flow

```
Host clicks Start → POST /rooms/:code/start { participantId }
  → status=playing, drawerId=hostId, secretWord=selectWord(code)
  → navigate /game
Poll GET /rooms/:code?participantId= → viewer-aware snapshot
```

## Testing

- Unit: startGame preconditions (host, 2 players, lobby)
- Unit: selectWord determinism
- Unit: toRoomSnapshot word visibility rules
- Manual: two tabs, verify word visible only to drawer
