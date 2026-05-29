# Rooms API Contract: Gameplay Interaction

All gameplay endpoints are scoped to an existing room and use JSON request and response bodies. Existing centralized error handling returns a predictable error message for rejected requests.

## Shared Snapshot Shape

Gameplay responses that return a room use the existing `room` wrapper and extend `RoomSnapshot`:

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [],
    "hostParticipantId": "participant-host",
    "viewerParticipantId": "participant-viewer",
    "isHost": true,
    "canStart": false,
    "currentRound": {
      "roundNumber": 1,
      "drawerParticipantId": "participant-host",
      "drawerName": "Alice",
      "canvas": {
        "strokes": [],
        "updatedAt": "2026-05-29T09:30:00.000Z"
      },
      "guesses": []
    },
    "viewerRole": "drawer",
    "isDrawer": true,
    "secretWord": "rocket",
    "scores": [
      {
        "participantId": "participant-host",
        "participantName": "Alice",
        "score": 0
      }
    ],
    "availableWords": [],
    "roles": ["drawer", "guesser"]
  }
}
```

For guesser viewers, `secretWord` must be omitted entirely.

## GET /rooms/:code

Fetches the current room snapshot for polling.

### Query

- `participantId` optional string, used to derive viewer role and secret-word visibility.

### Success

- `200 OK`
- Returns the shared snapshot shape.
- Includes active round canvas, guess history, and scores when the room is playing.

### Errors

- `400 Bad Request`: Invalid room code or malformed participant query.
- `404 Not Found`: Room cannot be loaded.

## POST /rooms/:code/drawing

Appends one completed drawer stroke to the active round canvas.

### Body

```json
{
  "participantId": "participant-host",
  "stroke": {
    "color": "#111827",
    "size": 4,
    "points": [
      { "x": 0.1, "y": 0.2 },
      { "x": 0.2, "y": 0.25 }
    ]
  }
}
```

### Success

- `200 OK`
- Returns the shared snapshot shape for the drawer.

### Validation and Errors

- `400 Bad Request`: Invalid room code, inactive round, missing participant ID, malformed stroke, too few points, out-of-bounds coordinates, unsupported brush size, or invalid color.
- `403 Forbidden`: Participant is not the active drawer.
- `404 Not Found`: Room or participant cannot be found.

## POST /rooms/:code/drawing/clear

Clears the active round canvas.

### Body

```json
{
  "participantId": "participant-host"
}
```

### Success

- `200 OK`
- Returns the shared snapshot shape for the drawer with `currentRound.canvas.strokes` empty.

### Validation and Errors

- `400 Bad Request`: Invalid room code, inactive round, or missing participant ID.
- `403 Forbidden`: Participant is not the active drawer.
- `404 Not Found`: Room or participant cannot be found.

## POST /rooms/:code/guesses

Submits a guess for the active round.

### Body

```json
{
  "participantId": "participant-guesser",
  "guess": " Rocket "
}
```

### Success

- `200 OK`
- Returns the shared snapshot shape for the guesser.
- The stored guess text is trimmed.
- `pointsAwarded` is `100` only for the guesser's first correct guess in the active round; otherwise `0`.

### Validation and Errors

- `400 Bad Request`: Invalid room code, inactive round, missing participant ID, or guess empty after trimming.
- `403 Forbidden`: Participant is the drawer or otherwise not allowed to guess.
- `404 Not Found`: Room or participant cannot be found.

## Polling Data Flow

1. Drawer or guesser submits a gameplay mutation.
2. Backend validates room, participant, role, payload, and active round.
3. Backend mutates only the addressed room in memory and returns the caller's updated snapshot.
4. Other clients continue polling `GET /rooms/:code?participantId=...`.
5. Next successful poll returns updated canvas, guesses, and scores without requiring page refresh.
