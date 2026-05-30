# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "(Game Start & Drawer Flow): Assigning the drawer, securely selecting the secret word, and transitioning state from Lobby to Game."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host starts the game and a drawer is assigned (Priority: P1)

The host decides to start the game from the lobby. The game transitions to the active game state, and one player is randomly chosen to be the drawer for the first round.

**Why this priority**: Without starting the game and assigning a drawer, the game cannot be played. This is the foundational transition from the waiting area to the actual gameplay.

**Independent Test**: Can be tested by having multiple players in a lobby, the host clicking "Start Game", and verifying that all players' screens update to the game view with exactly one player identified as the drawer.

**Acceptance Scenarios**:

1. **Given** a lobby with at least 2 players, **When** the host clicks "Start Game", **Then** the game state changes to "Game" for all players.
2. **Given** a newly started game, **When** the game screen loads, **Then** exactly one player is randomly assigned the role of "Drawer" and all others are "Guessers".

---

### User Story 2 - Drawer selects the secret word (Priority: P2)

The newly assigned drawer is presented with multiple word choices. They must select one to draw, while the other players wait securely without knowing the choices or the selected word.

**Why this priority**: The drawer must have a word to draw, and it must be kept secret from the guessers to ensure the core game loop works.

**Independent Test**: Can be tested by verifying the drawer sees word options, selects one, and the guessers never receive the word in their client data payloads.

**Acceptance Scenarios**:

1. **Given** a player is assigned as the drawer, **When** the game starts, **Then** they are presented with 3 random word options to choose from.
2. **Given** the drawer is selecting a word, **When** the other players view their screen, **Then** they see a "Drawer is choosing a word" message.
3. **Given** the drawer selects a word, **When** the selection is confirmed, **Then** the game proceeds to the drawing phase without sending the word to the guessers' clients.

---

### User Story 3 - Transition to Drawing Phase (Priority: P3)

Once the word is selected, the actual round begins. The drawer can start drawing on the canvas, and the timer starts ticking down for the round.

**Why this priority**: This completes the Game Start flow, bridging the gap between word selection and the core gameplay of drawing/guessing.

**Independent Test**: Can be tested by selecting a word as the drawer and observing that the canvas unlocks and a timer begins counting down on all clients.

**Acceptance Scenarios**:

1. **Given** the drawer has selected a word, **When** the selection is processed, **Then** the drawer's canvas becomes active/drawable.
2. **Given** the drawer has selected a word, **When** the selection is processed, **Then** a shared round timer starts counting down for all players.

### Edge Cases

- What happens if a player leaves the lobby exactly when the host clicks start?
- What happens if the assigned drawer disconnects before selecting a word?
- What happens if the drawer takes too long to select a word (timeout)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow the Host to transition the room state from "Lobby" to "Game" when the minimum player requirement is met.
- **FR-002**: The system MUST randomly select exactly one active player to be the "Drawer" at the start of a round.
- **FR-003**: The system MUST designate all non-drawer players as "Guessers".
- **FR-004**: The system MUST provide the Drawer with a choice of 3 random secret words.
- **FR-005**: The system MUST securely store the selected secret word on the backend, only exposing it to the Drawer's client.
- **FR-006**: The system MUST display a waiting indicator to Guessers while the Drawer is selecting a word.
- **FR-007**: The system MUST unlock the drawing canvas for the Drawer and start the round timer immediately after the word is selected.
- **FR-008**: The system MUST auto-select a random word if the Drawer fails to choose within a configurable timeout period.

### Key Entities

- **Room**: Holds current state (Lobby vs. Game), list of players, and manages transitions.
- **Player**: Has a specific role (Host, Drawer, Guesser) and connection status.
- **Round**: Tracks the current Drawer, the chosen secret word, word options, and the round timer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Game state transitions from Lobby to Game for all connected clients within 1 second of the host's action via HTTP polling.
- **SC-002**: The secret word is never present in the HTTP response payloads sent to Guesser clients before the round ends.
- **SC-003**: Exactly one player is given drawing permissions per round.
- **SC-004**: The round automatically progresses if the drawer does not pick a word within the allotted time limit (e.g., 15 seconds).

## Assumptions

- There is a predefined, in-memory list of words available on the backend to choose from.
- A minimum of 2 players is required to start the game.
- The game relies exclusively on HTTP polling for state synchronization, meaning clients will poll to realize the game has started and a drawer has been assigned.
- Authentication/accounts are not required; players are identified by session or simple ID.
