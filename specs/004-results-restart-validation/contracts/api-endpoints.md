# API Contracts: Results, Restart, and Final Validation

## Result State via POST /rooms/:code/guesses

A correct guess transitions the room to results.

### Response 200

```json
{
  "room": {
    "code": "ABCD",
    "status": "results",
    "secretWord": "rocket",
    "result": {
      "correctWord": "rocket",
      "winnerId": "uuid",
      "winnerName": "Bob"
    },
    "scores": [],
    "guesses": []
  }
}
```

## POST /rooms/:code/restart

### Request

```json
{ "participantId": "host-uuid" }
```

### Response 200

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": []
  }
}
```

### Errors

- `403` when participant is not host.
- `409` when room is not in results.
- `404` when room is missing.

## GET /rooms/:code?participantId=<id>

Polling returns results to active players and lobby state after restart.
