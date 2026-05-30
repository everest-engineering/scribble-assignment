# Data Model: Room Setup and Lobby

## Entities

### Room

- `code: string` - unique uppercase room code.
- `status: "lobby" | "playing" | "results"` - current phase; this feature starts in and validates lobby behavior.
- `hostId: string` - participant id for the room creator/current host.
- `participants: Participant[]` - players in this room only.
- `createdAt: string` - ISO creation timestamp.
- `updatedAt: string` - ISO update timestamp.

### Participant

- `id: string` - unique participant id.
- `name: string` - trimmed display name; empty values are rejected.
- `joinedAt: string` - ISO join timestamp.

### Room Snapshot

- `code: string` - room code for display and polling.
- `status: string` - current room status.
- `hostId: string` - host participant id.
- `participants: Participant[]` - current participants for this room only.

### Room Session

- `participantId: string` - current browser participant id.
- `room: RoomSnapshot` - latest room snapshot held in frontend memory during in-app navigation.

## Validation Rules

- Player names are trimmed and must be non-empty.
- Room codes are trimmed, normalized to uppercase, and must be non-empty.
- Unknown room codes return a clear not-found error.
- Start requires current host and at least two participants.
- Room state is isolated by room code.

## Notes

- Rooms are stored in memory only.
- Browser refresh loses frontend room session state.
