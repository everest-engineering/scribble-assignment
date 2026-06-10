# API Contract: Result, Restart & Final Validation

Extends the existing `POST /api/rooms/:code/*` REST surface. All endpoints return JSON. Errors
follow the existing `{ message: string }` shape with appropriate HTTP status codes.

---

## Modified Behaviour: Existing Endpoints

### GET `/api/rooms/:code?participantId=<id>`

**Change**: `room.secretWord` is now non-null for **all** participants (not just the drawer) when
`room.status === "completed"`.

No request/response shape changes — `secretWord: string | null` was already in the schema.

### POST `/api/rooms/:code/guess`

**Change**: If the submitted guess is correct, the returned `room.status` will be `"completed"`
and `room.secretWord` will be non-null for all viewers.

No request/response shape changes.

### GET `/api/rooms/:code` and all endpoints returning `RoomSnapshot`

**Change**: Response body now includes `roundScores`.

```jsonc
// RoomSnapshot — updated shape
{
  "code": "ABCD",
  "status": "lobby" | "active" | "completed",   // "completed" is the new state
  "hostId": "<uuid>",
  "drawerId": "<uuid>" | null,
  "secretWord": "<word>" | null,                 // non-null for all when status === "completed"
  "participants": [{ "id": "<uuid>", "name": "Alice", "joinedAt": "<iso8601>" }],
  "availableWords": ["cat", "dog", ...],
  "roles": ["drawer", "guesser"],
  "scores": { "<participantId>": 200 },          // cumulative across rounds
  "roundScores": { "<participantId>": 100 },     // this round only — NEW
  "guesses": [
    { "participantId": "<uuid>", "text": "cat", "isCorrect": true, "submittedAt": "<iso8601>" }
  ]
}
```

---

## New Endpoint

### POST `/api/rooms/:code/restart`

Transitions a `"completed"` (or `"active"`) room back to `"lobby"`. Only the host may call this.

**Request**

```
POST /api/rooms/ABCD/restart?participantId=<uuid>
Content-Type: application/json
(no body required)
```

**Success response** — `200 OK`

```jsonc
{
  "room": { /* RoomSnapshot with status "lobby", drawerId null, secretWord null,
               guesses [], roundScores {}, participants and scores preserved */ }
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 403 | `participantId` is not the host |

---

## Routing Convention (Frontend)

| Room Status | Frontend Route |
|-------------|----------------|
| `"lobby"` | `/lobby` |
| `"active"` | `/game` |
| `"completed"` | `/results` |

All pages poll `GET /api/rooms/:code` every 2 s and navigate based on status transitions.
