# Data Model: Game Start & Drawer Flow

## Entities

### Room

- `code`: 4-character uppercase room code.
- `status`: `lobby | game`.
- `hostParticipantId`: id of the room creator.
- `currentDrawerId`: participant id of the active drawer after start.
- `currentWord`: selected secret word stored only while the room is active in
  game state.
- `participants`: ordered list of participants.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.

Rules:

- `hostParticipantId` must always reference an existing participant.
- `currentDrawerId` must equal `hostParticipantId` when the game starts.
- `currentWord` is assigned once on start and is not recomputed during the
  round.
- If the host/drawer leaves while `status === "game"`, the room is deleted.

### Participant

- `id`: unique participant id.
- `name`: trimmed, non-empty display name.
- `joinedAt`: ISO timestamp.
- `role`: `drawer | guesser`, assigned when the room transitions to `game`.

Rules:

- Role is not needed in lobby state.
- The host gets `drawer`; every other participant gets `guesser`.

### RoomSnapshot

Viewer-aware response DTO returned by room polling and start responses.

Base fields:

- `code`
- `status`
- `hostParticipantId`
- `currentDrawerId`
- `participants`
- `availableWords`

Conditional field:

- `currentWord`: included only when the viewer is the drawer.

Rules:

- Guessers must not receive `currentWord` at all.
- `participants` should include role labels once the game has started so the UI
  can show drawer/guesser identity to everyone.

## State Transitions

### Lobby -> Game

1. Host sends start request.
2. Room validates at least 2 participants.
3. Backend assigns drawer/guesser roles.
4. Backend selects `currentWord` deterministically from `STARTER_WORDS`.
5. Room status becomes `game`.

### Game -> Deleted

1. Drawer/host leaves the room.
2. Backend deletes the room immediately.
3. Polling clients receive 404 and clear local session state.

