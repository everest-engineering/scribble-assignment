# API Contract: Room Setup and Lobby

Base path: `/rooms`

All error responses return:

```json
{
  "message": "Clear user-facing error"
}
```

## RoomSnapshot

```json
{
  "code": "ABCD",
  "status": "lobby",
  "participants": [
    {
      "id": "participant-id",
      "name": "Alice",
      "joinedAt": "2026-05-29T07:30:00.000Z"
    }
  ],
  "hostParticipantId": "participant-id",
  "viewerParticipantId": "participant-id",
  "isHost": true,
  "canStart": false,
  "availableWords": ["cat"],
  "roles": ["drawer", "guesser"]
}
```

## Create Room

`POST /rooms`

Request:

```json
{
  "playerName": "Alice"
}
```

Validation:

- `playerName` is required after trimming.

Success `201`:

```json
{
  "participantId": "participant-id",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [],
    "hostParticipantId": "participant-id",
    "viewerParticipantId": "participant-id",
    "isHost": true,
    "canStart": false,
    "availableWords": [],
    "roles": []
  }
}
```

## Join Room

`POST /rooms/{code}/join`

Request:

```json
{
  "playerName": "Bob"
}
```

Validation:

- `code` is trimmed, uppercased, and must match the room code format.
- `playerName` is required after trimming.
- Target room must exist and still be in lobby state.

Success `200`:

```json
{
  "participantId": "participant-id",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [],
    "hostParticipantId": "host-id",
    "viewerParticipantId": "participant-id",
    "isHost": false,
    "canStart": false,
    "availableWords": [],
    "roles": []
  }
}
```

Errors:

- `400`: Empty or malformed room code or player name.
- `404`: Room does not exist or is no longer joinable.

## Fetch Room for Polling

`GET /rooms/{code}?participantId={participantId}`

Validation:

- `code` is trimmed, uppercased, and must match the room code format.
- `participantId` is optional for lookup but required to derive `isHost` and `canStart`.

Success `200`:

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [],
    "hostParticipantId": "host-id",
    "viewerParticipantId": "participant-id",
    "isHost": true,
    "canStart": true,
    "availableWords": [],
    "roles": []
  }
}
```

Errors:

- `400`: Malformed room code.
- `404`: Room does not exist.

## Start Game

`POST /rooms/{code}/start`

Request:

```json
{
  "participantId": "host-participant-id"
}
```

Validation:

- `code` is trimmed, uppercased, and must match the room code format.
- `participantId` is required.
- Participant must belong to the target room.
- Participant must be the room host.
- Room must contain at least 2 participants.

Success `200`:

```json
{
  "room": {
    "code": "ABCD",
    "status": "inGame",
    "participants": [],
    "hostParticipantId": "host-participant-id",
    "viewerParticipantId": "host-participant-id",
    "isHost": true,
    "canStart": false,
    "availableWords": [],
    "roles": []
  }
}
```

Errors:

- `400`: Missing participant ID, malformed room code, or fewer than 2 participants.
- `403`: Participant is not the room host.
- `404`: Room or participant does not exist.
