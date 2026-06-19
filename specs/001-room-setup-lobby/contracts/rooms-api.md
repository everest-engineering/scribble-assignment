# Phase 1 Contract: Rooms API (Group 1)

Base URL: `http://localhost:3001`. All bodies are JSON. Existing error pathway: non-2xx responses carry
`{ "message": string }`, which the frontend surfaces verbatim.

Legend: **[existing]** = already in starter (changes noted), **[new]** = added by this group.

---

## `RoomSnapshot` shape (shared)

```jsonc
{
  "code": "ABCD",
  "status": "lobby",            // "lobby" | "active"   (status widened)
  "hostId": "uuid-of-creator",  // NEW — client derives isHost
  "participants": [
    { "id": "uuid", "name": "Alice", "joinedAt": "2026-06-17T10:00:00.000Z" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

---

## POST /rooms  **[existing — extended]**

Create a room; creator becomes host.

**Request**: `{ "playerName": "Alice" }` (name optional; trimming is Group 2)

**Response 201**:
```jsonc
{ "participantId": "uuid-of-creator", "room": { /* RoomSnapshot, status:"lobby", hostId == participantId */ } }
```

**Contract change**: `room.hostId` now present and equals the returned `participantId`. _(FR-001, FR-002)_

---

## POST /rooms/:code/join  **[existing — message changed]**

Join an existing room. `:code` matched case-insensitively (uppercased server-side). _(FR-006)_

**Request**: `{ "playerName": "Bob" }`

**Response 200**:
```jsonc
{ "participantId": "uuid-of-bob", "room": { /* RoomSnapshot incl. Bob; hostId still the creator */ } }
```

**Response 404** (unknown code):
```jsonc
{ "message": "No room with that code." }
```
**Contract change**: 404 message changed from `"Unable to join room"` → `"No room with that code."` _(FR-005)_

> Empty/whitespace code is **not** sent to this endpoint — the client guards it and shows
> "Enter a room code." _(FR-004)_

---

## GET /rooms/:code  **[existing — extended]**

Fetch a room snapshot. Used by manual refresh **and** the ~2s lobby poll. _(FR-008, FR-009)_

**Query**: `?participantId=<uuid>` (optional; reserved for per-viewer projection in Group 2)

**Response 200**: `{ "room": { /* RoomSnapshot incl. hostId, status */ } }`

**Response 404**: `{ "message": "Unable to load room" }` (unchanged)

**Contract change**: snapshot now includes `hostId` and may report `status: "active"` after start. _(FR-001, FR-013)_

---

## POST /rooms/:code/start  **[new]**

Transition a room from `lobby` to `active`. Host-only; requires ≥2 players.

**Request**:
```jsonc
{ "participantId": "uuid-of-requester" }
```

**Response 200** (success):
```jsonc
{ "room": { /* RoomSnapshot with status: "active" */ } }
```

**Error responses**:

| Status | Condition | Body | FR |
|--------|-----------|------|----|
| 404 | No room for `:code` | `{ "message": "Unable to load room" }` | — |
| 403 | `participantId !== room.hostId` | `{ "message": "Only the host can start the game." }` | FR-011, FR-012 |
| 409 | `participants.length < 2` | `{ "message": "Need at least 2 players to start." }` | FR-010, FR-012 |
| 400 | Missing/invalid `participantId` | `{ "message": "Invalid request payload" }` (Zod) | FR-014 |

**Behavior**: On success, `status` becomes `"active"` and `updatedAt` is bumped. All clients observe the new
status on their next `GET /rooms/:code` poll and navigate to the game screen. Invalid requests leave the
room in `lobby`. _(FR-012, FR-013)_

---

## Contract test checklist (for `/speckit.tasks`)

- [ ] `POST /rooms` returns `hostId === participantId`, `status === "lobby"`.
- [ ] `POST /rooms/:code/join` on unknown code → 404 `"No room with that code."`.
- [ ] `POST /rooms/:code/join` matches lowercase code to existing room.
- [ ] `GET /rooms/:code` snapshot includes `hostId` and current `status`.
- [ ] `POST /rooms/:code/start` by non-host → 403; never flips status.
- [ ] `POST /rooms/:code/start` with 1 player → 409; never flips status.
- [ ] `POST /rooms/:code/start` by host with ≥2 players → 200, `status === "active"`.
- [ ] Two rooms: starting/joining one never alters the other (isolation).
