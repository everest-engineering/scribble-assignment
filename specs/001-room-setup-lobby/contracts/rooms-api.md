# Contract: Rooms REST API (Scenario 1)

Base URL: `http://localhost:3001`. JSON over HTTP. No auth. Existing endpoints; **bold**
marks fields/behavior added by this feature.

## Shared shape: RoomSnapshot

```jsonc
{
  "code": "ABCD",
  "status": "lobby",
  "participants": [
    { "id": "uuid", "name": "Sketch captain", "joinedAt": "2026-06-05T10:00:00.000Z" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"],
  "hostId": "uuid",          // NEW
  "isHost": true,            // NEW — relative to the requesting viewer
  "canStart": false          // NEW — isHost && participants.length >= 2
}
```

## POST /rooms — create room

Request:
```json
{ "playerName": "Sketch captain" }
```
- `playerName` optional (name validation owned by Scenario 2).

Response `201`:
```json
{ "participantId": "uuid", "room": { /* RoomSnapshot, isHost: true, canStart: false */ } }
```
- Creator becomes host (`room.hostId === participantId`, `isHost: true`).
- A single participant means `canStart: false`.

## POST /rooms/:code/join — join room

Path param `code`: **trimmed, min length 1**, matched **case-insensitively** (upper-cased
server-side).

Request:
```json
{ "playerName": "Second pencil" }
```

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Code matches an active room | `{ "participantId": "uuid", "room": { /* snapshot, isHost: false */ } }` |
| **`400`** | **Empty / whitespace-only code** | `{ "message": "Invalid request payload" }` |
| **`404`** | **No active room for code** | `{ "message": "Room not found" }` |

- Joiner is appended; `hostId` unchanged; joiner's snapshot has `isHost: false`.
- With 2+ participants, the host's subsequent snapshots report `canStart: true`.

## GET /rooms/:code — fetch snapshot (polling)

Query: `participantId` (optional but expected during lobby polling so `isHost`/`canStart` are
viewer-correct).

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Room exists | `{ "room": { /* RoomSnapshot for this viewer */ } }` |
| `404` | No active room for code | `{ "message": "Room not found" }` |

- Called every ~2s by the lobby. `isHost`/`canStart` computed from `participantId`.
- If `participantId` is missing/unknown, `isHost` and `canStart` are `false`.

## Error contract

All errors flow through the centralized handler: `{ "message": string }`. Zod failures →
`400 "Invalid request payload"`. Not-found → `404 "Room not found"`. The frontend surfaces
`message` directly and never crashes the view on a non-2xx response.

## Isolation guarantee

Every response is built solely from the addressed room's `Map` entry. No field from one room
appears in another room's snapshot.
