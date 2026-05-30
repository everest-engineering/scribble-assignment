# Data Model: Game Start & Drawer Flow

**Phase 1 output** | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

## Overview

Adds round tracking, drawer assignment, and word selection to the existing room model. All changes extend the existing types in `backend/src/models/game.ts`.

## Entity Changes

### RoomStatus (extended)

```
RoomStatus = "lobby" | "awaiting_rename" | "playing"
```

- `"awaiting_rename"` — new intermediate state. Room enters this when the host triggers start but a player has an invalid name. Polling continues; the invalid player sees an inline rename prompt.
- Transitions: `"lobby" → "awaiting_rename" → "playing"`, or `"lobby" → "playing"` (all names valid).
- Only the host can trigger the transition (button hidden for non-hosts).

### Round (new)

| Field | Type | Description |
|-------|------|-------------|
| `roundNumber` | `number` | Starts at 1 |
| `drawerId` | `string` | `participant.id` of the drawing player |
| `word` | `string` | The secret word for this round |

- `drawerId` and `roundNumber` are sent to ALL players in the snapshot.
- `word` is sent ONLY to the drawer (server-side filtering in `toRoomSnapshot`).

### Room (extended)

| Field | Type | Description |
|-------|------|-------------|
| `currentRound` | `Round \| null` | Added field. `null` while in lobby/awaiting_rename. Set when transitioning to `"playing"`. |

### RoomSnapshot (extended)

| Field | Type | Visibility |
|-------|------|------------|
| `roundNumber` | `number \| null` | All players |
| `drawerId` | `string \| null` | All players |
| `currentWord` | `string \| undefined` | **Only the drawer** (server adds this when viewerParticipantId matches drawerId) |

- `availableWords` (existing field) — REMOVED or made empty for non-drawers to prevent word leakage. The drawer doesn't need the full list either since they get the specific word.
- `roles` (existing field) — KEPT for future multi-round support; for round 1, drawer role is implicit from `drawerId`.

## State Transitions

```text
                    ┌─────────────────────────────────────────────┐
                    │  host clicks "Start Game"                    │
                    │  (all names valid after trim)                │
                    │                                             │
  ┌───────┐        ┌▼──────────┐        ┌──────────────────┐      │
  │ lobby │───────►│  playing  │        │ awaiting_rename  │──────┘
  └───────┘        └───────────┘        └──────────────────┘
       │                ▲                       │
       │                │                       │
       │                │    invalid player     │
       │                │    enters valid name  │
       │                │                       │
       └────────────────┴───────────────────────┘
           host clicks "Start Game"
           (some names empty/whitespace-only)
```

- **lobby → playing**: All player names valid after trimming. Round 1 created with host as drawer. Word selected deterministically.
- **lobby → awaiting_rename**: One or more player names empty/whitespace-only. Room waits for inline correction.
- **awaiting_rename → playing**: All players now have valid names. Round 1 created.
- **awaiting_rename → lobby**: Not directly supported. If no fix is provided, room stays in awaiting_rename indefinitely (spec edge case). Path back would require explicit host action to disband.

## Word Selection

- Deterministic: `STARTER_WORDS[0]` for round 1 (`"rocket"` with current seed data).
- The starter list should be expanded from 5 to at least 10 words (matching spec assumption in spec.md).
- For round 1, `STARTER_WORDS[0]` is always chosen regardless of room or player composition (SC-005 requirement: "same word for round 1 of any game").

## Validation Rules (from spec FRs)

- **FR-001**: All player names trimmed (leading/trailing whitespace) at game start.
- **FR-002**: Empty/whitespace-only after trim → `"awaiting_rename"` state; that player sees inline input; game proceeds once valid without host retry.
- **FR-003**: Host = drawer for round 1.
- **FR-004**: Drawer indicator visible to all players.
- **FR-005**: Word from starter list, deterministically selected.
- **FR-006**: Word delivered only to drawer (server-side filtering).
- **FR-007**: Word persists on drawer reload; not revealed to non-drawers.
- **FR-008**: Start control hidden from non-host players.
