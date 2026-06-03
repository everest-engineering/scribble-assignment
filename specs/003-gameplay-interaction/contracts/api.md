# API Contracts: Gameplay Interaction

## Unchanged Endpoints

The following endpoints are unchanged in behavior. Their response shapes are extended with the new `strokes`, `guesses`, and `scores` fields on `RoomSnapshot` (see data-model.md).

- `GET /health`
- `POST /rooms`
- `POST /rooms/:code/join`
- `GET /rooms/:code`
- `POST /rooms/:code/start`

---

## Updated Shape: `RoomSnapshot`

All endpoints that return a `RoomSnapshot` now include the three new fields:

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "currentWord": "rocket",
    "status": "active",
    "participants": [...],
    "availableWords": [...],
    "roles": ["drawer", "guesser"],
    "strokes": [
      {
        "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }],
        "color": "#000000",
        "lineWidth": 4
      }
    ],
    "guesses": [
      {
        "id": "<uuid>",
        "participantId": "<uuid>",
        "text": "rocket",
        "correct": true,
        "submittedAt": "2026-06-03T10:00:00.000Z"
      }
    ],
    "scores": {
      "<participantId-1>": 100,
      "<participantId-2>": 0
    }
  }
}
```

Note: `currentWord` is still `null` for non-drawer viewers (viewer-scoping unchanged).

---

## New Endpoint: Submit a Stroke

**`POST /rooms/:code/stroke`**

Appends a single drawing stroke to the room's canvas state. Only the drawer may call this.

**Request**

```json
{
  "participantId": "<uuid>",
  "stroke": {
    "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }],
    "color": "#000000",
    "lineWidth": 4
  }
}
```

**Response `200 OK`**

```json
{
  "room": { ...RoomSnapshot }
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | Room not active |
| 400 | Stroke has no points |
| 403 | Caller is not the drawer |
| 404 | Room not found |

---

## New Endpoint: Clear Canvas

**`POST /rooms/:code/clear`**

Resets the stroke list to empty. Only the drawer may call this.

**Request**

```json
{
  "participantId": "<uuid>"
}
```

**Response `200 OK`**

```json
{
  "room": { ...RoomSnapshot }
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | Room not active |
| 403 | Caller is not the drawer |
| 404 | Room not found |

---

## New Endpoint: Submit a Guess

**`POST /rooms/:code/guess`**

Submits a guess for the current round. The drawer may not guess. The text is trimmed before validation and comparison.

**Request**

```json
{
  "participantId": "<uuid>",
  "text": "Rocket"
}
```

**Response `200 OK`**

```json
{
  "guess": {
    "id": "<uuid>",
    "participantId": "<uuid>",
    "text": "rocket",
    "correct": true,
    "submittedAt": "2026-06-03T10:00:00.000Z"
  },
  "room": { ...RoomSnapshot }
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | Room not active |
| 400 | Text is empty or whitespace-only after trimming |
| 403 | Caller is the drawer |
| 404 | Room not found |
