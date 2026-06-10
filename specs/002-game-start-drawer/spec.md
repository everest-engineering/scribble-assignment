# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Game start and drawer flow: trim and reject empty or whitespace-only player names before allowing game start, add POST /rooms/:code/start endpoint that transitions room state from lobby to playing, assign the first participant as drawer, select the secret word deterministically as the first entry in the word list (rocket), return the secretWord field only to the player whose name matches the drawerName, all other players receive the room snapshot without the secret word"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Starts the Game (Priority: P1)

The host is in the lobby with at least 2 players present. The host clicks "Start
Game". The system validates that every participant's name is non-empty after
trimming, transitions the room from the waiting lobby to the active playing
state, assigns the first participant (by join order) as the drawer, and selects
the first word in the fixed word list as the secret word. On API success the
host is immediately navigated to the Game screen. Non-host players detect the
status change via their 2-second polling loop and are automatically navigated to
the Game screen without any manual action.

**Why this priority**: Game start is the gateway to all gameplay. Without it,
no game-state screen, no drawer assignment, and no secret-word flow can be
tested.

**Independent Test**: With two browser tabs (host + one guest) both in the
lobby, the host clicks "Start Game"; Tab A (host) navigates immediately to the
Game screen, and Tab B (guest) navigates automatically within the next 2-second
polling cycle.

**Acceptance Scenarios**:

1. **Given** a room in the lobby state with 2+ participants whose names are all
   non-empty, **When** the host triggers game start, **Then** the room status
   transitions to "playing" and the response confirms the transition.
2. **Given** a room in the lobby state, **When** the host triggers game start,
   **Then** the participant who joined first is designated as the drawer.
3. **Given** a room in the lobby state, **When** the host triggers game start,
   **Then** the secret word is set to the first entry of the fixed word list
   ("rocket").
4. **Given** a room already in "playing" state, **When** any player attempts to
   start the game again, **Then** the system rejects the request and the room
   state is unchanged.
5. **Given** the host clicks "Start Game" and the API call succeeds, **When** the
   success response is received, **Then** the host is immediately navigated to
   the Game screen (no polling wait).
6. **Given** the room transitions to "playing" state, **When** a non-host
   player's polling response includes `status: "playing"`, **Then** that player
   is automatically navigated to the Game screen.

---

### User Story 2 - Drawer Receives the Secret Word (Priority: P2)

After the game starts, the player whose name matches the drawer name requests
the current room state. The response includes the secret word so the drawer
knows what to draw. The Game screen displays the secret word visibly to the
drawer and hides it entirely from all other players.

**Why this priority**: The drawer must know the secret word to participate. This
is the core information asymmetry that makes the game work, and the GamePage
must surface it so the feature is verifiable in-browser without inspecting
network responses.

**Independent Test**: After game start, the drawer's Game screen shows the text
"rocket". A second browser tab for a non-drawer player shows no secret word on
their Game screen.

**Acceptance Scenarios**:

1. **Given** the game is in playing state, **When** the drawer requests the room
   state (identified by name matching `drawerName`), **Then** the response
   includes `secretWord: "rocket"`.
2. **Given** the game is in playing state, **When** the drawer requests the room
   state multiple times, **Then** each response consistently includes the same
   secret word.
3. **Given** the game is in playing state, **When** the drawer views the Game
   screen, **Then** the secret word ("rocket") is displayed visibly on their
   screen.
4. **Given** the game is in playing state, **When** a non-drawer player views the
   Game screen, **Then** no secret word is displayed on their screen.

---

### User Story 3 - Guessers Do Not Receive the Secret Word (Priority: P3)

After the game starts, any player who is not the drawer requests the current
room state. The response includes the drawer's name and game status but does
NOT include the secret word.

**Why this priority**: Keeping the secret word hidden from guessers is the
essential fairness rule of the game. A guesser seeing the word would make the
game pointless.

**Independent Test**: After game start, a non-drawer player's polling response
contains `drawerName` but no `secretWord` field (or an undefined/absent value).

**Acceptance Scenarios**:

1. **Given** the game is in playing state, **When** a non-drawer player requests
   the room state, **Then** the response does NOT include a `secretWord` field.
2. **Given** the game is in playing state and there are 3+ players, **When**
   each non-drawer player individually requests the room state, **Then** none of
   their responses contain the secret word.

---

### User Story 4 - Invalid Names Block Game Start (Priority: P4)

The system performs a final name validation pass when game start is requested.
If any participant's name is empty or whitespace-only (edge case where data
integrity was not enforced at join time), the start request is rejected with a
clear error and the room remains in the lobby state.

**Why this priority**: Defensive guard against malformed state. Correct behavior
is achievable only if data is clean at the time of play.

**Independent Test**: Simulate (via direct API call) a game-start request on a
room that contains a participant with a whitespace-only name; confirm the
endpoint rejects it and the room status remains "lobby".

**Acceptance Scenarios**:

1. **Given** a room in the lobby state where at least one participant name is
   empty or whitespace-only, **When** game start is requested, **Then** the
   system rejects the request with a descriptive error and the room status
   remains "lobby".
2. **Given** a room in the lobby state where all participant names are valid
   (non-empty after trimming), **When** game start is requested, **Then** the
   system accepts it and transitions to playing.

---

### Edge Cases

- What happens when game start is requested on a room already in playing state?
  → Request is rejected; room is unchanged.
- What happens if the room code does not exist? → Request is rejected with a
  "room not found" error.
- What if there is only 1 participant when start is requested? → Request is
  rejected (fewer than 2 players required, enforced by the lobby gate from the
  prior feature).
- What if two requests to start arrive simultaneously? → Only the first
  succeeds; the second sees the room already in playing state and is rejected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a "start game" action for a given room.
- **FR-002**: The start game action MUST only succeed when the room is in the
  lobby/waiting state; a room already in playing state MUST be rejected.
- **FR-003**: Before transitioning, the system MUST verify that every
  participant's name is non-empty after trimming; if any name fails, the action
  MUST be rejected with a descriptive error message.
- **FR-004**: On a successful start, the room status MUST change from "lobby" to
  "playing".
- **FR-005**: The participant who joined the room first (earliest join order)
  MUST be assigned as the drawer.
- **FR-006**: The secret word MUST be selected deterministically as the first
  entry of the fixed word list ("rocket"); no randomness is used.
- **FR-007**: When a player retrieves the room state after game start, the
  response MUST include the drawer's name.
- **FR-008**: When the drawer retrieves the room state, the response MUST
  include the secret word.
- **FR-009**: When any player other than the drawer retrieves the room state, the
  response MUST NOT include the secret word.
- **FR-010**: The system MUST identify the requesting player by name to determine
  whether to include the secret word in the response.
- **FR-011**: On a successful game-start API response, the host's frontend MUST
  immediately navigate to the Game screen without waiting for a polling cycle.
- **FR-012**: When the frontend detects `status: "playing"` in any polling
  response, non-host players MUST be automatically navigated to the Game screen.
- **FR-013**: The Game screen MUST display the secret word to the drawer and MUST
  NOT display it to any other player.

### Key Entities

- **Room**: Represents a game session. Has a status ("lobby" or "playing"), an
  ordered list of participants, and — once started — a designated drawer name
  and a secret word stored server-side.
- **Participant**: A player in a room. Has a name, a join timestamp that
  establishes order, and an `isHost` flag. Once the game starts, participants
  also carry a role (drawer or guesser).
- **Room Snapshot (Drawer)**: The view of room state returned to the drawer —
  includes status, participants, drawer name, and the secret word.
- **Room Snapshot (Guesser)**: The view of room state returned to all
  non-drawer players — includes status, participants, and drawer name; the
  secret word is omitted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of game-start requests on rooms with 2+ valid-name
  participants successfully transition the room to playing state.
- **SC-002**: The drawer always receives the secret word and guessers never do —
  verified across all test scenarios with zero exceptions.
- **SC-003**: The first-joined participant is always assigned as the drawer —
  deterministic and reproducible given the same room state.
- **SC-004**: 100% of game-start requests on rooms with any invalid participant
  name are rejected and leave the room in lobby state.
- **SC-005**: A non-drawer player polling the game state never sees the secret
  word — confirmed in both two-player and three-player scenarios.

## Assumptions

- A room must have at least 2 participants before game start is allowed; this
  minimum is already enforced by the "Start Game" button being disabled with
  fewer than 2 players (from the prior feature, Room Setup & Lobby).
- "First participant" means the participant with the earliest join order as
  recorded at the time they were added to the room.
- Player identity for secret-word filtering is determined by matching the
  requester's player name against the stored `drawerName`; no session tokens or
  authentication are used (in-memory, name-based matching is consistent with the
  project's scope).
- The fixed word list is ordered and stable; "rocket" is always the first entry
  and will not change between requests.
- Game restart (resetting a playing room back to lobby) is out of scope for this
  feature.
- Only the host initiates the start game action; the UI already gates this
  button to the host. Server-side host verification is not required beyond what
  the existing data model provides, unless the plan phase identifies it as
  necessary.
- The room code in the start request uniquely identifies the room; code
  collisions are not possible within the in-memory store.

## Clarifications

### Session 2026-06-10

- Q: How does the frontend navigate players to the Game screen after game start? → A: Host navigates immediately on API success; non-hosts auto-navigate via polling when `status === "playing"` is detected.
- Q: Should the GamePage display the secret word to the drawer? → A: Yes — the Game screen displays the secret word to the drawer only; guessers see no secret word.
