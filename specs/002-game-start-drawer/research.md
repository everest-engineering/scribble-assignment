# Research: Game Start & Drawer Flow

## Drawer Assignment Strategy

**Decision**: Assign the drawer by setting `drawerId = room.hostId` at game start.

**Rationale**: The spec requires the host (room creator) to always be the drawer. `hostId` is
already stored on the `Room` model from Feature Group 1. Using it directly avoids any ambiguity
about "first player" ordering and keeps the assignment deterministic.

**Alternatives considered**:
- `participants[0]` as drawer: Fragile — array order could change if the store is modified.
- Random selection: Explicitly ruled out — spec requires determinism.
- Separate drawer election endpoint: Overkill for a single-drawer, single-round game.

## Deterministic Word Selection

**Decision**: Always use `STARTER_WORDS[0]` ("rocket") as the secret word.

**Rationale**: The spec explicitly states "deterministically selected from the starter list."
The simplest correct interpretation of deterministic + first round is a fixed index of 0. This
is trivially testable: the expected value is always known.

**Alternatives considered**:
- Round index % word count: Adds complexity; only one round exists.
- Per-room seeded random: Unpredictable in tests without seed injection.

## Game State Storage

**Decision**: Add `drawerId: string` and `secretWord: string` fields to the `Room` model.
These are set when `POST /api/rooms/:code/start` is called (already implemented in FG1).

**Rationale**: The game screen needs to serve viewer-specific responses — the drawer sees the
word, guessers do not. The `toRoomSnapshot()` function already accepts `viewerParticipantId`
(currently a no-op); this feature activates that parameter.

**Alternatives considered**:
- Separate GameState entity: Unnecessary abstraction for a single-room, single-round model.
- Store word on frontend only: Insecure — any client could read it from state.

## Viewer-Specific Snapshot

**Decision**: The `GET /api/rooms/:code?participantId=<id>` endpoint already passes
`viewerParticipantId` to `toRoomSnapshot()`. Activate it: include `secretWord` in the snapshot
only when `viewerParticipantId === drawerId`.

**Rationale**: The server is the authority on who the drawer is. The frontend simply renders
what it receives — if `secretWord` is present in the snapshot, the viewer is the drawer.

**Alternatives considered**:
- Always send the word, hide it client-side: Security violation — any client-side hiding can
  be bypassed by inspecting network responses.
