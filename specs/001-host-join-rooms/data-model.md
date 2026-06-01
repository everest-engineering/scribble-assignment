# Data Model: Host and Join Game Rooms

**Feature**: `001-host-join-rooms` | **Date**: 2026-06-01

## Room

| Field | Type | Notes |
|-------|------|-------|
| `code` | string | 4 chars, uppercase, unique key in memory map |
| `status` | `"lobby" \| "drawing" \| "result"` | This feature: lobby join/start; reject join when `drawing`; `result` join is feature 004 |
| `hostParticipantId` | string (UUID) | Set at create to creator’s participant id |
| `participants` | Participant[] | Max 10 |
| `createdAt` | ISO string | |
| `updatedAt` | ISO string | |

**Lifecycle**: Created on `POST /rooms` → participants join → empty after all disconnect/timeouts → room deleted (FR-016).

## Participant

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | Stable for resume (FR-018) |
| `name` | string | Trimmed, min length 1 |
| `joinedAt` | ISO string | |
| `lastSeenAt` | ISO string | Updated on poll and mutations |

## RoomSnapshot (API view)

Extends current snapshot with:

| Field | Type | Notes |
|-------|------|-------|
| `hostParticipantId` | string | |
| `viewer` | object | `{ participantId, isHost, canStart }` when `participantId` query provided |
| `participants` | array | Include `isHost` flag per row optional for UI |

**Validation rules**

- `playerName`: trim; reject if empty after trim (create, join).
- `code`: trim; uppercase; reject empty; 404 if no room.
- Join: reject if `status === "drawing"` (409 game already started). Allow join when `status === "lobby"` only in this feature; `result` join rules in feature 004.
- Join: reject if `participants.length >= 10` (409 room full).
- Resume: `GET` with known `participantId` re-attaches `lastSeenAt` without new participant row.

## State transitions (this feature)

```text
[no room] --POST /rooms--> lobby (1 participant, host set)
lobby --POST join--> lobby (n participants)
lobby --disconnect all--> [room deleted]
lobby --POST start (host, n>=2)--> drawing  (handoff to feature 002; status flip only in 001 plan boundary)
```

**Note**: Full `drawing` behavior is out of scope; start endpoint transitions status so join gating (FR-015) can be tested.
