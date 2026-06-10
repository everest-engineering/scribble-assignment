# Feature Specification: Room Setup & Lobby

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User scenario: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a private room as host (Priority: P1)

A player opens the app, chooses to create a room, enters a non-empty display name, and is taken to a lobby screen showing a unique room code. They are automatically the host of that room.

**Why this priority**: Without room creation, no game can start. This is the entry point for every session and must work before any other capability is meaningful.

**Independent Test**: Open the app, create a room with a display name, and confirm the lobby renders with a visible room code, the creating player listed as a participant with a host indicator, and host-only controls present.

**Acceptance Scenarios**:

1. **Given** a player on the start screen, **When** they create a room with a non-empty display name, **Then** a lobby is shown with a unique room code and the player listed as the only participant.
2. **Given** a newly created room, **When** the lobby renders for the creator, **Then** host-only controls (Start Game) are visible to that player.
3. **Given** a creator alone in the lobby, **When** fewer than 2 players are present, **Then** the Start Game action is visible but disabled.
4. **Given** the create form, **When** the player submits an empty or whitespace-only display name, **Then** the form rejects the submission with a validation message and no network request is made.

---

### User Story 2 - Join an existing room with a code (Priority: P1)

A second player opens the app, chooses to join, enters a non-empty display name and a room code shared by the host, and lands in the same lobby. Empty or invalid codes are rejected with clear feedback.

**Why this priority**: Multiplayer is impossible without joining. Combined with US1, this delivers a working two-player lobby — the minimum for the host to start a game.

**Independent Test**: With a room already created, a second client enters the room code and a name, then verifies the lobby shows both players and that the second player does not see host-only controls.

**Acceptance Scenarios**:

1. **Given** an existing room with code `ABCD`, **When** a second player submits name and code `ABCD` (or `abcd`, or `aBcD`, or with surrounding whitespace), **Then** they are placed into the same lobby and see both participants.
2. **Given** the join form, **When** the player submits an empty room code or empty display name, **Then** the form rejects the submission with a validation message and no network request is made.
3. **Given** the join form, **When** the player submits a syntactically valid but non-existent code, **Then** the player sees a clear error message ("Room not found") inline and remains on the join screen.
4. **Given** a non-host participant in the lobby, **When** the lobby renders, **Then** the Start Game action is not visible to them.

---

### User Story 3 - Lobby stays in sync automatically (Priority: P2)

While waiting in the lobby, every player sees the participant list update on its own as others join, without anyone clicking refresh.

**Why this priority**: Removes the existing manual-refresh friction and is required for the scenario's "polling (~2s)" guarantee. Builds on US1+US2 but is otherwise independent.

**Independent Test**: Open the lobby in two clients. From a third client, join the same room. Within ~2 seconds the existing two clients should both display the new participant without user action.

**Acceptance Scenarios**:

1. **Given** a player viewing the lobby, **When** another player joins the same room, **Then** the new participant appears in the lobby list within approximately 2 seconds without any manual refresh.
2. **Given** a player viewing the lobby, **When** the polling request fails transiently (network error or 5xx), **Then** the previously rendered participant list is preserved and polling continues on the next tick.
3. **Given** a player viewing the lobby, **When** the room can no longer be found (404), **Then** polling stops and the UI surfaces a "Room no longer available" state with a path back to the start screen.
4. **Given** a player navigates away from the lobby, **When** they leave the page, **Then** polling for that lobby stops.

---

### User Story 4 - Host starts the game when ready (Priority: P2)

Once at least two players are present, the host can start the game. Non-hosts cannot — both visually (the control is hidden) and at the server (a forged request is rejected).

**Why this priority**: Closes the lobby phase. Required for the lobby feature to be useful end-to-end. The downstream gameplay screen is out of scope for this feature; only the host-gate enforcement matters here.

**Independent Test**: With two players in a lobby, confirm the host sees an enabled Start Game control and a non-host does not see it. A direct HTTP call as a non-host or with fewer than 2 participants is rejected by the server.

**Acceptance Scenarios**:

1. **Given** a lobby with one participant (the host), **When** the host views the lobby, **Then** the Start Game action is visible but disabled.
2. **Given** a lobby with two or more participants, **When** the host views the lobby, **Then** the Start Game action is visible and enabled.
3. **Given** a non-host participant, **When** they view the lobby, **Then** the Start Game action is not visible to them.
4. **Given** a non-host participant, **When** they attempt to trigger Start Game (e.g., by replaying or forging the request), **Then** the system rejects the action with an authorization error and the room state does not change.
5. **Given** the host, **When** they trigger Start Game with fewer than 2 participants, **Then** the system rejects the action with a "need at least 2 players" error.

---

### Edge Cases

- A user submits a room code with leading/trailing whitespace or mixed case — the system normalizes it (trim + uppercase) before lookup so `abcd `, `ABCD`, and `aBcD` all resolve to the same room.
- Two simultaneous create requests must each receive distinct, non-colliding room codes.
- A player joins with a display name that duplicates another participant's name — both are accepted; participants are distinguished by their server-issued participant identity, not by name.
- The host closes their browser before starting the game — the room continues to exist for the remaining process lifetime; host privileges remain bound to the original creator's participant identity (no automatic host transfer in this feature).
- A second player loads the lobby before any poll cycle has completed — the initial render uses the join response payload, so the second player is visible immediately on their own screen.
- Empty or whitespace-only display name on create or join — rejected with a validation message before any network call.
- A page refresh while in `/lobby` — the user remains in the lobby (the participant identity and room code are rehydrated for that tab).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a new room by providing a non-empty display name and MUST place that player into a lobby for the new room.
- **FR-002**: The system MUST assign the player who created a room as the host of that room.
- **FR-003**: The system MUST generate a room code for each new room that is unique among all currently active rooms.
- **FR-004**: The system MUST allow a player to join an existing room by providing a non-empty display name and a room code.
- **FR-005**: The system MUST reject create or join attempts where the display name or room code is empty or whitespace-only, with a clear validation message, and MUST NOT issue the corresponding HTTP request in that case.
- **FR-006**: The system MUST reject join attempts where the room code does not match any active room, returning a clear, user-readable error message ("Room not found") that the client displays inline.
- **FR-007**: The system MUST normalize room codes for lookup (trimmed and case-insensitive) so visually equivalent codes resolve to the same room.
- **FR-008**: The system MUST isolate room state: a participant in one room MUST only see participants and state belonging to that room.
- **FR-009**: The lobby MUST display the room code prominently so the host can share it.
- **FR-010**: The lobby MUST display the current list of participants for the active room with a clear indicator of which participant is the host.
- **FR-011**: The lobby MUST automatically refresh the participant list approximately every 2 seconds while the lobby view is active, without requiring user action.
- **FR-012**: The lobby MUST stop automatic refresh when the user leaves the lobby view, and MUST tolerate transient (non-404) refresh failures by keeping the last successful participant list visible.
- **FR-013**: When a refresh returns "room not found", the lobby MUST stop polling and surface a clear "Room no longer available" state.
- **FR-014**: The Start Game action MUST be visible only to the host of the room.
- **FR-015**: The Start Game action MUST be disabled while fewer than 2 participants are present, and enabled once 2 or more participants are present.
- **FR-016**: The system MUST reject any Start Game request that does not originate from the host of that room, returning an authorization error and leaving room state unchanged.
- **FR-017**: The system MUST reject any Start Game request when the room has fewer than 2 participants, returning a clear precondition error.
- **FR-018**: The system MUST identify a participant by a stable participant identity issued at create-or-join time, so that host privileges and room membership cannot be impersonated by display name alone.

### Key Entities *(include if feature involves data)*

- **Room**: A private game session identified by a unique, shareable room code. Has a status (lobby), an ordered list of participants, a designated host (by participant identity), and timestamps.
- **Participant**: A player inside exactly one room at a time. Has a stable participant identity, a display name, and a join timestamp.
- **Room Code**: The short, human-shareable identifier used to join a room. Treated case-insensitively and trimmed of surrounding whitespace.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time player can create a room and reach the lobby with the room code visible in under 30 seconds from opening the app.
- **SC-002**: A second player given a valid room code can join and see the same lobby as the host in under 30 seconds.
- **SC-003**: When a new player joins a room, all other participants viewing the lobby see the updated participant list within 3 seconds, without any manual action.
- **SC-004**: 100% of create or join attempts with empty or invalid inputs produce a clear, user-readable error message rather than a generic failure or a stuck UI.
- **SC-005**: 0% of Start Game attempts succeed when initiated by a non-host or when fewer than 2 participants are present.
- **SC-006**: 0 cross-room leakage incidents: in any test where two rooms exist concurrently, no participant from one room appears in the other room's lobby list.

## Assumptions

- Synchronization between clients is achieved exclusively via HTTP polling at approximately a 2-second cadence; no real-time push protocols are used (per project constitution Principle II).
- All room and participant data is stored in server process memory for the lifetime of the process; no persistence across restarts is required for this feature (per Principle II).
- There is no authentication system: a participant's identity is the opaque `participantId` returned at create or join time, supplied by the client on subsequent requests for that room (per Principle II).
- Display names are not required to be unique within a room.
- Host transfer when the original host disconnects is out of scope for this feature; the host remains the original creator for the room's lifetime.
- Maximum room size and idle-room reaping policy are existing platform decisions and are not redefined by this feature.
- "Approximately every 2 seconds" for polling is interpreted as an interval in the range of roughly 1.5–3 seconds, allowing for jitter and pause-on-hidden behavior.
- Downstream gameplay (drawing, guessing, scoring, results) is a separate feature; only the host-gate enforcement on the Start action is in scope here.
