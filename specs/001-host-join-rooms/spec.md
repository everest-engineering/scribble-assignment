# Feature Specification: Host and Join Game Rooms

**Feature Branch**: `001-host-join-rooms`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-01

- Q: When a player tries to join with a valid room code but the room has already started, what should happen? → A: Reject — show a clear message that the game already started; player stays outside the room.
- Q: When all participants have left, when should the room code stop working for new joins? → A: Empty room — code stops working as soon as the last participant leaves the room.
- Q: What should count as a participant leaving the room? → A: Disconnect — closing the tab, navigating away, or prolonged loss of contact removes them.
- Q: When a participant returns to the lobby while the room still exists, how should they re-enter? → A: Resume — if the client still holds their room identity, they rejoin as the same participant (including host) without re-entering the code.
- Q: Is there a maximum number of participants allowed in a single room lobby? → A: Fixed cap (8–12) — join rejected with a clear “room full” message when at capacity; default cap of 10 players per room.
- Q: When a room is in result state (round ended), may new players join with a valid code? → A: Out of scope for this feature — join during an active drawing round is rejected here; join while viewing results is defined in feature `004-result-restart-lobby`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Room (Priority: P1)

A player who wants to run a drawing game creates a new room, receives a shareable room code, enters the lobby as the designated host, and can invite others by sharing that code.

**Why this priority**: Without room creation and host assignment, no game session can exist; this is the entry point for the multiplayer experience.

**Independent Test**: A single player can create a room, see a unique code, confirm they are identified as host in the lobby, and remain the only participant until others join.

**Acceptance Scenarios**:

1. **Given** a player on the home or create flow with a valid display name, **When** they create a room, **Then** they receive a unique room code and land in the lobby as the host.
2. **Given** a newly created room, **When** the host views the lobby, **Then** they see themselves listed as a participant (identified as host), and the room code is visible for sharing.
3. **Given** a player attempts to create a room without a display name (or with only whitespace), **When** they submit, **Then** creation is blocked and they see a clear message explaining what to fix.

---

### User Story 2 - Player Joins with a Room Code (Priority: P1)

A player who received a room code enters it (along with their display name) to join the correct waiting room. Invalid or empty codes are rejected before they enter a lobby.

**Why this priority**: Joining is equally essential as hosting; most sessions need at least one guest player.

**Independent Test**: A second player can join an existing room using a valid code and appear in that room’s participant list; invalid codes never place them in a lobby.

**Acceptance Scenarios**:

1. **Given** an active room with code `ABCD`, **When** another player enters `ABCD` and a valid display name, **Then** they join that room’s lobby and appear in its participant list.
2. **Given** no room exists for the entered code, **When** a player attempts to join, **Then** they remain outside any lobby and see a clear message that the room could not be found.
3. **Given** a player leaves the room code field empty or enters only whitespace, **When** they submit, **Then** join is blocked and they see a clear message explaining that a code is required.
4. **Given** two different active rooms, **When** players join each using the respective codes, **Then** each player only sees participants and status for their own room (no cross-room visibility).
5. **Given** a room where the last participant has left, **When** another player tries to join using that room’s former code, **Then** join is rejected with a clear message that the room could not be found.
6. **Given** a lobby that already has the maximum number of participants (10), **When** another player attempts to join with a valid code, **Then** join is rejected with a clear message that the room is full.

---

### User Story 3 - Lobby Stays Current and Host Starts the Game (Priority: P2)

Players waiting in the lobby see an up-to-date participant list without manual action. Only the host can start the drawing game, and only when enough players are present.

**Why this priority**: Accurate lobby state and controlled game start prevent confusion and unfair starts; it builds on create/join flows.

**Independent Test**: With two browsers (host + guest), the guest appears in the host’s lobby within the refresh interval; the host can start when two players are present, while the guest cannot.

**Acceptance Scenarios**:

1. **Given** a host is in the lobby and another player joins, **When** the host waits without manually refreshing, **Then** the new player appears in the participant list within approximately 2 seconds.
2. **Given** a room with only the host, **When** the host views start controls, **Then** starting the game is not available (disabled or hidden) with feedback that at least one more player is needed.
3. **Given** a room with the host and at least one other player, **When** the host starts the game, **Then** the session transitions from waiting to in-progress for participants in that room.
4. **Given** a non-host player in the lobby, **When** they attempt to start the game, **Then** they cannot start and see that only the host may start.
5. **Given** a room in an active drawing round (not lobby, not result), **When** a new player tries to join with a valid code, **Then** join is rejected, they remain outside the room, and they see a clear message that the game has already started.

---

### Edge Cases

- What happens when the host closes the browser before anyone else joins? Closing the tab counts as leaving; if they were the last participant, the room is removed and the code no longer works for new joins.
- What happens when a participant refreshes the page? Refresh is treated as disconnect; if the room still exists and the client retained their room identity, they resume as the same participant (host status preserved for the creator).
- What happens when a disconnected participant returns after the room was removed (last person left)? They cannot resume; they must create or join a different room with a new code.
- What happens when the lobby is at capacity (10 participants)? Additional join attempts with a valid code are rejected with a “room full” message.
- What happens when the host leaves but one or more guests remain? The room stays active for remaining participants; the host role remains with the absent host until they return (host transfer out of scope).
- What happens when the host disconnects after a guest has joined but before start? Guests remain in the lobby; start remains unavailable to non-hosts until the host returns or product policy defines host transfer (out of scope unless added later).
- What happens when two players submit the same display name? Both may appear with the same visible name; the system still treats them as distinct participants.
- What happens when a player enters a room code with different letter casing (e.g., `abcd` vs `ABCD`)? Join succeeds for the same room if the code matches regardless of casing entered.
- What happens when a player tries to join while already in another room’s lobby? They complete join for the new code and are associated with that room (prior lobby session is abandoned from their perspective).
- What happens under slow network during create/join? The player sees a loading state and either succeeds into the lobby or receives a clear failure message without partial or ambiguous room membership.
- What happens when a player joins with a valid code after the host started the game? Join is rejected with a message that the game has already started; they are not added as a participant or spectator.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a new drawing-game room by providing a valid display name.
- **FR-002**: Upon successful room creation, the system MUST assign the creating player as the host for that room.
- **FR-003**: Upon successful room creation, the system MUST generate and expose a unique, shareable room code for that room only.
- **FR-004**: The system MUST allow a player to join an existing room by entering a room code and a valid display name.
- **FR-005**: The system MUST reject join attempts when the room code is empty, whitespace-only, or does not match any active room, with a **distinct**, user-readable error message for each case (e.g., “Room code is required” vs “Room not found”).
- **FR-006**: The system MUST reject room creation when the display name is empty or whitespace-only, with a clear error message.
- **FR-007**: The system MUST keep each room’s participants, host identity, and lobby status isolated so that data from one room is never shown to players in another room.
- **FR-008**: While players are in the lobby, the system MUST automatically refresh lobby information so that participant changes become visible within approximately 2 seconds without requiring manual refresh.
- **FR-009**: The system MUST allow only the designated host to initiate transition from lobby to in-progress game.
- **FR-010**: The system MUST prevent the host from starting the game until at least two participants (including the host) are present in the room.
- **FR-011**: The system MUST prevent non-host participants from starting the game under any lobby state.
- **FR-012**: The system MUST present the room code prominently in the lobby so the host can share it with others.
- **FR-013**: The system MUST list all current participants in the lobby with their display names.
- **FR-014**: The system MUST treat room codes as matching independent of letter casing entered by the player.
- **FR-015**: The system MUST reject join attempts when the room is in an **active drawing round** (`drawing` status), with a clear message that the game has already started. Join while the room is in **result** state is out of scope here and is handled by feature `004-result-restart-lobby`.
- **FR-016**: The system MUST remove a room (and invalidate its code for new joins) when the last participant leaves that room.
- **FR-017**: The system MUST treat a participant as having left when they disconnect (e.g., close the tab, navigate away, or stop being reachable for a prolonged period), not only when they use an explicit “leave” control if one exists.
- **FR-018**: The system MUST allow a returning participant to resume the same participant identity (including host) when the room still exists and the client retains their prior room identity, without requiring them to re-enter the room code.
- **FR-019**: The system MUST limit each lobby to a maximum of 10 participants and MUST reject new joins when at capacity with a clear “room full” message.

### Key Entities

- **Room**: An isolated session identified by a unique code; holds lifecycle status (`lobby`, `drawing`, or `result` per product constitution), creation time, and its participant collection. The room exists only while at least one participant is present.
- **Participant**: A player instance within a room, with a stable internal identity retained across brief disconnects on the same client, display name, and join time; exactly one participant per room is designated as host.
- **Host**: The participant who created the room; holds exclusive permission to start the game when start conditions are met.
- **Room code**: A short, unique, human-shareable identifier used to route join requests to exactly one room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach the lobby with a visible shareable code in under 30 seconds from a typical home/create screen.
- **SC-002**: A player joining with a valid code sees themselves in the correct lobby in under 30 seconds, including name entry and submission.
- **SC-003**: 100% of join attempts with empty or unknown codes are blocked with an explicit error message (no silent failure or wrong-room entry).
- **SC-004**: When a second player joins an existing lobby, the host’s participant list updates to include them within 3 seconds in at least 95% of attempts under normal network conditions.
- **SC-005**: In usability testing or structured scenarios, non-host players are unable to start the game in 100% of attempts.
- **SC-006**: In structured scenarios with only one participant, the host cannot start the game in 100% of attempts.
- **SC-007**: In multi-room test scenarios, zero instances occur where a player sees another room’s participants or host-only actions.
- **SC-008**: 100% of join attempts when the lobby already has 10 participants are rejected with an explicit “room full” message.

## Assumptions

- Players are identified by a display name they enter at create/join time; there is no account login or persistent profile requirement.
- Room codes are short and suitable for verbal or chat sharing; **this release uses 4-character codes** from the starter generator (not security tokens).
- Each lobby supports at most 10 participants (within the product’s 8–12 player cap range); joins beyond that are rejected as “room full.”
- Join to a room in an **active drawing round** is not allowed: valid-code join attempts are rejected with a clear “game already started” message (no mid-round spectator). Join during **result** state is defined in `004-result-restart-lobby`, not this feature.
- Host transfer if the host disconnects is out of scope; the original creator remains host for the room instance.
- “Drawing game” context implies a subsequent in-game phase after start; this feature covers lobby create/join/start gating only.
- Automatic lobby refresh at ~2 second intervals is the expected update cadence; manual refresh may exist as a supplement but must not be required to see new players.
- A room code is valid only while the room has at least one participant; when the last participant leaves, the room is destroyed and the code behaves like an unknown code for new join attempts.
- “Leaves the room” includes disconnect (tab close, navigation away, prolonged unreachable), not only an explicit leave action.
- Clients may retain a participant’s room identity locally so they can resume the same participant after disconnect while the room still exists.
