# API Contract: Rooms (Scenario 2 extensions)

**Base URL**: `http://localhost:3001`  
**Prefix**: `/rooms`  
**Builds on**: [001-room-setup-lobby/contracts/rooms-api.md](../../001-room-setup-lobby/contracts/rooms-api.md)

---

## POST /rooms — updated validation

**Request body**

```json
{ "playerName": "  Alex  " }
```

| Rule | Error |
|------|-------|
| Missing or empty after trim | `400` — `"Player name is required"` |

**Response 201** — participant name is trimmed (`"Alex"`). Snapshot unchanged in lobby except participant names.

---

## POST /rooms/:code/join — updated validation

Same name rules as create. Stored name trimmed.

| Rule | Error |
|------|-------|
| Empty/whitespace name | `400` — `"Player name is required"` |

---

## POST /rooms/:code/start — extended response

On success, server assigns drawer, secret word, and scores.

**Response 200** (host/drawer viewer with `participantId` in prior session — poll with viewer id):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-host",
    "drawerId": "uuid-host",
    "participants": [ ... ],
    "scores": {
      "uuid-host": 0,
      "uuid-guest": 0
    },
    "secretWord": "castle"
  }
}
```

**GET /rooms/:code?participantId=uuid-guest** (guesser viewer):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-host",
    "drawerId": "uuid-host",
    "participants": [ ... ],
    "scores": {
      "uuid-host": 0,
      "uuid-guest": 0
    }
  }
}
```

Note: no `secretWord`, no `availableWords` when `status === "playing"`.

---

## GET /rooms/:code — viewer filtering

**Query**: `participantId` (required for correct word filtering during play)

| Viewer | `secretWord` | `availableWords` |
|--------|--------------|------------------|
| Drawer (`participantId === drawerId`) | present | omitted |
| Guesser | omitted | omitted |
| Lobby (`status === "lobby"`) | omitted | may include starter list (unchanged) |

---

## Client-side validation (Create & Join pages)

| Condition | Message |
|-----------|---------|
| Empty/whitespace name | `Player name is required` |

Validate before API call; server remains source of truth.
