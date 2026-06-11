# Research: Game Start & Drawer Flow

## Decision 1: Drawer Assignment Algorithm

- **Decision**: Host (earliest-joined participant that created the room) is assigned as drawer.
- **Rationale**: Matches FR-001 and simplifies deterministic rule. Host is always the first participant.
- **Alternatives considered**: First non-host (current buggy behavior), random assignment (violates determinism), round-robin (overkill for single round).

**Implementation impact**: Fix `startRoom()` in `roomStore.ts` — change `const drawer = participants.find(p => p.id !== hostId)` to `const drawer = participants.find(p => p.id === hostId)`.

## Decision 2: Word Selection Algorithm

- **Decision**: Index-based on room code's character code sum modulo 5.
  - `const wordIndex = room.code.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % STARTER_WORDS.length`
- **Rationale**: Deterministic (same room code → same word every time). Uses immutable room code (created at room creation, never changes). Guarantees in-range index for a list of 5 words.
- **Alternatives considered**: `STARTER_WORDS[0]` always (current — too predictable, not state-dependent), round-robin via round counter (only one round in scope), random (violates determinism), participant count (changes if players leave/join).

## Decision 3: Game State Polling Cadence

- **Decision**: ~2 seconds, matching the existing lobby polling cadence.
- **Rationale**: Consistent UX, reuses existing `RoomStore.startPolling()` and `fetchRoom()`.
- **Alternatives considered**: 1s (too aggressive for 8-player room), 3s (stale for rapid game start transition).

## Decision 4: Canvas Implementation

- **Decision**: Native HTML5 `<canvas>` element wrapped in a React component, with basic brush (freehand drawing) and color picker (predefined palette of 8 colors).
- **Rationale**: Zero dependencies, lightweight, consistent with "no new libraries" constraint.
- **Alternatives considered**: SVG (slower for freehand), external library (violates no-new-libraries constraint), div-based pixel grid (too complex).

## Decision 5: Word Visibility Enforcement

- **Decision**: Server-side filtering in `toRoomSnapshot()` — strip `secretWord` from snapshot when `viewerParticipantId` does not match the drawer's participant ID.
- **Rationale**: Single source of truth. Client-side hiding is bypassable.
- **Alternatives considered**: Client-only hide (insecure), separate endpoint per role (unnecessary complexity).

## Decision 6: Non-Drawer Draw Rejection

- **Decision**: Backend validates drawer identity on draw endpoint (to be added in gameplay interaction feature). For this feature, frontend disables canvas controls for non-drawer roles.
- **Rationale**: Defense-in-depth — UI hides controls AND backend will reject unauthorized draw actions when the endpoint is built.
