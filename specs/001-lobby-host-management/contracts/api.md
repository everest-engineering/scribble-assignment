# API Contracts — Lobby & Host Management

Base URL: `http://localhost:3001` (configurable via `VITE_API_URL`)

---

## POST /rooms — Create Room

Creates a new room and designates the creator as host.

**Request Body:**

```json
{
  "playerName": "Alice"
}
```

- `playerName`: string, optional. Trimmed, min 1 char, max 30 chars. Defaults to `"Player"` if omitted.

**Success Response** (201):

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "AB12",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid-string",
        "name": "Alice",
        "joinedAt": "2026-06-08T12:00:00.000Z",
        "isHost": true,
        "role": null
      }
    ],
    "hostId": "uuid-string"
  }
}
```

**Error Responses:**

All error responses use a structured format:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

| HTTP Status | `code` | `error` |
|-------------|--------|---------|
| 400 | `NAME_TOO_LONG` | "Name must be 30 characters or less" |
| 400 | `NAME_REQUIRED` | "Name is required" |

**Zod Schema** (updated):

```typescript
const createRoomSchema = z.object({
  playerName: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(1, "Name is required").max(30, "Name must be 30 characters or less")
  ).optional().default("Player"),
});
```

---

## POST /rooms/:code/join — Join Room

Joins an existing room. Rejected if room is in `"playing"` state.

**Path Parameters:**

- `code`: string, 4-char room code

**Request Body:**

```json
{
  "playerName": "Bob"
}
```

- `playerName`: string, optional. Same validation as create.

**Success Response** (200):

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "AB12",
    "status": "lobby",
    "participants": [
      { "id": "...", "name": "Alice", "joinedAt": "...", "isHost": true, "role": null },
      { "id": "...", "name": "Bob", "joinedAt": "...", "isHost": false, "role": null }
    ],
    "hostId": "uuid-string"
  }
}
```

**Error Responses:**

| HTTP Status | `code` | `error` |
|-------------|--------|---------|
| 404 | `ROOM_NOT_FOUND` | "Room not found" |
| 400 | `GAME_IN_PROGRESS` | "Game already in progress" |
| 400 | `NAME_REQUIRED` | "Name is required" |

---

## GET /rooms/:code — Get Room State

Fetches current room state (polling endpoint).

**Path Parameters:**

- `code`: string, 4-char room code

**Query Parameters:**

- `participantId`: string, optional (currently voided, but included for future per-participant views)

**Success Response** (200):

```json
{
  "room": {
    "code": "AB12",
    "status": "lobby",
    "participants": [
      { "id": "...", "name": "Alice", "joinedAt": "...", "isHost": true, "role": null },
      { "id": "...", "name": "Bob", "joinedAt": "...", "isHost": false, "role": null }
    ],
    "hostId": "uuid-string"
  }
}
```

**Error** (404):

| HTTP Status | `code` | `error` |
|-------------|--------|---------|
| 404 | `ROOM_NOT_FOUND` | "Room not found" |

---

## POST /rooms/:code/start — Start Game (NEW)

Host-only. Starts the game if at least 2 participants. Sets `status` to `"playing"`, selects a word, assigns roles.

**Path Parameters:**

- `code`: string, 4-char room code

**Request Body:**

```json
{
  "participantId": "uuid-string"
}
```

- `participantId`: string, required. Must match the room's `hostId`.

**Success Response** (200):

```json
{
  "room": {
    "code": "AB12",
    "status": "playing",
    "participants": [
      { "id": "...", "name": "Alice", "joinedAt": "...", "isHost": true, "role": "drawer" },
      { "id": "...", "name": "Bob", "joinedAt": "...", "isHost": false, "role": "guesser" }
    ],
    "hostId": "uuid-string",
    "availableWords": ["pizza"],
    "roles": ["drawer", "guesser"]
  }
}
```

> **Note**: `availableWords` and `roles` in the response are frontend convenience fields and will be populated by the start-game logic.

**Error Responses:**

| HTTP Status | `code` | `error` |
|-------------|--------|---------|
| 404 | `ROOM_NOT_FOUND` | "Room not found" |
| 403 | `NOT_HOST` | "Only the host can start the game" |
| 400 | `NOT_ENOUGH_PLAYERS` | "At least 2 players are required to start" |
| 400 | `GAME_IN_PROGRESS` | "Game already in progress" |
