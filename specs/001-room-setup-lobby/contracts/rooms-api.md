# Rooms HTTP API Contract

Base URL: `http://localhost:3001` (configurable via `VITE_API_URL` on the frontend).

All endpoints accept and return JSON (`Content-Type: application/json`). Validation errors return `400 { "message": "Invalid request payload" }` (Zod). Generic server errors return `500 { "message": "..." }`. CORS is open in dev.

The `code` path parameter is normalized server-side: trimmed and upper-cased before lookup (FR-007). Examples below use `ABCD`.

## POST /rooms

Create a new room. The caller becomes the host.

Request body:

```json
{ "playerName": "Alice" }
```

| Field        | Type     | Rules                                  |
| ------------ | -------- | -------------------------------------- |
| `playerName` | `string` | Required. Trimmed length 1–24.         |

Responses:

- **201 Created**

  ```json
  {
    "participantId": "8f2c…",
    "room": { /* RoomSnapshot, see data-model.md */ }
  }
  ```

  In the returned snapshot, `viewerIsHost` is `true`, `canStart` is `false` (only one participant), and the participant entry for the caller has `isHost: true`.

- **400 Bad Request** — missing or empty `playerName`.

## POST /rooms/:code/join

Join an existing room.

Request body:

```json
{ "playerName": "Bob" }
```

| Field        | Type     | Rules                          |
| ------------ | -------- | ------------------------------ |
| `playerName` | `string` | Required. Trimmed length 1–24. |

Path:

- `code` — Required, non-empty after trim. Looked up case-insensitively.

Responses:

- **200 OK**

  ```json
  {
    "participantId": "1a9b…",
    "room": { /* RoomSnapshot */ }
  }
  ```

  Caller is appended to `participants`. `viewerIsHost` is `false`. If the room now has ≥2 participants, the host's next snapshot will report `canStart: true`.

- **400 Bad Request** — empty/missing name or empty `code`.
- **404 Not Found** — `{ "message": "Room not found" }`.

## GET /rooms/:code

Fetch the current snapshot for a room as a specific viewer. Used by both the post-join initial load and by the lobby polling loop.

Path:

- `code` — Required, non-empty.

Query:

- `participantId` — Optional. Drives `viewerIsHost`/`canStart` and per-row `isHost` in the snapshot. If omitted, those fields are `false`.

Responses:

- **200 OK**

  ```json
  { "room": { /* RoomSnapshot */ } }
  ```

- **404 Not Found** — `{ "message": "Room not found" }`. Polling clients MUST stop their interval on this and surface "Room no longer available" (FR-013).

Polling expectations:

- Cadence ≈ 2000 ms while the lobby tab is visible (FR-011).
- Pause when `document.visibilityState !== "visible"`; resume with an immediate fetch when visible.
- A failed fetch (network or 5xx) MUST NOT clear the previously rendered snapshot (FR-012).

## POST /rooms/:code/start (NEW)

Host-only acknowledgement that the room is ready to start. In this feature it does not transition `status` (gameplay is a later feature) but it enforces the host and participant-count guards on the server (FR-014, FR-016, FR-017).

Request body:

```json
{ "participantId": "8f2c…" }
```

| Field           | Type     | Rules                                          |
| --------------- | -------- | ---------------------------------------------- |
| `participantId` | `string` | Required. Must equal `room.hostParticipantId`. |

Responses:

- **200 OK**

  ```json
  { "room": { /* RoomSnapshot, viewerIsHost: true, canStart: true */ } }
  ```

- **400 Bad Request** — missing/invalid body.
- **403 Forbidden** — `{ "message": "Only the host can start the game" }` when `participantId` does not match `hostParticipantId`.
- **404 Not Found** — `{ "message": "Room not found" }`.
- **409 Conflict** — `{ "message": "Need at least 2 players to start" }` when `participants.length < 2`.

## Error response shape

All errors share the same envelope:

```json
{ "message": "Human-readable reason" }
```

The frontend maps these to inline form errors (400/404 on join) or banner messages (403/404/409 on start). 4xx messages are safe to display verbatim.
