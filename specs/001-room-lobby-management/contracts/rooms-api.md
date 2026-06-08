# REST API Contract: Rooms

**Base URL**: `http://localhost:3001` (frontend default; overridable via `VITE_API_URL`)

**Conventions**

- All bodies are JSON; requests send `Content-Type: application/json`.
- Room codes are matched case-insensitively; the server upper-cases `:code`.
- Errors use the existing shape: `{ "message": string }`. Zod validation failures return `400 { "message": "Invalid request payload" }` via the existing `errorHandler`.
- `RoomSnapshot` = `{ code, status, hostId, participants[], availableWords[], roles[] }` where `status ∈ { "lobby", "playing" }`.
- A `GET` poll is the heartbeat: it refreshes the caller's `lastSeenAt` and lazily prunes members idle > 10s.

Legend: ✳️ = new/changed by this feature.

---

## POST /rooms

Create a room; creator becomes host. (FR-001, FR-002)

**Request body**

```json
{ "playerName": "Alice" }
```

`playerName` optional; trimmed; empty → `"Player"`.

**Response `201`**

```json
{
  "participantId": "uuid-host",
  "room": {
    "code": "K7P2",
    "status": "lobby",
    "hostId": "uuid-host",        // ✳️ equals participantId
    "participants": [
      { "id": "uuid-host", "name": "Alice", "joinedAt": "...", "lastSeenAt": "..." }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

**Behavior**: Generates a unique 4-char uppercase alphanumeric code (regenerates on collision). `hostId` = creator. ✳️ `lastSeenAt` set.

---

## POST /rooms/:code/join

Join an existing lobby. (FR-004, FR-007, FR-014, FR-016, FR-017)

**Request body**

```json
{ "playerName": "Bob" }
```

**Response `200`** — same shape as create (`participantId` is the joiner's; `room.hostId` stays the creator's).

**Pre-checks (in order) & errors** ✳️

| Condition | Status | Body `message` | FR |
|-----------|--------|----------------|----|
| Unknown `:code` | `404` | `Room not found` | FR-006 |
| Room `status === "playing"` | `409` | `This game has already started` | FR-014 |
| Participants (after prune) ≥ 8 | `409` | `This room is full` | FR-016 |

**Behavior**: Prune stale members first (so departed players free slots). Name trimmed, defaulted, and disambiguated against current members (`"Bob (2)"`). New participant gets `lastSeenAt = now`. (FR-017)

> Empty/whitespace code is rejected **client-side** before this call (FR-005); it never reaches the server as a clean route.

---

## GET /rooms/:code?participantId=:id

Poll room state (the lobby's ~2s refresh) and register the caller's heartbeat. (FR-008, FR-009, FR-010, FR-010a)

**Query**: `participantId` optional but expected during polling so the caller's `lastSeenAt` is refreshed.

**Response `200`**

```json
{ "room": { "code": "K7P2", "status": "lobby", "hostId": "uuid-host", "participants": [ ... ], "availableWords": ["..."], "roles": ["..."] } }
```

**Behavior** ✳️

- Refresh `lastSeenAt` for the caller (`participantId`), if present and still a member.
- Prune participants idle > `PRESENCE_TIMEOUT_MS` (10s).
- If the pruned set removes the host → **delete the room**; if it empties the room → delete it. (FR-015, FR-015a)
- Returns only this room's participants (isolation — FR-008).

**Errors**

| Condition | Status | Body `message` | Meaning to client |
|-----------|--------|----------------|-------------------|
| Unknown / deleted `:code` | `404` | `Room not found` | During active lobby polling, treated as **room closed (host left)** → eject to start. (FR-015) |

---

## POST /rooms/:code/start ✳️ NEW

Host starts the game once enough players are present. (FR-011, FR-012, FR-013)

**Request body**

```json
{ "participantId": "uuid-host" }
```

**Response `200`**

```json
{ "room": { "code": "K7P2", "status": "playing", "hostId": "uuid-host", "participants": [ ... ], "availableWords": ["..."], "roles": ["..."] } }
```

**Pre-checks (in order) & errors**

| Condition | Status | Body `message` | FR |
|-----------|--------|----------------|----|
| Unknown `:code` | `404` | `Room not found` | — |
| `participantId !== room.hostId` | `403` | `Only the host can start the game` | FR-011 |
| Participants (after prune) < 2 | `409` | `At least 2 players are required to start` | FR-012 |
| Already `playing` (idempotent guard) | `409` | `This game has already started` | FR-014 |

**Behavior**: On success set `status = "playing"`. All clients observe `status === "playing"` on their next `GET` poll and navigate to `/game`. (FR-013)

---

## Status-code summary

| Code | Used for |
|------|----------|
| `200` | Successful join / poll / start |
| `201` | Room created |
| `400` | Malformed payload (Zod) |
| `403` | Non-host attempted start (FR-011) |
| `404` | Unknown/closed room (FR-006, FR-015) |
| `409` | Room full / game already started / too few players (FR-012, FR-014, FR-016) |

## Frontend client (`api.ts`) additions ✳️

- `startRoom(code, participantId)` → `POST /rooms/:code/start`.
- `request()` throws an error carrying the HTTP `status` (not just `message`) so the lobby can distinguish a `404` closure from a transient failure, and join screens can show the specific `409`/`404` message.
