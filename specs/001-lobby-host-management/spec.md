# Feature Specification: Lobby & Host Management

**Feature Branch**: `001-lobby-host-management`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Create lobby management with host tracking, player validation, lobby polling, and host-only game start"

## Clarifications

### Session 2026-06-08

- Q: What happens when the host leaves the room? → A: Host role passes to the next player who joined earliest
- Q: Should duplicate player names be allowed? → A: Yes, duplicate names are allowed — no uniqueness enforcement

### Session 2026-06-09

- Q: Where should inline error messages appear on the join/create form? → A: Directly below the relevant input field, in red text (12px, #D32F2F). They clear automatically when the user starts typing in that field.
- Q: Does "at least 2 participants" (FR-010) count the host? → A: Yes, the host counts toward the minimum of 2.
- Q: How does the manual Refresh button coexist with auto-polling? → A: The manual button does not reset the auto-poll timer. Manual refresh is a one-off immediate fetch; auto-polling continues independently on its schedule.
- Q: What distinguishes "game view" (US4-4) from the lobby? → A: "Game view" means the room status is now "playing"; the lobby UI is replaced with the game UI (canvas, word display, chat). This is the same transition as "game round begins" (US4-1) — describing the UI consequence rather than the game-logic event.
- Q: Is the 3-second acceptance criterion (SC-002) compatible with the 2-second polling interval (FR-007)? → A: Yes. Given a tolerance of 1.5–2.5s per FR-007, the worst-case delay from a join event to the next poll is ~2.5s. The 3s bound accounts for network latency and server processing.
- Q: What happens when the creator's browser is hard-refreshed? → A: The `participantId` is persisted in localStorage. On page load, the lobby reads this ID and resumes polling GET /rooms/:code. If the room is gone (404), the player is redirected to the join page.

## User Scenarios & Testing

### User Story 1 - Host Creates and Manages Room (Priority: P1)

A player creates a room and is automatically recognised as the host. The host sees the lobby with their room code and can see other players joining. The host can start the game when ready.

**Why this priority**: Host designation is the foundation for all subsequent game actions (starting, drawer assignment). Without host tracking, no game can proceed.

**Independent Test**: Can be fully tested by creating a room and verifying the creator is designated as host, then having another player join and confirming the host remains unchanged.

**Acceptance Scenarios**:

1. **Given** no room exists, **When** a player creates a new room, **Then** that player is designated as the host
2. **Given** a room with an existing host, **When** a new player joins, **Then** the host designation remains unchanged
3. **Given** a room with multiple players, **When** any participant views the lobby, **Then** the host is clearly identified in the participant list

---

### User Story 2 - Players Join with Validated Names (Priority: P1)

Players can join a room only if they provide a valid player name and a valid room code.

**Why this priority**: Player identity and room access are fundamental to the game experience. Invalid inputs should give clear, helpful feedback rather than failing silently.

**Independent Test**: Can be fully tested by submitting various invalid inputs (empty names, whitespace-only names, invalid room codes) and verifying clear error messages are shown.

**Acceptance Scenarios**:

1. **Given** a player is on the join room form, **When** they submit with an empty or whitespace-only name, **Then** an inline error message is shown and the room is not joined
2. **Given** a player is on the join room form, **When** they submit a valid name with an invalid or non-existent room code, **Then** a clear error message is shown explaining the room was not found
3. **Given** a player is on the join room form, **When** they submit with an empty room code, **Then** an inline error message is shown and the form is not submitted
4. **Given** a player submits a valid name with leading/trailing spaces, **When** the name is processed, **Then** the spaces are trimmed and the trimmed name is used

---

### User Story 3 - Lobby Auto-Refreshes (Priority: P2)

Players in the lobby see new joiners appear automatically without manually clicking a refresh button.

**Why this priority**: A manual refresh button works but creates a poor user experience. Auto-refresh makes the lobby feel live and responsive.

**Independent Test**: Can be tested by opening the lobby in two browser windows, joining from the second window, and verifying the first window automatically shows the new player within a few seconds.

**Acceptance Scenarios**:

1. **Given** a player is on the lobby page, **When** another player joins the room, **Then** the participant list updates automatically within 3 seconds
2. **Given** a player is on the lobby page, **When** the lobby auto-refreshes with no changes, **Then** the player's view remains stable with no visual flicker — the DOM must not cause layout shift (cumulative layout shift score 0), and the participant list must not re-render if the data is identical
3. **Given** a player is on the lobby page, **When** the network is temporarily unavailable during a refresh, **Then** the player sees a subtle loading indicator and the last known state is preserved — the participant list, room code, host identity, and start button state all remain visible with their pre-fetch values; only the loading indicator distinguishes the stale state

---

### User Story 4 - Host Starts the Game (Priority: P1)

Only the host can start the game, and only when at least 2 players are present.

**Why this priority**: Starting the game is the transition point from lobby to gameplay. Host-only control prevents unauthorised starts, and the 2-player minimum ensures the game is playable.

**Independent Test**: Can be tested by verifying the start button is only visible/active for the host, and verifying it requires at least 2 players.

**Acceptance Scenarios**:

1. **Given** the host is viewing the lobby with at least 2 players, **When** the host clicks "Start Game", **Then** the game round begins
2. **Given** a non-host player is viewing the lobby, **When** they look for a start option, **Then** no start button is available to them
3. **Given** the host is viewing the lobby with only 1 player, **When** they look for a start option, **Then** the start button is disabled with a message indicating more players are needed
4. **Given** the host has started the game, **When** they or other players view the lobby, **Then** the lobby transitions to the game view

---

### Edge Cases

- What happens if the host leaves the room? [v2 scope] The host role passes to the next player who joined earliest, keeping the game alive
- What happens if all players leave the room? The room should be cleaned up after all participants depart
- What happens when a player submits very long names (e.g., 100+ characters)? Names should be truncated to a reasonable maximum length
- What happens if a player tries to join a room that has already started a game? The join should be rejected with an appropriate message
- What happens if two players join with the same name? Duplicate names are allowed — participants are distinguished by their unique participant ID, not by name

## Requirements

### Functional Requirements

- **FR-001**: System MUST designate the room creator as the host
- **FR-002**: System MUST preserve host designation when new players join
- **FR-003**: System MUST reject player names that are empty or whitespace-only, with an inline error message
- **FR-004**: System MUST trim leading and trailing whitespace from player names before acceptance
- **FR-005**: System MUST reject join attempts for non-existent room codes with a clear error message
- **FR-006**: System MUST reject join attempts for rooms where a game is in progress
- **FR-007**: System MUST auto-refresh lobby state on the frontend at approximately 2-second intervals (tolerance: 1.5–2.5s)
- **FR-008**: System MUST show a subtle loading state during lobby refresh without full page flicker. The loading indicator MUST be positioned above the participant list, use a thin animated bar (< 4px height, colour #E0E0E0, fade-in/out 300ms), and MUST NOT cause layout shift (reserve space before appear).
- **FR-009**: System MUST limit the "Start Game" button to the host only — non-host players must not see or have access to this control
- **FR-010**: System MUST require at least 2 participants (including the host) before the host can start the game
- **FR-011**: System MUST show the start button as disabled with a reason when fewer than 2 players are present
- **FR-012**: System MUST enforce a maximum player name length of 30 characters
- **FR-013**: System MUST implement polling with exponential backoff on network errors: retry after 1s, then 2s, then 4s, max 3 retries before showing a persistent "Connection lost" banner
- **FR-014**: System MUST detect room deletion during polling (HTTP 404) and redirect the player to the join page with a "Room no longer exists" message
- **FR-015**: System MUST debounce the "Start Game" button client-side (1s cooldown) and MUST reject duplicate start requests server-side by checking room status before processing
- **FR-016**: System MUST preserve the participant's session (`participantId` in localStorage) so that navigating away and returning restores the lobby state without requiring re-join
- **FR-017**: System MUST restore lobby state on hard refresh by reading `participantId` from localStorage and re-polling GET /rooms/:code; if the room no longer exists, redirect to join page
- **FR-018**: System MUST display a scalable participant list that remains usable at 50+ participants (virtualised list or capped height with scroll, each entry ≤ 40px height)
- **FR-019**: System MUST recover from polling network timeouts (no response after 5s) by showing the last known state with a stale-data indicator (amber badge: "Updates paused") and resuming on next successful poll
- **FR-020**: System MUST process server requests (join, start, create) atomically using Zod validation before mutating room state, preventing partial state corruption under concurrent requests
- **FR-021**: System MUST handle server restart gracefully: in-memory room state is lost, all active clients receive a 404 on next poll and are redirected to the join page

### Key Entities

- **Participant**: Represents a player in a room. Has an id, name (trimmed and validated). Host status is derived at snapshot time via room hostId.
- **Room**: Represents a game room. Has a unique code, status (lobby/playing/finished), participant list, host reference, creation timestamp.
- **LobbySnapshot**: A view of the room presented to players in the lobby. Contains room code, host identity, participant list with names and host indicator, room status.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Players can create a room and see themselves as host within 2 seconds of creation (measured end-to-end: from POST /rooms response received to participant.isHost === true confirmed via GET /rooms/:code)
- **SC-002**: Joiners appear in the host's lobby within 3 seconds of submitting their join request (consistent with FR-007 2s interval — the joiner's data will appear on the next poll cycle, bounded by the 1.5–2.5s tolerance)
- **SC-003**: Players who submit invalid names or room codes receive clear error feedback without a page reload
- **SC-004**: The start game flow from host click to lobby transition completes within 2 seconds
- **SC-005**: Non-host players never see or interact with a start game control

## Assumptions

- The room creator is always the host for the lifetime of the room (host transfer is out of scope for v1)
- Lobby polling interval of 2 seconds provides good balance between responsiveness and server load
- Error messages are client-side validated where possible before submitting to server
- The existing "Refresh" button on the lobby page can remain as a fallback for manual refresh
- Players are expected to have stable internet connectivity for the polling to work effectively
- The in-memory room store is ephemeral: server restart clears all state; clients detect this via 404 and redirect
