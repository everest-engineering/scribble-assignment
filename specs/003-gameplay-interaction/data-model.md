# Data Model: Gameplay Interaction

**Branch**: `assignment` | **Date**: 2026-05-31

## Backend Models (`backend/src/models/game.ts`)

### Guess (new)

```ts
export interface Guess {
  id: string;           // randomUUID() at submission
  participantId: string;
  participantName: string;  // stored at submission time
  text: string;             // trimmed before storage
  isCorrect: boolean;
  submittedAt: string;      // ISO timestamp
}
```

### Room (extended)

```ts
export interface Room {
  code: string;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];                   // ADDED — append-only, initialised [] in startRoom()
  scores: Record<string, number>;     // ADDED — participantId → score, initialised in startRoom()
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
```

### RoomSnapshot (extended)

```ts
export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;
  secretWord?: string;
  guesses: Guess[];                   // ADDED — full history, safe to expose (no secrets)
  scores: Record<string, number>;     // ADDED — participantId → score
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

*Note*: `guesses` and `scores` are included in all snapshots regardless of viewer —
they contain no secret information.

## Backend Service (`backend/src/services/roomStore.ts`)

### createRoom() — extended

```ts
const room: Room = {
  ...
  guesses: [],
  scores: {},
  ...
};
```

### startRoom() — extended

```ts
return saveRoom({
  ...room,
  status: "game",
  drawerId: room.hostId,
  secretWord: STARTER_WORDS[0],
  guesses: [],
  scores: Object.fromEntries(room.participants.map((p) => [p.id, 0]))
});
```

### submitGuess() — new

```ts
export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.status !== "game") throw new Error("Game is not active");
  if (participantId === room.drawerId) throw new Error("Drawer cannot submit guesses");

  const trimmed = text.trim();
  if (!trimmed) throw new Error("Guess cannot be empty");

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) throw new Error("Participant not found");

  const isCorrect = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();
  const guess: Guess = {
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    text: trimmed,
    isCorrect,
    submittedAt: now()
  };

  const pointsEarned = isCorrect ? 100 : 0;
  const currentScore = room.scores[participantId] ?? 0;

  return saveRoom({
    ...room,
    guesses: [...room.guesses, guess],
    scores: { ...room.scores, [participantId]: currentScore + pointsEarned }
  });
}
```

### toRoomSnapshot() — extended

```ts
return {
  ...
  guesses: room.guesses.map((g) => ({ ...g })),
  scores: { ...room.scores },
  ...
};
```

## Backend Validation (`backend/src/api/schemas.ts`)

### submitGuessSchema (new)

```ts
export const submitGuessSchema = z.object({
  participantId: z.string().trim().min(1, "participantId is required"),
  text: z.string()  // trimming handled in service; keep raw here for accurate error
});
```

## Frontend Types (`frontend/src/services/api.ts`)

### Guess (new)

```ts
export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  submittedAt: string;
}
```

### RoomSnapshot (extended)

```ts
export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;
  secretWord?: string;
  guesses: Guess[];                // ADDED
  scores: Record<string, number>;  // ADDED
  status: "lobby" | "game";
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

## State Transitions

```
POST /rooms/:code/guesses (guesser):
  trimmed = text.trim()
  isCorrect = trimmed.toLowerCase() === room.secretWord.toLowerCase()
  guess appended to room.guesses
  room.scores[participantId] += isCorrect ? 100 : 0
  → response: full RoomSnapshot with updated guesses + scores

GET /rooms/:code?participantId=<id> (polling):
  → snapshot includes current guesses[] and scores{}
  → all clients converge within one poll cycle (≤2s)
```

## Validation Rules

| Field | Rule | Layer |
|-------|------|-------|
| `text` | Trimmed; empty after trim → 400 | Backend (`submitGuess`) |
| `participantId` | Must exist in room participants | Backend (`submitGuess`) |
| Drawer submitting | `participantId === drawerId` → 403 | Backend (`submitGuess`) |
| `isCorrect` | `trimmed.toLowerCase() === secretWord.toLowerCase()` | Backend only |
| Empty guess (client) | Trim + empty check before API call | Frontend (`GuessForm`) |
