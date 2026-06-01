# Feature Specification: Drawer Selection & Word Visibility

**Feature Branch**: `003-drawer-selection`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Start Round Drawer Assignment (Priority: P1)

When a game starts, the room host (or first player if host unavailable) must be assigned as the drawer for the first round, and only that drawer sees the secret word.

**Why this priority**: This is core gameplay: a clear drawer and secret-word privacy are required for a playable round.

**Independent Test**: Create a room with N players, ensure player names are validated, start the first round and verify the assigned drawer UI shows the drawer role and the secret word only in the drawer's client.

**Acceptance Scenarios**:

1. **Given** a room with valid player names and a starter word list, **When** the host starts the first round, **Then** the host is assigned the drawer role and sees the secret word.
2. **Given** a room where host disconnected and a player is the first in the joined-order, **When** the first round starts, **Then** the first player is assigned the drawer role and sees the secret word.
3. **Given** any non-drawer player in the same room, **When** the first round starts, **Then** they do not see the secret word and see a clearly indicated drawer identity.

---

### User Story 2 - Player Name Validation (Priority: P1)

Players must provide non-empty, trimmed display names; whitespace-only names are rejected with an inline validation message.

**Why this priority**: Names are used to identify players and to deterministically choose drawer when necessary.

**Independent Test**: Attempt to join a room with names: "Alice", " ", " Bob ". Validate join is rejected for whitespace-only and accepted after trimming for others.

**Acceptance Scenarios**:

1. **Given** a user submits a name of only whitespace, **When** they attempt to join/create a room, **Then** the UI rejects the name and displays a validation message: "Please enter a name." (or equivalent).
2. **Given** a user submits a name with surrounding whitespace, **When** they submit, **Then** the system trims the name and accepts it.

---

### User Story 3 - Deterministic Secret Word Selection (Priority: P2)

The secret word for the round is selected deterministically from the starter word list so results are reproducible for tests and debugging (e.g., using room seed + round number).

**Why this priority**: Deterministic selection is useful for reproducible tests and fair play; it also simplifies acceptance testing.

**Independent Test**: For a given room seed and round number, assert that the selected word matches the deterministic selection algorithm.

**Acceptance Scenarios**:

1. **Given** a room seed and starter list, **When** requesting the selected word for round 1 using the deterministic algorithm, **Then** the returned word matches the expected value for that seed/list.

---

### Edge Cases

- What if the starter word list is empty? The system must surface an error and prevent starting the round until at least one word exists.
- What if the host disconnects between room creation and round start? The first player in join-order should be treated as drawer.
- What if all joined players have whitespace-only names (unlikely)? Reject join attempts until at least one valid name exists.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST trim player-entered display names and enforce validation on both client and server; names that are empty after trimming MUST be rejected with a clear validation message.
- **FR-002**: When the first round begins, the system MUST assign the drawer role to the host; if the host is not present, assign to the first player by join-order.
- **FR-003**: The system MUST ensure only the drawer's client can retrieve and view the secret word for the active round.
- **FR-004**: The secret word for a round MUST be selected deterministically from the configured starter list using a reproducible algorithm (e.g., keyed by room seed and round index).
- **FR-005**: If the starter word list is empty, the system MUST prevent round start and surface an error indicating the missing words.
- **FR-006**: The UI MUST clearly indicate the identity of the drawer to other players (e.g., "Drawer: Alice").

### Key Entities _(include if feature involves data)_

- **Player**: displayName (trimmed string), clientId, joinOrder, isHost (boolean)
- **Room**: id, players[], seed (deterministic seed used for word selection), starterWordList[]
- **Round**: index, drawerPlayerId, secretWord (server-only except for drawer), startedAt

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of first-round starts assign the drawer to the host or first player according to join-order in automated tests.
- **SC-002**: 100% of non-drawer clients do not receive the secret word in integration tests that simulate a full room.
- **SC-003**: Deterministic word selection yields the same word for the same room seed and round index in 100% of reproducibility tests.
- **SC-004**: Player name validation rejects whitespace-only names with an explicit message in 100% of UI validation tests.

## Assumptions

-- Player identity is by display name only for UI; no authentication or persistent accounts are required.
-- Rooms expose a deterministic `seed` (or derived value) at creation time to support reproducible word selection.
-- Starter word list is provided by the server configuration (seeded list) and is non-empty for normal operation.
-- Secret-word visibility is enforced by server-side access controls so only the designated drawer can retrieve the secret word for their client.

## Clarifications

### Session 2026-05-31

- Q: Server-side name validation (client vs server enforcement) → A: Enforce both client- and server-side validation.
