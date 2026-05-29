# Feature Specification: Game Start and Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "Game start and drawer flow Scenario 2 Player name validation (trim, reject empty), drawer assignment, deterministic secret word selection, drawer-only word visibilty"

## Clarifications

### Session 2026-05-28
- Q: How should the secret word be masked for guessers? → A: Send `secretWord: null` to keep the schema consistent.
- Q: What should the explicit error message be for blank or whitespace-only names? → A: "Name cannot be empty or whitespace".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Assignment (Priority: P1)

As a host, when I start the game, I want to be automatically assigned the "drawer" role so that the game has a clear leader for the first round. All other participants should become "guessers".

**Why this priority**: Core logic required to differentiate player views and permissions during the game phase.

**Independent Test**: Start the game with 2 players. Verify that the host's view shows drawer tools and the guest's view shows guesser inputs.

**Acceptance Scenarios**:

1. **Given** I am the host in the lobby, **When** I trigger the game start, **Then** my role is set to `drawer` and all other players are set to `guesser`.

---

### User Story 2 - Secret Word Visibility (Priority: P1)

As the assigned drawer, I want to clearly see the secret word I need to sketch, while ensuring guessers cannot see it.

**Why this priority**: Prevents cheating and defines the core asymmetry of the game.

**Independent Test**: Inspect the API response for the room. Verify `secretWord` is populated for the drawer and `null` for the guessers.

**Acceptance Scenarios**:

1. **Given** the game is in the `playing` state, **When** the drawer fetches the room state, **Then** the `secretWord` is visible in the payload.
2. **Given** the game is in the `playing` state, **When** a guesser fetches the room state, **Then** the `secretWord` field is `null` in the payload.
3. **Given** a new game round is initialized, **When** the word is selected, **Then** it is deterministically set to the first word in the starter list ("rocket").

---

### User Story 3 - Room State Transition (Priority: P2)

As a player in the lobby, I want my view to transition automatically to the game board when the host starts the game.

**Why this priority**: Required for a seamless multiplayer experience.

**Independent Test**: Open two tabs. Host clicks start. Both tabs should navigate to the Game screen within the polling interval.

**Acceptance Scenarios**:

1. **Given** players are waiting in the lobby, **When** the host starts the game, **Then** the room status changes to `playing` and all polling clients navigate to the game screen automatically.
2. **Given** the game is already in the `playing` state, **When** a late player attempts to join via code, **Then** the server rejects the request with a 403 Forbidden error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim all player names during room creation and joining.
- **FR-002**: System MUST reject empty or whitespace-only names with a 400 Bad Request and the error message "Name cannot be empty or whitespace".
- **FR-003**: System MUST update the room status from `lobby` to `playing` when the host initiates the game start.
- **FR-004**: System MUST automatically assign the `drawer` role to the host upon game start.
- **FR-005**: System MUST automatically assign the `guesser` role to all non-host participants upon game start.
- **FR-006**: System MUST deterministically select the word "rocket" (first in starter list) as the secret word for the round.
- **FR-007**: System MUST include the `secretWord` string in the API payload ONLY if the requesting identity matches the drawer's identity.
- **FR-008**: System MUST send `secretWord: null` in the API payload if the requesting identity is a guesser.
- **FR-009**: System MUST block late joins (403 Forbidden) if the room status is `playing`.

### Key Entities *(include if feature involves data)*

- **Participant**:
    - `id`: string
    - `name`: string
    - `role`: `drawer` | `guesser` | `null` (when in lobby)
- **RoomSnapshot**:
    - `status`: `lobby` | `playing` | `results`
    - `secretWord`: string | null (masked as null for guessers)

### Edge Cases

- **EC-01: Names with Interior Spaces**: A name like "Scribble King" is accepted, but " " or "" is rejected with "Name cannot be empty or whitespace".
- **EC-02: Late Join Attempt**: If a player tries to join a room via POST `/rooms/:code/join` after the status has already changed to "playing", the server must reject the request with a 403 Forbidden error.
- **EC-03: Cheating via Network Tab**: A guesser inspecting the GET `/rooms/:code?participantId=GuesserId` network response payload must only see `secretWord: null`.
- **EC-04: Mid-Lobby Refresh**: If a player manually refreshes their browser window while in the lobby, their presence is maintained, and name validation prevents duplicate identity issues.

## Explicitly Out Of Scope

- [ ] Multi-Round Management (no round rotation or dynamic switching of drawers)
- [ ] Game Timers (no countdowns or round expiration)
- [ ] Real-Time Sync (no WebSockets, rely solely on HTTP polling)
- [ ] Drawing interaction or canvas clearing (handled in Scenario 3)
- [ ] Guess submission and scoring (handled in Scenario 3)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of guesser API responses omit or mask the secret word to prevent network-tab cheating.
- **SC-002**: 100% of late-join attempts during the `playing` state are rejected.
- **SC-003**: Player names are strictly trimmed, preventing whitespace-only entries in the database/memory.

## Assumptions

- The frontend will continue to use the established ~2s polling cadence.
- The `participantId` (identity) is already passed in API requests to determine visibility.
