# Feature Specification: Game Start and Drawer

**Feature Branch**: `002-game-start-and-drawer`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 2 — Game start and drawer: host-only backend start, lobby→playing, drawer assignment, deterministic secret word, drawer-only visibility, real Start Game flow, game page word card vs hint."

## Clarifications

### Session 2026-06-03

- Q: How is the secret word chosen for round one? → A: `STARTER_WORDS[(sumCharCodes(code) + roundIndex) % length]` with `roundIndex = 0` (A1).
- Q: Who is the drawer for round one? → A: First participant in the room list, which is the host (A2).
- Q: Does drawer rotate on restart? → A: No rotation in this scenario; restart behavior is Scenario 4; round one always uses first participant (Q2 default).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host starts the game (Priority: P1)

The host starts the round from the lobby when at least two players are present. The room transitions from waiting to active play, and all clients reach the game screen with consistent room state.

**Why this priority**: Without a real start action, drawer assignment and secret-word rules cannot be exercised.

**Independent Test**: Two tabs in the same lobby; host clicks Start Game; both tabs land on the game view within one poll cycle and see room status as active play.

**Acceptance Scenarios**:

1. **Given** a lobby with the host and at least one other participant, **When** the host starts the game, **Then** the room leaves the lobby state and enters active play, and the host is navigated to the game screen.
2. **Given** a lobby with only the host, **When** the host attempts to start, **Then** start is rejected with a clear message that at least two players are required.
3. **Given** a non-host participant in the lobby, **When** they attempt to start (if exposed), **Then** start is rejected with a clear message that only the host may start.
4. **Given** a lobby already in active play, **When** start is requested again, **Then** start is rejected with a conflict-style message.
5. **Given** a participant whose tab is on the game screen, **When** polling runs while the tab is visible, **Then** room state refreshes automatically about every 2 seconds (same cadence as lobby).

---

### User Story 2 - Drawer sees the secret word (Priority: P1)

When a round begins, one player is clearly the drawer. Only that player sees the secret word; everyone else sees a non-revealing hint.

**Why this priority**: Drawer-only word visibility is the core privacy rule for Scenario 2.

**Independent Test**: Two tabs after start; tab for drawer shows the word card with the deterministic word; tab for guesser shows the hint card and never shows the secret word string.

**Acceptance Scenarios**:

1. **Given** a round has just started, **When** the first participant (host) views the game, **Then** they are identified as the drawer and see a word card with the round's secret word.
2. **Given** a round has just started, **When** any non-drawer participant views the game, **Then** they see a "What's being drawn?" style hint and do not see the secret word text.
3. **Given** the same room code and first round index, **When** the round starts, **Then** the secret word is always the same deterministic choice from the starter word list (not random per request).
4. **Given** any participant fetches room state with their viewer identity, **When** they are not the drawer, **Then** the shared room snapshot never includes the secret word value.

---

### User Story 3 - Player names remain validated (Priority: P2)

Create and join flows continue to trim names and reject empty or whitespace-only input, consistent with Scenario 1.

**Why this priority**: README Scenario 2 explicitly includes name validation; this scenario verifies no regression when start is added.

**Independent Test**: Attempt create/join with blank name; receive the same validation message as Scenario 1 without creating or joining.

**Acceptance Scenarios**:

1. **Given** create or join with a whitespace-only name, **When** submitted, **Then** the action fails with a clear required-name message.
2. **Given** create or join with a trimmed name of 1–24 characters, **When** submitted, **Then** the action succeeds as in Scenario 1.

---

### Edge Cases

- Unknown room code on start returns a non-technical not-found message.
- Host refreshes game page after start; drawer still sees word, guessers still do not.
- Guest navigates directly to game URL without an active session is redirected home (existing behavior).
- Backend restart clears rooms; poll/start return not-found and client shows recoverable error.
- Drawer rotation on restart is out of scope (Scenario 4); first round always uses first participant as drawer per locked assumption A2.
- Canvas drawing, guess submission, scoring, and result state are out of scope for this scenario.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a host-only action to start the game for a room in lobby state, requiring the caller to be the room host.
- **FR-002**: System MUST reject start when fewer than two participants are present.
- **FR-003**: System MUST transition room status from lobby to active play on successful start.
- **FR-004**: System MUST assign the drawer for round one to the first participant in the room (the host per A2).
- **FR-005**: System MUST select the secret word deterministically from the starter word list using room code and round index zero (formula A1: index = (sum of character codes of room code + round index) modulo list length).
- **FR-006**: System MUST include round metadata in room snapshots (current round with drawer id and secret word field) while masking the secret word so only the drawer viewer receives the actual word; all other viewers receive null for the secret word.
- **FR-007**: System MUST reject start from non-host callers with a clear forbidden message.
- **FR-008**: System MUST reject start when the room is not in lobby state.
- **FR-009**: Frontend MUST call the backend start action when the host clicks Start Game (not navigate-only).
- **FR-010**: Frontend MUST navigate to the game screen only after successful start.
- **FR-011**: Frontend MUST show a word card with the secret word only when the viewer is the drawer.
- **FR-012**: Frontend MUST show a guesser hint card without the secret word when the viewer is not the drawer.
- **FR-013**: Frontend MUST poll room snapshots on the game page at the same ~2 s cadence as the lobby, pausing when the tab is hidden.
- **FR-014**: System MUST continue to trim player names and reject empty or whitespace-only names on create and join (no regression from Scenario 1).

### Key Entities

- **Room**: Gains active-play status, host id, and optional current round data after start.
- **Current Round**: First-round state with round index zero, drawer participant id, and secret word (server-side; masked in snapshots).
- **Viewer**: The requesting participant; determines whether secret word is visible in the snapshot.
- **Drawer**: First participant for round one; sole viewer who receives the secret word in snapshots.
- **Room Snapshot**: Client-safe view including status, participants, host, roles, and viewer-specific round fields (drawer flag, masked secret word).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Host with two or more players can start and reach the game screen in one intentional action.
- **SC-002**: Within 3 seconds of start, all connected clients polling the room see active-play status.
- **SC-003**: 100% of non-drawer snapshot responses omit the secret word value (null or absent).
- **SC-004**: 100% of drawer snapshot responses for the same room include the identical deterministic word.
- **SC-005**: Re-running start on an active room never succeeds; clients remain consistent.
- **SC-006**: Empty-name create/join attempts remain blocked with a visible validation message.

## Assumptions

- **A1**: Secret word index = `(sumCharCodes(roomCode) + roundIndex) % STARTER_WORDS.length` with `roundIndex` starting at `0` (from discovery.md).
- **A2**: Drawer for round one is `room.participants[0]`, which is the host (from discovery.md).
- **A5**: Polling interval 2000 ms; pause when tab hidden (constitution).
- **A6**: Player names 1–24 characters after trim (Scenario 1).
- **Q2**: On future restart, drawer does not rotate; same first participant remains drawer until Scenario 4 defines otherwise—no rotation logic in this scenario.
- Scenario 1 (room setup, host, join, lobby polling) is complete before this feature ships.
- Drawing, guessing, scoring, and result/restart flows are explicitly out of scope here.

## Dependencies

- Scenario 1: `hostParticipantId`, lobby polling hook, name validation, host-only Start UI gating.
- Starter word list remains the five words in seed data; no new words.

## Out of Scope

- Interactive canvas, stroke sync, clear canvas (Scenario 3).
- Guess submission, guess history display, scoring (Scenario 3).
- Result state, restart endpoint, drawer rotation (Scenario 4).
- WebSockets, databases, authentication.

## Validation

Two-tab manual check:

1. Tab A: create room as host; Tab B: join with code.
2. Host starts game; both tabs on game view within ~3 s.
3. Host tab shows word card with deterministic word for that code.
4. Guest tab shows hint only; inspect network/poll payload confirms no secret word for guest viewer id.
5. Non-host cannot start (API or disabled UI).
