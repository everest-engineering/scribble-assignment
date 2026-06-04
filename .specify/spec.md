# Specification

## Room Setup & Lobby

- Creator becomes host automatically (`hostId` set to creator's `participantId`)
- Invalid room codes → 404 with `"Unable to join room"` / `"Unable to load room"`
- Rooms isolated via `Map<string, Room>` — each room's data is independent
- Lobby auto-refreshes every ~2 seconds via `setInterval` with `roomStore.fetchRoom()`
- Only host sees and can click "Start Game" button
- "Start Game" disabled when `room.participants.length < 2`
- Non-host sees "Waiting for host to start the game..." message

## Game Start & Drawer Flow

- Player names trimmed via Zod `.trim()` before storage
- Empty/whitespace-only names → Zod validation error (400)
- Drawer assigned when game starts: first participant in the room is the drawer
- Secret word randomly selected from `STARTER_WORDS` list
- Secret word visible only to the drawer (included in snapshot when `viewerParticipantId === drawerId`)
- Guessers see `"[Hidden]"` instead of the word

## Gameplay Interaction

- Drawer can draw on `<canvas>` via mouse/touch events
- Drawer can clear canvas (sends `{ type: "clear" }` command)
- Drawing stored as strokes on server, replayed on all clients
- Guessers submit guesses via `GuessForm`
- Guesses trimmed before submission
- Empty guesses rejected client-side and server-side
- Guess comparison is case-insensitive (`guess.toLowerCase() === word.toLowerCase()`)
- Guess history synced via room polling (~2 seconds)
- Correct guess → status changes to `finished`, guesser scores 100 points
- Incorrect guess → 0 points, guess added to history
- All scores start at 0

## Result, Restart & Final Validation

- Results page shows: correct word, final scores, full guess history
- Host can click "Restart Game" → room returns to `lobby` status
- Restart preserves participants list
- Round-specific data (draw commands, guesses, secret word, drawer) cleared
- Non-host redirected to lobby when game restarts

## Data Model Changes

### Room (expanded)
```typescript
interface Room {
  code: string;
  status: "lobby" | "playing" | "finished";
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];
  drawCommands: DrawCommand[];
  scores: Record<string, number>;  // participantId → score
  createdAt: string;
  updatedAt: string;
}
```

### RoomSnapshot (expanded)
```typescript
interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "finished";
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;  // only shown to drawer
  guesses: Guess[];
  drawCommands: DrawCommand[];
  scores: Record<string, number>;
  isHost: boolean;
}
```

### DrawCommand
```typescript
type DrawCommand = { type: "stroke"; points: { x: number; y: number }[]; color: string; lineWidth: number }
  | { type: "clear" };
```

### Guess
```typescript
interface Guess {
  participantId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/rooms` | Create room |
| POST | `/rooms/:code/join` | Join room |
| GET | `/rooms/:code` | Get room snapshot (polling) |
| POST | `/rooms/:code/start` | Start game (host only) |
| POST | `/rooms/:code/guess` | Submit guess |
| POST | `/rooms/:code/draw` | Add draw commands |
| POST | `/rooms/:code/clear` | Clear canvas |
| POST | `/rooms/:code/restart` | Restart game (host only) |

## Frontend Routing

| Route | Page | Purpose |
|-------|------|---------|
| `/` | StartPage | Landing page |
| `/create-room` | CreateRoomPage | Create room form |
| `/join-room` | JoinRoomPage | Join room form |
| `/lobby` | LobbyPage | Pre-game lobby |
| `/game` | GamePage | Active game + results |

## Polling Strategy

- LobbyPage: polls room state every 2 seconds while mounted
- GamePage: polls room state every 2 seconds while mounted
- Polling clears on unmount (cleanup via clearInterval)
