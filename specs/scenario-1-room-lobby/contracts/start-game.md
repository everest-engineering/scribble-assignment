# Contract: POST /rooms/:code/start

**Phase**: 1 — Design & Contracts

## Purpose

Allow the host to start the game. Validates host identity and minimum player count.

## Request

```
POST /rooms/:code/start
```

**URL Parameters**:
- `code: string` — Room code (4-char alphanumeric, case-insensitive, normalized to uppercase)

**Headers**:
- `Content-Type: application/json`

**Body**: None (empty body, or ignored if provided)

## Responses

### 200 — Game Started Successfully

```json
{
  "room": {
    "code": "A1B2",
    "status": "lobby",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "2026-06-04T..." },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "2026-06-04T..." }
    ],
    "hostId": "uuid-1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `status` remains `"lobby"` for Scenario 1. Game status transitions will be handled in future scenarios.

### 400 — Insufficient Players

```json
{
  "message": "At least 2 players are required to start"
}
```

Returned when `room.participants.length < 2`.

### 403 — Not Host

```json
{
  "message": "Only the host can start the game"
}
```

Returned when the requesting participant is not the room host. The request body must include `participantId` to identify the requester:
```json
{ "participantId": "uuid-2" }
```

### 404 — Room Not Found

```json
{
  "message": "Unable to load room"
}
```

Returned when no room exists with the given code.

## Validation Rules

1. `code` must be a non-empty string (Zod `.min(1)` — catches empty/null/undefined)
2. Room must exist matching `code` (case-insensitive, uppercased)
3. `participantId` in body must match `room.hostId`
4. `room.participants.length` must be >= 2

## Frontend Integration

Client calls:
```typescript
api.startGame(code: string, participantId: string): Promise<{ room: RoomSnapshot }>
```

Client handles:
- 200 → Navigate to game page
- 400 → Show "Need at least 2 players" message
- 403 → Show "Only the host can start" message (should not occur if button is hidden)
- 404 → Redirect to home (room was deleted/expired)

## Testing

```typescript
// Backend integration test
await request(app).post("/rooms/CODE1/start").send({ participantId: hostId }).expect(200);
await request(app).post("/rooms/CODE1/start").send({ participantId: nonHostId }).expect(403);
await request(app).post("/rooms/NEWROOM/start").send({ participantId: someId }).expect(404);
```
