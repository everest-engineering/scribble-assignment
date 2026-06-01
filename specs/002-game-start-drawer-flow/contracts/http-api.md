# HTTP API Contract: Game Start & Drawer Flow

## POST /rooms/:code/start

Starts the first round for a room.

### Request

Path parameters:

- `code`: Room code. Leading/trailing whitespace is ignored and code matching is case-insensitive.

Body:

```json
{
  "participantId": "player-123"
}
```

### Success Response

Status: `200 OK`

Returned snapshot is viewer-specific for the requester.

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
      "secretWord": "rocket"
    }
  }
}
```

### Error Responses

Status: `400 Bad Request`

```json
{
  "message": "Participant is required"
}
```

Status: `403 Forbidden`

```json
{
  "message": "Only the host can start the game"
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
  "message": "At least 2 players are required to start the game"
}
```

Status: `409 Conflict`

```json
{
  "message": "Game has already started"
}
```

## GET /rooms/:code

Returns a viewer-safe room snapshot. Existing behavior remains, with Scenario 2 round state added when a round is active.

### Request

Query parameters:

- `participantId`: Optional viewer player ID. Required for drawer-only secret word visibility.

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
      "secretWord": "rocket"
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
      "drawerName": "Alice"
    }
  }
}
```

## Existing Contracts to Preserve

- `POST /rooms` still creates a room and returns `participantId` plus a room snapshot.
- `POST /rooms/:code/join` still joins a room and returns `participantId` plus a room snapshot.
- Player names are trimmed and whitespace-only names are rejected with a clear message.
- Room snapshots must not expose the secret word to non-drawers.
