# Feature Specification: Game Start and Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Feature Group 2: Game Start and Drawer Flow. Given a game is starting and player names are trimmed, when the first round begins, empty or whitespace-only player names are rejected with a clear message. The host (or first player) becomes the drawer. The drawer is clearly identified to all players. A secret word is selected deterministically from the starter word list. Only the drawer can see the secret word. Guessers must not be able to see the secret word through API responses or UI state. The room transitions correctly from lobby to playing state. Generate user stories, acceptance criteria, edge cases, validation rules, state transitions, API requirements, and success metrics."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start First Round with Drawer (Priority: P1)

The host starts the game from the lobby and the first round begins with a single drawer assigned. The drawer is the host when the host is present; if host ownership is unavailable, the first player in the room becomes the drawer.

**Why this priority**: A playable round cannot begin until the room leaves lobby state, a drawer is chosen, and every player understands who is drawing.

**Independent Test**: Create a room with at least 2 players, start the game, and verify the room is playing, exactly one drawer is assigned, and all players can identify the drawer.

**Acceptance Scenarios**:

1. **Given** a lobby with a host and at least 2 players, **When** the game starts, **Then** the room transitions to playing state and the host becomes the drawer.
2. **Given** a lobby with at least 2 players but no valid host reference, **When** the game starts, **Then** the room transitions to playing state and the earliest joined player becomes the drawer.
3. **Given** a room has started, **When** any player views the round, **Then** the drawer is clearly identified to all players.

---

### User Story 2 - Protect the Secret Word (Priority: P2)

The first round selects a secret word in a deterministic way from the starter word list. The drawer can see the secret word, while guessers cannot see it in any visible game state or response intended for them.

**Why this priority**: The game is only fair if guessers know who is drawing but cannot access the answer before guessing.

**Independent Test**: Start the same initial room state and verify the same first word is selected; compare drawer and guesser views to confirm only the drawer receives the secret word.

**Acceptance Scenarios**:

1. **Given** a first round is starting, **When** the secret word is selected, **Then** the selected word comes from the starter word list using a deterministic rule.
2. **Given** a drawer views the round, **When** their round state loads, **Then** the secret word is visible to the drawer.
3. **Given** a guesser views the round, **When** their round state loads, **Then** the secret word is absent from their response and UI state.
4. **Given** any shared player list or scoreboard view, **When** it is shown to guessers, **Then** it does not include the secret word.

---

### User Story 3 - Validate Player Names Before Start (Priority: P3)

Players must have non-empty names after trimming whitespace before they can create or join a room that may enter gameplay. Empty or whitespace-only names are rejected with a clear message and do not affect room state.

**Why this priority**: Clear player names are needed to identify the drawer and prevent confusing round state.

**Independent Test**: Attempt to create or join with empty and whitespace-only names, verify clear rejection, then create or join with a name containing surrounding spaces and verify the stored visible name is trimmed.

**Acceptance Scenarios**:

1. **Given** a player enters an empty name, **When** they attempt to create or join a room, **Then** the action is rejected with a clear message.
2. **Given** a player enters a whitespace-only name, **When** they attempt to create or join a room, **Then** the action is rejected with a clear message.
3. **Given** a player enters a name with leading or trailing whitespace, **When** they create or join a room, **Then** the stored and displayed name is trimmed.
4. **Given** a rejected name attempt, **When** the rejection is shown, **Then** no player is added and no game state changes.

---

### User Story 4 - Keep Round State Consistent for All Players (Priority: P4)

After the first round starts, each player sees a consistent playing state for the room: the same drawer, same round number, same public round status, and role-appropriate private word visibility.

**Why this priority**: Multiplayer gameplay depends on shared state being consistent while still protecting drawer-only information.

**Independent Test**: Start a game with at least 2 players and compare each player's round state to confirm all public fields match and private fields differ only by role.

**Acceptance Scenarios**:

1. **Given** a room transitions from lobby to playing, **When** players refresh their game view, **Then** all players see the same drawer and playing status.
2. **Given** a drawer and guesser request the same room state, **When** responses are compared, **Then** public fields match and only the drawer response contains the secret word.
3. **Given** a room is already playing, **When** another player attempts to join through the lobby flow, **Then** the join is rejected with clear feedback.

---

### Edge Cases

- A player tries to create a room with an empty or whitespace-only name.
- A player tries to join a room with an empty or whitespace-only name.
- A player enters a valid name with leading or trailing whitespace.
- The host starts the game when the host is also the first joined player.
- The host reference is missing or no longer valid when a start attempt is made.
- A room has fewer than 2 players when a start attempt is made.
- The starter word list is empty when a round should begin.
- Multiple players request room state immediately after the transition to playing.
- A guesser attempts to inspect shared room state for the secret word.
- A drawer refreshes after the round starts and should still see the same secret word.
- A player attempts to join after the room is already playing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reject empty player names before creating or joining a room.
- **FR-002**: System MUST reject whitespace-only player names before creating or joining a room.
- **FR-003**: System MUST trim leading and trailing whitespace from accepted player names before storing or displaying them.
- **FR-004**: System MUST prevent rejected player-name attempts from adding players or changing room state.
- **FR-005**: System MUST transition a room from lobby state to playing state when the first round begins successfully.
- **FR-006**: System MUST assign exactly one drawer for the first round.
- **FR-007**: System MUST assign the host as drawer when a valid host is present in the room.
- **FR-008**: System MUST assign the earliest joined player as drawer when no valid host is present.
- **FR-009**: System MUST clearly identify the drawer to all players in the room.
- **FR-010**: System MUST select the first round's secret word from the starter word list using a deterministic rule.
- **FR-011**: System MUST keep the selected secret word stable for the round after it is selected.
- **FR-012**: System MUST show the secret word to the drawer.
- **FR-013**: System MUST hide the secret word from all guessers in responses and UI state.
- **FR-014**: System MUST reject game start if fewer than 2 players are present.
- **FR-015**: System MUST reject game start if no starter word can be selected.
- **FR-016**: System MUST reject joins once a room is playing.
- **FR-017**: System MUST validate player identity and room status before returning role-specific round state.
- **FR-018**: System MUST keep public round state consistent for all players in the same room.
- **FR-019**: System MUST keep drawer-only secret word visibility isolated from other rooms and other players.

### Validation Rules

- Player names are valid only when at least one non-whitespace character remains after trimming.
- Accepted player names are displayed using the trimmed value.
- A game can start only from a lobby with at least 2 players and at least one starter word.
- Drawer assignment is valid only when the drawer is a participant in the room.
- Secret word visibility is valid only when the requesting player is the assigned drawer.

### State Transitions

- **Lobby to Playing**: Occurs when the first round starts successfully.
- **Lobby to Lobby**: Remains unchanged when player-name validation, player-count validation, or word-selection validation fails.
- **Playing to Playing**: Player refreshes preserve the same drawer and secret word for the current round.
- **Playing Reject Join**: Join attempts after play begins are rejected without changing room state.

### API Requirements

- Start-game responses MUST include public playing state, drawer identity, and the requesting player's role.
- Drawer-specific game-state responses MUST include the secret word.
- Guesser-specific game-state responses MUST omit the secret word entirely rather than returning it as blank, hidden, or masked text.
- Validation failures MUST return clear messages suitable for display to players.
- Responses for one room MUST NOT include drawer identity, secret words, or round state from another room.

### Key Entities

- **Room**: A drawing game session with a code, participants, current state, and current round once playing starts.
- **Player**: A named participant in a room. The name is trimmed before acceptance and display.
- **Host**: The player who can start the game and is the preferred first drawer.
- **Drawer**: The player assigned to draw for the current round and the only player allowed to see the secret word.
- **Guesser**: A non-drawer player who can see public round state but cannot see the secret word.
- **Round**: The current gameplay turn containing drawer identity, deterministic word selection, and playing state.
- **Secret Word**: The selected word for the drawer, hidden from guessers.

### Traceability & Scope

- **Source Scenario(s)**: Feature Group 2 - Game Start and Drawer Flow; User Story 1 through User Story 4 in this specification.
- **In Scope**: Player-name trimming and rejection, first-round start, lobby-to-playing transition, drawer assignment, deterministic secret word selection, drawer identification, role-specific secret word visibility, and playing-state responses.
- **Out of Scope**: Drawing canvas input, guess submission, scoring, round completion, multi-round drawer rotation, restart flows, authentication, databases, WebSockets, unrelated refactors, and any behavior not required by this source scenario.
- **Polling Behavior**: Existing room/game state refresh may continue through HTTP polling only. When polling playing state, public fields should remain consistent for all players while drawer-only fields remain visible only to the drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of empty or whitespace-only player-name attempts are rejected with a clear player-facing message.
- **SC-002**: 100% of accepted player names are displayed without leading or trailing whitespace.
- **SC-003**: In 100 repeated first-round starts from the same room setup, the same starter word is selected each time.
- **SC-004**: In 100% of first-round starts with a valid host, the host is assigned as the drawer.
- **SC-005**: In 100% of first-round starts without a valid host reference, the earliest joined player is assigned as the drawer.
- **SC-006**: 100% of drawer views show the secret word for the current round.
- **SC-007**: 0% of guesser views expose the secret word in visible UI state or responses intended for guessers.
- **SC-008**: Players in the same room see the playing transition and drawer identity within the normal refresh window.
- **SC-009**: Failed start attempts leave the room in lobby state and do not assign a drawer or secret word.

## Assumptions

- The starter word list is finite and ordered.
- Deterministic first-word selection means the same room setup selects the same first word every time.
- The first round starts only after the room has already satisfied the lobby's host-only start and minimum-player rules.
- If the host reference is missing or points to a player no longer in the room, drawer assignment falls back to the earliest joined current player.
- This feature covers first-round start and drawer flow only; guessing, scoring, and later-round drawer rotation are handled by later feature groups.
