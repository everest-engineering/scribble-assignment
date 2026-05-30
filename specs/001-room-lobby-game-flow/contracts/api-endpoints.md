# API Contracts: Room Lobby Game Flow

## POST /rooms

### Request
```json
{
  "playerName": "Alice"
}
```

### Response (201)
```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "2026-05-30T...Z" }
    ],
    "availableWords": ["apple", "house", "rocket"],
    "roles": ["drawer", "guesser"]
  }
}
```

## POST /rooms/:code/join

### Request
```json
{
  "playerName": "Bob"
}
```

### Response (200)
```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["apple", "house", "rocket"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Errors
- `404` when the room code does not exist.
- `400` when `playerName` is empty after trimming.
- Returns `{ "message": "..." }`.

## GET /rooms/:code?participantId=<id>

### Response (200)
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

### Errors
- `404` when the room does not exist.
- Returns `{ "message": "..." }`.

## POST /rooms/:code/start

### Request
```json
{
  "participantId": "uuid"
}
```

### Response (200)
```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid",
    "drawerId": "uuid",
    "secretWord": "house",
    "drawing": { "paths": [] },
    "guesses": [],
    "scores": [
      { "participantId": "uuid", "playerName": "Alice", "score": 0 }
    ],
    "result": null
  }
}
```

### Errors
- `403` when the participant is not the host.
- `409` when fewer than two players are present.

## PUT /rooms/:code/drawing

### Request
```json
{
  "participantId": "uuid",
  "drawing": { "paths": [] }
}
```

### Response (200)
```json
{ "room": { "code": "ABCD", "status": "playing" } }
```

### Errors
- `403` when the participant is not the drawer.
- `409` when the room is not actively playing.

## POST /rooms/:code/drawing/clear

### Request
```json
{
  "participantId": "uuid"
}
```

### Response (200)
```json
{ "room": { "code": "ABCD", "drawing": { "paths": [] } } }
```

## POST /rooms/:code/guesses

### Request
```json
{
  "participantId": "uuid",
  "text": "house"
}
```

### Response (200)
```json
{ "room": { "code": "ABCD", "status": "results" } }
```

### Errors
- `400` when the guess is empty after trimming.
- `403` when the drawer submits a guess.
- `409` when the room is not actively playing.

## POST /rooms/:code/restart

### Request
```json
{
  "participantId": "uuid"
}
```

### Response (200)
```json
{ "room": { "code": "ABCD", "status": "lobby", "guesses": [], "scores": [] } }
```

### Errors
- `403` when the participant is not the host.
- `409` when the room is not in results state.

## Client contract

- The frontend stores `participantId` and `room` in `RoomStore`.
- `createRoom` and `joinRoom` both return a `RoomSessionResponse`.
- `fetchRoom` refreshes the current room snapshot using the stored participant identity.
- Room code values are normalized to uppercase before sending to the backend.
- Lobby, gameplay, and results state are synced by HTTP polling.
- Room session state is not persisted across browser refresh.
