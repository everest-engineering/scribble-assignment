# Data Model: Game Start & Drawer Flow

## Entities

### Room (modified)

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` (4 chars) | Unique alphanumeric room identifier (unchanged) |
| `status` | `"lobby"` or `"playing"` | Room phase; transitions `"lobby"` → `"playing"` on game start (unchanged) |
| `hostId` | `string` (UUID) | Participant ID of the room host (unchanged) |
| `participants` | `Participant[]` | Players in the room (unchanged) |
| `createdAt` | `string` (ISO) | Room creation timestamp (unchanged) |
| `updatedAt` | `string` (ISO) | Last activity timestamp (unchanged) |

**New fields:**

| Field | Type | Description |
|-------|------|-------------|
| `drawerId` | `string` (UUID) | Participant ID of the current round's drawer. Set to `hostId` on game start. |
| `secretWord` | `string` | The word for the current round, deterministically selected from the starter list. Set on game start. |

### Participant (unchanged)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique participant identifier |
| `name` | `string` | Display name; trimmed, alphanumeric-only, max 15 chars, unique within room |
| `joinedAt` | `string` (ISO) | When this participant joined |

### RoomSnapshot (modified)

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` (4 chars) | Room identifier |
| `status` | `"lobby"` or `"playing"` | Room phase |
| `hostId` | `string` (UUID) | Host participant ID |
| `drawerId` | `string` (UUID) | Current drawer participant ID (new) |
| `participants` | `Participant[]` | All participants |
| `availableWords` | `string[]` | Copy of the starter word list (all players see this) |
| `roles` | `ParticipantRole[]` | Role labels (`["drawer", "guesser"]`) |
| `secretWord` | `string` or `undefined` | **Only present** when the viewer is the drawer (`viewerParticipantId === room.drawerId`); `undefined` for all others (new) |

## Validation Rules

### Name Validation (new rules applied to create/join)

| Rule | Source | Enforcement |
|------|--------|-------------|
| Leading/trailing whitespace trimmed | FR-005 | Route handler trims input before Zod |
| Empty/whitespace-only name rejected | FR-006 | Zod `.min(1)` after trim |
| Name must be alphanumeric + spaces, hyphens, underscores | FR-009 | Zod regex `/^[A-Za-z0-9 _-]+$/` |
| Name max 15 characters | FR-010 | Zod `.max(15)` |
| Name must be unique within room | FR-012 (existing) | Backend `joinRoom` 409 check |

### Game Start Validation (new rules)

| Rule | Source | Enforcement |
|------|--------|-------------|
| Only host can start game | FR-008 (existing) | Backend checks `participantId === room.hostId` |
| At least 2 players to start | FR-009 (existing) | Backend checks `participants.length >= 2` |
| Secret word deterministically selected | FR-003 | DJB2 hash of room code modulo word list length |
| Secret word only visible to drawer | FR-004 | `toRoomSnapshot()` filters based on viewer ID |
| Drawer identity visible to all | FR-002 / FR-007 | `drawerId` always present in snapshot |
| Empty word list guarded | FR-003 edge case | Backend throws 400 if word list is empty |

## State Transitions

```
[Room Created] ──→ [Lobby] ──→ [Playing: Round 1]
                                   │
                                   ├── drawerId = hostId
                                   ├── secretWord = deterministic(wordList, roomCode)
                                   ├── Drawer sees: full snapshot + secretWord
                                   ├── Guessers see: full snapshot (no secretWord)
                                   └── All participants see who the drawer is
```

Room enters `"playing"` once the host calls `POST /rooms/:code/start` with 2+ participants. The host becomes the drawer. No drawer rotation — this feature covers round 1 only.
