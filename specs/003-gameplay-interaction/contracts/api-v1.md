# API v1: Gameplay Interaction

## POST /rooms/:code/draw

**Purpose**: Append a stroke to the canvas (drawer only).

### Request

```json
{
  "participantId": "uuid-string",
  "color": "#000000",
  "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }]
}
```

### Success Response (200)

```json
{
  "strokeCount": 12
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Invalid stroke data (missing color, empty points) |
| 403 | Participant is not the drawer |
| 404 | Room not found |
| 409 | Room is not in "playing" status |

---

## DELETE /rooms/:code/draw

**Purpose**: Clear all strokes from the canvas (drawer only).

### Request (body)

```json
{
  "participantId": "uuid-string"
}
```

### Success Response (200)

```json
{
  "cleared": true
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 403 | Participant is not the drawer |
| 404 | Room not found |
| 409 | Room is not in "playing" status |

---

## GET /rooms/:code/canvas

**Purpose**: Fetch all strokes drawn so far (any participant).

### Query Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `participantId` | Yes | Participant UUID (for auth validation) |

### Success Response (200)

```json
{
  "strokes": [
    {
      "color": "#000000",
      "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }]
    }
  ]
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Room not found |

---

## POST /rooms/:code/guess

**Purpose**: Submit a guess (guesser only).

### Request

```json
{
  "participantId": "uuid-string",
  "text": "rocket"
}
```

### Success Response (200)

```json
{
  "correct": true,
  "points": 100,
  "alreadyGuessed": false
}
```

On incorrect guess:

```json
{
  "correct": false,
  "points": 0,
  "alreadyGuessed": false
}
```

On repeat guess from already-correct guesser:

```json
{
  "correct": true,
  "points": 0,
  "alreadyGuessed": true
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Missing or whitespace-only guess text |
| 403 | Participant is the drawer (drawers cannot guess) |
| 404 | Room not found |
| 409 | Room is not in "playing" status |

---

## POST /rooms/:code/end-round

**Purpose**: End the round early (host only).

### Request

```json
{
  "participantId": "uuid-string"
}
```

### Success Response (200)

```json
{
  "ended": true
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 403 | Participant is not the host |
| 404 | Room not found |
| 409 | Room is not in "playing" status |

---

## GET /rooms/:code (extended)

**Existing endpoint** extended with:

- `scores`: `Record<string, number>` — always included when `status` is `"playing"` or `"finished"`
- `guessLog`: `Guess[]` — always included when `status` is `"playing"` or `"finished"`
- `roundEnded`: `boolean` — `true` when round has concluded
- `secretWord`: revealed to **all** participants when `status === "finished"` (in addition to existing drawer-only reveal while `"playing"`)

### Example (finished state, viewer is guesser)

```json
{
  "room": {
    "code": "ABCD",
    "status": "finished",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "...", "role": "drawer" },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "...", "role": "guesser" }
    ],
    "hostId": "uuid-1",
    "secretWord": "rocket",
    "scores": { "uuid-1": 0, "uuid-2": 100 },
    "guessLog": [
      { "participantId": "uuid-2", "text": "pizza", "correct": false, "timestamp": "..." },
      { "participantId": "uuid-2", "text": "rocket", "correct": true, "timestamp": "..." }
    ],
    "roundEnded": true
  }
}
```
