# API Contract: Result & Restart

**Base path**: `/rooms`  
**Feature**: `004-result-restart-lobby`

## Round end (internal)

Triggered by `POST /rooms/:code/guesses` when guess is correct and room is `drawing`. Response room has `status: "result"` and `revealedWord` set.

Further guess attempts while `result`: **409** — “Round has ended”.

## GET /rooms/:code (result)

**Query**: `?participantId=<uuid>`

**Success `200`** (all viewers):

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "revealedWord": "rocket",
    "participants": [{ "id": "…", "name": "Alice", "score": 100 }],
    "guesses": [{ "participantName": "Bob", "text": "rocket", "isCorrect": true }]
  }
}
```

## POST /rooms/:code/join (result)

Allowed when `status === "result"`. Returns same result snapshot shape as existing participants (FR-014).

Rejected when `status === "drawing"` (001/003).

## POST /rooms/:code/restart

Host resets to lobby.

**Query**: `?participantId=<uuid>` (must be host)

**Success `200`**: `{ "room": { "status": "lobby", "participants": [...], "score": 0 each, no guesses/canvas/word } }`

**Errors**: 403 non-host; 400 if not in `result`
