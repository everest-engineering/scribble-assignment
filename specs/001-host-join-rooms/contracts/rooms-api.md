# API Contract: Rooms (Lobby)

**Base path**: `/rooms`  
**Feature**: `001-host-join-rooms`

## POST /rooms

Create room; creator becomes host.

**Body**

```json
{ "playerName": "Alice" }
```

**Success `201`**

```json
{
  "participantId": "uuid",
  "room": { "code": "ABCD", "status": "lobby", "hostParticipantId": "uuid", "participants": [], "viewer": { "participantId": "uuid", "isHost": true, "canStart": false } }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | Empty/whitespace `playerName` |

---

## POST /rooms/:code/join

Join lobby by code (case-insensitive).

**Body**

```json
{ "playerName": "Bob" }
```

**Success `200`**

Same shape as create; `viewer.isHost: false`.

**Errors**

| Status | Message intent |
|--------|----------------|
| 400 | Empty/whitespace room code — e.g. “Room code is required” |
| 400 | Empty/whitespace player name — e.g. “Name is required” |
| 404 | Room not found (unknown or destroyed) — e.g. “Room not found” |
| 409 | Room full (10 players) — e.g. “Room is full” |
| 409 | Active drawing round (`status === drawing`) — e.g. “Game already started” |

**Note**: Join while `status === result` is defined in `004-result-restart-lobby`, not this contract.

---

## GET /rooms/:code

Poll lobby state. **Required query**: `participantId` for resume and host flags.

**Query**: `?participantId=<uuid>`

**Success `200`**

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "uuid",
    "participants": [{ "id": "uuid", "name": "Alice", "joinedAt": "...", "isHost": true }],
    "viewer": { "participantId": "uuid", "isHost": true, "canStart": true }
  }
}
```

`viewer.canStart`: `isHost && participants.length >= 2 && status === "lobby"`.

**Errors**

| Status | Condition |
|--------|-----------|
| 404 | Unknown room |
| 400 | Missing/invalid `participantId` when resume expected |

---

## POST /rooms/:code/start

Host starts game (lobby → drawing). Implementation detail for 002+; contract defined here for gating.

**Query**: `?participantId=<uuid>` (host)

**Success `200`**: `{ "room": { "status": "drawing", ... } }`

**Errors**

| Status | Condition |
|--------|-----------|
| 403 | Not host |
| 400 | Fewer than 2 participants |
| 409 | Not in lobby |

---

## Presence via GET

Use **GET only** for presence refresh (`lastSeenAt` updated on poll)—no separate presence endpoint.
