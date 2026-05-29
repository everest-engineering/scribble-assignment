# API Contract: Game Start and Drawer Flow

Base path: `/rooms`

This contract extends the Feature Group 1 room API with first-round playing state and viewer-specific secret word visibility.

## RoomSnapshot Additions

Public room snapshot fields:

```json
{
  "code": "ABCD",
  "status": "playing",
  "participants": [
    {
      "id": "host-id",
      "name": "Alice",
      "joinedAt": "2026-05-29T08:30:00.000Z"
    }
  ],
  "hostParticipantId": "host-id",
  "viewerParticipantId": "host-id",
  "isHost": true,
  "canStart": false,
  "currentRound": {
    "roundNumber": 1,
    "drawerParticipantId": "host-id",
    "drawerName": "Alice"
  },
  "viewerRole": "drawer",
  "isDrawer": true,
  "secretWord": "rocket"
}
```

Guesser snapshots must omit `secretWord` entirely:

```json
{
  "code": "ABCD",
  "status": "playing",
  "participants": [],
  "hostParticipantId": "host-id",
  "viewerParticipantId": "guesser-id",
  "isHost": false,
  "canStart": false,
  "currentRound": {
    "roundNumber": 1,
    "drawerParticipantId": "host-id",
    "drawerName": "Alice"
  },
  "viewerRole": "guesser",
  "isDrawer": false
}
```

## Start First Round

`POST /rooms/{code}/start`

Request:

```json
{
  "participantId": "host-id"
}
```

Validation:

- Room code is normalized and must identify an active room.
- Participant ID is required and must belong to the room.
- Start is allowed only from lobby state.
- Existing host-only and minimum 2-player rules remain enforced.
- Starter word list must contain at least one word.

Success `200`:

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "currentRound": {
      "roundNumber": 1,
      "drawerParticipantId": "host-id",
      "drawerName": "Alice"
    },
    "viewerRole": "drawer",
    "isDrawer": true,
    "secretWord": "rocket"
  }
}
```

Errors:

- `400`: Fewer than 2 players, room already playing, invalid room code, or no starter words available.
- `403`: Participant is not allowed to start the room.
- `404`: Room or participant does not exist.

## Fetch Viewer-Specific Room State

`GET /rooms/{code}?participantId={participantId}`

Validation:

- Room code is normalized and must identify an active room.
- Participant ID is optional for lobby reads but required to receive drawer-specific fields.
- Participant ID must belong to the room before `secretWord` can be included.

Success for drawer `200`:

```json
{
  "room": {
    "status": "playing",
    "viewerRole": "drawer",
    "isDrawer": true,
    "secretWord": "rocket"
  }
}
```

Success for guesser `200`:

```json
{
  "room": {
    "status": "playing",
    "viewerRole": "guesser",
    "isDrawer": false
  }
}
```

Privacy requirement:

- The `secretWord` property must not exist in guesser or unknown-viewer responses.

## Create and Join Name Validation

`POST /rooms` and `POST /rooms/{code}/join`

Validation:

- `playerName` is rejected when empty or whitespace-only.
- Accepted `playerName` values are trimmed before storage and display.
- Rejected requests do not mutate room state.
