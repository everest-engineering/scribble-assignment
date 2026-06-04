# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Game Start & Drawer Flow Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Name Validation for Room Access (Priority: P1)

A user provides a valid player name when creating or joining a room, ensuring no empty or whitespace-only names are accepted.

**Why this priority**: Core prerequisite for session participation.

**Independent Test**: Can be tested by creating/joining a room with empty/whitespace names and verifying rejection.

**Acceptance Scenarios**:

1. **Given** a user is creating or joining a room, **When** they enter an empty or whitespace-only name, **Then** the system rejects the name and displays a clear error message.
2. **Given** a user is creating or joining a room, **When** they enter a valid name (e.g., "Alice"), **Then** the room access is granted.

---

### User Story 2 - Game Start and Drawer Designation (Priority: P1)

The host starts the game, which designates the host as the drawer, who is then identified by being shown the secret word.

**Why this priority**: Core game start mechanic.

**Independent Test**: Can be tested by starting a game as host and verifying drawer designation via secret word visibility.

**Acceptance Scenarios**:

1. **Given** a game is in the lobby, **When** the host starts the game, **Then** the host is designated as the drawer.
2. **Given** a game start, **When** the game starts, **Then** a secret word is deterministically selected for the round from the starter list.
3. **Given** a game has started, **When** the drawer views the game state, **Then** the drawer is shown the secret word, identifying them as the drawer.
4. **Given** a game has started, **When** a non-drawer views the game state, **Then** the non-drawer cannot see the secret word.

### Edge Cases

- *Note: Room joining with an empty name is prevented by US1.*
- *Note: Game start with only 1 player is prevented by existing 001-room-setup-lobby requirements.*
- **Host Disconnection**: If the host disconnects after the game starts, the system MUST end the game immediately and notify all remaining players.
- **Late Joins**: The system MUST disallow players from joining a room after the game has started.


## Clarifications

### Session 2026-06-03
- Q: What happens if the host disconnects immediately after starting the game? → A: End game immediately; notify remaining players.
- Q: What defines "game state" visibility—API endpoint structure or frontend display? → A: Client-side logic (Frontend conditionally renders based on `isDrawer` flag).
- Q: Can players join a room that has already started, and if so, what happens? → A: Disallow late joins; redirect to lobby or error.
- Q: Backend or frontend masking for secret word? → A: Backend filters `currentWord` for non-drawers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim player names and reject empty/whitespace-only names during room creation, displaying error message "Player name invalid". Validation criteria: 1-20 characters, no leading/trailing whitespace.
- **FR-002**: System MUST designate the host as the drawer upon game start. Host transition from 'lobby' to 'in-game' MUST be atomic.
- **FR-003**: System MUST deterministically select a secret word from `backend/src/seed/starterData.ts` at the start of the round (algorithm: `starterList[roomId.length % starterList.length]`). Words MUST not repeat until full set is exhausted.
- **FR-004**: System MUST ensure the secret word is accessible only to the designated drawer. The backend MUST filter `currentWord` from the game state API response for non-drawers.
- **FR-005**: Host disconnection after game start MUST result in immediate game end, clearing room state, and notifying remaining clients in the next poll.
- **FR-006**: Late joining MUST be forbidden; 'in-game' join attempts MUST return "Room has already started".
- **FR-007**: Loading failures MUST display "Something went wrong" while retaining existing state in UI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of room creation requests with invalid names (empty/whitespace/length >20) are rejected with "Player name invalid".
- **SC-002**: Upon game start, a drawer is always assigned to the host.
- **SC-003**: The secret word is visible 100% of the time only to the drawer (0% leaks).
- **SC-004**: Word selection is deterministic: Given identical Room ID and word list, the selected word is always identical.

## Assumptions

- The starter list of words is available in `backend/src/seed/starterData.ts`.
- Deterministic selection implies a consistent algorithm or list order.
