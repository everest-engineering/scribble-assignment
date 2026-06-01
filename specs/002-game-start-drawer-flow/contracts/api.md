# API Contracts: Game Start and Drawer Flow

## POST /rooms/:code/start

**Purpose**: Start the game in a room. Assigns drawer and selects secret word.
**Request body**:
```json
{
  "participantId": "string"
}
```
**Validation**:
- `participantId` must match the room's `hostId` (only room creator can start)
- Room must have ≥ 2 participants
- Room must be in `"lobby"` status
- `participantId` must be a valid participant in the room

**Success response (200)**:
```json
{
  "code": "abcd",
  "status": "playing",
  "hostId": "host-uuid",
  "participants": [
    { "id": "host-uuid", "name": "Alice", "joinedAt": "2026-06-01T12:00:00Z" },
    { "id": "guest-uuid", "name": "Bob", "joinedAt": "2026-06-01T12:01:00Z" }
  ],
  "drawerId": "host-uuid",
  "yourRole": "drawer",
  "secretWord": "rocket"
}
```
The response is a `RoomSnapshot` with `yourRole` and `secretWord` computed for the requesting participant.

**Error response (400)**: `{ "error": "At least 2 players required to start" }`
**Error response (403)**: `{ "error": "Only the host can start the game" }`

---

## GET /rooms/:code?participantId=<id>

**Purpose**: Poll current room state. Returns role-aware snapshot.
**Query params**: `participantId` (optional — if omitted, `secretWord` is excluded and `yourRole` defaults to `"guesser"`)

**Success response (200) — game in progress, viewer is drawer**:
```json
{
  "code": "abcd",
  "status": "playing",
  "hostId": "host-uuid",
  "participants": [ ... ],
  "drawerId": "host-uuid",
  "yourRole": "drawer",
  "secretWord": "rocket"
}
```

**Success response (200) — game in progress, viewer is guesser**:
```json
{
  "code": "abcd",
  "status": "playing",
  "hostId": "host-uuid",
  "participants": [ ... ],
  "drawerId": "host-uuid",
  "yourRole": "guesser"
}
```
Note: `secretWord` is omitted when `yourRole !== "drawer"`.

---

## POST /rooms/:code/leave

**Purpose**: Leave a room. If the leaving player is the drawer, a new drawer and word are assigned.
**Request body**:
```json
{
  "participantId": "string"
}
```

**Success response (200)**:
```json
{
  "success": true,
  "room": { ... }
}
```
Returns updated `RoomSnapshot` without the leaving participant.

**Behavior**:
- If drawer leaves: next longest-joined participant becomes drawer, new secret word selected
- If host but not drawer leaves: host status transfers to next longest-joined participant (or drawer, or any other participant logic)
- If last participant leaves: room is removed from active rooms
- If participant not found: returns 404

---

## POST /rooms

**Purpose**: Create room (existing — updated validation).

**Request body**:
```json
{
  "playerName": "Alice"
}
```

**Validation (updated)**:
- Must not be empty after trimming (existing)
- Must be ≤ 20 characters after trimming (NEW)

---

## POST /rooms/:code/join

**Purpose**: Join an existing room (existing — updated validation).

**Request body**:
```json
{
  "playerName": "Bob"
}
```

**Validation (updated)**:
- Must not be empty after trimming (existing)
- Must be ≤ 20 characters after trimming (NEW)
- Must not match an existing participant's name (case-sensitive) (NEW)

---

## Error Response Format (all endpoints)

```json
{
  "error": "Human-readable error message"
}
```

HTTP status codes: 400 (validation), 403 (authorization), 404 (not found).
