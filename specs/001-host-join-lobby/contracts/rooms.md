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
    "roles": ["drawer", "guesser"]
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

## `GET /rooms/:code`

Returns the current room snapshot for the requested viewer.

### Query parameters

- `participantId`: Optional viewer identifier

### Response

```json
{
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
    "roles": ["drawer", "guesser"]
  }
}
```

## Contract notes

- Room state is in-memory only.
- Room access uses HTTP only.
- The host is the first participant in the room's participant list.
- Future game-state endpoints should preserve this same snapshot-oriented style.
