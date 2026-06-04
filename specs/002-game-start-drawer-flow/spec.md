# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## Clarifications

### Session 2026-06-05

- Q: Should each player see their own role label, or only the drawer's identity? → A: Each player sees their own role label (e.g., "You are the Drawer" / "You are a Guesser") plus the drawer's name is shown to everyone.
- Q: What happens if the drawer leaves mid-game? → A: The game ends immediately and the room is deleted (consistent with host-leaves-lobby behavior; no drawer rotation per Constitution VI).
- Q: Should word selection always pick the first word, or use room-state-based indexing? → A: Use a predictable index derived from room state (e.g., hash of room code modulo list length) so different rooms get different words.
- Q: Should the guesser's polling response omit the word field entirely or include it as null? → A: Omit the `currentWord` field entirely from the guesser's response (field does not exist in the JSON).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Starts Game and Becomes Drawer (Priority: P1)

A host has created a room and at least one other player has joined. The host clicks "Start Game." The room transitions from lobby to game status. The host is automatically assigned the drawer role, and all other participants become guessers. The secret word is deterministically selected from the starter word list and displayed only to the drawer.

**Why this priority**: This is the core game-start loop. Without it, no game can begin. Everything else depends on this transition.

**Independent Test**: Can be fully tested by creating a room, joining a second player, starting the game, and verifying the drawer sees the word while guessers do not.

**Acceptance Scenarios**:

1. **Given** a room in "lobby" status with 2+ participants, **When** the host sends a start-game request, **Then** the room status changes to "game," the host is assigned the "drawer" role, and all others are assigned the "guesser" role.
2. **Given** the game has just started, **When** the drawer polls for room state, **Then** the response includes the secret word.
3. **Given** the game has just started, **When** a guesser polls for room state, **Then** the response does NOT include the secret word.
4. **Given** a room in "lobby" status with 2+ participants, **When** the host starts the game, **Then** the secret word is deterministically selected from the starter word list using a predictable index derived from the room state (e.g., hash of room code modulo list length), so different rooms may get different words.

---

### User Story 2 - Player Name Validation on Join (Priority: P1)

When a player creates or joins a room, their name is trimmed of leading/trailing whitespace. If the trimmed name is empty (i.e., the player typed only spaces or submitted an empty field), the request is rejected with a clear error message. Valid trimmed names are accepted and stored.

**Why this priority**: Name validation is a prerequisite for a clean lobby and meaningful drawer identification. Invalid names would undermine the game experience.

**Independent Test**: Can be tested by attempting to create/join a room with whitespace-only names and verifying rejection, then retrying with a valid name and verifying acceptance.

**Acceptance Scenarios**:

1. **Given** a player attempts to create a room with a name of `"  "` (spaces only), **When** the request is processed, **Then** the system rejects the request with a user-friendly error message indicating the name cannot be empty.
2. **Given** a player attempts to join a room with a name of `""` (empty string), **When** the request is processed, **Then** the system rejects the request with an error message.
3. **Given** a player provides the name `"  Alice  "`, **When** they create or join a room, **Then** the stored name is `"Alice"` (trimmed).
4. **Given** a player provides a valid non-whitespace name, **When** they create or join a room, **Then** they successfully enter the lobby with the trimmed name displayed.

---

### User Story 3 - Drawer Identification in Game UI (Priority: P2)

Once the game starts, all participants can clearly see who the drawer is. The drawer's identity is prominently displayed so guessers know who is drawing.

**Why this priority**: Without clear drawer identification, guessers have no context for the game. This is essential for the game to be playable but depends on the game-start mechanics in P1.

**Independent Test**: Can be tested by starting a game in two browser tabs and verifying both tabs display the drawer identity prominently.

**Acceptance Scenarios**:

1. **Given** a game is in progress, **When** any participant views the game screen, **Then** the drawer is clearly identified (e.g., labeled as "Drawer" next to their name in the participant list).
2. **Given** a game is in progress, **When** the drawer views their own screen, **Then** they see a role label such as "You are the Drawer" along with the secret word.
3. **Given** a game is in progress, **When** a guesser views their own screen, **Then** they see a role label such as "You are a Guesser" and the drawer's identity, but not the secret word.

---

### Edge Cases

- What happens when the host tries to start a game with fewer than 2 players? → The request is rejected with an error ("too few players").
- What happens if a non-host player tries to start the game? → The request is rejected ("forbidden").
- What happens if the room does not exist when a start request is sent? → The request is rejected ("not found").
- What happens if the starter word list is exhausted? → Out of scope per constitution (single-round only, no round rotation), but the deterministic selection always picks the first word in the list.
- What happens if the drawer (host) leaves mid-game? → The game ends immediately and the room is deleted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from player names on room creation and room join requests.
- **FR-002**: System MUST reject room creation and room join requests where the trimmed player name is empty, returning a descriptive error message (e.g., "Player name cannot be empty").
- **FR-003**: System MUST assign the host (room creator, first participant by join order) the "drawer" role when the game starts.
- **FR-004**: System MUST assign all non-host participants the "guesser" role when the game starts.
- **FR-005**: System MUST deterministically select a secret word from the starter word list when the game starts. The word is chosen using a predictable index derived from room state (e.g., hash of room code modulo list length) so that different rooms get different words while remaining fully deterministic and testable.
- **FR-006**: System MUST include the secret word in the room state response ONLY when the requesting participant is the drawer.
- **FR-007**: System MUST completely omit the secret word field from the room state response when the requesting participant is a guesser (the field must not exist in the JSON payload, not sent as `null`).
- **FR-008**: The game UI MUST clearly indicate which participant is the drawer to all players.
- **FR-009**: The game UI MUST display the secret word only to the drawer.
- **FR-010**: The game UI MUST show a placeholder or hidden-word indicator (e.g., "_ _ _ _ _ _") to guessers instead of the actual word.
- **FR-011**: The game UI MUST display each player's own role label (e.g., "You are the Drawer" or "You are a Guesser") so every participant knows their assigned role.
- **FR-012**: If the drawer (host) leaves the room while the game is in progress, the system MUST end the game immediately and delete the room.

### Key Entities

- **Participant**: A player in a room. Extended with a `role` field ("drawer" or "guesser") once the game starts.
- **Room**: The game session container. Gains a `currentDrawerId` and `currentWord` when transitioning to "game" status.
- **Starter Word List**: A static, ordered list of words used for deterministic word selection. Already exists in the codebase as `STARTER_WORDS`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players with whitespace-only names are rejected 100% of the time with a clear error message.
- **SC-002**: Valid player names are trimmed and stored correctly on every creation/join.
- **SC-003**: The host is always assigned the drawer role on game start.
- **SC-004**: The secret word is visible only to the drawer; guessers never see it in any response.
- **SC-005**: The drawer identity is visible to all participants on the game screen.
- **SC-006**: The game start transition completes and is reflected in the polled room state within one polling cycle.

## Assumptions

- The starter word list (`STARTER_WORDS`) is a static array already present in the codebase and will not be modified.
- Only the host can start the game (existing behavior in `startRoom`).
- The game has a single round only — no round rotation, drawer rotation, or timer mechanics (per constitution VI).
- The existing polling mechanism from feature 001 is used for game state synchronization; no new transport is needed.
- Word selection uses a deterministic index derived from room state (e.g., room code hash modulo list length). The same room code always produces the same word.
- The "drawer" and "guesser" roles already exist as types in the codebase (`ParticipantRole`).

> **Out-of-scope reminder (Constitution VI)**: WebSockets, databases, auth,
> deployment, Docker, new state/routing libs, multiple rounds, drawer rotation,
> timers, bonuses, custom word packs, spectator mode, room moderation, room
> passwords, and starter rewrites are permanently excluded. Do not include them
> here or in any downstream plan or task list.
