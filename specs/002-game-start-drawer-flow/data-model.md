# Data Model: Game Start & Drawer Flow

## Entity Changes

### Room (backend/src/models/game.ts)

**New field**:
- `drawerId: string | null` — ID of the participant assigned as the drawer for the current round. `null` when room is in "lobby" status.

**Existing fields** (unchanged):
- `code`, `status`, `participants`, `hostId`, `createdAt`, `updatedAt`

### RoomSnapshot (backend/src/models/game.ts)

**New fields**:
- `drawerId: string | null` — mirrors Room.drawerId
- `currentWord: string | null` — the secret word for the current round. Set to `null` if the viewer is not the drawer or if no round is active.

**Existing fields** (unchanged):
- `code`, `status`, `participants`, `hostId`, `availableWords`, `roles`

### Participant (backend/src/models/game.ts)

No changes. Existing `id`, `name`, `joinedAt` fields are sufficient.

## State Transitions

### Room Status: "lobby" → "active"
1. Host calls POST /rooms/:code/start
2. Backend sets `room.status = "active"`
3. Backend sets `room.drawerId = room.hostId` (host is drawer for round 1)
4. Backend selects `currentWord = STARTER_WORDS[0]` (round 1, index 0)
5. `toRoomSnapshot` returns `currentWord` only if `viewerParticipantId === room.drawerId`

## Validation Rules

- **Player name**: trimmed, non-empty (already enforced by Zod schemas + `createParticipant`)
- **Minimum players**: ≥ 2 to start (already enforced in `rooms.ts` handler)
- **Host-only start**: only `room.hostId` can call start (already enforced)
- **Word list non-empty**: if `STARTER_WORDS` is empty, start should fail with 500 error

## Key Derivations

- **drawerName**: derived by finding participant where `participant.id === snapshot.drawerId`
- **isViewerDrawer**: derived by checking `snapshot.drawerId === viewerParticipantId`
- **wordIndex**: `(roundNumber - 1) % STARTER_WORDS.length` (round 1 = index 0)
