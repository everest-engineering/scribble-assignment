# API Contracts: Room Setup & Lobby

**Date**: 2026-06-11
**Base URL**: `http://localhost:3001`

## Existing Endpoints (unchanged)

### `POST /rooms` — Create Room

Request:
```json
{ "playerName": "Alice" }
```

Response `201`:
```json
{
  "participantId": "uuid-string",
  "room": { "code": "ABCD", "status": "lobby", "participants": [...], "hostId": "uuid-string", "availableWords": [...], "roles": [...] }
}
```

### `POST /rooms/:code/join` — Join Room

Request:
```json
{ "playerName": "Bob" }
```

Response `200`:
```json
{
  "participantId": "uuid-string",
  "room": { <RoomSnapshot> }
}
```

Error `404`:
```json
{ "message": "Unable to join room" }
```

### `GET /rooms/:code` — Get Room Snapshot (polling)

Query: `?participantId=<uuid>`

Response `200`:
```json
{ "room": { <RoomSnapshot> } }
```

Error `404`:
```json
{ "message": "Unable to load room" }
```

## New Endpoints

### `POST /rooms/:code/start` — Start Game

**Purpose**: Host-only action to transition room from lobby to playing status.
Requires ≥2 participants.

**Request**: (empty body — host identity sent as query or header)

```json
{}
```

Query: `?participantId=<host-uuid>`

**Response `200`**:
```json
{
  "room": { <RoomSnapshot with status: "playing"> }
}
```

**Error `403`** — Not the host:
```json
{ "message": "Only the host can start the game" }
```

**Error `400`** — Fewer than 2 players:
```json
{ "message": "At least 2 players are required to start" }
```

**Error `400`** — Already playing:
```json
{ "message": "Game has already started" }
```

## RoomSnapshot Shape (updated)

```typescript
interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  participants: Participant[];
  hostId: string;
  availableWords: string[];
  roles: ParticipantRole[];
}
```

## Polling Protocol

- Frequency: ~2000ms interval via `setInterval`
- Endpoint: `GET /rooms/:code?participantId=<uuid>`
- On success: merge returned snapshot into frontend state
- On failure: silent retry — keep current state, retry next interval
- Polling starts when LobbyPage mounts, stops when component unmounts
