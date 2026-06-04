# Room API Contract

## Overview

The feature uses the existing HTTP room API and adds a host-only start action.
All responses are JSON.

## `POST /rooms`

Create a room and the first participant.

### Request

```json
{
  "playerName": "Sketch captain"
}
```

### Response `201`

```json
{
  "participantId": "participant-id",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "participant-id",
    "participants": [
      {
        "id": "participant-id",
        "name": "Sketch captain",
        "joinedAt": "2026-06-04T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

## `POST /rooms/:code/join`

Join an existing room.

### Request

```json
{
  "playerName": "Round one"
}
```

### Response `200`

Same shape as `POST /rooms`.

### Response `404`

```json
{
  "message": "Unable to join room"
}
```

## `GET /rooms/:code?participantId=...`

Fetch the latest room snapshot for lobby polling.

### Response `200`

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "participant-id",
    "participants": []
  }
}
```

### Response `404`

```json
{
  "message": "Unable to load room"
}
```

## `POST /rooms/:code/start`

Start the room as the host.

### Request

```json
{
  "participantId": "participant-id"
}
```

### Response `200`

Returns the updated room snapshot after the room leaves the lobby.

### Response `403`

Returned when the caller is not the host.

### Response `409`

Returned when the room has fewer than two participants.

### Response `404`

Returned when the room code does not exist.

## Notes

- The polling flow should continue to use the same `participantId` returned at
  room creation or join time.
- The room snapshot must stay room-scoped so one room's state never appears in
  another room's response.
