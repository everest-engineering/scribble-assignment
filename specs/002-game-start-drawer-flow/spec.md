# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `sdd-2-scribble-assignment` (single-branch workflow)  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: User description: "Scenario 2 — Game Start & Drawer Flow: Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trim Player Names and Reject Empty Names (Priority: P1)

Players enter display names that may include accidental leading or trailing whitespace. The system trims all names on submission and rejects names that are empty or contain only whitespace with a clear error message.

**Why this priority**: Clean player names are a prerequisite for identifying the drawer and guessers during gameplay. This refines the basic validation from Scenario 1.

**Independent Test**: Enter a name with spaces around it (e.g., "  Alice  ") and create a room. Confirm the lobby shows "Alice" without surrounding spaces. Enter a whitespace-only name (e.g., "   ") and confirm an error message is shown and creation/join is blocked.

**Acceptance Scenarios**:

1. **Given** a player enters a name with leading or trailing whitespace, **When** they submit to create or join a room, **Then** the name is trimmed and they proceed without error.
2. **Given** a player enters a name that is empty or whitespace-only, **When** they submit to create or join a room, **Then** a clear error message is displayed and submission is blocked.

---

### User Story 2 - Assign and Identify the Drawer (Priority: P1)

When the host starts the game and the first round begins, the host becomes the drawer. All players can clearly see who the drawer is on the game screen.

**Why this priority**: Identifying the drawer is essential for gameplay — guessers need to know who is drawing, and the drawer needs to know their role.

**Independent Test**: Start a game with two players. Confirm both players see the host identified as the drawer on the game screen.

**Acceptance Scenarios**:

1. **Given** a game has just started with at least two players, **When** the first round begins, **Then** the host is assigned as the drawer and all players see the drawer's name displayed prominently.
2. **Given** a player is the drawer, **When** they view the game screen, **Then** they see a clear indicator that they are the drawer.
3. **Given** a player is a guesser, **When** they view the game screen, **Then** they see a clear indicator showing who the drawer is.

---

### User Story 3 - Display Secret Word to Drawer Only (Priority: P2)

A secret word is deterministically selected from the starter list for the first round. The word is visible only to the drawer. Guessers cannot see the word.

**Why this priority**: The secret word is the core of the drawing game — the drawer must know what to draw, and guessers must not see it.

**Independent Test**: Start a game and observe the drawer's screen shows the secret word. On the guesser's screen, confirm the word is not visible in any form.

**Acceptance Scenarios**:

1. **Given** the first round starts, **When** the drawer views the game screen, **Then** the secret word is displayed to them.
2. **Given** the first round starts, **When** a guesser views the game screen, **Then** the secret word is not visible in any form — not in the UI, not in network responses to guessers.

---

### Edge Cases

- Name is multiple spaces with a visible character in between (e.g., "A  B") — trimming only removes leading/trailing whitespace, internal spaces are preserved
- Name is submitted as null or undefined — treated as empty and rejected
- Only one player in the room presses "Start Game" (blocked by Scenario 1 rule, but if somehow reached, the system should handle gracefully — no drawer assignment or secret word display)
- Player joins after the game has started (out of scope — deferred to future scenario)
- Secret word list is empty or corrupted — system should handle gracefully (defensive, not expected)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from player names on both room creation and room join submission.
- **FR-002**: System MUST reject player names that are empty or contain only whitespace after trimming, displaying a clear error message.
- **FR-003**: System MUST assign the host as the drawer when the first round begins.
- **FR-004**: System MUST display the drawer's display name on the game screen for all players, and additionally show a "You are the drawer" badge when the viewer is the drawer versus "Drawer: [name]" for guessers.
- **FR-005**: System MUST select a secret word deterministically from the starter list for the first round. The same room always gets the same word for round 1.
- **FR-006**: System MUST display the secret word to the drawer on the game screen.
- **FR-007**: System MUST ensure the secret word is never visible to guessers — not in the UI and not in any data the guesser receives from the server.

### Key Entities *(include if feature involves data)*

- **Drawer**: The player responsible for drawing in the current round. Assigned as the host (first player) in round 1. Identified by display name. Only the drawer sees the secret word.
- **Guesser**: A non-drawer player in the current round. All non-host players are guessers in round 1. Guessers cannot see the secret word.
- **Secret Word**: A word from the starter list, deterministically selected for the current round. Visible only to the drawer.
- **Round**: A period of gameplay where one player draws and others guess. Round 1 begins when the game starts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player with leading/trailing whitespace in their name is automatically trimmed — the lobby shows the clean name, and no error is shown.
- **SC-002**: An empty or whitespace-only name shows an error message within 1 second of submission — submission is prevented.
- **SC-003**: When the game starts, all players see the drawer's identity on the game screen within 2 seconds of the game starting.
- **SC-004**: The drawer sees the secret word on their screen. A guesser viewing the same game from another device does not see the word in any form.
- **SC-005**: The same room always selects the same word for round 1 across multiple game sessions (deterministic selection).

## Assumptions

- The starter word list contains at least one word. The current list includes five words: rocket, pizza, castle, guitar, sunflower.
- The first round begins immediately when the host clicks "Start Game" and the room transitions from "lobby" to "playing" status.
- Existing room status transitions and start-game logic from Scenario 1 are already implemented and functional.
- The RoomSnapshot includes roles (drawer/guesser) and availableWords as part of the existing model — these fields are already present but need to be populated correctly for round 1.
- Player name validation (trimming) applies to both create and join flows consistently.
- Multiple rounds and round transitions are out of scope for this scenario.
