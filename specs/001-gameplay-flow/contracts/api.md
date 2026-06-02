# API Contract: Gameplay Flow Build-Out

## Base URL

`http://localhost:3001`

## Endpoints

### POST /rooms

Create a new room.

Request body:

```json
{
  "playerName": "string"
}
```

Response:

```json
{
  "participantId": "string",
  "room": {
    "code": "string",
    "status": "lobby",
    "participants": [
      { "id": "string", "name": "string", "joinedAt": "string" }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

Errors:
- `400` when validation fails
- `500` for unexpected server errors

### POST /rooms/:code/join

Join an existing room.

Request body:

```json
{
  "playerName": "string"
}
```

Response:

```json
{
  "participantId": "string",
  "room": {
    "code": "string",
    "status": "lobby",
    "participants": [
      { "id": "string", "name": "string", "joinedAt": "string" }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

Errors:
- `400` when validation fails
- `404` when the room code does not exist
- `500` for unexpected server errors

### GET /rooms/:code

Fetch the latest room snapshot.

Query parameters:
- `participantId` (optional): the requesting participant’s ID

Response:

```json
{
  "room": {
    "code": "string",
    "status": "lobby" | "active" | "results",
    "participants": [
      { "id": "string", "name": "string", "joinedAt": "string", "score": number, "role": "drawer" | "guesser" }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"],
    "round": {
      "drawerId": "string",
      "secretWord": "string?",
      "startedAt": "string",
      "endedAt": "string?",
      "status": "active" | "finished"
    },
    "guesses": [
      {
        "id": "string",
        "participantId": "string",
        "text": "string",
        "normalizedText": "string",
        "correct": boolean,
        "createdAt": "string"
      }
    ]
  }
}
```

Note: `secretWord` is only included for the drawer; other participants must not receive the secret word in their snapshot.

Errors:
- `404` when the room code does not exist
- `500` for unexpected server errors

### POST /rooms/:code/start

Start the game round. Only the host can invoke this.

Request body:

```json
{
  "participantId": "string"
}
```

Response:

```json
{
  "room": { ...updated room snapshot... }
}
```

Errors:
- `400` when the room is not in `lobby` or when participantId is missing
- `403` when the requester is not the host
- `404` when the room code does not exist

### POST /rooms/:code/guess

Submit a guess during an active round.

Request body:

```json
{
  "participantId": "string",
  "guess": "string"
}
```

Response:

```json
{
  "room": { ...updated room snapshot... }
}
```

Errors:
- `400` when the room is not active, the guess is empty, or validation fails
- `403` when the participant is the drawer
- `404` when the room code does not exist

### POST /rooms/:code/restart

Restart the room after a round completes. Only the host can invoke this.

Request body:

```json
{
  "participantId": "string"
}
```

Response:

```json
{
  "room": { ...room snapshot reset to lobby state... }
}
```

Errors:
- `400` when the room is not in `results`
- `403` when the requester is not the host
- `404` when the room code does not exist
