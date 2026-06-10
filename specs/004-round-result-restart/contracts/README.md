# API Contracts: Round Result & Restart

## Base URL

All endpoints are prefixed with `/rooms` and served under the Express API at the configured `PORT` (default 3001).

## Content Type

All requests and responses use `Content-Type: application/json`.

## Error Format

```json
{
  "message": "Human-readable error description"
}
```

## Endpoints

---

### GET /rooms/:code

Fetches room state. Extended to include `"results"` status.

**Query Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `participantId` | `string` | No | Viewer's participant ID (controls `secretWord` visibility) |

**Response (status: `"results"`)**

```json
{
  "room": {
    "code": "AB12",
    "status": "results",
    "hostId": "uuid-of-host",
    "drawerId": "uuid-of-drawer",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "2026-06-11T12:00:00.000Z" }
    ],
    "availableWords": ["apple", "banana", ...],
    "roles": ["drawer", "guesser"],
    "secretWord": "apple",
    "canvasActions": [...],
    "guessHistory": [
      { "id": "uuid", "participantId": "uuid", "text": "orange", "correct": false, "timestamp": "..." },
      { "id": "uuid", "participantId": "uuid", "text": "apple", "correct": true, "timestamp": "..." }
    ],
    "scores": { "uuid1": 100, "uuid2": 0 },
    "roundOver": true
  }
}
```

**Notes**:
- `secretWord` is always present when `status === "results"`, regardless of viewer identity
- `roundOver` is always `true` when `status === "results"` (informational, kept for backward compatibility)

---

### POST /rooms/:code/restart

**NEW**: Triggers a restart, returning the room to lobby state with players preserved and round data cleared.

**Request Body**

```json
{
  "participantId": "uuid-of-host"
}
```

**Responses**

| Status | Condition |
|--------|-----------|
| `200` | Restart successful |
| `403` | Non-host attempted restart |
| `400` | Room is not in `"results"` status |
| `404` | Room not found |

**Success Response (200)**

```json
{
  "room": {
    "code": "AB12",
    "status": "lobby",
    "hostId": "uuid-of-host",
    "drawerId": "",
    "participants": ["..."],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"],
    "canvasActions": [],
    "guessHistory": [],
    "scores": {},
    "roundOver": false
  }
}
```

**Error Response (403)**

```json
{
  "message": "Only the host can restart the round"
}
```

---

## Contract Versioning

This is version 1 of the results/restart contract. Backward-compatible additions:
- `status` field accepts a new value `"results"` (clients should handle unknown statuses gracefully)
- `POST /rooms/:code/restart` is an additive endpoint
