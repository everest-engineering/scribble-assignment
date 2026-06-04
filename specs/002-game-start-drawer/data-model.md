# Data Model: Game Start & Drawer Flow

## Entities

### Participant
- `id`: string (UUID)
- `name`: string (trimmed, non-empty)
- `joinedAt`: string (ISO date string)

### Room
- `code`: string (4-letter uppercase code)
- `status`: `"lobby" | "active" | "results"`
- `hostId`: string (host participant ID)
- `participants`: Participant[]
- `currentWord`: string (secret word selected from starter words)
- `drawerId`: string (participant ID of active drawer)
- `createdAt`: string
- `updatedAt`: string

### RoomSnapshot
- `code`: string
- `status`: `"lobby" | "active" | "results"`
- `hostId`: string
- `participants`: Participant[]
- `roles`: ParticipantRole[] (or mapping from participant ID to role)
- `wordTemplate`: string (unmasked word for drawer, masked representation like `_ _ _ _ _ _` for guessers)
- `drawerId`: string (who is currently drawing)
