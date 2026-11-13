# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `003-game-start-drawer-flow`

**Created**: 2026-06-01

**Status**: Draft

**Input**: Group 2 features (F6-F9) from document.md

## Clarifications

### Session 2026-06-01
- Q: Word Selection Algorithm → A: Always select the first word in the list (simplest deterministic approach)
- Q: Role Storage in Data Model → A: Add role field to each Participant object
- Q: Secret Word API Response Filtering → A: Role-based filtering in toRoomSnapshot()
- Q: Role Assignment Timing → A: Immediately on POST /rooms/:code/start response
- Q: Default Name Handling on Validation Failure → A: Reject with 400 Bad Request

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Name Validation on Game Start (Priority: P1)

As a player starting a game, I want the system to validate that I've entered a proper name (non-empty, not whitespace-only) before the game can begin. Empty or invalid names should be rejected with a clear error message.

**Why this priority**: Prevents broken player state and ensures all participants have valid display names in the game scoreboard.

**Independent Test**: Attempt to start a game with empty name, observe error message; correct the name and verify game can start.

**Acceptance Scenarios**:

1. **Given** a player is on the Create Room page, **When** they submit with an empty name field, **Then** the form shows a validation error and does not navigate away.
2. **Given** a player is on the Create Room page, **When** they submit with whitespace-only name (e.g., "   "), **Then** the form shows a validation error.
3. **Given** a player is on the Create Room page, **When** they enter a valid name (trimmed), **Then** the form submission succeeds.
4. **Given** a player is on the Join Room page, **When** they submit with an empty name, **Then** the form shows a validation error.
5. **Given** a player is on the Join Room page, **When** they submit with a valid name, **Then** the room is joined successfully.

---

### User Story 2 - Drawer Role Assignment on Game Start (Priority: P1)

As a game host who clicks "Start Game", I want the system to automatically assign me the `drawer` role and assign all other players the `guesser` role, ensuring each player knows their role when the game begins.

**Why this priority**: Defines player responsibilities and controls game flow. Drawer must see the secret word; guessers must not.

**Independent Test**: Host clicks "Start Game" with 2+ players in lobby; verify host is assigned `drawer` role and guests are assigned `guesser` roles in the game state.

**Acceptance Scenarios**:

1. **Given** the host is in a lobby with 2+ participants, **When** the host clicks "Start Game", **Then** the host is assigned the `drawer` role.
2. **Given** the host is in a lobby with 2+ participants, **When** the host clicks "Start Game", **Then** all non-host participants are assigned the `guesser` role.
3. **Given** a game has started with role assignments, **When** a player loads the game page, **Then** their assigned role is visible in the player info section.

---

### User Story 3 - Deterministic Secret Word Selection (Priority: P1)

As a game host starting a game, I want the system to select a secret word for this round from the provided word list in a consistent, repeatable way (e.g., always the first word, or based on a seed). This ensures the drawer and backend agree on the secret word without needing to transmit it separately.

**Why this priority**: Enables drawer-only word visibility without complex synchronization or API calls to fetch the word.

**Independent Test**: Start multiple games and verify the same word is selected given the same starting conditions, or that a deterministic pattern is followed (e.g., first word, round-robin, hash-based).

**Acceptance Scenarios**:

1. **Given** a game is being started, **When** the backend selects a word for the round, **Then** the word is chosen from the starter word list (e.g., `rocket`, `pizza`, `castle`, `guitar`, `sunflower`).
2. **Given** the starter word list, **When** a word is selected, **Then** the selection is deterministic (repeatable under the same conditions).
3. **Given** a word has been selected for a round, **When** the game state is created, **Then** the word is stored in the backend room state (not visible to all players).

---

### User Story 4 - Drawer-Only Word Visibility (Priority: P1)

As a drawer, I want to see the secret word on my game screen so I can begin drawing. As a guesser, I must not see the secret word under any circumstances, only the canvas and the guess input.

**Why this priority**: Core game mechanic — guessers must not know the answer. Prevents cheating and maintains game integrity.

**Independent Test**: Open two browser tabs as host (drawer) and guest (guesser). Start game. Verify host sees the secret word and guest does not.

**Acceptance Scenarios**:

1. **Given** a game has started and I am the drawer, **When** I load the game page, **Then** the secret word is displayed on my screen (e.g., in a card labeled "Secret Word" or similar).
2. **Given** a game has started and I am a guesser, **When** I load the game page, **Then** the secret word is not displayed anywhere on my screen.
3. **Given** the drawer is viewing the game page, **When** they view the page source or network requests, **Then** the secret word is visible (not hidden in a hidden HTML element).
4. **Given** a guesser is viewing the game page, **When** they view the page source or network requests, **Then** the secret word is not transmitted to the client (role-based filtering on the backend).

---

### Edge Cases

- **Empty Name on Backend**: If an invalid name somehow reaches the backend (e.g., frontend validation bypassed), the backend rejects with 400 Bad Request and does NOT auto-assign a fallback name like "Player". Data integrity is maintained by rejecting at the boundary.
- **Drawer Role Changes Mid-Round**: If the drawer leaves or disconnects during a round, the round should terminate and players should be redirected (handled by future "Game Round Interruption" feature).
- **Role Mismatch on Page Reload**: If a player reloads the game page, they should see the same role and word visibility as before (round state must be fetched from backend).
- **Word List Exhaustion**: If all words have been used across multiple rounds, selection behavior is undefined (out of scope for single-round v1).
- **Empty Word List**: If no words are available, behavior is undefined (covered by assumption of non-empty starter list).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reject empty or whitespace-only player names on the Create Room and Join Room pages with a visible error message. Frontend validation MUST prevent form submission; backend Zod schema MUST also reject with 400 Bad Request.
- **FR-002**: System MUST trim leading and trailing whitespace from player names before storing them. This trimming occurs before validation, so "   " (spaces only) is rejected as empty.
- **FR-003**: System MUST assign the host the `drawer` role when `POST /rooms/:code/start` is invoked.
- **FR-004**: System MUST assign all non-host participants the `guesser` role when the game starts.
- **FR-005**: System MUST select the first word from the starter word list as the secret word when a game begins.
- **FR-006**: System MUST include the secret word in the room snapshot returned to the drawer only via role-based filtering in `toRoomSnapshot(room, requestingParticipantId)`. Roles are assigned synchronously when `POST /rooms/:code/start` is invoked.
- **FR-007**: System MUST NOT include the secret word in the room snapshot returned to guessers. Role assignments are immediately reflected in all subsequent API responses.
- **FR-008**: Frontend MUST display the secret word prominently for the drawer on the Game page.
- **FR-009**: Frontend MUST NOT display the secret word anywhere on the Game page for guessers.

### Key Entities

- **Game Round**: Represents an active game round. Has `secretWord` (string), `startedAt` (timestamp).
- **Participant**: Extended with `role: "drawer" | "guesser"` field when game is active. Role determines secret word visibility and game responsibilities.
- **Room Status**: Extends existing Room model. When `status === "game"`, all participants have role assignments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Player name validation errors display within 200ms of form submission.
- **SC-002**: Role assignments are visible to players within 2.5 seconds of game start (constrained by polling interval).
- **SC-003**: Drawer sees the secret word on their game page; guesser does not see it under any viewing method (page source, network tab).
- **SC-004**: Secret word selection is deterministic — the same word is selected given identical starting conditions.
- **SC-005**: Role-based visibility is enforced — backend API returns different snapshots to drawer vs. guesser, preventing cheating via network inspection.

## Assumptions

- Player names are single strings with no special delimiters; trimming removes only leading/trailing whitespace and occurs before validation (post-trim empty names are rejected, no fallback to "Player").
- The starter word list is non-empty and immutable for a single game round.
- Word selection always uses the first word from the starter word list (e.g., `rocket` for the first game in a fresh room).
- The `GET /rooms/:code` endpoint uses role-based filtering: `toRoomSnapshot(room, participantId)` returns the secret word only if `participantId` is the drawer.
- Role assignments occur synchronously in the `POST /rooms/:code/start` handler and are included in the start response; players discover their role when they fetch room state after redirecting to `/game`.
- Network connectivity and polling are working correctly (per Spec 002 lobby polling assumptions).
- Game page is only accessible after room status transitions to `"game"` (per Spec 002 start-game logic).
