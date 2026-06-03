# API Contract: Rooms (Scenario 1 subset)

Base URL: `http://localhost:3001`  
Content-Type: `application/json`

## POST /rooms

Create a room; creator becomes host.

**Request body**

```json
{
  "playerName": "Alice"
}
```

**Validation**

- `playerName`: optional in body, but after trim must be 1–24 chars; empty → 400 `"Player name is required"`

**Response 201**

```json
{
  "participantId": "<uuid>",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "<uuid>",
    "participants": [{ "id": "<uuid>", "name": "Alice", "joinedAt": "<iso>" }],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

## POST /rooms/:code/join

Join existing lobby.

**Params**: `code` — uppercased server-side

**Request body**

```json
{
  "playerName": "Bob"
}
```

**Responses**

| Status | Condition | Message |
|--------|-----------|---------|
| 200 | Success | `{ participantId, room }` |
| 400 | Invalid name | Field validation message |
| 404 | Unknown code | `"Unable to join room"` |
| 409 | 8 participants already | `"Room is full"` |

## GET /rooms/:code

Poll room snapshot.

**Query**: `participantId` optional (viewer id for future masking)

**Response 200**

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "<uuid>",
    "participants": [...],
    "availableWords": [...],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response 404**: `"Unable to load room"`

## Error shape

```json
{
  "message": "Human-readable error"
}
```

HTTP status matches constitution: 400 validation, 404 not found, 409 conflict.

## Out of scope (Scenario 2+)

- `POST /rooms/:code/start`
- `POST /rooms/:code/guess`
- `POST /rooms/:code/strokes`
- `POST /rooms/:code/restart`
