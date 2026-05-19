# Data Model: Game Start and Drawer Flow

## Entities

### Round

Represents a single drawing round within a game. Created atomically when the host starts the game. Subsequent rounds are out of scope for this feature.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `number` | `number` | Round sequence number (1-based) | Always `1` for first round. Immutable after creation. |
| `drawerId` | `string` (UUID) | Participant ID of the round's drawer | Must match an existing participant in the room. Set to host for round 1. |
| `secretWord` | `string` | The word the drawer must illustrate | Deterministially selected from starter word list. Viewable only by drawer. |
| `status` | `"drawing"` | Current round lifecycle state | For this scope, always `"drawing"`. Future: `"judging"`, `"complete"`. |

### Room (extended)

Existing Room entity gains a reference to the current active round.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `currentRound` | `Round \| null` | Reference to the active round | `null` when in lobby. Set atomically on game start. |

All other Room fields (`code`, `status`, `hostId`, `participants`, `createdAt`, `updatedAt`) remain unchanged from Phase 1.

### RoomSnapshot (extended)

Public-facing view sent to clients. Extended with round information, filtered per viewer.

| Field | Type | Description | Visibility |
|-------|------|-------------|------------|
| `currentRound` | `RoundSnapshot \| null` | Current round info | All viewers. Word field filtered per drawer. |

All other RoomSnapshot fields (`code`, `status`, `hostId`, `participants`, `availableWords`, `roles`) remain unchanged from Phase 1.

### RoundSnapshot

Public-facing view of a round sent to clients. The `secretWord` field is conditionally included.

| Field | Type | Description | Visibility |
|-------|------|-------------|------------|
| `number` | `number` | Round number | All viewers |
| `drawerId` | `string` | Participant ID of the drawer | All viewers |
| `secretWord` | `string \| undefined` | The word to draw | **Only the drawer** — `undefined` for guessers |
| `status` | `"drawing"` | Round status | All viewers |

## State Transitions

```
Room: lobby ──[host clicks start, 2+ players, all names valid]──▶ active
                                    │
                                    ├── creates Round (number=1, drawer=host, word=selected)
                                    ├── selects word deterministically from word list
                                    └── transition is ATOMIC (all-or-nothing)

Room: active ──[drawer disconnects before drawing]──▶ lobby
                                    │
                                    └── currentRound set to null, status reverts
```

## Validation Rules

| Field | Rule | Source |
|-------|------|--------|
| Participant names at start | All names trimmed, 1-16 alphanumeric — reject with message if any fail | FR-001 |
| Host as drawer | The host participant MUST be the drawer for round 1 | FR-002 |
| Word selection | Deterministic function of room code — same code → same word | FR-004 |
| Word visibility | Secret word MUST NOT appear in API responses for non-drawer participants | FR-005 |
| Word list size | At least 20 unique entries | FR-006 |
| Empty word list | Game start rejected if word list is empty (503) | FR-008 |
