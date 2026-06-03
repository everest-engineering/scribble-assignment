# Data Model: Game Start and Drawer

**Feature**: Scenario 2 | **Date**: 2026-06-03

## Entities

### CurrentRound (server-only fields in Room)

| Field | Type | Rules |
|-------|------|-------|
| `roundIndex` | number | Starts at `0` on first start |
| `drawerParticipantId` | string | `participants[0].id` (A2) |
| `secretWord` | string | From `pickWord(code, roundIndex)` (A1); never sent raw to non-drawer clients |

### Room (extended)

| Field | Type | Rules |
|-------|------|-------|
| `status` | `"lobby" \| "playing"` | Start transitions lobby → playing |
| `currentRound` | CurrentRound \| undefined | Set on successful start; undefined in lobby |
| `hostParticipantId` | string | Unchanged from Scenario 1 |
| `participants` | Participant[] | Unchanged |

### RoundSnapshot (client view in RoomSnapshot)

| Field | Type | Notes |
|-------|------|-------|
| `roundIndex` | number | Same as server |
| `drawerParticipantId` | string | Visible to all |
| `secretWord` | string \| null | Word for drawer viewer; `null` for others |

### ViewerSnapshot

| Field | Type | Notes |
|-------|------|-------|
| `participantId` | string | From query param |
| `isDrawer` | boolean | `participantId === currentRound.drawerParticipantId` |

### RoomSnapshot (extended)

| Field | Type | Notes |
|-------|------|-------|
| `status` | `"lobby" \| "playing"` | Drives routing/UI |
| `currentRound` | RoundSnapshot \| undefined | Present when playing |
| `viewer` | ViewerSnapshot \| undefined | When `participantId` query provided |

## Pure functions

### `sumCharCodes(code: string)`

Sum `charCodeAt` for each character in room code (uppercase).

### `pickWord(code: string, roundIndex: number)`

`STARTER_WORDS[(sumCharCodes(code) + roundIndex) % STARTER_WORDS.length]`

## Validation Rules (start)

| Rule | Error |
|------|-------|
| Room not found | 404 `"Unable to start game"` |
| `participantId !== hostParticipantId` | 403 `"Only the host can start the game"` |
| `status !== "lobby"` | 409 `"Game has already started"` |
| `participants.length < 2` | 409 `"Need at least 2 players to start"` |

## State Transitions

```text
lobby --startRound (host, 2+)--> playing + currentRound(roundIndex=0)
playing --startRound--> rejected 409
```

## Out of scope entities

- `Stroke`, `Guess`, `scores`, `status: "result"` — Scenario 3/4
