# Data Model: Round Start Setup

## Room

Represents one isolated drawing game room.

### Fields

- `code: string`
  - Unique 4-character room code.
  - Stored normalized as uppercase.
- `status: "lobby" | "playing"`
  - `lobby`: players are waiting before game start.
  - `playing`: the game has begun and first-round state is available.
- `hostParticipantId: string`
  - Participant id of the room creator.
- `participants: Participant[]`
  - Players currently associated with the room in stable join order.
- `currentRound: Round | null`
  - `null` before the game begins.
  - First-round state after the game begins.
- `createdAt: string`
  - ISO timestamp when the room was created.
- `updatedAt: string`
  - ISO timestamp when the room last changed.

### Validation Rules

- `hostParticipantId` must reference a participant in the same room.
- `participants` must contain only trimmed, non-empty player names.
- `currentRound.drawerParticipantId` must reference a current participant when
  `currentRound` is present.
- Room state is isolated by `code`; operations on one room must not mutate any
  other room.

### State Transitions

```text
lobby -- Host starts with eligible players and starter word --> playing + first round
```

No later-round transition is included in this feature.

## Participant

Represents a player in a room.

### Fields

- `id: string`
  - Unique participant identifier.
- `name: string`
  - Trimmed display name.
- `joinedAt: string`
  - ISO timestamp when the player joined.

### Validation Rules

- `name` must be trimmed before storage.
- Empty or whitespace-only names must be rejected with clear feedback.
- Participant array order is the stable join order used for first-round drawer
  fallback.

## Round

Represents the first playable drawing turn for this feature.

### Fields

- `number: 1`
  - This feature only creates the first round.
- `drawerParticipantId: string`
  - Participant assigned to draw.
- `secretWord: string`
  - Deterministically selected first word from the ordered starter word list.
- `startedAt: string`
  - ISO timestamp when the first round was created.

### Validation Rules

- `drawerParticipantId` must reference an eligible participant in the room.
- The Host is selected when eligible; otherwise the first eligible participant by
  stable join order is selected.
- `secretWord` must come from the starter word list.
- First-round setup fails gracefully if no eligible drawer or no starter word is
  available.

## Participant Snapshot

Represents participant data sent to clients.

### Fields

- `id: string`
- `name: string`
- `joinedAt: string`
- `isHost: boolean`
- `isDrawer: boolean`

### Validation Rules

- Exactly one participant snapshot has `isHost: true` while the Host is present.
- Exactly one participant snapshot has `isDrawer: true` while first-round state
  is present.

## Round Snapshot

Represents first-round state sent to a specific viewer.

### Fields

- `number: 1`
- `drawerParticipantId: string`
- `startedAt: string`
- `secretWord?: string`
  - Present only when the viewer is the assigned drawer.
  - Omitted for non-drawers and unknown viewers.

### Validation Rules

- Drawer viewers receive the selected secret word.
- Non-drawers receive no secret word value.
- Unknown or missing viewers receive no secret word value.

## Room Snapshot

Represents the room state sent to clients.

### Fields

- `code: string`
- `status: "lobby" | "playing"`
- `hostParticipantId: string`
- `participants: ParticipantSnapshot[]`
- `currentRound: RoundSnapshot | null`
- `canStartGame: boolean`
  - Viewer-specific flag retained from the lobby flow.
- `availableWords: string[]`
  - Starter word list for reference.
- `roles: ParticipantRole[]`
  - Starter role list for reference.

### Validation Rules

- Snapshot content is viewer-specific when first-round state exists.
- `currentRound.secretWord` is present only for the assigned drawer's viewer
  snapshot.
- `canStartGame` is false once `status` is `playing`.

## Room Session Response

Represents the response after creating or joining a room.

### Fields

- `participantId: string`
  - The viewer's participant id.
- `room: RoomSnapshot`
  - Snapshot of the room from that viewer's perspective.

## Start Game Request

Represents a request to begin the game and create the first round.

### Fields

- `participantId: string`
  - Participant attempting to start the game.

### Validation Rules

- Participant must exist in the room.
- Participant must be allowed to start the game according to the lobby flow.
- Room must still be in `lobby` state.
- At least one eligible drawer and one starter word must be available.

## Error States

- Empty or whitespace-only player name: clear "player name is required" feedback.
- Start with no eligible drawer: clear "no eligible drawer" feedback.
- Start with no starter word: clear "no word available" feedback.
- Non-drawer first-round fetch: waiting state with no secret word value.
- Unknown or missing viewer: safe room snapshot with no secret word value.
