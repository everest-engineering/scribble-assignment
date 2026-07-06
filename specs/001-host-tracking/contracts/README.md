# API Contracts: Host Tracking on Room Creation

**Phase**: 1 | **Date**: 2026-07-05

## Overview

No new endpoints are added. All three existing room endpoints now include the
`isHost` boolean on each participant in their responses. The `POST /rooms`
response also includes `hostId` in the room object (returned as part of
`RoomSnapshot` projection).

## Endpoints

### POST /rooms — Create Room

**Request**: `POST /api/rooms`

```json
{
  "playerName": "Alice"
}
```

**Response** (201):

```json
{
  "participantId": "uuid-alice",
  "room": {
    "code": "X7K9",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid-alice",
        "name": "Alice",
        "joinedAt": "2026-07-05T12:00:00.000Z",
        "isHost": true
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Changes**: `participants[0].isHost` now present and set to `true`.

---

### POST /rooms/:code/join — Join Room

**Request**: `POST /api/rooms/X7K9/join`

```json
{
  "playerName": "Bob"
}
```

**Response** (200):

```json
{
  "participantId": "uuid-bob",
  "room": {
    "code": "X7K9",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid-alice",
        "name": "Alice",
        "joinedAt": "2026-07-05T12:00:00.000Z",
        "isHost": true
      },
      {
        "id": "uuid-bob",
        "name": "Bob",
        "joinedAt": "2026-07-05T12:01:00.000Z",
        "isHost": false
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Changes**: All participants now include `isHost`. Creator has `isHost: true`,
joiner has `isHost: false`.

---

### GET /rooms/:code — Fetch Room

**Request**: `GET /api/rooms/X7K9?participantId=uuid-alice`

**Response** (200):

```json
{
  "room": {
    "code": "X7K9",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid-alice",
        "name": "Alice",
        "joinedAt": "2026-07-05T12:00:00.000Z",
        "isHost": true
      },
      {
        "id": "uuid-bob",
        "name": "Bob",
        "joinedAt": "2026-07-05T12:01:00.000Z",
        "isHost": false
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Changes**: Same participant projection as join — `isHost` included on all
participants.
