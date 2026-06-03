# API Contract: Rooms (Scenario 2 additions)

Base URL: `http://localhost:3001`  
Content-Type: `application/json`

Builds on Scenario 1 endpoints (`POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`).

## POST /rooms/:code/start

Start the game; host-only; lobby only.

**Params**: `code` — uppercased server-side

**Request body**

```json
{
  "participantId": "<host-uuid>"
}
```

**Validation**

- `participantId`: required non-empty string
- Caller must be `room.hostParticipantId`
- `room.status` must be `"lobby"`
- `room.participants.length` must be `>= 2`

**Response 200**

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostParticipantId": "<uuid>",
    "participants": [...],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentRound": {
      "roundIndex": 0,
      "drawerParticipantId": "<first-participant-uuid>",
      "secretWord": "rocket"
    },
    "viewer": {
      "participantId": "<host-uuid>",
      "isDrawer": true
    }
  }
}
```

Note: `secretWord` in `currentRound` is the actual word only when `viewer.isDrawer` is true; otherwise `secretWord` is `null`.

**Responses**

| Status | Condition | Message |
|--------|-----------|---------|
| 200 | Success | `{ room }` snapshot for caller |
| 400 | Invalid body | Zod validation message |
| 403 | Not host | `"Only the host can start the game"` |
| 404 | Unknown code | `"Unable to start game"` |
| 409 | Not lobby or < 2 players | `"Game has already started"` or `"Need at least 2 players to start"` |

## GET /rooms/:code (updated behavior)

When `status` is `"playing"` and `participantId` query is set:

- Include `currentRound` with `drawerParticipantId` always
- `secretWord`: word string if viewer is drawer; `null` otherwise
- Include `viewer: { participantId, isDrawer }`

When `status` is `"lobby"`:

- `currentRound` omitted
- `viewer` optional (may still report `isDrawer: false`)

## Error shape

Unchanged from Scenario 1: `{ "message": "..." }`.

## Out of scope

- `POST /rooms/:code/guess`
- `POST /rooms/:code/strokes`
- `POST /rooms/:code/restart`
