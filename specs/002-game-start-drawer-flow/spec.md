# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Scenario 2"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Game & Assign Drawer (Priority: P1)

A host (room creator) wants to start the first round after players have joined.

**Why this priority**: Starting the game and assigning the drawer is the core interactive transition from lobby to gameplay.

**Independent Test**: Create a room, join a second player, start the game as the host. Verify the room transitions to the in-progress state and a single participant is marked as the drawer.

**Acceptance Scenarios**:

1. **Given** a host is in the lobby with at least one other joined player, **When** the host starts the game, **Then** the room moves to `inProgress`, one participant is assigned the `drawer` role, and all clients see the updated `gameState` and `roles` on next poll.
2. **Given** the host tries to start the game with fewer than 2 players, **When** they press Start, **Then** the UI shows a clear validation message and the game does not start.
3. **Given** names were submitted with leading/trailing whitespace, **When** the player created/joined, **Then** names are trimmed and empty-only names are rejected.

---

### User Story 2 - Secret Word Visibility (Priority: P1)

The drawer needs to see the secret word, while guessers must not.

**Why this priority**: Game play depends on the drawer knowing the word; secrecy ensures fair guessing.

**Independent Test**: Start a game and confirm the drawer's UI shows the secret word while other participants’ UI does not reveal the word in room snapshots.

**Acceptance Scenarios**:

1. **Given** the game has just started and the drawer is assigned, **When** the next room snapshot is fetched, **Then** the drawer's client receives a response indicating the secret word is visible to them only (server-side or redacted by contract), and other participants do not see the secret word in their `RoomSnapshot`.
2. **Given** the drawer disconnects and reconnects mid-round, **When** they re-enter, **Then** the server reassigns drawer role to the persisted drawer identity and provides the secret word to that participant only.

---

### User Story 3 - Deterministic Word Selection (Priority: P2)

When a round begins, the chosen word must be deterministic to make tests reproducible.

**Why this priority**: Determinism simplifies testing and evaluation of behavior in the lab.

**Independent Test**: For a given room code and seed behavior (e.g., round number and lexicographic order), the server selects the same word each time the round starts under identical state.

**Acceptance Scenarios**:

1. **Given** the starter word list, **When** the round begins for the first time in a room, **Then** the server deterministically selects one word from the list (algorithm documented in assumptions) and exposes it only to the drawer.

---

### Edge Cases

- Starting game without a host (host left): host-only Start button should be disabled for non-hosts; if host disappears, the server must reject start attempts from non-hosts and preserve lobby state.
- Duplicate player names: UI should show names as entered but participants identified by stable `participantId` for role assignment.
- Empty/whitespace-only player names: server rejects join/create with a clear validation error.
- Drawer disconnects mid-round: current round remains in-progress; reconnected drawer (same `participantId`) still receives word; if drawer cannot be reassociated, the server may keep round running without drawer word redistribution (documented under assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading/trailing whitespace from player names and reject empty-only names with a validation message.
- **FR-002**: System MUST allow only the host to initiate game start; non-host start attempts MUST be rejected.
- **FR-003**: System MUST transition `gameState` from `lobby` to `inProgress` when a valid host starts and at least 2 players are present.
- **FR-004**: System MUST assign exactly one participant the role `drawer` when the game starts.
- **FR-005**: System MUST select a secret word deterministically from the starter list on game start and ensure it is visible only to the `drawer` participant.
- **FR-006**: System MUST include `participantId` in session responses so clients can determine whether they are the drawer and hence receive the secret word.
- **FR-007**: System MUST represent roles and gameState in the `RoomSnapshot` contract in a way that prevents non-drawers from seeing the secret word.

## Key Entities *(include if feature involves data)*

- **Room**: `code`, `hostId`, `gameState` (`lobby` | `inProgress` | `finished`), `participants`, `round`
- **Participant**: `id`, `name`, `joinedAt`, `isHost`, `role` (`drawer` | `guesser`)
- **Round**: `secretWord` (server-side, only visible to drawer), `selectedAt`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of attempts to start a game by non-hosts are rejected (observable via API tests).
- **SC-002**: When host starts with ≥2 players, room `gameState` is `inProgress` within one poll cycle (~2s) in 100% of test runs.
- **SC-003**: The drawer sees the secret word and all other participants do not see the word in their `RoomSnapshot` (verified in integration test with two clients).
- **SC-004**: Player names with surrounding whitespace are stored trimmed and empty-only names are rejected (unit tests).

## Assumptions

- Deterministic word selection: Choose the word by hashing the room `code` plus a round counter and mapping to the starter word list (documented algorithm), ensuring repeatability.
- No persistent storage: All room and round state are in-memory and cleared on backend restart (starter constraint).
- No WebSockets: Synchronization is achieved via client polling (~2s) per Scenario 1 constraints.
- Drawer word exposure: The server will not include `secretWord` in the public `RoomSnapshot`; instead it will return the word as part of participant-specific session responses when appropriate.
- If the host disconnects before starting, the first joined participant is NOT automatically promoted; host-only permissions remain enforced unless the spec is updated.


