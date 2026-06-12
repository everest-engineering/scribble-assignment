# Contract: Backend Room API

## Create Room

POST /rooms

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
      {
        "id": "string",
        "name": "string",
        "joinedAt": "string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

## Join Room

POST /rooms/:code/join

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
      {
        "id": "string",
        "name": "string",
        "joinedAt": "string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

## Fetch Room

GET /rooms/:code?participantId=string

Response:
```json
{
  "room": {
    "code": "string",
    "status": "lobby",
    "participants": [
      {
        "id": "string",
        "name": "string",
        "joinedAt": "string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

## Error Responses

- 404 with message `Unable to join room` for invalid room codes or failed join attempts.
- 404 with message `Unable to load room` for invalid room lookup.
- 400 for invalid payloads.
