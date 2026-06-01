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
        "joinedAt": "2026-06-01T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": null,
    "canvasEvents": [],
    "guessHistory": [],
    "scores": {}
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

Starts the active round and assigns the drawer.

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
        "joinedAt": "2026-06-01T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": "uuid",
    "canvasEvents": [],
    "guessHistory": [],
    "scores": {
      "uuid": 0
    },
    "secretWord": "rocket"
  }
}
```

## `POST /rooms/:code/draw`

Adds a drawer drawing event to the active canvas.

### Request body

```json
{
  "participantId": "uuid",
  "stroke": {
    "points": [
      { "x": 12, "y": 24 },
      { "x": 18, "y": 30 }
    ],
    "color": "#111827",
    "lineWidth": 4
  }
}
```

### Response

```json
{
  "room": {
    "code": "ABCD",
    "status": "game",
    "participants": [],
    "availableWords": [],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": "uuid",
    "canvasEvents": [
      {
        "id": "event-1",
        "type": "stroke",
        "participantId": "uuid",
        "createdAt": "2026-06-01T00:00:00.000Z",
        "stroke": {
          "points": [
            { "x": 12, "y": 24 },
            { "x": 18, "y": 30 }
          ],
          "color": "#111827",
          "lineWidth": 4
        }
      }
    ],
    "guessHistory": [],
    "scores": {}
  }
}
```

## `POST /rooms/:code/clear`

Clears the active canvas for the room.

### Request body

```json
{
  "participantId": "uuid"
}
```

### Response

Same shape as `POST /rooms/:code/draw`, but `canvasEvents` is reset to an
empty list.

## `POST /rooms/:code/guess`

Submits a trimmed guess for evaluation.

### Request body

```json
{
  "participantId": "uuid",
  "guessText": "Rocket"
}
```

### Response

```json
{
  "room": {
    "code": "ABCD",
    "status": "game",
    "participants": [],
    "availableWords": [],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": "uuid",
    "canvasEvents": [],
    "guessHistory": [
      {
        "id": "guess-1",
        "participantId": "uuid-2",
        "rawText": "Rocket",
        "normalizedText": "rocket",
        "isCorrect": true,
        "pointsAwarded": 100,
        "createdAt": "2026-06-01T00:00:00.000Z"
      }
    ],
    "scores": {
      "uuid-2": 100
    }
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
    "participants": [],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": "uuid",
    "canvasEvents": [],
    "guessHistory": [],
    "scores": {},
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
    "participants": [],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerParticipantId": "uuid",
    "canvasEvents": [],
    "guessHistory": [],
    "scores": {}
  }
}
```

## Contract Notes

- Room state is in-memory only.
- Room access uses HTTP only.
- Polling is the synchronization mechanism for canvas, guesses, and scores.
- The drawer should not see the guess input in the UI, and guessers should not
  receive the secret word in their snapshots.
- Guess history and score state must remain consistent for all viewers of the
  same room.
