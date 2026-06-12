# Feature Specification: Game View Transition

**Feature Branch**: `005-fix-game-view`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "when host starts the game, the participant isn't seeing the game view"

## Clarifications

### Session 2026-06-11

- Q: US2 Scenario 1 says a participant on the join page with a valid room code should be redirected to the game page. Does this mean the join endpoint should allow playing rooms? → A: No. US2 Scenario 1 refers to already-joined participants (existing session) who navigated away and return. New joiners are still rejected per FR-007. The returning participant skips the lobby via LobbyPage mount-time status check.
- Q: What should the UI do if the 2-second poll fails when the room transitions to "playing"? → A: Show a non-blocking error indicator on the lobby while continuing to poll silently. The 2s retry interval handles recovery.
- Q: How should the GamePage handle "finished" state — redirect or show a message? → A: Two distinct behaviors needed: (1) navigating to /game when the room is already finished → redirect to join page; (2) being on /game during "playing" when status transitions to "finished" → stay and display "The round has ended" message.

## User Scenarios & Testing

### User Story 1 - All Players See Game View on Start (Priority: P1)

When the host starts the game, every participant currently in the lobby — including the host — transitions from the lobby page to the game page. No participant remains stuck on the lobby after the game has started.

**Why this priority**: The game cannot proceed if participants never leave the lobby. The host's start action must be visible to all, not just the host.

**Independent Test**: Can be fully tested by opening two browser windows in the same room, starting the game from the host window, and verifying both windows redirect to the game page within 3 seconds.

**Acceptance Scenarios**:

1. **Given** a room with 2+ players in the lobby, **When** the host clicks "Start Game", **Then** every participant sees their browser navigate from the lobby to the game page
2. **Given** a participant is on the lobby page polling the room, **When** the room status changes from "lobby" to "playing", **Then** the participant is redirected to the game page on the next poll cycle
3. **Given** a participant has been redirected to the game page, **When** the game page loads, **Then** the participant sees their role (drawer or guesser) displayed

---

### User Story 2 - Game Page State for Latecomers (Priority: P2)

A participant who was on the join page or had their browser tab backgrounded during the game start should still correctly transition to the game page when they next interact with the app.

**Why this priority**: Players may briefly navigate away, refresh, or join just as the game starts. They should end up at the game page, not the lobby.

**Independent Test**: Can be tested by joining a room during or just after the host clicks start, and verifying the new joiner is directed to the game page (or rejected with a "game in progress" message).

**Acceptance Scenarios**:

1. **Given** a participant who already joined a room navigates back to the join page or home page, **When** the room is already in "playing" status, **Then** the participant is redirected to the game page rather than the lobby on next interaction
2. **Given** a participant hard-refreshes their lobby page, **When** the room status is "playing", **Then** they are redirected to the game page instead of remaining on the lobby

---

### Edge Cases

- What happens if the participant's lobby poll returns status "finished" (game already ended)? They should see a "Game has ended" message and be redirected to the join page
- What happens if the participant's browser session does not contain their participant identity or room identifier? They should be redirected to the join page with an appropriate message
- What happens if the participant navigates to the game page directly without going through the lobby? The game page should check the room status, and if the room is in "playing" state, display the game; otherwise redirect to join page
- What happens if the lobby poll fails (network error) just as the game starts? The lobby should display a non-blocking error indicator (e.g., "Connection issue...") while continuing to poll at the normal 2s interval. The next successful poll will detect the status change and redirect

## Requirements

### Functional Requirements

- **FR-001**: System MUST redirect every participant from the lobby page to the game page when the room status transitions to "playing"
- **FR-002**: System MUST detect the status change on the next lobby status check (status is checked periodically at sub-3-second intervals per existing lobby polling requirements)
- **FR-003**: System MUST preserve the participant's identity and room identifier across the lobby-to-game page transition so that navigating between pages does not require re-joining
- **FR-004**: System MUST display each participant's role ("drawer" or "guesser") on the game page based on the room snapshot data
- **FR-005**: System MUST redirect participants who hard-refresh or navigate to the lobby page while the game is in progress to the game page automatically
- **FR-006**: System MUST redirect participants who navigate to the game page while the room is in "lobby" state to the lobby page, or in "finished" state to the join page
- **FR-007**: System MUST reject join attempts for rooms in "playing" state with a "Game already in progress" error
- **FR-008**: System MUST display an appropriate message on the game page when the room status transitions to "finished" while the participant is already on the game page ("The round has ended")

### Key Entities

- **Room**: Contains status field that transitions from "lobby" → "playing" → "finished". The status is the signal that triggers lobby-to-game page navigation.
- **Participant**: Identified by `participantId`. The role (drawer/guesser) is derived from the room snapshot and must be displayed on the game page.
- **Lobby Page**: The pre-game waiting room. Must detect status === "playing" and redirect to game page.
- **Game Page**: The in-game view. Must verify the room is in "playing" state and display role-specific content.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All participants see the game page within 3 seconds of the host clicking "Start Game" (bounded by the periodic status check cycle plus network latency)
- **SC-002**: The game page correctly displays the participant's role (drawer or guesser) on first load — role (drawer/guesser) must be rendered from the room snapshot data on the first render cycle without relying on a second poll to populate the field
- **SC-003**: 100% of participants who refresh their browser during a game are redirected back to the game page, not the lobby
- **SC-004**: Players who attempt to join a room that has already started receive a clear rejection message and are not admitted

## Assumptions

- All participants have their room identifier and participant identity persisted in the browser session from the join flow
- The lobby page already checks room status periodically at sub-3-second intervals — this fix adds the redirect-on-status-change behavior
- The existing game page already handles role-based rendering per the game rounds spec — this fix ensures participants actually reach it
- Only single-round games are supported (multi-round is out of scope per project constraints)
