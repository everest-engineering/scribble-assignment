# Feature Specification: Game Start and Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-05-19

**Status**: Draft

**Input**: Scenario 2: Game Start And Drawer Flow - drawer assignment, secret word selection, name validation at game start

## Clarifications

### Session 2026-05-19

- Q: Should Round be an explicit domain entity or just fields on Room? → A: Round is a core game concept — multiple rounds exist per game. Round MUST be modeled as an explicit entity (number, drawer, secret word, status) with Room holding a reference to the current active round. This round-1 implementation creates the Round entity; multi-round lifecycle, round transitions, and drawer rotation are deferred to future scenarios.
- Q: What happens if the drawer disconnects immediately after game start? → A: Simple but functional handling — if the drawer disconnects before any drawing occurs, the game aborts and all remaining players are returned to the lobby. This keeps the game from getting stuck.
- Q: When is the secret word selected and the Round entity created? → A: Atomically with game start. The word is selected and Round created in the same server call that transitions room status to "active". All subsequent room snapshots include the round info (word filtered per viewer role).
- Q: What should guessers see on the game screen in place of the secret word? → A: A placeholder with animation or a simple fun meme/illustration (e.g., waiting graphic) that indicates the round has started without revealing the word. Avoids a blank or confusing empty state.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Game Starts with Drawer and Word (Priority: P1)

When the host starts a game with 2+ valid players, the game transitions from lobby to active. The host is assigned as the drawer for round 1, a secret word is deterministically selected from the starter list, and the word is shown only to the drawer. All players see who the drawer is.

**Why this priority**: This is the core game flow — without drawer assignment and word selection, no gameplay can happen.

**Independent Test**: A host with 2+ players starts the game, sees themselves identified as drawer with a visible secret word; the other player sees the drawer identified but no word.

**Acceptance Scenarios**:

1. **Given** a room has 2+ participants, **When** the host starts the game, **Then** the host is assigned as drawer, a secret word is selected from the starter list, and the word is visible only to the host.
2. **Given** a game has started, **When** a non-host participant views the game screen, **Then** they see the host clearly identified as "Drawer" but do NOT see the secret word.
3. **Given** the same room is started twice with identical conditions, **When** round 1 begins, **Then** the same word is selected both times.

---

### User Story 2 - Scaled Word List and Drawer Isolation (Priority: P2)

The starter word list contains enough variety for replayability. The drawer's secret word is never exposed to guessers through any API response or UI element.

**Why this priority**: Word variety prevents repetition and guessing by elimination. Word isolation is essential for fair gameplay.

**Independent Test**: A guesser cannot discover the secret word through the API or UI in any way.

**Acceptance Scenarios**:

1. **Given** a game has started, **When** a guesser calls any API endpoint, **Then** the secret word is never included in the response.
2. **Given** the starter list, **When** a new game begins, **Then** the selected word comes from a list of at least 20 unique words.

### Edge Cases

- What happens when the host has an invalid (empty/whitespace) name at game start? The game start is rejected with a message explaining that player names must be valid. (Note: this should not occur during normal flow since names are validated on create/join, but serves as a safety check.)
- What if only 2 players are in the room when the game starts? The host is the drawer, the other player is the guesser — this is valid.
- Can a player join after the game has started? Not in scope for this scenario (room remains "active" and join is already rejected for active rooms).
- What if the word list is accidentally empty? Game start should fail gracefully.
- What if the drawer/host disconnects immediately after game starts (before drawing)? The game aborts and remaining players are returned to the lobby state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reject game start if ANY participant's trimmed name is empty or consists only of whitespace, with an inline message stating "All players must have a valid name to start the game".
- **FR-002**: System MUST assign the host as the drawer for round 1 when the game starts.
- **FR-003**: System MUST display a "Drawer" label or indicator next to the drawer's name to all participants, visible on the game screen.
- **FR-004**: System MUST select a secret word deterministically from the starter word list when round 1 begins. The selection MUST produce the same word for the same room code on every start.
- **FR-005**: System MUST expose the secret word ONLY to the drawer participant — guessers MUST NOT see the word in any API response or UI element.
- **FR-006**: System MUST maintain a starter word list of at least 20 unique, common, drawable words (nouns and simple concepts).
- **FR-007**: System MUST expand the current 5-word starter list to meet the FR-006 minimum before this feature is complete.
- **FR-008**: System MUST NOT allow game start if the starter word list is empty — return a 503 error with message "Game cannot start: word list is unavailable".

### Key Entities *(include if feature involves data)*

- **Round**: First-class entity representing a single drawing round within a game. Has a round number (integer), drawer participant ID, secret word, status (drawing, judging, complete). Room holds a reference (currentRound) to the active round. Multiple rounds exist sequentially per game.
- **Word List**: The predefined collection of eligible secret words. At least 20 entries, hardcoded (not user-provided).
- **Drawer Assignment**: The mapping from a round to the participant who draws. Persisted as part of the round/room state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Host starts a game and sees the drawer label and secret word on the game screen within 2 seconds of clicking start.
- **SC-002**: Non-host players see the drawer identified but cannot see the secret word in any way — verified by inspecting all API responses and UI elements.
- **SC-003**: The same room code always produces the same word for round 1 when restarted, confirming deterministic selection.
- **SC-004**: Word list contains at least 20 entries suitable for drawing.

## Assumptions

- The host is always the drawer for round 1. Subsequent round drawer rotation is out of scope.
- "Deterministic" means the word is selected by a pure function of the room code (e.g., hash of room code modulo word list count), not randomly.
- Word list is server-side only — never sent to clients in a way that reveals the selected word before game start.
- Name validation at game start is an additional safety check; primary validation already occurs at create/join time (per Phase 1 FR-011).
- Only the first round's creation is in scope — the Round entity is created at game start with drawer and word. Subsequent rounds, round transitions, scoring, drawer rotation, and round lifecycle (end-of-round, next round) are deferred to future scenarios.
- The browser tab is the player's session; no authentication system is involved.
