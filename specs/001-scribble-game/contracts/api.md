# API Contracts: Room Setup & Lobby

**Feature**: 001-scribble-game — Scenario 1
**Base URL**: `http://localhost:3001`

All request and response bodies are JSON. Errors return `{ "message": "<description>" }`.

---

## Existing Endpoints (modified)

### POST /rooms

Create a new room. The caller becomes the host.

**Request body**

```json
{ "playerName": "Alice" }
```

| Field        | Type   | Required | Validation                          |
|--------------|--------|----------|-------------------------------------|
| `playerName` | string | yes      | Trimmed; min 1 char after trim      |

**Response 201**

```json
{
  "participantId": "uuid-of-host",
  "room": {
    "code": "A3KP",
    "status": "lobby",
    "participants": [
      { "id": "uuid-of-host", "name": "Alice", "joinedAt": "2026-06-05T10:00:00.000Z" }
    ],
    "hostId": "uuid-of-host",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error 400** — `playerName` missing or whitespace-only.

---

### POST /rooms/:code/join

Join an existing room.

**Path param**: `code` — 4-character room code (uppercased by server).

**Request body**

```json
{ "playerName": "Bob" }
```

| Field        | Type   | Required | Validation                     |
|--------------|--------|----------|--------------------------------|
| `playerName` | string | yes      | Trimmed; min 1 char after trim |

**Response 200**

```json
{
  "participantId": "uuid-of-bob",
  "room": {
    "code": "A3KP",
    "status": "lobby",
    "participants": [
      { "id": "uuid-of-host", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-of-bob",  "name": "Bob",   "joinedAt": "..." }
    ],
    "hostId": "uuid-of-host",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error 400** — `playerName` missing or whitespace-only.
**Error 404** — room code not found.

---

### GET /rooms/:code

Fetch the latest room snapshot. Used by lobby polling.

**Path param**: `code` — 4-character room code (uppercased by server).
**Query param**: `participantId` (optional) — viewer's participant id.

**Response 200**

```json
{
  "room": {
    "code": "A3KP",
    "status": "lobby",
    "participants": [ ... ],
    "hostId": "uuid-of-host",
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Error 404** — room code not found.

---

## New Endpoint

### POST /rooms/:code/start

Start the game. Transitions room status from `"lobby"` to `"active"`.

**Path param**: `code` — 4-character room code (uppercased by server).

**Request body**

```json
{ "participantId": "uuid-of-host" }
```

| Field           | Type   | Required | Validation                    |
|-----------------|--------|----------|-------------------------------|
| `participantId` | string | yes      | Must match `room.hostId`      |

**Response 200**

```json
{
  "room": {
    "code": "A3KP",
    "status": "active",
    "participants": [ ... ],
    "hostId": "uuid-of-host",
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Error 400** — fewer than 2 participants.
**Error 403** — `participantId` does not match `hostId`.
**Error 404** — room code not found.

---

## Navigation Contract (Frontend)

The lobby polling loop (`GET /rooms/:code` every ~2 s) drives navigation:

| `room.status` returned | Action in LobbyPage          |
|------------------------|------------------------------|
| `"lobby"`              | Stay on lobby, update list   |
| `"active"`             | `navigate("/game")`          |
