# API Contracts: Game Start and Drawer Flow

## POST /:code/start

Start the game — transitions room from lobby to drawing, assigns round-1 drawer (host), selects secret word.

**Request**: `POST /rooms/:code/start`

No request body required.

**Success Response** (200):

```json
{
  "room": {
    "code": "A3X9",
    "status": "drawing",
    "hostId": "uuid-of-host",
    "currentRound": 1,
    "currentDrawerId": "uuid-of-host",
    "secretWord": "rocket",
    "participants": [
      { "id": "uuid-of-host", "name": "Alice", "joinedAt": "...", "isHost": true },
      { "id": "uuid-of-joiner", "name": "Bob", "joinedAt": "...", "isHost": false }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `secretWord` is the current round's word. It is returned only to the drawer participant. For non-drawer callers, it is `null`.

**Error Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{"message": "Game already started"}` | Room status is not "lobby" |
| 400 | `{"message": "At least 2 players required to start"}` | Fewer than 2 participants |
| 400 | `{"message": "Only the host can start the game"}` | Requester is not the host |
| 404 | `{"message": "Unable to load room"}` | Room code not found |

## Updated GET /:code (poll)

Existing poll endpoint returns the updated `RoomSnapshot` with new fields.

**Viewer-dependent `secretWord`**:

- When `viewerParticipantId === room.currentDrawerId` → `secretWord` is the word string
- Otherwise → `secretWord` is `null`

**Example response for drawer**:

```json
{
  "room": {
    "code": "A3X9",
    "status": "drawing",
    "currentRound": 1,
    "currentDrawerId": "uuid-of-host",
    "secretWord": "rocket",
    ...
  }
}
```

**Example response for guesser**:

```json
{
  "room": {
    "code": "A3X9",
    "status": "drawing",
    "currentRound": 1,
    "currentDrawerId": "uuid-of-host",
    "secretWord": null,
    ...
  }
}
```

## Updated POST /rooms (create room)

`playerName` is now required and must be non-empty after trimming.

**Request body**:

```json
{
  "playerName": "Alice"
}
```

**Error Response** (400):

```json
{
  "message": "Player name is required"
}
```

## Updated POST /rooms/:code/join

`playerName` is now required and must be non-empty after trimming.

**Request body**:

```json
{
  "playerName": "Bob"
}
```

**Error Response** (400):

```json
{
  "message": "Player name is required"
}
```
