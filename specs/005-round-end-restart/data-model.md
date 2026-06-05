# Data Model: Round End — Results Display and Lobby Restart

**Branch**: `005-round-end-restart` | **Date**: 2026-05-30

## Modified Type: RoomStatus

The existing `RoomStatus` union gains a third value.

| Value | Meaning | Client behaviour |
|-------|---------|-----------------|
| `"lobby"` | Room waiting for players / post-restart | Show `LobbyPage` |
| `"active"` | Round in progress | Show `GamePage` (game UI) |
| `"ended"` | Round finished, results displayed | Show `GamePage` (result UI) |

**State transitions** (all server-side, host-triggered):

```
lobby ──[host starts]──► active ──[host ends round]──► ended ──[host restarts]──► lobby
```

Clients observe status via 2-second polling of `GET /rooms/:code`; UI transitions happen automatically.

## Derived Concept: RoundResult

Not a new stored entity — computed on demand from the current `RoomSnapshot` when `status === "ended"`. Combines:

| Field | Source |
|-------|--------|
| `correctWord` | `room.availableWords[0]` |
| `scores` | Already in `RoomSnapshot.scores` (computed from guesses) |
| `guesses` | Already in `RoomSnapshot.guesses` |

No new fields, no new storage. The result screen reads directly from the snapshot.

## State Reset on Restart

When `restartRoom()` executes:

| Field | Before restart | After restart |
|-------|---------------|---------------|
| `room.status` | `"ended"` | `"lobby"` |
| `room.guesses` | `[...guesses from round]` | `[]` (cleared) |
| `room.participants` | `[...all players]` | `[...all players]` (preserved) |
| `room.hostId` | `<host UUID>` | `<host UUID>` (unchanged) |
| `room.availableWords` | `["rocket", ...]` | `["rocket", ...]` (unchanged) |

## Validation Rules

| Action | Who | Guard |
|--------|-----|-------|
| End round (`POST /end`) | Host only | `participantId === room.hostId`; room must be `"active"` |
| Restart (`POST /restart`) | Host only | `participantId === room.hostId`; room must be `"ended"` |
