# API Contracts v1: Room Setup and Lobby

**Phase**: 1 | **Feature**: Room Setup and Lobby | **Date**: 2026-06-11

## Base URL

All endpoints are mounted under the `/rooms` path on the Express server.

## Endpoints

### POST /rooms

Create a new room. First participant is designated as host.

**Request**:
```json
{
  "playerName": "Alice"
}
```

**Success Response** (201):
```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "2026-06-11T00:00:00.000Z" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 400 | Empty/whitespace-only `playerName` |

### POST /rooms/:code/join

Join an existing room in lobby status.

**Request**:
```json
{
  "playerName": "Bob"
}
```

**Success Response** (200):
```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 400 | Empty/whitespace-only `playerName` |
| 404 | Room code not found |
| 409 | Room status is not "lobby" (game already started) |
| 409 | Room is full (8 participants max) |

### GET /rooms/:code

Fetch current room snapshot. Used for lobby polling.

**Query Parameters**:
- `participantId` (optional): Viewer's participant ID — used to filter secret word visibility.

**Success Response** (200):
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 404 | Room code not found |

### POST /rooms/:code/start

Start the game. Host-only, requires ≥2 participants. Transitions status to "playing", assigns drawer and secret word.

**Request**: (empty body — no payload required)

**Success Response** (200):
```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "...", "role": "drawer" },
      { "id": "uuid", "name": "Bob", "joinedAt": "...", "role": "guesser" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Note**: The `secretWord` is only included in the response for the drawer participant when `participantId` matches the drawer. Room fetch (`GET /rooms/:code`) with a drawer's `participantId` will include it after game start.

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 403 | Requesting participant is not the host |
| 400 | Room has fewer than 2 participants |
| 409 | Room status is not "lobby" |
| 404 | Room code not found |

### DELETE /rooms/:code/leave

Leave a room. Removes participant from the room. If host leaves, host status transfers. If last participant leaves, room is cleaned up.

**Request**: (empty body)

**Success Response** (200):
```json
{
  "success": true
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 404 | Room code not found |
| 404 | Participant not found in room |

## Common Types

```typescript
type RoomStatus = "lobby" | "playing" | "finished";
type ParticipantRole = "drawer" | "guesser";

interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
}

interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
```
