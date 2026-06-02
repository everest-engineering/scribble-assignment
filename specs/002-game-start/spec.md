# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start`

**Status**: Draft

**Input**: User description: "Game Start & Drawer Flow"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Drawer Assignment (Priority: P1)

When the game transitions to the active state, the host (or first player) must be designated as the drawer.

**Acceptance Scenarios**:
1. **Given** a lobby with multiple players, **When** the host starts the game, **Then** the room transitions to the "active" status and the host is set as the `drawerId`.

### User Story 2 - Secret Word Selection (Priority: P1)

A secret word must be deterministically selected from the starter list when the game starts.

**Acceptance Scenarios**:
1. **Given** a game is starting, **When** the backend assigns the word, **Then** it selects deterministically based on the room's seed data (room code and creation date).

### User Story 3 - Word Visibility (Priority: P1)

The secret word must only be visible to the current drawer; guessers must not receive the word in their room snapshots.

**Acceptance Scenarios**:
1. **Given** an active game, **When** the drawer requests the room snapshot, **Then** the `secretWord` field is populated.
2. **Given** an active game, **When** a guesser requests the room snapshot, **Then** the `secretWord` field is `undefined`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST assign the host as the initial drawer when transitioning to the active state.
- **FR-002**: System MUST select a secret word deterministically from the starter list using a seed derived from room code and timestamp.
- **FR-003**: System MUST NOT expose the secret word to any participant other than the drawer during the active game state.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Integration tests verify that `GET /rooms/:code` returns the word for the drawer but hides it for guessers.
- **SC-002**: UI correctly displays the drawer's identity and hides the word for guessers.
