# Data Model: Result, Restart & Final Validation

**Branch**: `assignment` | **Date**: 2026-05-31

## Backend Models (`backend/src/models/game.ts`)

### RoomStatus (extended)

```ts
// Before (Scenario 3):
export type RoomStatus = "lobby" | "game";

// After (Scenario 4):
export type RoomStatus = "lobby" | "game" | "result";
```

### Room — no new fields

No new fields on `Room`. The existing `guesses`, `scores`, `drawerId`, `secretWord`,
and `status` cover all result and restart requirements.

### RoomSnapshot — no new fields

No new fields on `RoomSnapshot`. `secretWord` is already optional (`secretWord?: string`).
In result state it is now included for all viewers via a change to `toRoomSnapshot()`.

## Backend Service (`backend/src/services/roomStore.ts`)

### submitGuess() — extended (round-end transition)

```ts
// After scoring, add status transition when correct:
return saveRoom({
  ...room,
  guesses: [...room.guesses, guess],
  scores: { ...room.scores, [participantId]: currentScore + pointsEarned },
  ...(isCorrect ? { status: "result" as const } : {})
});
```

### toRoomSnapshot() — extended (secretWord reveal in result state)

```ts
// Before:
const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;
...(isDrawer && room.secretWord ? { secretWord: room.secretWord } : {})

// After:
const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;
const revealWord = (isDrawer || room.status === "result") && room.secretWord !== null;
...(revealWord ? { secretWord: room.secretWord! } : {})
```

### restartRoom() — new export

```ts
export function restartRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) return null;

  if (participantId !== room.hostId) {
    throw new Error("Only the host can restart");
  }

  return saveRoom({
    ...room,
    status: "lobby",
    drawerId: null,
    secretWord: null,
    guesses: [],
    scores: {}
  });
}
```

## Backend Validation (`backend/src/api/schemas.ts`)

### restartRoomSchema (new)

```ts
export const restartRoomSchema = z.object({
  participantId: z.string().trim().min(1, "participantId is required")
});
```

## Frontend Types (`frontend/src/services/api.ts`)

### RoomSnapshot.status (extended)

```ts
// Before:
status: "lobby" | "game";

// After:
status: "lobby" | "game" | "result";
```

### api.restartGame() (new method)

```ts
restartGame(code: string, participantId: string) {
  return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
    method: "POST",
    body: JSON.stringify({ participantId })
  });
}
```

## State Transitions

```
First correct guess (POST /rooms/:code/guesses):
  room.status = "result"
  room.guesses = [...existing, correctGuess]
  room.scores[participantId] += 100
  → toRoomSnapshot: secretWord returned to ALL viewers

Polling (GET /rooms/:code?participantId=<id>):
  → all clients detect status === "result"
  → GamePage navigates to /result

Host restarts (POST /rooms/:code/restart):
  room.status = "lobby"
  room.drawerId = null
  room.secretWord = null
  room.guesses = []
  room.scores = {}
  → participants and hostId preserved

Polling (GET /rooms/:code?participantId=<id>):
  → all clients detect status === "lobby"
  → ResultPage navigates to /lobby
```

## Validation Rules

| Field | Rule | Layer |
|-------|------|-------|
| Restart caller | Must be `hostId` | Backend (`restartRoom`) |
| Guess after result | `status !== "game"` → 400 "Game is not active" | Backend (`submitGuess`, existing guard) |
| `secretWord` in result | Included for all viewers when `status === "result"` | Backend (`toRoomSnapshot`) |
