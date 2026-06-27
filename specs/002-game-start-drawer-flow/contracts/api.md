# API Contracts: Game Start & Drawer Flow

**Extends**: contracts/api.md from Scenario 1 (Room Setup & Lobby)

## Modified Endpoints

### Get Room (updated response for "playing" status)

```
GET /rooms/:code?participantId=p1
```

**Response** `200` (when status is "playing"):
```json
{
  "room": {
    "code": "ABCD",
    "participants": [
      { "id": "p1", "name": "Alice", "joinedAt": "2026-06-26T00:00:00.000Z" },
      { "id": "p2", "name": "Bob", "joinedAt": "2026-06-26T00:00:01.000Z" }
    ],
    "status": "playing",
    "hostId": "p1",
    "currentRound": 1,
    "drawerId": "p1",
    "secretWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Note**: `secretWord` is present only when `participantId` matches `drawerId`.
For a guesser requesting with `?participantId=p2`:

```json
{
  "room": {
    "code": "ABCD",
    "participants": [
      { "id": "p1", "name": "Alice", "joinedAt": "..." },
      { "id": "p2", "name": "Bob", "joinedAt": "..." }
    ],
    "status": "playing",
    "hostId": "p1",
    "currentRound": 1,
    "drawerId": "p1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `secretWord` is absent (not `null`, not empty string — truly absent).

### Start Game (updated response)

```
POST /rooms/:code/start
Content-Type: application/json

{
  "playerId": "p1"
}
```

**Response** `200`:
```json
{
  "room": {
    "code": "ABCD",
    "participants": [
      { "id": "p1", "name": "Alice", "joinedAt": "..." },
      { "id": "p2", "name": "Bob", "joinedAt": "..." }
    ],
    "status": "playing",
    "hostId": "p1",
    "currentRound": 1,
    "drawerId": "p1",
    "secretWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Note**: `secretWord` is present because `playerId` (= drawer) is used as
`viewerParticipantId` when building the snapshot response.

## New Frontend-Only Contract: sessionStorage

| Key | Value | When Written | When Read | When Cleared |
|-----|-------|-------------|-----------|-------------|
| `scribble_roomCode` | Room code string (e.g. `"ABCD"`) | On successful `createRoom` or `joinRoom` | On GamePage mount | When user navigates to "/" or "/lobby" |
| `scribble_participantId` | Participant ID string (e.g. `"p1"`) | On successful `createRoom` or `joinRoom` | On GamePage mount | When user navigates to "/" or "/lobby" |

## Polling Contract (no change from Scenario 1)

- Frontend polls `GET /rooms/:code` at ~2s intervals while on the lobby page.
- GamePage does NOT poll — single fetch on mount only.
