# Data Model: Room Setup & Lobby

**Phase**: 1 — Design
**Date**: 2026-06-01

## Entities

### Room

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Unique 6-char alphanumeric identifier |
| `hostId` | `string` | Participant ID of the host |
| `status` | `"lobby" \| "playing" \| "finished"` | Current room state |
| `participants` | `Participant[]` | Players currently in the room |
| `createdAt` | `string` (ISO 8601) | Room creation timestamp |

**Validation rules**:
- `code` must be exactly 6 uppercase alphanumeric characters
- `hostId` must match one of the participant IDs in the room
- `participants` must contain at least 1 player (the host)

**State transitions**:
- `lobby` → `playing`: triggered by host start (≥2 players)
- `playing` → `finished`: triggered by round end
- `finished` → `lobby`: triggered by host restart

---

### Participant

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique participant identifier (UUID) |
| `name` | `string` | Display name, trimmed, non-empty |
| `joinedAt` | `string` (ISO 8601) | When the participant joined |

**Validation rules**:
- `name` must be non-empty after trimming whitespace
- `name` must be unique within a room (no duplicate names)
- `id` must be unique globally (UUID collision probability negligible)

---

### RoomSnapshot (API response shape)

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room code |
| `status` | `"lobby"` | Snapshot of current status |
| `participants` | `Participant[]` | Current participants |
| `hostId` | `string` | Host participant ID (so clients can identify host) |
| `availableWords` | `string[]` | Word list for the game (hidden from non-host in game) |
| `roles` | `("drawer" \| "guesser")[]` | Role options |

## Relationships

```
Room 1 ─── * Participant
  │
  └── hostId references Participant.id (1:1)
```

- A Room has many Participants
- A Room has exactly one host (referenced by `hostId`)
- A Participant belongs to exactly one Room

## State Diagram

```
┌─────────┐  host starts (≥2 players)  ┌──────────┐
│  lobby  │ ──────────────────────────→ │ playing  │
└─────────┘                             └──────────┘
      ↑                                      │
      │         host restarts                │
      └──────────────────────────────────────┘
                    round ends
               (future feature)
```
