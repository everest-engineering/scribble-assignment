# Room Contracts

## `POST /rooms`

Creates a new room and the first participant.

### Request body

```json
{
  "playerName": "Alice"
}
```

### Response

```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid",
        "name": "Alice",
        "joinedAt": "2026-05-31T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": "uuid"
  }
}
```

## `POST /rooms/:code/join`

Joins an existing room.

### Request body

```json
{
  "playerName": "Bob"
}
```

### Response

Same shape as `POST /rooms`.

## `POST /rooms/:code/start`

Starts the first round for the host/drawer.

### Request body

```json
{
  "participantId": "uuid",
  "secretWord": "rocket"
}
```

### Response

```json
{
  "room": {
    "code": "ABCD",
    "status": "game",
    "participants": [
      {
        "id": "uuid",
        "name": "Alice",
        "joinedAt": "2026-05-31T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": "uuid",
    "secretWord": "rocket"
  }
}
```

## `GET /rooms/:code`

Returns the current room snapshot for the requested viewer.

### Query parameters

- `participantId`: Optional viewer identifier

### Response for the drawer

```json
{
  "room": {
    "code": "ABCD",
    "status": "game",
    "participants": [
      {
        "id": "uuid",
        "name": "Alice",
        "joinedAt": "2026-05-31T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": "uuid",
    "secretWord": "rocket"
  }
}
```

### Response for guessers

```json
{
  "room": {
    "code": "ABCD",
    "status": "game",
    "participants": [
      {
        "id": "uuid",
        "name": "Alice",
        "joinedAt": "2026-05-31T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": "uuid"
  }
}
```

## Contract notes

- Room state is in-memory only.
- Room access uses HTTP only.
- The drawer is the first participant in the room's participant list.
- The host chooses the secret word from the starter list and it must only be
  present in snapshots returned to the drawer.
- Player names are trimmed at the API boundary and rejected when empty.
