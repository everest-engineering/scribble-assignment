# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: *(continues on current branch; no new branch required)*

**Created**: 2026-05-29

**Status**: Draft

**Input**: Scenario 2 from README — Game Start & Drawer Flow: when a game is starting, player names are trimmed (empty/whitespace-only rejected with a message); when the first round begins, the host becomes the clearly-identified drawer; the secret word is deterministically selected from the starter list and visible only to the drawer.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Names Are Validated at Entry (Priority: P1)

A player entering the game (creating or joining a room) must provide a non-empty display name after trimming whitespace. Invalid names are rejected with a clear message before the player enters a room.

**Why this priority**: Name validation prevents anonymous or blank participants from polluting the lobby and game views. It is a prerequisite for meaningful drawer identification.

**Independent Test**: On create-room and join-room forms, submit whitespace-only or empty names and confirm rejection with a message; submit a trimmed valid name and confirm entry succeeds.

**Acceptance Scenarios**:

1. **Given** a player on the create-room form, **When** they submit a name consisting only of whitespace, **Then** the request is rejected with a clear message and no room is created.
2. **Given** a player on the create-room form, **When** they submit a name with leading or trailing spaces around a valid word, **Then** the name is stored trimmed (e.g., `" Alice "` becomes `"Alice"`).
3. **Given** a player on the join-room form, **When** they submit an empty or whitespace-only name, **Then** the join is rejected with a clear message before any room lookup.
4. **Given** a player on the join-room form, **When** they submit a trimmed valid name and valid room code, **Then** they join with the trimmed name displayed in the participant list.

---

### User Story 2 - First Round Assigns a Single Drawer (Priority: P2)

When the host successfully starts the game (room leaves lobby), the first round begins with exactly one drawer and all other participants as guessers. The drawer is clearly identified to every client.

**Why this priority**: Role assignment is the core mechanic that separates who draws from who guesses; without it, the game cannot proceed to gameplay.

**Independent Test**: Two-tab test after host start — both tabs see the same participant marked as drawer; exactly one drawer exists; all others are guessers.

**Acceptance Scenarios**:

1. **Given** a room that has just transitioned from lobby to active play with at least two participants, **When** clients view the game, **Then** exactly one participant is designated as the drawer.
2. **Given** the room host started the game, **When** the first round begins, **Then** the host (room creator) is the drawer for that round.
3. **Given** multiple clients viewing the same active room, **When** they poll or load the game snapshot, **Then** all clients agree on the same drawer identity.
4. **Given** a non-drawer participant viewing the game, **When** they inspect the participant list or role indicators, **Then** the drawer is clearly distinguished from guessers.

---

### User Story 3 - Secret Word Is Chosen Deterministically (Priority: P3)

When the first round begins, the system selects one secret word from the fixed starter word list using a deterministic rule (not random per request). The same room always receives the same word for its first round.

**Why this priority**: Deterministic word selection enables reproducible testing and aligns with lab evaluation expectations.

**Independent Test**: Start the same room twice (fresh backend, recreate with known conditions if needed) or unit-test the selection rule — the chosen word is always from the starter set and follows the documented deterministic mapping.

**Acceptance Scenarios**:

1. **Given** a room entering its first round, **When** the secret word is selected, **Then** the word is one of: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`.
2. **Given** two identical room-start conditions (same room code and starter list), **When** the first round begins, **Then** the same secret word is selected every time.
3. **Given** a room in active play, **When** any client polls the room snapshot, **Then** the server holds a single authoritative secret word for that round (not re-rolled on each poll).

---

### User Story 4 - Secret Word Visible Only to the Drawer (Priority: P4)

The drawer sees the secret word on their game view. Guessers never see the word in the UI or in server responses intended for their participant identity.

**Why this priority**: Asymmetric information is the foundation of the drawing-and-guessing loop; leaking the word to guessers breaks the game.

**Independent Test**: Two-tab test with host (drawer) and joiner (guesser) — drawer tab shows the word; guesser tab does not; guesser cannot obtain the word by polling.

**Acceptance Scenarios**:

1. **Given** a participant who is the drawer, **When** they view the active game screen, **Then** the secret word is displayed prominently on their client.
2. **Given** a participant who is a guesser, **When** they view the active game screen, **Then** the secret word is not visible anywhere on their client.
3. **Given** a guesser polling the room snapshot with their own participant identity, **When** the server returns the game snapshot, **Then** the secret word field is omitted or null for that viewer.
4. **Given** the drawer polling with their participant identity, **When** the server returns the game snapshot, **Then** the secret word is included for that viewer only.

---

### User Story 5 - Active Game Stays Synchronized via Polling (Priority: P5)

While a round is active, clients on the game view receive updated role and word visibility (for the drawer) through the same HTTP polling pattern used in the lobby (~2 seconds).

**Why this priority**: Multi-client consistency for roles and drawer-only word visibility must hold under polling, not only on initial navigation.

**Independent Test**: After start, both tabs on the game view converge on the same drawer and word visibility rules within one poll cycle without manual refresh.

**Acceptance Scenarios**:

1. **Given** clients on the game view during an active round, **When** polling runs on an interval of approximately 2 seconds, **Then** role assignments remain consistent across clients.
2. **Given** a drawer and a guesser both polling, **When** each receives a snapshot, **Then** word visibility rules from User Story 4 are preserved on every poll response.

---

### Edge Cases

- **Whitespace-only name on create**: Rejected client- and server-side; no room created.
- **Whitespace-only name on join**: Rejected before join; room unchanged.
- **Name trim preserves inner spaces**: `"Big Bird"` remains valid after trim.
- **Single drawer invariant**: Never zero or two drawers assigned for the first round.
- **Host is drawer**: Joining players are never the drawer in the first round (no rotation in this scenario).
- **Word leak prevention**: Guessers cannot learn the word from snapshot responses, error messages, or UI placeholders meant for the drawer.
- **Poll during active game**: Temporary poll failure surfaces a non-crashing error; polling continues on subsequent intervals.
- **Start without valid names**: If legacy participants exist with blank names from before validation, new validation applies to new create/join attempts only (no retroactive rename required in Scenario 2).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from player names on room create and join before validation and storage.
- **FR-002**: System MUST reject create-room attempts when the trimmed player name is empty and display a clear, user-visible message.
- **FR-003**: System MUST reject join-room attempts when the trimmed player name is empty and display a clear, user-visible message.
- **FR-004**: System MUST assign exactly one drawer and all other participants as guessers when the first round begins after a successful game start.
- **FR-005**: System MUST assign the room host as the drawer for the first round.
- **FR-006**: System MUST expose the drawer role clearly in the game view for all participants (e.g., role label or badge on the designated drawer).
- **FR-007**: System MUST select the secret word deterministically from the starter list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) when the first round begins.
- **FR-008**: System MUST NOT use random or custom word sources outside the starter list.
- **FR-009**: System MUST include the secret word in server responses to the drawer participant only.
- **FR-010**: System MUST omit or null the secret word in server responses to non-drawer participants.
- **FR-011**: System MUST display the secret word on the drawer's game view and MUST NOT display it on guessers' game views.
- **FR-012**: System MUST automatically refresh active-game state for clients on the game view on an interval of approximately 2 seconds while the round is active.
- **FR-013**: System MUST keep drawer assignment and word visibility consistent across all clients viewing the same room on each poll cycle.
- **FR-014**: System MUST surface API and validation errors in the UI without crashing the client.

### Key Entities

- **Round (first round only)**: The active drawing period after lobby; has a designated drawer participant id, a deterministic secret word, and participant roles (`drawer` | `guesser`).
- **Participant role**: Each participant has exactly one role during the active round — one `drawer`, all others `guesser`.
- **Game snapshot**: Client-visible room state during active play — participant list with roles, drawer indicator, and viewer-specific secret word visibility.
- **Starter word list**: Fixed set of five words; sole source for secret word selection in Scenario 2.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of create/join attempts with empty or whitespace-only names are rejected with an explicit error message.
- **SC-002**: 100% of first-round starts assign exactly one drawer who is the room host.
- **SC-003**: 100% of secret words selected for first rounds belong to the starter list of five words.
- **SC-004**: The same room code always maps to the same starter-list word across repeated deterministic selection tests.
- **SC-005**: 0% of guesser clients receive the secret word in poll responses or UI during manual two-tab validation.
- **SC-006**: 100% of drawer clients see the secret word on the game view within one poll cycle after game start.
- **SC-007**: Drawer identity is identical across all connected clients within one poll cycle after game start.

## Assumptions

- **Scenario 1 dependency**: Room host, game start preconditions (≥2 players), lobby-to-playing transition, and HTTP polling infrastructure are implemented per `specs/001-room-setup-lobby/spec.md`.
- **First round only**: Scenario 2 covers a single round with no drawer rotation, second rounds, or round-end flow (Scenario 4).
- **Drawer = host**: The room host (creator) is the drawer for the first round; README phrasing "host (or first player)" resolves to host because the host is always the first participant.
- **Deterministic selection**: Word index is derived deterministically from room identity (e.g., room code) against the ordered starter list; exact formula is defined in plan/tasks, but behavior must be reproducible and testable.
- **Game view route**: Active play uses the existing game page route; navigation from lobby after start is already established in Scenario 1.
- **Scores and canvas**: Score initialization at zero, drawing, guesses, and scoring belong to Scenario 3; Scenario 2 may show placeholder UI but must not require interactive drawing or guess submission.
- **Constitution alignment**: HTTP polling only (~2s), in-memory rooms, Zod validation, starter word list only, Vitest for pure logic, two-tab manual validation.

## Out of Scope (Explicit Reminders)

The following MUST NOT appear in implementation work for this scenario:

- **Transport**: WebSockets, Socket.io, SSE, or any real-time push protocol — HTTP polling only.
- **Persistence**: Databases or durable storage across server restarts.
- **Identity**: Authentication, accounts, sessions, JWT, or OAuth.
- **Lobby behavior**: Room create/join codes, host-only start, lobby polling — owned by Scenario 1 except name validation added here.
- **Gameplay interaction**: Interactive drawing, clear canvas, guess submission, guess history sync, scoring (Scenario 3).
- **Round lifecycle beyond first round**: Multiple rounds, drawer rotation, timers, countdowns, speed bonuses, drawer bonuses.
- **Content**: Custom or random word packs beyond the starter list.
- **Results and restart**: Result screen, reveal word to all, restart to lobby (Scenario 4).
- **Social/moderation**: Spectators, kick, mute, room passwords.
- **Infrastructure**: Deployment, CI, Docker, new top-level dependencies without plan justification.

**Boundary note**: Scenario 2 begins when the room enters active play after Scenario 1 start. Scenario 3 owns drawing, guessing, and scoring once roles and word visibility are established.
