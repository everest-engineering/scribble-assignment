# Feature Specification: Secret Word Drawer

**Feature Branch**: `002-secret-word-drawer`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "When the host starts the game, player names are trimmed and empty names are rejected. The host is assigned as the drawer and a secret word is selected from the starter word list. The selected word is visible only to the drawer and hidden from all guessers."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start the Round With a Drawer (Priority: P1)

When the host starts the game, the host chooses a secret word from the starter list and the first round begins with one player clearly assigned as the drawer.

**Why this priority**: The game cannot begin in a meaningful way unless everyone knows who is drawing.

**Independent Test**: Start a game, choose a starter word, and confirm the host becomes the drawer for the first round.

**Acceptance Scenarios**:

1. **Given** the host starts the game, **When** they choose a word from the starter list and the first round begins, **Then** the host is assigned as the drawer.
2. **Given** the first round has begun, **When** players view the round state, **Then** the drawer is clearly identified.
3. **Given** the game has not yet started, **When** players are waiting, **Then** no drawer is shown.

---

### User Story 2 - Reveal the Secret Word Only to the Drawer (Priority: P1)

The chosen secret word should be picked by the host from the starter list, shown only to the drawer, and hidden from all guessers.

**Why this priority**: The round only works if the guessers cannot see the secret word.

**Independent Test**: Start a round, choose a starter word, and verify the drawer can see the secret word while guessers cannot.

**Acceptance Scenarios**:

1. **Given** a round has started, **When** the drawer opens the round view, **Then** the selected secret word is visible.
2. **Given** a round has started, **When** a guesser opens the round view, **Then** the secret word is hidden.
3. **Given** multiple players are viewing the same round, **When** they compare views, **Then** only the drawer sees the secret word.

---

### User Story 3 - Reject Empty Player Names (Priority: P2)

Player names must be cleaned up before use, and empty or whitespace-only names should be rejected with a clear message.

**Why this priority**: The game should not begin with invalid player identity information.

**Independent Test**: Try entering blank or whitespace-only names and confirm the player stays on the form with a clear error.

**Acceptance Scenarios**:

1. **Given** a player enters an empty name, **When** they try to join or start a game session, **Then** the name is rejected.
2. **Given** a player enters a whitespace-only name, **When** they try to join or start a game session, **Then** the name is rejected.
3. **Given** a player enters a valid name with surrounding spaces, **When** the name is accepted, **Then** the trimmed value is used.

### Edge Cases

- What happens when the starter word list contains only one available word?
- What happens if multiple players open the round at the same time?
- What happens if the host reconnects after the round has started?
- What happens if there are fewer than two players when the host starts the game?
- What happens when a player name contains only whitespace around otherwise valid text?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assign the host as the drawer when the first round begins.
- **FR-002**: The system MUST show the drawer label clearly to players in the round.
- **FR-003**: The system MUST let the host choose a secret word from the starter word list when the round begins.
- **FR-004**: The system MUST show the secret word only to the drawer.
- **FR-005**: The system MUST hide the secret word from all guessers.
- **FR-006**: The system MUST reject empty or whitespace-only player names with a clear message.
- **FR-007**: The system MUST trim valid player names before they are used.
- **FR-008**: The system MUST keep the drawer assignment and chosen secret word consistent for everyone in the same round.

### Key Entities *(include if feature involves data)*

- **Round**: The active game state that identifies the drawer and the secret word for the current round.
- **Drawer**: The player responsible for drawing in the current round.
- **Guessers**: Players who can see the round state but not the secret word.
- **Secret Word**: The hidden word chosen from the starter list that only the drawer can view.
- **Starter Word List**: The predefined set of words used to choose the secret word.
- **Player**: A participant whose display name must be valid and trimmed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of round starts, exactly one player is identified as the drawer.
- **SC-002**: In 100% of verification runs, the secret word is visible only to the drawer and hidden from guessers.
- **SC-003**: 100% of empty or whitespace-only names are rejected with a clear message before play continues.
- **SC-004**: In repeated first-round starts, the host-selected secret word comes from the starter word list and remains consistent for the same round.

## Assumptions

- The starter word list is already available and stable for the feature.
- The host is the player allowed to start the game.
- Non-drawer players should see that the round is in progress, but not the secret word itself.
- Player names are validated before the round begins, and the trimming rule applies wherever names are entered.
- The first round state is temporary and does not need long-term persistence.
