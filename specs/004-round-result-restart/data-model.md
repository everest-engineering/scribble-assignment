# Data Model: Round Result & Restart

## Entity Changes

### Room (extended)

Extends the existing `Room` entity. All existing fields unchanged unless noted.

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `status` | `"lobby" \| "playing" \| "results"` | Extended | Added `"results"` status for post-round phase |
| `hostId` | `string` | Unchanged | Used for restart authorization |
| `participants` | `Participant[]` | Unchanged | Preserved verbatim across restart |
| `secretWord` | `string` | Behavior change | Visible to ALL viewers when `status === "results"` (previously drawer-only) |
| `drawerId` | `string` | Unchanged | Preserved until restart, then cleared |
| `scores` | `Record<string, number>` | Unchanged | Cleared on restart |
| `guessHistory` | `GuessEntry[]` | Unchanged | Cleared on restart |
| `canvasActions` | `CanvasAction[]` | Unchanged | Cleared on restart |

### New/Modified Types

```typescript
// models/game.ts

// Extended status — added "results"
export type RoomStatus = "lobby" | "playing" | "results";

// RoomSnapshot — updated
// - status now includes "results"
// - secretWord is always included when status === "results"
// - roundOver is DEPRECATED (status === "results" is the canonical check)
//   but kept for backward compatibility (always true when status === "results")
```

## State Transitions

```
lobby ──[host startGame()]──▶ playing ──[all guessers score 100]──▶ results ──[host restart()]──▶ lobby
  │                            │                                      │
  └──(player join/leave)──┘   └──(guesses, canvas actions)──┘      └──(view results)──┘
```

### Transition Rules

| From | To | Trigger | Guard | Side Effects |
|------|----|---------|-------|-------------|
| `lobby` | `playing` | `POST /start` | Host only, ≥2 players | Sets drawerId, secretWord, initializes scores |
| `playing` | `results` | Auto (in `submitGuess`) | All non-drawer players have score ≥100 | Status changes to `"results"`; no data cleared |
| `results` | `lobby` | `POST /restart` | Host only | Clears: `secretWord`, `drawerId`, `scores`, `guessHistory`, `canvasActions` |

## Data Lifecycle

### Results Phase Data

During `status === "results"`, the `Room` object retains:
- `secretWord` — the correct word (now visible to all)
- `scores` — final per-player scores for the round
- `guessHistory` — full chronological guess log
- `drawerId` — who was drawing (informational)

### Restart Cleanup

On restart, the following fields are reset to pre-round defaults:

| Field | New Value |
|-------|-----------|
| `status` | `"lobby"` |
| `secretWord` | `""` |
| `drawerId` | `""` |
| `scores` | `{}` |
| `guessHistory` | `[]` |
| `canvasActions` | `[]` |

The following fields are preserved:
- `code` (room identifier)
- `hostId` (host player stays host)
- `participants` (all players remain)
- `createdAt` (room creation timestamp)

## Validation Rules

- **Restart**: Only the host (`participantId === room.hostId`) can restart. Room must be in `"results"` status. Non-host receives 403.
- **Round end**: Cannot transition to `"results"` if already in `"results"` or `"lobby"`.
- **Guess submission**: Rejected if `status !== "playing"` (unchanged behavior).
- **Canvas actions**: Rejected if `status !== "playing"` (unchanged behavior).
