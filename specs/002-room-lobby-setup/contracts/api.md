# API Contracts: Room Setup & Lobby

## Base URL

`http://localhost:3001/api`

## Endpoints

### POST /rooms

Create a new room. Creator is automatically designated as host.

**Request Body**:
```ts
{
  playerName: string;   // trimmed, may be empty (defaults to "Player")
}
```

**Response** (201):
```ts
{
  participantId: string;   // UUID for this session
  room: {
    code: string;          // 4-char uppercase alphanumeric
    status: "lobby";
    participants: Array<{
      id: string;
      name: string;
      joinedAt: string;    // ISO 8601
      isHost: boolean;     // true for creator
    }>;
    availableWords: string[];
    roles: ["drawer", "guesser"];
  };
}
```

**Errors**:
- `429 Too Many Requests`: Rate limit exceeded (max 5 creates/min)

### POST /rooms/:code/join

Join an existing room by code.

**Request Body**:
```ts
{
  playerName: string;   // trimmed, may be empty (defaults to "Player")
}
```

**Response** (200):
```ts
{
  participantId: string;   // new UUID for this session
  room: {
    code: string;
    status: "lobby";
    participants: Array<{
      id: string;
      name: string;        // with (N) discriminator if name collides
      joinedAt: string;
      isHost: boolean;
    }>;
    availableWords: string[];
    roles: ["drawer", "guesser"];
  };
}
```

**Errors**:
- `400 Bad Request`: Invalid request body (Zod validation)
- `404 Not Found`: Room code does not exist
- `409 Conflict`: Room is already in "playing" state (not accepting new players)
- `429 Too Many Requests`: Rate limit exceeded (max 10 joins/min)

### GET /rooms/:code

Fetch current room snapshot (polling endpoint).

**Query Parameters**:
```ts
{
  participantId?: string;   // optional, reserved for per-viewer filtering
}
```

**Response** (200):
```ts
{
  room: {
    code: string;
    status: "lobby" | "playing";
    participants: Array<{
      id: string;
      name: string;
      joinedAt: string;
      isHost: boolean;
    }>;
    availableWords: string[];
    roles: ["drawer", "guesser"];
  };
}
```

**Errors**:
- `404 Not Found`: Room code does not exist

### POST /rooms/:code/start

Start the game (host only, minimum 2 players).

**Request Body**: None (empty)

**Response** (200):
```ts
{
  room: {
    code: string;
    status: "playing";         // transitions from "lobby" to "playing"
    participants: Array<{
      id: string;
      name: string;
      joinedAt: string;
      isHost: boolean;
    }>;
    availableWords: string[];
    roles: ["drawer", "guesser"];
  };
}
```

**Errors**:
- `400 Bad Request`: Room has fewer than 2 participants (game cannot start)
- `403 Forbidden`: Requesting participant is not the host
- `404 Not Found`: Room code does not exist

## Common Error Response Shape

All errors return:
```ts
{
  message: string;   // human-readable error description
}
```

Zod validation errors additionally return HTTP 400 with message `"Invalid request payload"`.
