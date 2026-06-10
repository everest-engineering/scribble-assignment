# API Contracts: Gameplay Interaction - Drawing, Guessing & Scoring

Base URL: `http://localhost:3001`

This document describes the contracts affected by the Gameplay Interaction feature.
Contracts not listed here (e.g., `POST /rooms`, `POST /rooms/:code/join`, `POST /rooms/:code/start`) are unchanged from specs 001/002.

---

## POST /rooms/:code/canvas

Submit a drawing action (stroke or clear) to the current canvas. Only the drawer may call this endpoint.

**URL Parameters:**
- `code`: 4-character room code

**Query Parameters:**
- `playerId`: The requester's room-assigned participant ID

**Request Body:**

```json
{
  "type": "stroke",
  "points": [{ "x": 10, "y": 20 }, { "x": 30, "y": 40 }],
  "color": "#000000",
  "width": 3
}
```

Or for a clear action:

```json
{
  "type": "clear"
}
```

**Response** `200 OK`:

```json
{
  "ok": true
}
```

**Errors:**
- `400` — Invalid action payload (missing fields, invalid point data)
- `403` — Only the drawer can submit canvas actions
- `404` — Room code not found

---

## POST /rooms/:code/guess

Submit a text guess for the current round. Only guessers (non-drawer participants who haven't already scored 100) may submit.

**URL Parameters:**
- `code`: 4-character room code

**Query Parameters:**
- `playerId`: The requester's room-assigned participant ID

**Request Body:**

```json
{
  "text": "your guess here"
}
```

**Response** `200 OK` (correct guess):

```json
{
  "correct": true,
  "score": 100
}
```

**Response** `200 OK` (incorrect guess):

```json
{
  "correct": false,
  "score": 0
}
```

**Errors:**
- `400` — Empty or whitespace-only guess, guess exceeds 100 characters, or player already scored 100 this round
- `403` — The drawer cannot submit guesses
- `404` — Room code not found

---

## GET /rooms/:code

Fetch current room state (used for polling). Extended with canvas state, guess history, and scores.

**URL Parameters:**
- `code`: 4-character room code

**Query Parameters:**
- `participantId` (optional): Identifies the viewer (existing parameter from spec 001/002)

**Response** `200 OK` (room is playing):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-string",
    "drawerId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "string",
        "joinedAt": "ISO-8601-string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"],
    "secretWord": "pizza",
    "canvasActions": [
      {
        "type": "stroke",
        "points": [{ "x": 10, "y": 20 }],
        "color": "#000000",
        "width": 3,
        "timestamp": "ISO-8601-string"
      }
    ],
    "guessHistory": [
      {
        "id": "uuid-string",
        "participantId": "uuid-string",
        "text": "guess text",
        "correct": false,
        "timestamp": "ISO-8601-string"
      }
    ],
    "scores": {
      "uuid-string-1": 100,
      "uuid-string-2": 0
    },
    "roundOver": false
  }
}
```

**Notes:**
- `canvasActions` is `[]` when no drawing has occurred yet
- `guessHistory` is `[]` when no guesses have been submitted
- `scores` may be empty `{}` or contain entries for non-drawer participants only
- `roundOver` is `true` only when all non-drawer participants have scored 100

**Errors:**
- `400` — Malformed room code format
- `404` — Room code not found
