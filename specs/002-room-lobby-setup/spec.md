# Feature Specification: Phase 1 Room Lobby Setup

**Feature Branch**: `002-room-lobby-setup`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "I am starting Phase 1 of the Scribble lab. This phase covers room setup, lobby, and player name validation — features R1 through R5 plus G1.

Before writing the spec, do discovery first. Read these files and note what already exists vs what's missing:
- backend/src/models/game.ts
- backend/src/services/roomStore.ts
- backend/src/api/rooms.ts
- backend/src/api/schemas.ts
- frontend/src/pages/CreateRoomPage.tsx
- frontend/src/pages/JoinRoomPage.tsx
- frontend/src/pages/LobbyPage.tsx
- frontend/src/state/roomStore.ts

Then write a feature specification covering:

R1 — Create room: Generates a unique room code; creator joins automatically as host.
R2 — Join room by code: Empty / invalid / non-existent codes are rejected with clear feedback.
R3 — Multi-room isolation: State in room A never appears in room B.
R4 — Lobby player list: Player list refreshes via polling; new joiners appear within ~2s.
R5 — Host starts game: Only the host can start; minimum 2 players required.
G1 — Player name validation: Names are trimmed; empty or whitespace-only names are rejected with a clear message on both Create Room and Join Room flows.

For each feature, include:
- Acceptance criteria
- Edge cases discovered during inspection
- Discovery notes — what already works in the starter, what is missing or broken

Stay strictly within these features. Do not include drawer assignment, secret word, drawing, guessing, scoring, result, or restart — those are for later phases.

Out of scope (do not include in this spec): WebSockets, persistent storage, authentication, multiple rounds, timers, drawer rotation."

## Clarifications

### Session 2026-05-19

- Q: What exact room-code format should validation enforce? → A: Exactly 4 uppercase characters using the existing easy-to-read character set.
- Q: How should the lobby present start restrictions? → A: Show the Start Game control, disable it when the viewer is not the host or when fewer than two players are present, and show a clear reason.
- Q: Are duplicate player names allowed in the same room? → A: Yes, duplicate trimmed non-empty player names are allowed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Join a Lobby (Priority: P1)

As a player, I want to create a room or join an existing room with a valid name and
room code so I can enter the correct lobby without confusion.

**Why this priority**: Without reliable room creation, join flow, and name
validation, no multiplayer session can begin.

**Independent Test**: A player can create a room, automatically enter that lobby,
and a second player can join it by code with clear validation feedback for invalid
names or room codes.

**Acceptance Scenarios**:

1. **Given** a player enters a name with leading or trailing spaces, **When** they
   create a room, **Then** the room is created, the name is stored without extra
   outer spaces, and the creator enters that room immediately.
2. **Given** a player submits an empty or whitespace-only name on either entry flow,
   **When** the form is submitted, **Then** the action is rejected and the player
   sees a clear message explaining that a non-empty name is required.
3. **Given** a player enters a valid room code for an existing room, **When** they
   join, **Then** they enter that room and appear in its lobby player list.
4. **Given** a player enters a blank, malformed, or non-existent room code,
   **When** they try to join, **Then** the join is rejected and the player sees
   clear feedback describing the problem.

**Discovery Notes**:

- The starter already creates a room, joins the creator to it, and navigates both
  create and join flows into the lobby.
- The starter currently accepts missing names and silently substitutes a fallback
  player name instead of requiring a valid trimmed name.
- The starter already uppercases join codes in the user flow, but it does not
  clearly distinguish blank, malformed, and non-existent codes in user feedback.

---

### User Story 2 - See the Correct Lobby Roster (Priority: P2)

As a player, I want the lobby player list to refresh automatically and stay isolated
to my room so I can trust who is actually in my session.

**Why this priority**: Players must see the right roster quickly before they can
coordinate starting the game.

**Independent Test**: Two rooms can exist at once without participant leakage, and
new joiners appear in the correct lobby within about two seconds without manual
intervention.

**Acceptance Scenarios**:

1. **Given** two different rooms exist at the same time, **When** players join one
   room, **Then** those players never appear in the other room's lobby list.
2. **Given** a player is waiting in the lobby, **When** another player joins the
   same room, **Then** the waiting player sees the updated participant list within
   about two seconds.
3. **Given** lobby refresh fails temporarily, **When** the player remains in the
   lobby, **Then** the most recent valid participant list remains visible and the
   player sees clear refresh feedback.

**Discovery Notes**:

- The starter already stores rooms separately by room code, which supports room
  isolation at a behavioral level.
- The starter currently offers only a manual refresh action in the lobby; automatic
  polling is missing.
- The starter already shows the latest fetched participant list, but not on a timed
  refresh cycle.

---

### User Story 3 - Start From the Lobby as Host (Priority: P3)

As the host, I want to start the game only when enough players are present so the
transition out of the lobby is controlled and valid.

**Why this priority**: Starting the game is the final gate in Phase 1 and depends on
correct room membership and host identification.

**Independent Test**: In a room with two or more players, only the host can start
the game; non-host players cannot start it, and the host cannot start with fewer
than two players.

**Acceptance Scenarios**:

1. **Given** the room creator is in the lobby alone, **When** they try to start the
   game, **Then** the action is blocked and a clear message explains that at least
   two players are required.
2. **Given** a room has at least two players, **When** the host starts the game,
   **Then** the room leaves the lobby state and all players in that room can
   continue into the started game flow.
3. **Given** a non-host player is in the lobby, **When** they attempt to start the
   game, **Then** the action is unavailable or rejected with clear feedback.

**Discovery Notes**:

- The starter currently shows a Start Game button to any lobby viewer and allows
  navigation forward without host checks or minimum-player rules.
- The starter room state only represents the lobby, so start-game behavior must be
  introduced for the first time in this phase.
- The starter does not currently record host identity.

---

### Edge Cases

- A player enters a name made only of spaces on either entry flow.
- A player enters a valid name with accidental outer spaces; the stored display name
  must not keep those spaces.
- Two players in the same room choose the same trimmed non-empty display name.
- A player submits a blank room code.
- A player submits a room code with the wrong length or characters outside the
  supported 4-character uppercase easy-to-read set.
- A player submits a room code that looks valid but does not match any active room.
- Two players create different rooms near the same time; each room must keep its own
  participants and subsequent updates.
- A player is viewing the lobby while another player joins between refresh cycles.
- The lobby refresh request fails after a previously successful load; the visible
  roster should not disappear unnecessarily.
- A non-host opens the lobby at the same time the host has start permission; start
  controls and messages must still reflect the correct role.
- The host reaches the lobby with only one player present and attempts to start.
- The lobby shows the Start Game control while it is disabled; the reason for the
  disabled state must stay clear for both non-host players and the host waiting for
  a second player.

## Constitution Alignment *(mandatory)*

- **Typed Contract Impact**: Room state and session data will expand to distinguish
  host privileges, start eligibility, and non-lobby status changes needed for
  starting the game.
- **Validation Boundaries**: Player names, room codes, room existence checks,
  join eligibility, and host-only start attempts all require explicit validation.
- **State & Storage Impact**: Room state remains in-memory and room-scoped. The
  feature adds lobby-specific state only and must preserve strict separation between
  active rooms.
- **Scope Guardrail**: This specification is limited to Phase 1 room setup, lobby
  refresh, host start gating, and trimmed name validation. Drawing, guessing,
  scoring, result handling, restart, multiple rounds, timers, drawer rotation,
  persistent storage, authentication, and live transport remain out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (R1)**: The system MUST create a new room with a unique room code each
  time a player successfully completes the create-room flow.
- **FR-002 (R1)**: The system MUST add the room creator to the new room immediately
  and identify that player as the host.
- **FR-003 (G1)**: The system MUST trim leading and trailing spaces from player names
  before validation and storage.
- **FR-004 (G1)**: The system MUST reject empty or whitespace-only player names on
  both the create-room and join-room flows with clear feedback before the player
  enters a lobby.
- **FR-005 (G1)**: The system MUST allow duplicate player names within the same room
  as long as each submitted name is non-empty after trimming.
- **FR-006 (R2)**: The system MUST reject blank room codes with clear feedback.
- **FR-007 (R2)**: The system MUST accept room codes only when they are exactly
  4 uppercase characters from the supported easy-to-read room-code set, and MUST
  reject all other formats with clear feedback.
- **FR-008 (R2)**: The system MUST reject room codes that pass format checks but do
  not match an active room with clear feedback that the room was not found.
- **FR-009 (R2)**: The system MUST allow a player with a valid trimmed name and a
  valid existing room code to join that room successfully.
- **FR-010 (R3)**: The system MUST keep each room's participants, lobby updates, and
  start permissions isolated to that room only.
- **FR-011 (R4)**: The lobby player list MUST refresh automatically while a player
  remains in the lobby so that newly joined players appear within about two seconds.
- **FR-012 (R4)**: The lobby MUST continue showing the most recent valid player list
  if a refresh attempt fails, while also providing clear refresh feedback.
- **FR-013 (R5)**: The system MUST allow only the host to start the game from the
  lobby.
- **FR-014 (R5)**: The system MUST prevent the host from starting the game until at
  least two players are present in the room.
- **FR-015 (R5)**: The system MUST reject or hide start attempts from non-host
  players with clear feedback.
- **FR-016 (R5)**: The lobby MUST show the Start Game control to players in the
  room, disable it whenever the viewer is not the host or the room has fewer than
  two players, and show a clear reason for the disabled state.
- **FR-017 (R5)**: When the host starts the game successfully, the room MUST leave
  the lobby state for all players in that room.

### Key Entities *(include if feature involves data)*

- **Room**: A joinable multiplayer session identified by a room code, with a host,
  a current phase, and a participant roster that stays isolated from other rooms.
- **Participant**: A player identified within a room by a stored display name,
  join order or join time, host or non-host role, and room-scoped identity that
  does not depend on the display name being unique.
- **Lobby View**: The room-specific snapshot shown to a player while waiting in the
  lobby, including participant list, start eligibility, disabled-start reasons, and
  user-facing messages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful create-room attempts place the creator into a new
  lobby immediately with a visible room code.
- **SC-002**: 100% of blank or whitespace-only player names are rejected with clear
  feedback before a lobby is entered.
- **SC-003**: 100% of blank, malformed, or non-existent room codes are rejected with
  clear feedback and do not place the player into a lobby.
- **SC-004**: In manual verification with two browser sessions, a newly joined player
  appears in the correct lobby roster within two seconds.
- **SC-005**: In manual verification with two concurrent rooms, no participant or
  lobby state from one room appears in the other room.
- **SC-006**: 100% of non-host start attempts are blocked, and 100% of host start
  attempts with fewer than two players are blocked with clear feedback.

## Assumptions

- Room codes remain short and human-entered rather than hidden behind invitation
  links or account-based invitations.
- The system supports one host per room, and the original room creator is that host
  for this phase.
- Players stay connected through repeated room refreshes without needing accounts or
  persistent identity beyond the current session.
- Starting the game in this phase only needs to move the room out of the lobby and
  into the next shared phase; later gameplay behavior is defined in later phases.
- Multiple rounds, timers, drawer rotation, live drawing transport, and data
  persistence remain out of scope for this feature.

## Verification Plan *(mandatory)*

- **Build Validation**: Verify the changed application still supports the create,
  join, lobby, and start flows across all affected app surfaces before handoff.
- **Story Validation**: Validate each user story independently:
  create and join with name/code feedback, lobby isolation plus timed roster
  refresh, and host-only start with a two-player minimum.
- **Manual Multiplayer Checks**: Use at least two simultaneous player sessions and
  at least two separate rooms to confirm lobby refresh timing, room isolation, host
  restrictions, and minimum-player start rules.
