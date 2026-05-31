# Contract: GET /rooms/:code — Finished State

## `GET /rooms/:code?participantId=<uuid>`

Existing polling endpoint. When `room.status === "finished"`, the response includes
the `result` field and exposes `secretWord` to all participants (not just the drawer).

This contract documents only the **delta** from the existing spec 003 behaviour. For the
full endpoint contract see `specs/003-gameplay-interaction/`.

---

### Response when `status === "finished"`

```json
{
  "room": {
    "code": "ABCD",
    "status": "finished",
    "hostId": "<uuid>",
    "participants": [
      { "id": "<uuid>",  "name": "Alice", "joinedAt": "<iso-date>" },
      { "id": "<uuid2>", "name": "Bob",   "joinedAt": "<iso-date>" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentDrawerId": "<uuid>",
    "secretWord": "pizza",
    "result": {
      "revealedWord": "pizza",
      "scores": {
        "<uuid>":  0,
        "<uuid2>": 100
      },
      "guesses": [
        {
          "guesserName": "Bob",
          "guessText": "pizza",
          "isCorrect": true,
          "submittedAt": "<iso-date>"
        }
      ]
    }
  }
}
```

---

### Key differences from `"in-progress"` response

| Field | `"in-progress"` | `"finished"` |
|-------|----------------|--------------|
| `secretWord` | Present for drawer only (based on `?participantId`) | Present for **all** participants |
| `result` | Absent | Present with `revealedWord`, `scores`, `guesses` |

---

### Client behaviour

- When a client polling this endpoint observes `status` change to `"finished"`, it
  navigates to the result screen and renders `room.result`.
- When the result screen observes `status` change to `"lobby"` (after host restart),
  it navigates back to `/lobby`.
- The `?participantId` query param continues to be sent by the client on every poll
  (required for `secretWord` visibility during `"in-progress"`; harmless when `"finished"`).
