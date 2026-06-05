# Contract: Rooms REST API (Scenario 2)

Base URL: `http://localhost:3001`. JSON over HTTP. No auth. **Bold** marks additions for this
feature. Builds on the Scenario 1 contract.

## Shared shape: RoomSnapshot (extended)

```jsonc
{
  "code": "ABCD",
  "status": "playing",            // NEW value: "lobby" | "playing"
  "participants": [
    { "id": "uuid-host", "name": "Alice", "joinedAt": "..." },
    { "id": "uuid-2", "name": "Bob", "joinedAt": "..." }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"],
  "hostId": "uuid-host",
  "isHost": true,
  "canStart": true,
  "drawerId": "uuid-host",        // NEW — null while in lobby
  "isDrawer": true,               // NEW — viewer === drawerId
  "secretWord": "castle"          // NEW — present ONLY when isDrawer; null otherwise
}
```

A **guesser** receives the same object with `isDrawer: false` and **`secretWord: null`** (the
word is never sent to non-drawers).

## POST /rooms — create room (name validation tightened)

Request: `{ "playerName": "Alice" }`
- **`playerName` is now required, trimmed, min length 1.**

Responses:
| Status | When | Body |
|--------|------|------|
| `201` | Valid name | `{ "participantId", "room": { /* lobby snapshot */ } }` |
| **`400`** | **Empty / whitespace-only name** | `{ "message": "Invalid request payload" }` |

## POST /rooms/:code/join — join room (name validation tightened)

Request: `{ "playerName": "Bob" }` — **required, trimmed, min length 1.**

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Valid name + existing room | `{ "participantId", "room": { /* lobby snapshot */ } }` |
| **`400`** | **Empty / whitespace-only name** | `{ "message": "Invalid request payload" }` |
| `404` | Unknown code | `{ "message": "Room not found" }` |

## POST /rooms/:code/start — start the round (NEW)

Starts the round for a room. Host-only, requires ≥2 participants.

Request:
```json
{ "participantId": "uuid-host" }
```
- `participantId` required — the requester, used to verify host identity.

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Host starts a room with ≥2 players | `{ "room": { /* playing snapshot, drawer's view */ } }` |
| `400` | Missing `participantId` | `{ "message": "Invalid request payload" }` |
| `403` | Requester is not the host | `{ "message": "Only the host can start the game" }` |
| `404` | No active room for code | `{ "message": "Room not found" }` |
| `409` | Fewer than 2 participants | `{ "message": "At least 2 players are required to start" }` |

On success the room is mutated: `status = "playing"`, `drawerId = hostId`, `secretWord =
deterministic pick`. The response snapshot is rendered for the host (the drawer), so it includes
`secretWord`.

## GET /rooms/:code — fetch snapshot (now carries round state)

Query: `participantId` (expected, so `isDrawer`/`secretWord` are viewer-correct).

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Room exists | `{ "room": { /* snapshot for this viewer */ } }` |
| `404` | Unknown code | `{ "message": "Room not found" }` |

- Polled every ~2s by lobby and game views.
- While `status === "playing"`: the drawer's snapshot has `secretWord` set; every guesser's
  snapshot has `secretWord: null`. `status` is how clients detect the round has started.

## Determinism & isolation guarantees

- For a given room, the secret word is fixed once the round starts and is identical across all
  subsequent `GET`s (no re-selection per request).
- The secret word never appears in any non-drawer response.
- Round state is built solely from the addressed room's `Map` entry; no cross-room leakage.
