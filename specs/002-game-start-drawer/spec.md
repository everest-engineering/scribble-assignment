# Feature Specification: Game Start — First Round Drawer & Secret Word

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Starts the Game and First Round Begins (Priority: P1)

The host clicks start in the lobby. The game transitions from lobby to playing state, and the first round begins immediately with all players moved to the game screen.

**Why this priority**: This is the core transition from setup to gameplay; without it, no drawing or guessing can occur.

**Independent Test**: Can be tested by having two players in a lobby and verifying the host can trigger the game start, causing both clients to transition to the game screen.

**Acceptance Scenarios**:

1. **Given** a room has two or more players and the host is in the lobby, **When** the host starts the game, **Then** the room status changes to `playing`, all players are transitioned to the game screen, and the first round begins.
2. **Given** a room has fewer than two players, **When** the host attempts to start the game, **Then** the action is blocked with a clear message that at least two players are required.
3. **Given** a non-host player is in the lobby, **When** they attempt to start the game, **Then** the action is rejected.

---

### User Story 2 - Drawer Is Clearly Identified (Priority: P1)

When the first round begins, the host is automatically and clearly designated as the drawer. All players in the room can see who the current drawer is.

**Why this priority**: Knowing who is drawing is essential for guessers to understand the flow of the game.

**Independent Test**: Can be tested by starting a game and verifying every participant sees the host identified as the drawer.

**Acceptance Scenarios**:

1. **Given** the first round has just begun, **When** any player views the game screen, **Then** the host is visibly identified as the drawer.
2. **Given** the first round has just begun, **When** the drawer views the game screen, **Then** they see a clear indication that they are the drawer.
3. **Given** the first round has just begun, **When** a guesser views the game screen, **Then** they see a clear indication of which player is the drawer.

---

### User Story 3 - Secret Word Deterministically Selected and Visible Only to Drawer (Priority: P1)

At the start of the first round, a secret word is chosen deterministically from the fixed starter list. Only the drawer sees the word; guessers see a hidden or masked representation.

**Why this priority**: The secret word is the central objective of the guessing game. Hiding it from guessers preserves game integrity.

**Independent Test**: Can be tested by starting a game with two browser tabs and confirming the drawer tab shows the word while the guesser tab does not.

**Acceptance Scenarios**:

1. **Given** the first round begins, **When** the secret word is selected, **Then** it is the first word from the fixed starter list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) in deterministic order (i.e., always the first word for the first round).
2. **Given** the first round is active, **When** the drawer views the game screen, **Then** the secret word is displayed clearly.
3. **Given** the first round is active, **When** a guesser views the game screen, **Then** the secret word is not displayed; instead, they see a placeholder or masked indicator.
4. **Given** the first round is active, **When** the room state is polled by any client, **Then** the secret word is included in the response only for the drawer; guessers receive the word field as hidden or omitted.

---

### User Story 4 - Player Name Validation (Priority: P2)

When a player attempts to create or join a room, their name is trimmed of leading and trailing whitespace. Names that are empty or contain only whitespace are rejected with a clear error message.

**Why this priority**: Clean player names ensure the lobby and game UI remain readable and professional.

**Independent Test**: Can be tested by attempting to create or join a room with whitespace-only names and verifying the rejection message.

**Acceptance Scenarios**:

1. **Given** a player enters a name with leading or trailing spaces, **When** they create or join a room, **Then** the name is trimmed and accepted if it remains non-empty.
2. **Given** a player enters a name containing only whitespace, **When** they attempt to create or join a room, **Then** the system rejects the request with a clear error message.
3. **Given** a player enters a name that becomes empty after trimming, **When** they attempt to create or join a room, **Then** the system rejects the request with a clear error message.

---

### Edge Cases

- What happens if the host leaves after the game starts but during the first round? → The room transitions back to `lobby` status and all round state (`drawerId`, `currentWord`) is cleared; the next earliest-joined participant becomes the new host.
- What happens if the word list is exhausted? → Not applicable for the first round; only one round is implemented.
- What happens if a player refreshes the browser during the first round? → Treated as a new session; they must re-join (but joining a `playing` room is rejected).
- What happens if the drawer refreshes their browser? → Same as above; the game has no session recovery mechanism.
- What happens if two hosts somehow exist (e.g., race condition)? → Server truth is the single `hostParticipantId`; any conflicting request is rejected.

## Clarifications *(post-workshop)*

| # | Topic | Clarification |
|---|-------|---------------|
| 1 | Deterministic word selection | The first round always uses the first word in the fixed starter list (`rocket`). |
| 2 | Drawer identification UI | The drawer sees "You are the drawer" (or similar); guessers see "[Player Name] is drawing". |
| 3 | Secret word visibility in API | The `GET /rooms/:code` endpoint returns `currentWord` only when the requesting `participantId` matches the `drawerId`; otherwise the field is omitted or `null`. |
| 4 | Drawer for first round only | Only one round is implemented. There is no drawer rotation. |
| 5 | Name trimming scope | Trimming applies to both create-room and join-room name inputs on the backend. |
| 6 | `currentWord` visibility in API for guessers | The `GET /rooms/:code` endpoint returns `currentWord: null` for guessers (i.e., the field is always present but is `null` when the viewer is not the drawer). |
| 7 | `drawerId` on `RoomSnapshot` | The `RoomSnapshot` type replaces the `roles` array with a `drawerId: string` field; each client derives participant roles by comparing participant IDs to `drawerId`. |
| 8 | HTTP status for empty/whitespace names | Empty or whitespace-only name rejections return `400 Bad Request` (client input validation failure). |
| 9 | Host/drawer leaves mid-round | If the host (who is also the drawer in the first round) leaves during the round, the room immediately transitions back to `lobby` status and all round state (`drawerId`, `currentWord`) is cleared. |
| 10 | Polling in `GamePage` | `GamePage` includes an automatic ~2s polling loop (matching `LobbyPage`) to keep all clients synchronized with room state changes during gameplay. |
| 11 | Guesser word placeholder | Guessers see underscores matching the secret word length (e.g. `_ _ _ _ _` for `rocket`). |
| 12 | `drawerId`/`currentWord` in lobby | When the room is in `lobby` status, `drawerId` is `null` and `currentWord` is `null`. |
| 13 | Room reset screen behavior | When a room transitions from `playing` back to `lobby` (e.g. host leaves mid-round), all remaining players are auto-redirected back to the lobby screen. |
| 14 | Name trimming persistence | The stored participant name is the trimmed version; the UI always displays the trimmed version. |
| 15 | `isDrawer` computation | The client computes `isDrawer` locally by comparing its own `participantId` to the `drawerId` returned in the snapshot; the backend does not add an `isDrawer` field. |

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from player names before validating or storing them.
- **FR-002**: System MUST reject empty or whitespace-only player names with a clear, user-facing error message.
- **FR-003**: When the host starts the game with at least two players present, System MUST transition the room status from `lobby` to `playing` and begin the first round.
- **FR-004**: System MUST reject game-start attempts by non-host players.
- **FR-005**: System MUST block game-start attempts when fewer than two players are present and display a clear message.
- **FR-006**: At the start of the first round, System MUST automatically designate the host as the drawer.
- **FR-007**: System MUST clearly identify the current drawer to all participants in the room.
- **FR-008**: At the start of the first round, System MUST select the secret word deterministically from the fixed starter list (first word for the first round).
- **FR-009**: System MUST reveal the secret word only to the drawer; guessers MUST NOT receive the secret word in API responses or see it in the UI.
- **FR-010**: System MUST transition all players from the lobby screen to the game screen when the first round begins.

### Key Entities *(include if feature involves data)*

- **Room**: Updated attributes: `status` (`"lobby" | "playing"`), `drawerId` (reference to the current drawer participant), `currentWord` (the secret word for the active round).
- **Participant**: No new attributes; role is inferred from `drawerId` comparison.
- **RoomSnapshot**: Updated attributes: `drawerId` (visible to all, replaces the `roles` array), `currentWord` (always present; `string` for the drawer, `null` for guessers).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host can start the game and all players transition to the game screen in under 2 seconds.
- **SC-002**: 100% of game-start attempts with fewer than 2 players are blocked with a clear error message.
- **SC-003**: 100% of empty or whitespace-only name attempts receive a clear error message.
- **SC-004**: The drawer sees the secret word within 1 second of the round starting.
- **SC-005**: 0% of guesser API responses or UI views expose the secret word.
- **SC-006**: All participants can clearly identify the drawer within 1 second of the round starting.

## Assumptions

- Only one round is implemented per game, with no drawer rotation, timers, or multiple rounds.
- The word list is fixed: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`.
- The first round always uses the first word in the list (`rocket`) for deterministic behavior.
- Player names do not need to be globally unique; uniqueness within a room is not enforced.
- There is no reconnection or session persistence across browser refreshes; a refresh is treated as a new session.
- Host is the room creator and remains the host unless they leave.

## Out of Scope

- Timer or countdown for the round.
- Drawer rotation for subsequent rounds.
- Score tracking during the round.
- Canvas drawing functionality.
- Guess submission and validation.
- Game restart or multiple rounds.
