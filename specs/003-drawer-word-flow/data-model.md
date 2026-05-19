# Data Model: Phase 2 Drawer Word Flow

## Entity: Participant

- `id: string`
  Room-scoped participant identifier returned after create or join.
- `name: string`
  Trimmed display name from Phase 1.
- `joinedAt: string`
  ISO timestamp used for roster continuity.
- `role: "host" | "player"`
  Persistent Phase 1 lobby role. This remains the ownership/start-permission role,
  not the round role.

Validation rules:

- Participant identity remains room-scoped.
- Lobby role is assigned by the backend service, never by the client.

## Entity: Room

- `code: string`
  Exactly 4 uppercase characters from the easy-to-read alphabet.
- `status: "lobby" | "playing"`
  `lobby` before a valid start; `playing` after the first round begins.
- `hostId: string`
  Participant id of the room creator and start authority from Phase 1.
- `participants: Participant[]`
  Room-local roster.
- `drawerId?: string`
  Participant id of the single assigned drawer once the room starts.
- `guesserIds: string[]`
  Participant ids of every non-drawer participant once the room starts.
- `secretWord?: string`
  The deterministic active word for the started round.
- `createdAt: string`
  ISO timestamp of room creation.
- `updatedAt: string`
  ISO timestamp updated on joins and the start transition.

Validation rules:

- Only rooms in `lobby` status accept new joins.
- Only `hostId` can start the room.
- Start requires at least 2 participants.
- Starting the room must assign exactly one `drawerId`.
- Starting the room must assign every other participant id into `guesserIds`.
- Starting the room must select exactly one `secretWord`.

## Entity: RoomSnapshot

- `code: string`
- `status: "lobby" | "playing"`
- `hostId: string`
- `participants: Participant[]`
- `drawerId?: string`
  Visible to all players once the room is started.
- `viewerRole?: "drawer" | "guesser"`
  Explicit started-round role for the requesting participant.
- `secretWord?: string`
  Present only for drawer-visible started-room snapshots. Omitted entirely for
  guesser-visible snapshots.

Purpose:

- Returned by create, join, fetch, and start endpoints.
- Gives the frontend enough information to derive drawer identity, viewer role, and
  secret-word visibility without exposing the word to guessers.

## Relationships

- One `Room` has one `hostId` referencing exactly one `Participant.id`.
- One `Room` has many `Participant` entries.
- One started `Room` has exactly one `drawerId`.
- One started `Room` has `guesserIds` covering all non-drawer participants.
- One `RoomSnapshot` is a viewer-specific projection of one `Room`.

## State Transitions

### Room lifecycle

1. Create room -> `status = "lobby"`, host participant exists, no round fields yet.
2. Join room -> `status = "lobby"`, participant roster grows, no round fields yet.
3. Start room -> valid host changes `status` to `"playing"`, assigns `drawerId`,
   fills `guesserIds`, and stores `secretWord = "rocket"`.
4. Once `status = "playing"`, further joins are rejected in Phase 2 just as in
   Phase 1.

### Viewer-specific snapshot lifecycle

1. Lobby viewer -> snapshot contains lobby data only.
2. Drawer viewer after start -> snapshot contains started-room data plus
   `viewerRole = "drawer"` and `secretWord`.
3. Guesser viewer after start -> snapshot contains started-room data plus
   `viewerRole = "guesser"` and omits `secretWord`.

## Derived Frontend State

- `isHost = room.hostId === participantId`
- `isDrawer = room.drawerId === participantId`
- `viewerRoundRole = room.viewerRole ?? null`
- `drawerName = room.participants.find((participant) => participant.id === room.drawerId)?.name ?? null`
- `visibleSecretWord = room.secretWord ?? null`

## Invariants

- Before start:
  - `status === "lobby"`
  - `drawerId` absent
  - `guesserIds` empty
  - `secretWord` absent
- After start:
  - `status === "playing"`
  - `drawerId` present and equals `hostId`
  - `guesserIds.length === participants.length - 1`
  - `secretWord === "rocket"` while the starter list remains unchanged
