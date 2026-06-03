# REST API Contract: Scribble Game Completion

The app keeps the existing REST shape and adds room game actions. All responses
that return room state use a viewer-specific room snapshot.

## Existing Endpoints To Preserve

### `GET /health`

Returns `{ "ok": true }`.

### `POST /rooms`

Body:

```json
{ "playerName": "Alice" }
```

Success `201`:

```json
{ "participantId": "p1", "room": { "code": "ABCD", "status": "lobby" } }
```

Rules:

- Trims `playerName`.
- Rejects empty names.
- Creates host participant.

### `POST /rooms/:code/join`

Body:

```json
{ "playerName": "Bob" }
```

Success `200`: room session response.

Rules:

- Trims room code and player name.
- Rejects empty names and unknown rooms.

### `GET /rooms/:code?participantId=:id`

Success `200`:

```json
{ "room": { "code": "ABCD", "status": "lobby" } }
```

Rules:

- Returns viewer-specific snapshot.
- Hides secret word from non-drawers during active state.

## New Endpoints

### `POST /rooms/:code/start`

Body:

```json
{ "participantId": "host-id" }
```

Success `200`: room snapshot.

Rules:

- Host-only.
- Requires at least two participants.
- Valid only in lobby.
- Assigns drawer and deterministic secret word.

### `POST /rooms/:code/drawing`

Body:

```json
{
  "participantId": "drawer-id",
  "strokes": [
    { "id": "stroke-1", "points": [{ "x": 10, "y": 12 }] }
  ]
}
```

Success `200`: room snapshot.

Rules:

- Drawer-only.
- Valid only during active state.

### `POST /rooms/:code/drawing/clear`

Body:

```json
{ "participantId": "drawer-id" }
```

Success `200`: room snapshot.

Rules:

- Drawer-only.
- Valid only during active state.

### `POST /rooms/:code/guesses`

Body:

```json
{ "participantId": "guesser-id", "text": "rocket" }
```

Success `200`: room snapshot.

Rules:

- Guesser-only.
- Trims `text`.
- Rejects empty guesses.
- Correct guesses score 100 and move room to result state.

### `POST /rooms/:code/restart`

Body:

```json
{ "participantId": "host-id" }
```

Success `200`: room snapshot.

Rules:

- Host-only.
- Valid only in result state.
- Preserves participants and host.
- Clears all round state and returns to lobby.

## Error Response

Errors return JSON:

```json
{ "message": "Clear user-facing message" }
```

Expected status codes:

- `400`: invalid input or invalid state transition
- `403`: participant is not allowed to perform the action
- `404`: room or participant not found

