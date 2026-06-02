# Feature Specification: Scribble Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Scribble Game Start & Drawer Flow — As a user in the room I want to start the scribble game so that I can draw/guess the word. Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Starts the Game (Priority: P1)

The player who created the room (the host) sees a "Start Game" button in the lobby. When they click it, the game transitions from the waiting lobby into the first round, the host becomes the drawer, and the secret word is shown only to that drawer. All other players see that a drawer has been chosen but cannot see the word.

**Why this priority**: This is the core entry point to the game — without it, no round can begin. Everything else depends on a game having started.

**Independent Test**: Can be tested by having 2+ players in a lobby, the host pressing Start, and verifying the drawer role assignment and hidden word display independently of any drawing or guessing mechanics.

**Acceptance Scenarios**:

1. **Given** a lobby with at least 2 players where I am the host, **When** I click "Start Game", **Then** the game begins, I am identified as the drawer, and I can see the secret word while other players cannot.
5. **Given** I am the host and I am the only player in the room, **When** I view the lobby, **Then** the "Start Game" button is disabled and shows "Need at least 2 players".
2. **Given** a game has just started, **When** the first round begins, **Then** the drawer's name is clearly visible to all players in the room, indicating who is drawing.
3. **Given** a game has just started, **When** the drawer views their screen, **Then** the secret word is displayed prominently to the drawer only.
4. **Given** a game has just started, **When** a non-drawer player views their screen, **Then** the secret word is not present anywhere in the data received by their client — they see only a prompt to guess.

---

### User Story 2 - Player Name Validation on Game Start (Priority: P2)

Before the game starts, the system ensures all player names in the room are valid (non-empty after trimming whitespace). If any player joined with a whitespace-only name, they are rejected with a clear error message before the game can proceed.

**Why this priority**: Name validation is a prerequisite for a fair game experience — every player needs to be identifiable. However, this guard typically fires at join-time; at start-time it is a safety check.

**Independent Test**: Can be tested by attempting to start a game when a player with an empty/whitespace-only name is present, and verifying the error message appears without the game starting.

**Acceptance Scenarios**:

1. **Given** a player attempts to join with a name that is empty or contains only whitespace, **When** they submit their name, **Then** the system rejects the name and displays an inline error message such as "Name cannot be empty."
2. **Given** a player's name has leading or trailing whitespace, **When** it is stored, **Then** the name is trimmed so "  Alice  " is stored as "Alice".
3. **Given** a lobby where all player names are valid (non-empty after trimming), **When** the host clicks "Start Game", **Then** the game proceeds without any name-related error.

---

### User Story 3 - Non-Host Players Cannot Start the Game (Priority: P3)

Players who are not the host do not see or cannot use the "Start Game" control. This prevents accidental or unauthorized game starts.

**Why this priority**: Role-based action control improves predictability and prevents confusion, but the game still functions without it as a strict gate.

**Independent Test**: Can be tested by viewing the lobby screen as a non-host player and confirming the Start Game button is absent or disabled.

**Acceptance Scenarios**:

1. **Given** I am a non-host player in the lobby, **When** I view the lobby screen, **Then** the "Start Game" button is not visible or is disabled for me.
2. **Given** I am the host, **When** I view the lobby screen, **Then** the "Start Game" button is visible and enabled.

---

### Edge Cases

- When the host is the only player in the room, the "Start Game" button is disabled with the label "Need at least 2 players"; clicking is not possible.
- What happens if the host leaves the lobby before starting — does the next player become the host?
- What if two players join at exactly the same time and both appear as "first player"?
- How is the secret word selected if the word list is empty?
- What happens if the game is already in progress and a start request is sent again? (Covered by FR-010: start is rejected.)
- If a player disconnects during the start transition and the room drops below 2 players, the start is cancelled and the lobby is restored with an error to the host (covered by FR-011).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST designate the room creator (the host) as the drawer at the start of the first round.
- **FR-002**: The system MUST display the drawer's identity (name) to all players in the room when a round begins.
- **FR-003**: The system MUST only transmit the secret word to the designated drawer's client; the server MUST NOT send the word to non-drawer clients (not merely hidden in the UI).
- **FR-004**: The system MUST select the secret word for round 1 by always using the first word (position 0) in the predefined starter word list.
- **FR-005**: The system MUST only allow the host to trigger the "Start Game" action; non-host players MUST NOT be able to start the game.
- **FR-006**: The system MUST require a minimum of 2 players in the room before allowing the game to start; the "Start Game" button MUST be disabled with an explanatory label (e.g., "Need at least 2 players") when fewer than 2 players are present.
- **FR-007**: The system MUST reject player names that are empty or consist solely of whitespace, displaying an inline error message to the user.
- **FR-008**: The system MUST trim leading and trailing whitespace from player names before storing or displaying them.
- **FR-009**: The system MUST transition all players in the room from the lobby state to the active game/drawing state when the game starts.
- **FR-010**: The system MUST prevent a game from being started more than once (no re-triggering while already in progress).
- **FR-011**: If a player disconnects during the game-start transition and the room drops below 2 players, the system MUST cancel the start, restore the lobby state, and display an error message to the host.

### Key Entities

- **Room**: Represents a game session containing players, current game status (waiting / in-progress), and the host identifier (always the room creator).
- **Player**: A participant in the room with a name (trimmed, non-empty), a role (drawer or guesser), and a join order.
- **Round**: A single drawing turn with an assigned drawer, a secret word, and a status (active / completed).
- **Word List**: A predefined collection of words used as the source for secret word selection; deterministic selection means the same position in the list is used for the same game context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of game starts correctly assign the host as the drawer in the first round, with no cases where a non-host is assigned.
- **SC-002**: The secret word is visible to the drawer within 2 seconds of the game starting, as observed on the drawer's screen.
- **SC-003**: 0% of non-drawer players receive the secret word in their client data during an active round (verified by inspecting the data delivered to a non-drawer client).
- **SC-004**: 100% of empty or whitespace-only player names are rejected before the player enters the lobby, with a visible error message displayed to the user.
- **SC-005**: All players in the room see the drawer's name within 3 seconds of the host starting the game.
- **SC-006**: Every new game always uses the first word in the starter word list as the round 1 secret word (verified by starting two independent games and confirming both display the same word).

## Clarifications

### Session 2026-06-02

- Q: How is the secret word deterministically selected from the starter word list? → A: Always use the first word in the list (position 0) for round 1.
- Q: Who is the host — the room creator or the first player to join? → A: The room creator is always the host.
- Q: Is the secret word hidden only in the UI, or does the server never send it to non-drawer clients? → A: Server-side enforcement — the word is only transmitted to the drawer's client.
- Q: What happens to the "Start Game" button when fewer than 2 players are in the room? → A: Button is disabled with label "Need at least 2 players".
- Q: What happens if a player disconnects during the game-start transition, dropping below 2 players? → A: Start is cancelled, lobby is restored, and an error message is shown to the host.

## Assumptions

- The "host" is always the player who created the room; host transfer is out of scope for this feature.
- The predefined starter word list is already available in the system; this feature does not include creating or editing the word list.
- Word selection for round 1 always uses position 0 (the first word) of the starter word list; no random or hash-based selection is used.
- A minimum of 2 players is required to start the game; the exact maximum (e.g., 4 players per the existing room spec) is governed by the room setup feature.
- Player name validation applies at join time; the start-game action re-validates as a safety check but the primary guard is on join.
- The scope of this feature is limited to game start and initial drawer assignment; subsequent round transitions, scoring, and drawing canvas mechanics are separate features.
- All players are using the same shared session/room; no cross-room play is in scope.
