# Feature Specification: Room Setup and Lobby

**Feature Branch**: `001-room-setup-and-lobby`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Room setup and lobby — Scenario 1 from README: host on create, name validation, room isolation, lobby polling, host-only start with 2-player minimum."

## Clarifications

### Session 2026-06-03

- Q: What polling interval should the lobby use? → A: 2000 ms; pause when tab hidden (A5).
- Q: What are valid player name rules? → A: 1–24 characters after trim; empty rejected (A6).
- Q: Is there a participant cap per room? → A: Soft cap 8; ninth join returns 409 (Q4).
- Q: How should the broken default API URL be handled? → A: Fix default to `http://localhost:3001`; use form errors only (Q5).
- Q: Does Scenario 1 include backend game start? → A: No; UI gating only; `POST /rooms/:code/start` is Scenario 2.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a room as host (Priority: P1)

A player opens Create Room, enters a valid name, and becomes the host of a new isolated lobby with a shareable 4-character code.

**Why this priority**: Without room creation and host identity, no other lobby behavior can be validated.

**Independent Test**: Create a room in one browser tab; confirm the creator appears in the participant list and is identified as host; confirm a unique room code is shown.

**Acceptance Scenarios**:

1. **Given** a player on the Create Room screen, **When** they submit a trimmed name between 1 and 24 characters, **Then** a new room is created, they land on the lobby, and they are recorded as the host.
2. **Given** a player on the Create Room screen, **When** they submit an empty or whitespace-only name, **Then** the room is not created and a clear validation message is shown without contacting the server (client-side) or with the same message from the server if bypassed.
3. **Given** two rooms created separately, **When** each room is viewed, **Then** participant lists and codes are independent (no cross-room leakage).

---

### User Story 2 - Join a room by code (Priority: P1)

A second player enters a valid room code and name to join an existing lobby.

**Why this priority**: Multi-player lobby validation requires at least one joiner beyond the host.

**Independent Test**: Host creates a room; second tab joins with the code; both tabs show two participants after the next poll cycle.

**Acceptance Scenarios**:

1. **Given** an existing room code, **When** a player submits a valid trimmed name and correct code, **Then** they join the room and appear in the lobby participant list for all connected clients.
2. **Given** a player on Join Room, **When** they submit an empty or whitespace-only room code, **Then** join is rejected with a clear message before any network request.
3. **Given** a player on Join Room, **When** they submit a code that does not match any room, **Then** join fails with a non-technical error message (e.g., unable to join room).
4. **Given** a room that already has 8 participants, **When** a ninth player attempts to join, **Then** join is rejected with a clear conflict message.

---

### User Story 3 - Automatic lobby sync and host-only start gating (Priority: P1)

All players in a lobby see participant updates automatically without manual refresh. Only the host sees an enabled Start control once at least two players are present.

**Why this priority**: Polling and host gating are the defining lobby behaviors for Scenario 1.

**Independent Test**: Open two tabs in the same room; add a joiner in tab B; within ~2 seconds tab A shows the new participant without clicking refresh. Non-host tab shows Start disabled with reason; host tab enables Start only at 2+ players.

**Acceptance Scenarios**:

1. **Given** a player on the lobby page, **When** the page is visible, **Then** the room snapshot refreshes automatically about every 2 seconds.
2. **Given** a lobby tab in the background (document not visible), **When** polling would fire, **Then** polling pauses until the tab becomes visible again.
3. **Given** a non-host participant in the lobby, **When** they view the Start control, **Then** it is disabled and explains that only the host can start.
4. **Given** the host alone in the lobby, **When** they view the Start control, **Then** it is disabled and explains that at least 2 players are required.
5. **Given** the host and at least one other participant, **When** the host views the Start control, **Then** it is enabled (actual round start is deferred to Scenario 2; no backend start call in this scenario).
6. **Given** a lobby with automatic polling active, **When** the user looks for manual refresh, **Then** no manual Refresh Room button is present.

---

### Edge Cases

- Player name longer than 24 characters after trim is rejected with a clear message.
- Room codes are normalized to uppercase on input and lookup; lowercase entry still resolves the same room.
- Join with malformed code length (not 4 characters after trim) is rejected client-side with clear feedback.
- Backend restart clears all rooms; clients receive 404 on poll and show a recoverable error.
- Duplicate player names in one room are allowed (no uniqueness constraint).
- Host disconnecting is not special-cased in Scenario 1; host identity remains the original creator participant id.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST assign the room creator as host and expose host identity in room snapshots via `hostParticipantId`.
- **FR-002**: System MUST trim player names on create and join; reject empty or whitespace-only names with HTTP 400 and a field-level message.
- **FR-003**: System MUST enforce player names of 1–24 characters after trim on create and join.
- **FR-004**: System MUST reject join attempts for unknown room codes with HTTP 404 and a non-technical message.
- **FR-005**: System MUST reject join attempts when the room already has 8 participants with HTTP 409 and a clear message.
- **FR-006**: System MUST keep rooms fully isolated in memory; operations on one room code MUST NOT affect another.
- **FR-007**: Frontend MUST poll room snapshots every 2000 ms ± 100 ms while the lobby page is visible.
- **FR-008**: Frontend MUST pause lobby polling when `document.visibilityState` is not `"visible"`.
- **FR-009**: Frontend MUST remove the manual Refresh Room control once automatic polling is active.
- **FR-010**: Frontend MUST enable the Start control only for the host when at least two participants are present; non-hosts see a disabled control with a short explanation.
- **FR-011**: Frontend MUST validate room code and player name on Join Room before submit, matching server rejection messages.
- **FR-012**: Frontend MUST use a correct default backend base URL (`http://localhost:3001`) when `VITE_API_URL` is unset.

### Key Entities

- **Room**: A lobby container with unique 4-character code, status (`lobby`), participant list, host participant id, and timestamps.
- **Participant**: A player in a room with id, display name (trimmed), and join timestamp.
- **Host**: The participant who created the room; sole actor allowed to enable Start in Scenario 1 UI.
- **Room Snapshot**: Client-safe view of a room including code, status, participants, host id, available words, and roles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host can create a room and see their code within one form submission.
- **SC-002**: A second player can join using the code and appear in the host's lobby within 3 seconds without manual refresh.
- **SC-003**: 100% of empty-name create/join attempts are blocked with a user-visible validation message.
- **SC-004**: Non-host clients never see an enabled Start control; host with fewer than 2 players never sees an enabled Start control.
- **SC-005**: Two concurrently active rooms never show each other's participants when queried by their respective codes.
- **SC-006**: Ninth join attempt to a full room receives a conflict response and no new participant is added.

## Assumptions

- **A5**: Polling cadence is 2000 ms; shared `useRoomPolling` hook pauses when the document is hidden (from discovery.md).
- **A6**: Player names are 1–24 characters after `.trim()` (from discovery.md).
- **Q4 default**: Soft cap of 8 participants per room; join beyond cap returns 409.
- **Q5 default**: Fix default API URL; rely on existing form-level error display rather than a global backend-unreachable banner.
- **Scenario boundary**: Backend `POST /rooms/:code/start` and transition to `playing` state are out of scope (Scenario 2). Scenario 1 Start button gating is UI-only.

## Out of Scope

- Starting a round, drawer assignment, secret word, canvas, guesses, scoring, result state, restart.
- WebSockets, databases, authentication, timers, drawer rotation, spectator mode.
- Manual Refresh Room button after polling ships.

## Validation

Two-tab manual check before closing Scenario 1:

1. Start backend and frontend; create a room as Alice.
2. Confirm Alice is host in lobby; Start disabled with "Need at least 2 players".
3. Open second tab; join same code as Bob.
4. Within ~3 s Alice's tab shows Bob without clicking refresh.
5. Alice sees Start enabled; Bob sees Start disabled with host-only message.
6. Create a second room in a third tab; confirm codes and rosters differ.
7. Attempt join with empty code and empty name; confirm inline errors.
8. Run backend and frontend test suites and builds.
