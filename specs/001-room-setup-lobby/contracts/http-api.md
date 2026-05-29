# HTTP API Contracts: Room Setup & Lobby

## Overview

This document defines the HTTP request/response contracts for all endpoints required by Scenario 1.

---

## Base URL

```
http://localhost:3001
```

---

## Endpoints

### 1. POST /rooms

**Purpose**: Create a new room and add the creator as host.

**Request**:
```json
{
  "playerName": "Alice"
}
```

**Validation**:
- `playerName`: Required, string, non-empty after trim
- If validation fails, return 400

**Response (201 Created)**:
```json
{
  "code": "abc12",
  "hostId": "uuid-host-1",
  "participants": [
    {
      "id": "uuid-host-1",
      "name": "Alice",
      "isHost": true
    }
  ],
  "playerId": "uuid-host-1"
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Player name is required"
}
```

**Notes**:
- Code is generated as a unique 4-6 alphanumeric string (lowercase).
- Creator is automatically marked as host.
- Response includes the creator's player ID for frontend state initialization.

---

### 2. POST /rooms/:code/join

**Purpose**: Add a player to an existing room.

**Request**:
```json
{
  "playerName": "Bob"
}
```

**Path Parameter**:
- `code`: Room code (case-insensitive; normalized to lowercase)

**Validation**:
- `playerName`: Required, string, non-empty after trim
- `:code`: Must correspond to an existing room
- If player is already in the room (by some identifier), update their entry
- If validation fails, return 400 or 404

**Response (200 OK)**:
```json
{
  "code": "abc12",
  "participants": [
    {
      "id": "uuid-host-1",
      "name": "Alice",
      "isHost": true
    },
    {
      "id": "uuid-joiner-1",
      "name": "Bob",
      "isHost": false
    }
  ],
  "playerId": "uuid-joiner-1",
  "isHost": false
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Room not found"
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Player name is required"
}
```

**Notes**:
- `playerId` is generated server-side for the joiner.
- `isHost` in response is always `false` for joiners (for clarity on frontend).
- Participants are returned in insertion order.
- If the same player rejoins, their name is updated (idempotent).

---

### 3. GET /rooms/:code

**Purpose**: Fetch the current state of a room (used for polling).

**Path Parameter**:
- `code`: Room code (case-insensitive; normalized to lowercase)

**Query Parameters**: None

**Response (200 OK)**:
```json
{
  "code": "abc12",
  "hostId": "uuid-host-1",
  "participants": [
    {
      "id": "uuid-host-1",
      "name": "Alice",
      "isHost": true
    },
    {
      "id": "uuid-joiner-1",
      "name": "Bob",
      "isHost": false
    }
  ],
  "gameState": "lobby"
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Room not found"
}
```

**Notes**:
- Called every ~2 seconds by the frontend Lobby component (polling).
- Response includes all participants and the current `gameState`.
- `gameState` is "lobby" for Scenario 1; other states introduced in later scenarios.
- No authentication required; room is identified by code only.

---

## Type Definitions (for reference)

```typescript
interface Player {
  id: string;           // Unique within the room
  name: string;         // Player's chosen name (trimmed)
  isHost: boolean;      // True if room creator
}

interface Room {
  code: string;         // Room identifier (lowercase, 4-6 alphanumeric)
  hostId: string;       // ID of the host player
  participants: Player[];
  gameState: "lobby" | "inProgress" | "finished";
}

type GameState = "lobby" | "inProgress" | "finished";
```

---

## Error Handling

All errors return appropriate HTTP status codes and JSON error objects:

| Status | Error | Description |
|--------|-------|-------------|
| 400 | "Player name is required" | Empty or whitespace-only name |
| 404 | "Room not found" | Code does not correspond to an existing room |
| 500 | "Internal server error" | Unexpected server error (should not occur in normal operation) |

**Frontend Handling**:
- Display error message to user in UI
- Do not crash; remain on current screen or return to previous screen
- Retry is user's responsibility (e.g., re-enter code)

---

## Example Flow: Create Room → Join Room

### Step 1: Host Creates Room

```
POST /rooms
{
  "playerName": "Alice"
}

→ 201 Created
{
  "code": "abc12",
  "hostId": "uuid-1",
  "participants": [{ "id": "uuid-1", "name": "Alice", "isHost": true }],
  "playerId": "uuid-1"
}
```

### Step 2: Joiner Joins Room

```
POST /rooms/abc12/join
{
  "playerName": "Bob"
}

→ 200 OK
{
  "code": "abc12",
  "participants": [
    { "id": "uuid-1", "name": "Alice", "isHost": true },
    { "id": "uuid-2", "name": "Bob", "isHost": false }
  ],
  "playerId": "uuid-2",
  "isHost": false
}
```

### Step 3: Polling (both players fetch room state every ~2s)

```
GET /rooms/abc12

→ 200 OK
{
  "code": "abc12",
  "hostId": "uuid-1",
  "participants": [
    { "id": "uuid-1", "name": "Alice", "isHost": true },
    { "id": "uuid-2", "name": "Bob", "isHost": false }
  ],
  "gameState": "lobby"
}
```

---

## Notes for Implementation

1. **Case Insensitivity**: Codes are case-insensitive but stored and returned as lowercase.
2. **Polling Cadence**: Frontend polls every ~2 seconds; expect many GET requests per minute per room.
3. **Idempotency**: Joining with the same code and name multiple times should be safe (update vs. add).
4. **Player ID Format**: Use a reliable format (UUID v4, nanoid, or similar); must be unique per room.

