# Data Model: Fix Gaps and Assumptions

## Entities & Schemas

### 1. Participant
Represents a player in a room.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `id` | `string` | UUID generated on the backend | Required, unique within the room |
| `name` | `string` | Custom display name of the player | Required, trimmed, 1-50 chars |
| `joinedAt` | `string` | ISO timestamp of when the player joined | Required |

### 2. Room
Represents an in-memory game room session.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `code` | `string` | 4-character unique code | Required, uppercase, alphanumeric |
| `participants` | `Participant[]` | List of players currently in the room | Required |
| `status` | `"lobby"` | Status of the room session | Required |
| `createdAt` | `string` | ISO timestamp of room creation | Required |
| `updatedAt` | `string` | ISO timestamp of last room update | Required |

---

## State Transitions

### Room Status Lifecycle
The status of a Room transitions through the following state machine:

```mermaid
state-diagram
  [*] --> lobby : Room created
  lobby --> [*] : Room garbage-collected (inactive)
```

- **Creation**: When a user creates a room, a new Room record is stored in memory, set to status `"lobby"`.
- **Cleanup**: Inactive rooms are cleared from memory if they have no activity for a set duration.
