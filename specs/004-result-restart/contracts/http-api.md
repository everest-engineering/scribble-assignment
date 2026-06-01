# HTTP API Contracts: Result & Restart Flow

## GET /rooms/:code

Returns the current room snapshot, including finished round result state when the room is complete.

### Request

- Path parameter:
  - `code: string`

### Response

```ts
interface RoomSnapshot {
  code: string;
  hostId: string;
  participants: ParticipantSnapshot[];
  gameState: "lobby" | "inProgress" | "finished";
  currentRound?: RoundSnapshot;
}

interface ParticipantSnapshot {
  id: string;
  name: string;
  isHost: boolean;
}

interface RoundSnapshot {
  roundNumber: number;
  status: "active" | "finished";
  drawerId: string;
  drawerName: string;
  secretWord?: string;
  guessHistory: GuessSnapshot[];
  totalScore: number;
  result?: RoundResultSnapshot;
}

interface GuessSnapshot {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  score: number;
  submittedAt: string;
}

interface RoundResultSnapshot {
  finalizedAt: string;
  correctWord: string;
}
```

### Notes

- When `gameState` is `finished`, `currentRound.status` should be `finished` and `currentRound.result` must be present.
- The result snapshot is shared with all active players and preserved across refreshes.

## POST /rooms/:code/restart

Resets the completed round and returns the refreshed lobby snapshot.

### Request

- Path parameter:
  - `code: string`

### Response

```ts
interface RestartRoomResponse {
  room: RoomSnapshot;
}
```

### Success Behavior

- Validates that the room exists.
- Validates that the requesting participant is the current host.
- Validates that the room is currently in `finished` state.
- Resets `gameState` to `lobby`.
- Clears `currentRound` from the room snapshot.
- Preserves `participants`, `hostId`, and `code`.

### Error Codes

- `404` if the room is not found.
- `403` if the requesting participant is not the host.
- `400` if the room is not in a finished state.
- `500` for unexpected server errors.
