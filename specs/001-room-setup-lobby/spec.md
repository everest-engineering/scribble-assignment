# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Room Setup and Lobby — host tracking on room creation, join validation with clear error messages, multi-room isolation, automatic lobby polling (~2s), host-only start with 2-player minimum (Scribble lab Scenario 1)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Room (Priority: P1)

A player opens the app and creates a new drawing room. They receive a unique room code and enter the lobby as the room host. Other players can use the code to join.

**Why this priority**: Without room creation and host identity, no multiplayer session can begin. This is the entry point for all other lobby behavior.

**Independent Test**: One browser tab creates a room and lands in the lobby with a visible room code and host indication. No second player required.

**Acceptance Scenarios**:

1. **Given** a player on the start screen, **When** they create a room with a display name, **Then** they are taken to the lobby with a unique room code shown.
2. **Given** a newly created room, **When** the creator views the lobby, **Then** they are identified as the host and listed as a participant.
3. **Given** two separate create-room actions, **When** both complete, **Then** each room has a distinct code and independent participant list.

---

### User Story 2 - Player Joins by Room Code (Priority: P2)

A player enters a room code to join an existing game lobby. Invalid or empty codes are rejected with clear feedback before or after submission. Joining one room does not affect other rooms.

**Why this priority**: Multiplayer requires a reliable join path with understandable errors when codes are wrong.

**Independent Test**: With an existing room open in one tab, a second tab joins using the code and appears in that room's lobby only.

**Acceptance Scenarios**:

1. **Given** an active room with code `ABCD`, **When** another player submits that code to join, **Then** they enter the lobby and appear in the participant list.
2. **Given** a player on the join screen, **When** they submit an empty room code, **Then** they see a clear message that a code is required and are not navigated away.
3. **Given** a player on the join screen, **When** they submit a code that does not match any room, **Then** they see a clear message that the room was not found.
4. **Given** a player on the join screen, **When** they submit a code with invalid format (not the expected length or characters), **Then** they see a format error distinct from "room not found" before attempting to join.
5. **Given** rooms `ABCD` and `WXYZ` each with one player, **When** a new player joins `ABCD`, **Then** only `ABCD`'s participant list grows; `WXYZ` is unchanged.

---

### User Story 3 - Lobby Sync and Host-Controlled Start (Priority: P3)

Players in the lobby see the participant list update automatically without manual refresh. Only the host can start the game, and only when at least two players are present.

**Why this priority**: The lobby must feel live for multiplayer coordination, and start permissions prevent non-hosts from forcing a premature game.

**Independent Test**: Two tabs in the same room; the joiner's appearance shows in the host tab within ~2 seconds without clicking refresh. Start button behavior differs by role and player count.

**Acceptance Scenarios**:

1. **Given** a host waiting in the lobby, **When** another player joins the same room, **Then** the host's participant list updates within approximately 2 seconds without manual refresh.
2. **Given** a non-host player in the lobby, **When** they view lobby controls, **Then** they cannot start the game (control hidden or disabled with clear reason).
3. **Given** a host alone in the lobby, **When** they attempt to start the game, **Then** the action is blocked with a message that at least two players are required.
4. **Given** a host and at least one other player in the lobby, **When** the host starts the game, **Then** the start succeeds and all players in that room are notified via updated room state (not client-only navigation).
5. **Given** a non-host and two or more players in the lobby, **When** the non-host attempts to start, **Then** the action is rejected or unavailable.

---

### Edge Cases

- What happens when the same room code is entered with different letter casing? Codes are treated case-insensitively for matching; display may normalize to uppercase.
- What happens when a player refreshes the browser in the lobby? They remain associated with their participant identity for that room session when the app restores session context.
- What happens when a host opens two tabs? Each tab acts as a separate participant unless the product already deduplicates; duplicate participants in one room are acceptable for this feature.
- What happens when join is attempted while the backend is unreachable? The user sees a friendly error and can retry without losing their entered code.
- What happens when polling fails temporarily? The lobby shows last known state and recovers on the next successful update without crashing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room and receive a unique room code.
- **FR-002**: System MUST designate the room creator as the host for the lifetime of that room.
- **FR-003**: System MUST allow players to join an existing room by entering its code.
- **FR-004**: System MUST reject empty room codes with a clear, user-facing message.
- **FR-005**: System MUST reject room codes that do not match any existing room with a clear "not found" message.
- **FR-006**: System MUST reject malformed room codes (wrong length or invalid characters) with a format error distinct from "not found."
- **FR-007**: System MUST keep each room's participants and state fully isolated from other rooms.
- **FR-008**: System MUST automatically refresh lobby participant data at approximately 2-second intervals while a player is on the lobby screen.
- **FR-009**: System MUST allow only the host to initiate game start.
- **FR-010**: System MUST block game start when fewer than two participants are in the room, with a clear message to the host.
- **FR-011**: System MUST record game start on the server so all clients in the room observe the same updated room state.
- **FR-012**: System MUST display all current participants in the lobby with enough identity to distinguish players (e.g., display name).

### Key Entities

- **Room**: A isolated game session identified by a short unique code; has a host, a list of participants, and a lifecycle status beginning in lobby.
- **Participant**: A player in a room with a display identity and join time; exactly one participant per room is the host (the creator).
- **Host**: The participant who created the room; sole actor allowed to start the game from the lobby when preconditions are met.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host can create a room and see their room code in the lobby in under 30 seconds on first attempt.
- **SC-002**: A second player joining with a valid code appears in the host's lobby within 3 seconds without manual refresh (target cadence ~2 seconds).
- **SC-003**: 100% of empty, malformed, and not-found join attempts show a specific error message (no silent failure or generic crash).
- **SC-004**: In two-browser testing, actions in room A never change participant lists or start availability in room B.
- **SC-005**: Non-host players cannot successfully start a game in 100% of attempted tests; hosts cannot start with only one player present.
- **SC-006**: After a successful host start with two or more players, every participant in that room observes the same started state within 3 seconds.

## Assumptions

- Room codes are four characters, matching the starter's existing format; matching is case-insensitive.
- Player display name trimming and empty-name rejection belong to Scenario 2 (Game Start & Drawer Flow); this feature accepts names as provided by create/join forms today unless empty names block lobby display.
- Game start in this feature means the server transitions the room out of lobby; drawer assignment, secret word, and gameplay rules are specified in the next feature (Scenario 2).
- Polling uses a fixed interval of approximately 2 seconds in the lobby; exact millisecond timing is not user-visible.
- Session identity (which participant the browser represents) is preserved for the browser session via existing client session storage patterns.
- Rooms exist only in memory; a server restart clears all rooms (acceptable per lab scope).
- No authentication; anyone with a room code can join that room.

## Scope Boundaries

**In scope**: Room creation, host designation, join by code with validation, multi-room isolation, automatic lobby polling, host-only start with two-player minimum, server-authoritative start.

**Out of scope for this feature** (later scenarios or lab exclusions): drawer assignment, secret word, canvas and guesses, result/restart, player name trim validation, WebSockets, persistence, authentication, timers, multi-round rotation.
