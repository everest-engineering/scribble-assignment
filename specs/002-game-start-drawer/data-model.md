# Data Model: Game Start & Drawer Flow

No new entities. All types are defined in `backend/src/models/game.ts` and extended/refined below.

## Room

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | 4-char alphanumeric, immutable |
| `status` | `RoomStatus` | `"lobby"` → `"playing"` on start; never goes back to lobby |
| `hostId` | `string` | Participant ID of room creator; transferred on host leave |
| `participants` | `Participant[]` | Max 8 |
| `secretWord` | `string?` | Set on game start; `undefined` in lobby |
| `createdAt` | `string` (ISO) | Immutable |
| `updatedAt` | `string` (ISO) | Updated on status change |

## Participant

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Assigned on join, immutable |
| `name` | `string` | Display name, trimmed |
| `joinedAt` | `string` (ISO) | Immutable |
| `role` | `ParticipantRole?` | `"drawer"` or `"guesser"`; set on game start |

## RoomSnapshot (API response shape)

| Field | Type | Visible To |
|-------|------|------------|
| `code` | `string` | All |
| `status` | `RoomStatus` | All |
| `participants` | `Participant[]` | All (role field visible to all) |
| `hostId` | `string` | All |
| `availableWords` | `string[]` | Never in production; exists in starter for debug |
| `secretWord` | `string?` | Drawer only; `undefined` for guessers |

## State Transitions

```
lobby ──[host clicks Start]──► playing
  │                              │
  │ (join/leave allowed)         │ (join/leave restricted)
  │                              │
  └── (0 participants)          │
      → room cleaned up          └── (next feature: → finished)
```

## Validation Rules (from spec FRs)

- FR-001: `drawer = participant where id === hostId`
- FR-002: `wordIndex = charCodeSum(room.code) % 5`
- FR-003: `secretWord` omitted from snapshot for non-drawer viewers
- FR-006: `participant.name = participant.name.trim()` on display
- FR-008: Draw actions rejected server-side for non-drawer participant IDs
