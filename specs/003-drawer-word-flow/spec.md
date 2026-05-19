# Feature Specification: Phase 2 Drawer Word Flow

**Feature Branch**: `003-drawer-word-flow`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "I am starting Phase 2 of the Scribble lab. Phase 1 (R1–R5, G1) is complete. This phase covers game start and drawer flow — features G2, G3, and G4.

Before writing the spec, do discovery first. Read these files and note what already exists vs what's missing now that Phase 1 is in place:
- backend/src/models/game.ts
- backend/src/services/roomStore.ts
- backend/src/api/rooms.ts
- backend/src/api/schemas.ts
- backend/src/seed/starterData.ts
- frontend/src/pages/GamePage.tsx
- frontend/src/pages/LobbyPage.tsx
- frontend/src/state/roomStore.ts
- frontend/src/services/api.ts

Pay special attention to:
- The Room and Participant data shapes added in Phase 1 (hostId, role, RoomStatus values)
- The start-game endpoint added in Phase 1 — Phase 2 extends what happens when it runs
- The toRoomSnapshot helper in roomStore.ts and how it currently treats the viewer ID
- The starter word list in seed/starterData.ts

Then write a feature specification for Phase 2 covering:

G2 — Drawer assignment: When the host starts the game, the host (or first player, if your spec documents that rule) becomes the drawer for the round. The drawer identity is clearly visible to all players in the room.

G3 — Secret word selection: When the round starts, the system selects a secret word deterministically. The default rule is the first item in the starter word list (rocket). If your spec adopts a different deterministic rule, it must apply consistently across all validation cases.

G4 — Secret word visibility: The secret word is visible only to the assigned drawer. Guessers must not be able to retrieve the secret word through any room snapshot or API response they can access.

For each feature, include:
- Acceptance criteria
- Edge cases discovered during inspection
- Discovery notes — what already works in the starter (including Phase 1 additions), what is missing or broken

Stay strictly within these features. Do not include drawing interaction, clear canvas, guess submission, scoring, result state, or restart — those are for Phase 3 and Phase 4.

Out of scope (do not include in this spec): WebSockets, live drawing stroke broadcast, persistent storage, authentication, multiple rounds, drawer rotation, timers, custom or random word packs."

## Clarifications

### Session 2026-05-19

- Q: How should guesser-visible room data represent the secret word? → A: Guesser-visible room data omits the secret word field entirely; only the drawer receives it.
- Q: How should non-drawers be represented when the round starts? → A: When the round starts, the assigned drawer is marked as `drawer` and every other player in that room is marked as `guesser`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a Round With a Visible Drawer (Priority: P1)

As a player in a ready lobby, I want the game start action to assign a single drawer
for the round and show that drawer clearly to everyone so the room immediately knows
who is drawing.

**Why this priority**: The round cannot begin coherently unless all players share the
same drawer identity as soon as the game starts.

**Independent Test**: Create a room with at least two players, start the game as the
host, and confirm that every player sees the same assigned drawer identity after the
room leaves the lobby.

**Acceptance Scenarios**:

1. **Given** a room is still in the lobby with at least two players, **When** the
   host starts the game, **Then** the room enters the playing state and the host
   becomes the drawer for that round, and every other player in that room becomes a
   guesser for that round.
2. **Given** the round has started successfully, **When** any player views the room,
   **Then** the assigned drawer identity is visible and consistent for everyone in
   that room.
3. **Given** a player is not in the started room, **When** they view another room,
   **Then** they never see drawer information from a different room.

**Edge Cases Discovered During Inspection**:

- The room creator is also the host from Phase 1, so the drawer rule must remain
  consistent with that existing ownership model.
- The current start flow only changes the room status to playing, so drawer identity
  is otherwise undefined after the transition.
- The current participant `role` field represents lobby ownership (`host` or
  `player`), not the round-specific drawer versus guesser role players need after
  the game starts.

**Discovery Notes**:

- Phase 1 already enforces host-only start and the two-player minimum before the
  room can leave the lobby.
- The starter already has a `playing` room status and a game route, so the round
  transition shell exists.
- The starter does not currently assign a round drawer or display that identity in
  the game view.

---

### User Story 2 - Start With a Deterministic Secret Word (Priority: P2)

As a player entering the started round, I want the round to use one deterministic
secret word so all validation and manual checks produce the same result every time.

**Why this priority**: A stable, predictable word-selection rule is necessary before
word visibility can be validated or demonstrated reliably.

**Independent Test**: Start multiple fresh rooms and confirm that each new round
uses the same word-selection rule, which picks `rocket` from the starter word list
for this phase.

**Acceptance Scenarios**:

1. **Given** a room starts its first round, **When** the round state is created,
   **Then** the secret word is selected deterministically using the first available
   starter word.
2. **Given** separate rooms start under the same Phase 2 rules, **When** each room
   begins its first round, **Then** they receive the same deterministic secret word.
3. **Given** the starter word list remains unchanged, **When** manual validation is
   repeated, **Then** the selected word remains `rocket`.

**Edge Cases Discovered During Inspection**:

- The starter word list already exists and begins with `rocket`, so the selection
  rule must align with that list rather than introduce randomness.
- The current room snapshot exposes the full starter word list to every viewer,
  which conflicts with the need for a single active secret word.
- If the deterministic rule changes later, all validation cases would need the same
  rule; this phase assumes the first starter word without any rotation or packs.

**Discovery Notes**:

- The starter data already provides a shared word list for the game.
- Phase 1 did not choose or store any active round word when the host started the
  game.
- The current game page does not display a selected word because no round word is
  tracked yet.

---

### User Story 3 - Reveal the Secret Word Only to the Drawer (Priority: P3)

As a player in the started round, I want only the assigned drawer to see the secret
word so guessers cannot learn the answer from the room state they are allowed to
access.

**Why this priority**: Hidden word visibility is the core game-state privacy rule
for the round and must be correct before any later guessing mechanics can build on
top of it.

**Independent Test**: Start a room with two players, inspect the drawer and
guesser views separately, and confirm that only the drawer can see the secret word
while guessers still see the drawer identity.

**Acceptance Scenarios**:

1. **Given** the round has started, **When** the assigned drawer views the room,
   **Then** the secret word is visible to that drawer.
2. **Given** the round has started, **When** any guesser views the room, **Then**
   the secret word is not present in that guesser-visible room data or screen, and
   no secret-word field is returned to that guesser at all.
3. **Given** different players request room state for the same started room,
   **When** the drawer and a guesser compare what they can access, **Then** both
   see the same drawer identity but only the drawer can retrieve the secret word.

**Edge Cases Discovered During Inspection**:

- The room snapshot helper currently ignores the viewer identity, so every viewer
  would receive identical room data unless Phase 2 changes that behavior.
- The current room snapshot includes `availableWords`, which would let guessers
  inspect the starter list even when only one word should matter to the drawer.
- The current game page derives the viewer from `participantId`, so drawer-only
  visibility must remain aligned with that existing viewer-specific session model.

**Discovery Notes**:

- Phase 1 already passes the viewer participant ID through room fetches, which is a
  useful starting point for viewer-specific round visibility.
- The current backend does not use the viewer ID when building room snapshots, so
  there is no secrecy yet.
- The current frontend can identify the viewer participant locally, but it does not
  receive drawer-only word data and therefore cannot render this distinction.

### Edge Cases

- The host starts the game after Phase 1 validation succeeds, but no round-specific
  drawer has been assigned yet.
- A player refreshes after the room has moved to the playing state and must still
  see the same drawer identity as everyone else in that room.
- Two separate rooms start independently; each room must assign its own drawer and
  word without leaking either to the other room.
- The started room still needs to distinguish the host's lobby ownership from the
  drawer's round responsibility without confusing the two concepts.
- A guesser fetches room state directly after the round starts; the active secret
  word must still remain unavailable in every room view that guesser can access,
  and guesser-visible data must omit any secret-word field entirely.
- The drawer refreshes the game page after the round starts and must still receive
  the same secret word rather than a different or missing value.

## Constitution Alignment *(mandatory)*

- **Typed Contract Impact**: Room and room-view data will expand to represent the
  started round's drawer identity and drawer-only word visibility while preserving
  existing host identity and lobby roles from Phase 1.
- **Validation Boundaries**: The start transition must validate room state changes
  from lobby to playing, deterministic word assignment, drawer assignment, and
  viewer-specific word visibility.
- **State & Storage Impact**: Room state remains in-memory and room-scoped. Phase 2
  adds only the minimum started-round state needed for a single drawer and one
  deterministic secret word.
- **Scope Guardrail**: This specification is limited to drawer assignment, one
  deterministic secret word, and drawer-only word visibility during the first
  started round. Drawing actions, guessing, scoring, results, restart, timers,
  multiple rounds, rotation, live transport, persistence, and authentication remain
  out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (G2)**: When a valid lobby starts the game, the system MUST assign a
  single drawer for the round.
- **FR-002 (G2)**: For Phase 2, the system MUST assign the host as that drawer.
- **FR-003 (G2)**: The system MUST make the assigned drawer identity visible and
  consistent for every player in the same started room.
- **FR-004 (G2)**: When the round starts, the system MUST mark every non-drawer in
  that room as a guesser for that same round.
- **FR-005 (G2)**: The system MUST keep drawer assignment isolated to the room that
  started and MUST NOT expose one room's drawer identity in another room.
- **FR-006 (G3)**: When a round starts, the system MUST select exactly one secret
  word for that round.
- **FR-007 (G3)**: For Phase 2, the system MUST select the secret word
  deterministically as the first item in the starter word list.
- **FR-008 (G3)**: The deterministic selection rule MUST produce `rocket` while the
  starter word list remains unchanged from discovery.
- **FR-009 (G3)**: Repeating the same Phase 2 validation in separate fresh rooms
  MUST produce the same secret word under the same starter list.
- **FR-010 (G4)**: The assigned drawer MUST be able to view the secret word after
  the round starts.
- **FR-011 (G4)**: Guessers MUST NOT be able to retrieve the secret word from any
  room snapshot, room refresh, or room-related response available to them.
- **FR-012 (G4)**: Guesser-visible room data MUST omit the secret-word field
  entirely instead of returning it with an empty, null, or masked value.
- **FR-013 (G4)**: Non-secret round information needed by all players, including the
  drawer identity and started-room status, MUST remain visible to every player in
  that room.
- **FR-014 (G4)**: Viewer-specific room data MUST stay consistent across refreshes,
  so the drawer continues to see the same secret word and guessers continue not to
  see it for the same active round.

### Key Entities *(include if feature involves data)*

- **Started Round**: The first active round created when a valid lobby leaves the
  lobby state, carrying one assigned drawer, guesser assignments for every other
  participant, and one deterministic secret word.
- **Drawer Assignment**: The room-scoped designation of which participant is drawing
  for the active round and whose identity is visible to all room members.
- **Guesser Assignment**: The room-scoped designation automatically applied to every
  non-drawer participant in the active round.
- **Viewer-Specific Room View**: The player-visible room state for a started room,
  which is shared across players except for the secret word that is revealed only to
  the drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of successful start-round attempts, exactly one drawer is
  assigned and that drawer is the host.
- **SC-002**: In manual verification with at least two simultaneous players, 100%
  of players in the same room can identify the same drawer immediately after the
  game starts.
- **SC-003**: In repeated fresh-room validation using the unchanged starter word
  list, 100% of started rounds select `rocket` as the secret word.
- **SC-004**: In manual verification with a drawer and at least one guesser, 100%
  of drawer views reveal the secret word and 100% of guesser-accessible room views
  do not reveal it.
- **SC-005**: In manual verification with two concurrent rooms, no drawer identity
  or secret word from one room appears in the other room's player-visible state.

## Assumptions

- The host remains the first and only eligible drawer for the single started round
  covered by Phase 2.
- The starter word list continues to be the only available source of round words in
  this phase.
- Each room supports only one active round and one active secret word during Phase
  2; multiple rounds and drawer rotation are deferred.
- Players continue to identify themselves through the room-scoped participant ID
  already established in Phase 1.
- The game page is the main player view after the room leaves the lobby, and later
  gameplay mechanics will extend that view in future phases.

## Verification Plan *(mandatory)*

- **Build Validation**: Verify the changed application still supports room start,
  lobby exit, room refresh, and game-page entry across all affected app surfaces
  before handoff.
- **Story Validation**: Validate each user story independently: start a room and
  confirm host drawer assignment, confirm deterministic `rocket` selection across
  fresh rooms, and confirm drawer-only secret word visibility with separate drawer
  and guesser sessions.
- **Manual Multiplayer Checks**: Use at least two simultaneous player sessions and
  at least two separate rooms to verify started-room drawer visibility, room
  isolation, deterministic word selection, and secret-word privacy for guessers.
