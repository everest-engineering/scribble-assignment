# API Contracts: Guessing, Scoring & Game End

All endpoints extend the base `RoomSessionResponse` pattern. All request bodies validated with Zod. All endpoints are prefixed by `http://localhost:3001` (configurable via `VITE_API_URL`).

---

## POST /rooms/:code/guess — Submit a Guess

Submit a guess during an active round. The guess is validated, compared to the secret word, and added to the shared guess history. If correct, the round ends immediately and scores are calculated.

**Request**:
```typescript
{
  participantId: string;   // Must be a guesser in an active round
  text: string;            // 1–100 chars, trimmed of whitespace
}
```

**Response (200)** — Incorrect guess:
```typescript
{
  room: {
    code: string;
    status: "playing";                    // Still playing
    participants: ParticipantSnapshot[];
    hostId: string;
    word?: string;                        // Only for drawer
    availableWords: string[];
    roles: ParticipantRole[];
    guesses: Guess[];                     // Includes new guess
    scores: Record<string, number>;       // All scores (unchanged)
    roundResult: null;                    // No result yet
  }
}
```

**Response (200)** — Correct guess (round ends):
```typescript
{
  room: {
    code: string;
    status: "finished";                   // Round ended
    participants: ParticipantSnapshot[];
    hostId: string;
    word: string;                         // Secret word revealed to all
    availableWords: string[];
    roles: ParticipantRole[];
    guesses: Guess[];                     // Full guess history
    scores: Record<string, number>;       // Updated scores (winner has 100)
    roundResult: RoundResult;             // Round result with winner
  }
}
```

**Errors**:
- `400`: Invalid guess data (empty, too long, whitespace)
- `403`: Participant is the drawer (drawers cannot guess), or round is already finished
- `404`: Room not found or no active round

---

## GET /rooms/:code — Get Room State (extended)

Returns the full room state including guesses, scores, and round result when applicable. This is the single polling endpoint used by all participants.

**Query Parameters**:
- `participantId` (optional): Used for role-based word visibility

**Response (200)** — Playing state:
```typescript
{
  room: {
    code: string;
    status: "playing";
    participants: ParticipantSnapshot[];
    hostId: string;
    word?: string;                        // Only for drawer
    availableWords: string[];
    roles: ParticipantRole[];
    guesses: Guess[];                     // Guesses so far
    scores: Record<string, number>;       // Current scores
    roundResult: null;
  }
}
```

**Response (200)** — Finished state:
```typescript
{
  room: {
    code: string;
    status: "finished";
    participants: ParticipantSnapshot[];
    hostId: string;
    word: string;                         // Secret word revealed to ALL
    availableWords: string[];
    roles: ParticipantRole[];
    guesses: Guess[];                     // Full guess history
    scores: Record<string, number>;       // Final scores
    roundResult: RoundResult;             // Winner, end time, etc.
  }
}
```

**Response (200)** — Lobby state:
```typescript
{
  room: {
    code: string;
    status: "lobby";
    participants: ParticipantSnapshot[];
    hostId: string;
    availableWords: string[];
    roles: ParticipantRole[];
    guesses: [];                          // Empty
    scores: {};                           // Empty
    roundResult: null;
  }
}
```

**Errors**:
- `404`: Room not found

---

## POST /rooms/:code/restart — Restart Game (Host Only)

Resets the room to lobby state. All round data (guesses, scores, drawing, word, roundResult) is cleared. Participants are preserved.

**Request**:
```typescript
{
  participantId: string;   // Must be the host
}
```

**Response (200)**:
```typescript
{
  room: {
    code: string;
    status: "lobby";
    participants: ParticipantSnapshot[];  // All participants preserved
    hostId: string;
    availableWords: string[];
    roles: ParticipantRole[];
    guesses: [];
    scores: {};
    roundResult: null;
  }
}
```

**Errors**:
- `403`: Participant is not the host
- `400`: Room is not in finished state
- `404`: Room not found

---

## Type Definitions

### Guess
```typescript
interface Guess {
  id: string;              // UUID v4
  participantId: string;
  text: string;            // Trimmed, 1–100 chars
  isCorrect: boolean;
  createdAt: string;       // ISO 8601
}
```

### RoundResult
```typescript
interface RoundResult {
  secretWord: string;
  guessHistory: Guess[];   // All guesses in submission order
  scores: Record<string, number>;
  winnerId: string | null; // null if no correct guess
  endedAt: string;         // ISO 8601
}
```

### ParticipantSnapshot (unchanged from 001)
```typescript
interface ParticipantSnapshot {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  role: "drawer" | "guesser" | null;
}
```

---

## State Machine

```
lobby (guesses=[], scores={}, roundResult=null)
  │
  ▼ startGame
playing (guesses=[], scores={all:0}, roundResult=null)
  │
  ├── POST /guess (incorrect) → guesses += [guess], status stays playing
  │
  ├── POST /guess (correct)   → guesses += [guess],
  │                              scores[guesser] = 100,
  │                              roundResult = {secretWord, guessHistory, scores, winnerId, endedAt},
  │                              status = finished
  │
  ▼
finished (guesses=[...], scores={...}, roundResult={...})
  │
  ▼ POST /restart (host only)
lobby (guesses=[], scores={}, roundResult=null)
  // participants preserved
```
