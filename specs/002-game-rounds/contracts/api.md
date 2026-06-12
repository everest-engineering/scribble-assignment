# API Contracts — Game Rounds

Base URL: `http://localhost:3001` (configurable via `VITE_API_URL`)

All API contracts from 001 remain unchanged except for the response payloads below.

---

## POST /rooms/:code/start — Start Game (updated)

Starts the game, assigns roles (host = drawer, others = guessers), selects a word.

**Request Body:**

```json
{
  "participantId": "uuid-string"
}
```

**Success Response** (200) — Drawer view:

```json
{
  "room": {
    "code": "AB12",
    "status": "playing",
    "participants": [
      {
        "id": "...",
        "name": "Alice",
        "joinedAt": "...",
        "isHost": true,
        "role": "drawer"
      },
      {
        "id": "...",
        "name": "Bob",
        "joinedAt": "...",
        "isHost": false,
        "role": "guesser"
      }
    ],
    "hostId": "uuid-string",
    "word": "pizza",
    "availableWords": ["pizza"],
    "roles": ["drawer", "guesser"]
  }
}
```

> **Note**: The response above shows the drawer's view (includes `word`). A guesser polling `GET /rooms/:code` will see no `word` field.

**Error Responses** (400/403): Unchanged from 001.

---

## GET /rooms/:code — Get Room State (role-aware word visibility)

Role-based word visibility: the `word` field is included **only** when the requesting participant is the drawer.

**Request:**

```
GET /rooms/:code?participantId=<drawer-uuid>
```

**Success Response** (200) — Drawer view:

```json
{
  "room": {
    "code": "AB12",
    "status": "playing",
    "participants": [
      { "id": "...", "name": "Alice", "isHost": true, "role": "drawer" },
      { "id": "...", "name": "Bob", "isHost": false, "role": "guesser" }
    ],
    "hostId": "uuid-string",
    "word": "pizza"
  }
}
```

**Success Response** (200) — Guesser view:

```json
{
  "room": {
    "code": "AB12",
    "status": "playing",
    "participants": [
      { "id": "...", "name": "Alice", "isHost": true, "role": "drawer" },
      { "id": "...", "name": "Bob", "isHost": false, "role": "guesser" }
    ],
    "hostId": "uuid-string"
  }
}
```

> Note the absence of `word` in the guesser response.

**Invalid/Missing `participantId`**: If `participantId` is missing or does not match any participant in the room, the `word` field is omitted (treated as guesser-safe). Malformed `participantId` format returns:

```json
{
  "error": "INVALID_PARTICIPANT_ID"
}
```

**Error** (404): Unchanged from 001.

---

## POST /rooms/:code/join — Join Room

No changes from 001. The join endpoint rejects with "Game already in progress" when `status !== "lobby"`.

---

## POST /rooms — Create Room

No changes from 001.
