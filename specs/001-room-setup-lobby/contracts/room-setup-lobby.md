# Contract: Room Setup & Lobby

This contract describes the room API surface needed for Feature 1. Existing route names
are retained where already present.

## Create Room

`POST /rooms`

### Request

```json
{
  "playerName": "Sketch captain"
}
```

### Success Response: 201

```json
{
  "participantId": "creator-participant-id",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "creator-participant-id",
    "participants": [
      {
        "id": "creator-participant-id",
        "name": "Sketch captain",
        "joinedAt": "2026-05-30T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

## Join Room

`POST /rooms/:code/join`

### Request

```json
{
  "playerName": "Second pencil"
}
```

### Success Response: 200

```json
{
  "participantId": "joining-participant-id",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "creator-participant-id",
    "participants": [
      {
        "id": "creator-participant-id",
        "name": "Sketch captain",
        "joinedAt": "2026-05-30T00:00:00.000Z"
      },
      {
        "id": "joining-participant-id",
        "name": "Second pencil",
        "joinedAt": "2026-05-30T00:00:02.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Error Responses

- `400`: room code is empty or whitespace-only.
- `404`: room code does not match an active room.

## Fetch Room

`GET /rooms/:code?participantId=:participantId`

### Success Response: 200

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "creator-participant-id",
    "participants": [
      {
        "id": "creator-participant-id",
        "name": "Sketch captain",
        "joinedAt": "2026-05-30T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Error Responses

- `400`: room code is empty or whitespace-only.
- `404`: room code does not match an active room.

## Start Game

`POST /rooms/:code/start`

### Request

```json
{
  "participantId": "creator-participant-id"
}
```

### Success Response: 200

```json
{
  "room": {
    "code": "ABCD",
    "status": "in-game",
    "hostParticipantId": "creator-participant-id",
    "participants": [
      {
        "id": "creator-participant-id",
        "name": "Sketch captain",
        "joinedAt": "2026-05-30T00:00:00.000Z"
      },
      {
        "id": "joining-participant-id",
        "name": "Second pencil",
        "joinedAt": "2026-05-30T00:00:02.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Error Responses

- `400`: participant id is missing, room code is empty, or the room has fewer than two
  participants.
- `403`: participant id does not belong to the host.
- `404`: room code does not match an active room.
- `409`: room is no longer in lobby state.
