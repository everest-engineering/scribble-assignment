# Data Model: Game Start & Drawer Flow

**Extends**: [Scenario 1 data model](../001-room-setup-lobby/data-model.md)

## Entities

### Room (extended)

| Field | Type | Description | Change from Scenario 1 |
|-------|------|-------------|------------------------|
| `status` | `"lobby"` `"playing"` | Current room state | Added `"playing"` to the type union (already done in Scenario 1) |
| `currentDrawerId` | `string \| null` | Participant ID of the current round's drawer | **New** — set on game start |
| `roundNumber` | `number` | Current round number (1-based) | **New** — set to 1 on game start |

### Participant (unchanged)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique participant identifier (UUID) |
| `name` | `string` | Display name (trimmed, no leading/trailing whitespace) |
| `joinedAt` | `string` | ISO 8601 timestamp of join time |

### RoomSnapshot (extended)

| Field | Type | Description | Visibility |
|-------|------|-------------|------------|
| `code` | `string` | Room code | All players |
| `status` | `"lobby"` `"playing"` | Room state | All players |
| `hostId` | `string` | Host participant ID | All players |
| `participants` | `Participant[]` | List of participants | All players |
| `availableWords` | `string[]` | Word list for the round | All players (word list, not secret word) |
| `roles` | `ParticipantRole[]` | Role for each participant (same order as participants) | All players |
| `currentDrawerId` | `string \| null` | Participant ID of drawer | All players |
| `roundNumber` | `number` | Current round | All players |
| `secretWord` | `string \| null` | The secret word for this round | **Drawer only** — `null` for guessers |

## State Transitions

```
lobby → [host clicks "Start Game"] → playing
```

During `lobby → playing` transition:
1. Room status changes to `"playing"`
2. `currentDrawerId` is set to the host's participant ID
3. `roundNumber` is set to `1`
4. Secret word is selected deterministically: `STARTER_WORDS[roundNumber - 1]`
5. Roles are assigned: host = `"drawer"`, everyone else = `"guesser"`
6. `RoomSnapshot.roles` is populated in participant order matching the drawer/guesser assignment

## Validation Rules

- **Player name**: Must be ≥1 character after trimming leading/trailing whitespace
- **Game start**: Requires ≥2 participants; caller must be the host
- **Secret word**: Must never be included in the snapshot for non-drawer participants
