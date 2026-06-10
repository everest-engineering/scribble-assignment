# Data Model: Room Setup & Lobby

## Room (extended)

```
Room {
  code:         string        // 4-char uppercase, unique
  status:       "lobby" | "active" | "completed"
  hostId:       string        // participant UUID of creator  ← NEW
  participants: Participant[]
  createdAt:    string        // ISO 8601
  updatedAt:    string        // ISO 8601
}
```

**Validation rules**:
- `code` is generated server-side; never supplied by clients.
- `hostId` is set to the creator's participant `id` at creation time and never changes.
- `status` starts as `"lobby"`; transitions: `lobby → active` (game start), `active → completed`
  (game end), `completed → lobby` (restart).

## Participant (unchanged)

```
Participant {
  id:       string   // UUID
  name:     string   // trimmed, non-empty
  joinedAt: string   // ISO 8601
}
```

**Validation rules**:
- `name` is trimmed of leading/trailing whitespace before storage.
- Empty or whitespace-only names are rejected before a Participant is created.

## RoomSnapshot (extended — what the frontend receives)

```
RoomSnapshot {
  code:           string
  status:         "lobby" | "active" | "completed"
  hostId:         string        // ← NEW — allows client to identify host
  participants:   Participant[]
  availableWords: string[]
  roles:          ParticipantRole[]
}
```

## State Transitions

```
[create] ──► lobby
lobby    ──► active    (host clicks Start, ≥2 players)
active   ──► completed (round ends)
completed ──► lobby   (host restarts)
```
