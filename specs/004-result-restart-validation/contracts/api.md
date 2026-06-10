# API Contracts: Result, Restart, and Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-10

All endpoints follow the existing pattern: JSON bodies, JSON responses, errors use `{ message: string }`.

---

## POST /rooms/:code/end

Transitions a room from `"playing"` to `"result"` state. Host only.

### Request

```
POST /rooms/:code/end
Content-Type: application/json
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Room code (case-insensitive; normalised to uppercase) |

**Body**:

```json
{
  "playerName": "Alice"
}
```

| Field | Type | Validation |
|-------|------|------------|
| `playerName` | string | Required, trimmed, non-empty |

### Success Response — 200 OK

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "drawerName": "Alice",
    "secretWord": "Rocket",
    "guesses": [
      {
        "playerName": "Bob",
        "text": "rocket",
        "correct": true,
        "points": 100,
        "submittedAt": "2026-06-10T12:00:01.000Z"
      }
    ],
    "scores": { "Bob": 100 },
    "strokes": [...]
  }
}
```

Note: `secretWord` is always included when `status === "result"` (no viewer filtering).

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Room code not found |
| 403 | `playerName` does not match host (`participants[0].name`) |
| 409 | Room is not in `"playing"` state |

---

## POST /rooms/:code/restart

Transitions a room from `"result"` to `"lobby"` state, clearing game data. Host only.

### Request

```
POST /rooms/:code/restart
Content-Type: application/json
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Room code (case-insensitive; normalised to uppercase) |

**Body**:

```json
{
  "playerName": "Alice"
}
```

| Field | Type | Validation |
|-------|------|------------|
| `playerName` | string | Required, trimmed, non-empty |

### Success Response — 200 OK

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "...", "name": "Alice", "joinedAt": "...", "isHost": true },
      { "id": "...", "name": "Bob",   "joinedAt": "...", "isHost": false }
    ],
    "availableWords": [...],
    "roles": [...],
    "guesses": [],
    "scores": {},
    "strokes": []
  }
}
```

Note: `secretWord` and `drawerName` are absent (cleared). `participants` is preserved in full.

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Room code not found |
| 403 | `playerName` does not match host (`participants[0].name`) |
| 409 | Room is not in `"result"` state |

---

## Modified: GET /rooms/:code

No new parameters. The response `room.status` field now includes `"result"` as a possible value. When `status === "result"`, `secretWord` and `drawerName` are always present (no viewer filtering applied).

### Extended RoomSnapshot when `status === "result"`

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "drawerName": "Alice",
    "secretWord": "Rocket",
    "guesses": [...],
    "scores": { "Bob": 100 },
    "strokes": [...],
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```
