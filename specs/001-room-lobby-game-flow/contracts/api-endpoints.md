# API Contracts: Room Setup and Lobby

## POST /rooms

Creates a new room and assigns the creator as host.

### Request

```json
{ "playerName": "Alice" }
```

### Response 201

```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "2026-05-31T00:00:00.000Z" }
    ]
  }
}
```

### Errors

- `400` when `playerName` is empty after trimming.

## POST /rooms/:code/join

Joins an existing room by normalized room code.

### Request

```json
{ "playerName": "Bob" }
```

### Response 200

```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "host-uuid",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid", "name": "Bob", "joinedAt": "..." }
    ]
  }
}
```

### Errors

- `400` when `playerName` is empty after trimming.
- `404` when the room code does not exist.

## GET /rooms/:code?participantId=<id>

Fetches the latest lobby snapshot for polling.

### Response 200

```json
{ "room": { "code": "ABCD", "status": "lobby", "hostId": "host-uuid", "participants": [] } }
```

### Errors

- `404` when the room code does not exist.

## POST /rooms/:code/start

Starts the game from the lobby.

### Request

```json
{ "participantId": "host-uuid" }
```

### Response 200

```json
{ "room": { "code": "ABCD", "status": "playing", "hostId": "host-uuid" } }
```

### Errors

- `403` when the participant is not the host.
- `409` when fewer than two players are present.

## Client Contract

- Create and join store `participantId` plus room snapshot in frontend memory.
- Lobby polling calls `GET /rooms/:code` about every 2 seconds.
- Join errors preserve entered form values for correction.
