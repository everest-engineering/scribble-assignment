# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `[002-game-start-drawer]`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## Clarifications

### Session 2026-06-03
- Q: How should the system handle duplicate player names in the lobby? → A: Reject with an error ("Name already taken")
- Q: To prevent cheating, should the backend strictly omit the secret word from the state payload sent to non-drawer players? → A: Yes, omit it entirely from non-drawer payloads
- Q: What should be the maximum allowed length for a player name to ensure UI consistency? → A: 32 characters
- Q: While the drawer sees the secret word, what specifically should the non-drawers see in the word area? → A: Both blanks and a waiting message

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate Player Name on Game Start (Priority: P1)

As a player joining or starting a game, I must provide a valid name so that the game has properly identified participants without blank names.

**Why this priority**: Essential to ensure the game state has valid player names before proceeding to actual gameplay.

**Independent Test**: Can be fully tested by attempting to join or start a game with various inputs (empty, spaces only, valid names) and verifying the error message or successful progression.

**Acceptance Scenarios**:

1. **Given** a player enters an empty name or only whitespace, **When** they try to start or join the game, **Then** the request is rejected with a clear error message (e.g., "Name cannot be empty").
2. **Given** a player enters a name with leading and trailing spaces, **When** they try to start or join the game, **Then** the name is trimmed of whitespace before being saved.
3. **Given** a player enters a name that is already used by someone else in the lobby, **When** they try to join the game, **Then** the request is rejected with a "Name already taken" error message.

---

### User Story 2 - Game Start and Drawer Assignment (Priority: P1)

As the first player or host starting the game, I become the drawer for the first round and receive a secret word, so that gameplay can commence immediately.

**Why this priority**: Core mechanic required to transition from the lobby to active gameplay.

**Independent Test**: Can be tested by having multiple players join, starting the game, and verifying the role assignment and word visibility for each player.

**Acceptance Scenarios**:

1. **Given** players are in the lobby, **When** the game starts and the first round begins, **Then** the host (or first player in the list) is assigned the role of "Drawer".
2. **Given** the first round has begun, **When** players look at the game interface, **Then** the Drawer is clearly identified to all participants.
3. **Given** the first round has begun, **When** the Drawer looks at their interface, **Then** they see the secret word.
4. **Given** the first round has begun, **When** non-drawers look at their interface, **Then** they do not see the secret word.
5. **Given** the game requires a word for the round, **When** the round starts, **Then** the secret word is deterministically selected from a predefined starter list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim whitespace from the beginning and end of all player names upon entry.
- **FR-002**: System MUST reject player names that are empty or consist entirely of whitespace.
- **FR-003**: System MUST provide a clear error message when a player name is rejected due to being empty.
- **FR-004**: System MUST reject player names that are already taken in the current game/lobby with a "Name already taken" error message.
- **FR-005**: System MUST reject player names that exceed 32 characters in length.
- **FR-006**: System MUST assign the role of Drawer to the host (or first joined player) when the first round begins.
- **FR-007**: System MUST clearly indicate to all players who the current Drawer is.
- **FR-008**: System MUST select a secret word for the round deterministically from a predefined starter list.
- **FR-009**: System MUST display the secret word only to the player designated as the Drawer.
- **FR-010**: System MUST hide the secret word from all other players by completely omitting it from backend state payloads sent to non-drawers.
- **FR-011**: System MUST display blanks representing the word length and a "Waiting for [DrawerName] to draw..." message to all non-drawers.

### Key Entities *(include if feature involves data)*

- **Player**: Represents a participant in the game. Key attributes include `name` (trimmed string) and `isDrawer` (boolean).
- **Game State**: Represents the current status of the game. Key attributes include `roundNumber` and `secretWord`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of player names in a started game contain at least one non-whitespace character.
- **SC-002**: 100% of the time, the host/first player is assigned as the Drawer in the first round.
- **SC-003**: 100% of the time, the secret word is visible only to the assigned Drawer.

## Assumptions

- There is an existing interface where players enter their names.
- There is a predefined starter list of words available to the system.
- Deterministic selection implies a predictable algorithm (e.g., selecting the first word from the list or using a seeded randomizer based on room ID/round), rather than pure randomness.
