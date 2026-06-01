# HTTP API Contract: Gameplay Interaction

## POST /rooms/:code/guesses

Submits a guess for the active round in a room.

### Request

Path parameters:

- `code`: Room code. Trim whitespace and treat code matching as case-insensitive.

Body:

```json
{
  "participantId": "player-123",
  "guessText": "rocket"
}
```

### Success Response

Status: `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "player-123",
    "gameState": "inProgress",
    "participants": [
      {
        "id": "player-123",
        "name": "Alice",
        "joinedAt": "2026-05-29T00:00:00.000Z",
        "isHost": true
      },
      {
        "id": "player-456",
        "name": "Bob",
        "joinedAt": "2026-05-29T00:00:01.000Z",
        "isHost": false
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentRound": {
      "roundNumber": 1,
      "status": "active",
      "drawerId": "player-123",
      "drawerName": "Alice",
      "guessHistory": [
        {
          "id": "guess-1",
          "participantId": "player-456",
          "playerName": "Bob",
          "text": " rocket ",
          "normalizedText": "rocket",
          "isCorrect": true,
          "score": 100,
          "submittedAt": "2026-05-29T00:00:30.000Z"
        }
      ]
    }
  }
}
```

### Error Responses

Status: `400 Bad Request`

```json
{
  "message": "guessText is required"
}
```

Status: `400 Bad Request`

```json
{
  "message": "guessText cannot be empty"
}
```

Status: `403 Forbidden`

```json
{
  "message": "Participant is not in the room"
}
```

Status: `404 Not Found`

```json
{
  "message": "Unable to load room"
}
```

Status: `409 Conflict`

```json
{
  "message": "Room is not accepting guesses"
}
```

## GET /rooms/:code

Returns a viewer-safe room snapshot. Existing behavior is preserved, and active round state now includes `guessHistory` for all players.

### Request

Query parameters:

- `participantId`: Optional viewer player ID used for drawer-only `secretWord` visibility.

### Active Round Response for Drawer

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "player-123",
    "gameState": "inProgress",
    "participants": [],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentRound": {
      "roundNumber": 1,
      "status": "active",
      "drawerId": "player-123",
      "drawerName": "Alice",
      "secretWord": "rocket",
      "guessHistory": []
    }
  }
}
```

### Active Round Response for Guesser

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "player-123",
    "gameState": "inProgress",
    "participants": [],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentRound": {
      "roundNumber": 1,
      "status": "active",
      "drawerId": "player-123",
      "drawerName": "Alice",
      "guessHistory": []
    }
  }
}
```

## Scope Notes

- No backend endpoint is added for canvas drawing or clear actions in Scenario 3. The drawer's canvas is maintained locally in the frontend.
- Guess submissions are validated on the backend before being recorded in `guessHistory`.
- Correct guesses score `100`; incorrect guesses score `0`.
