# API Contracts: Game Start and Drawer Flow (002)

## Modified Endpoints

### POST /rooms/:code/start — unchanged request, expanded response

Already implemented in Scenario 001. Response shape gains new fields.

**Request** (unchanged):
```json
{ "participantId": "<uuid>" }
```

**Response** (expanded):
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "status": "active",
    "participants": [ { "id": "<uuid>", "name": "Alice", "joinedAt": "<iso>" } ],
    "availableWords": ["apple", "house", "..."],
    "roles": ["drawer", "guesser"],
    "drawerId": "<uuid>",
    "secretWord": "apple"
  }
}
```

Notes:
- `drawerId` equals `hostId` (host is always drawer in Scenario 002)
- `secretWord` is present in this response because the caller IS the host/drawer
- Non-host participants receive `wordPlaceholder` instead when they poll GET /rooms/:code

**Error responses** (unchanged from Scenario 001):
- `404` Room not found
- `409` Game already in progress
- `403` Only the host can start the game
- `400` At least 2 players are required to start

---

### GET /rooms/:code?participantId=:id — expanded response (viewer-scoped)

**Request** (unchanged):
```
GET /rooms/ABCD?participantId=<uuid>
```

**Response for drawer** (`participantId === room.drawerId`):
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "status": "active",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "drawerId": "<uuid>",
    "secretWord": "apple"
  }
}
```

**Response for guesser** (`participantId !== room.drawerId` or omitted):
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "status": "active",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "drawerId": "<uuid>",
    "wordPlaceholder": "_ _ _ _ _"
  }
}
```

Notes:
- `secretWord` field is ABSENT from guesser response (not `null`, not `""` — omitted entirely)
- `wordPlaceholder` field is ABSENT from drawer response
- In lobby (`status !== "active"`): both `secretWord` and `wordPlaceholder` are absent; `drawerId` is `""`

---

## Unchanged Endpoints

- `POST /rooms` — no change
- `POST /rooms/:code/join` — no change
