# Feature Specification: Host Start Control

**Feature Branch**: `005-host-start-control`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "Only host can start the game so the start game button is only visible for host and not other participants. Also host can only start with 2-player minimum"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host sees Start Game button, participants do not (Priority: P1)

As the host, I want to see the "Start Game" button so I can begin the game when ready. As a non-host participant, I should not see the "Start Game" button so I cannot accidentally or intentionally start the game.

**Why this priority**: Core permission control — the host must be the sole controller of game start. Participants seeing the button would be confusing and could lead to unintended game starts.

**Independent Test**: Open two browser tabs. Tab 1 creates a room (host). Tab 2 joins. Tab 1 shows "Start Game" button. Tab 2 does NOT show "Start Game" button.

**Acceptance Scenarios**:

1. **Given** the host is on the Lobby page, **When** they view the page, **Then** they see a visible "Start Game" button.
2. **Given** a non-host participant is on the Lobby page, **When** they view the page, **Then** they do NOT see any "Start Game" button.
3. **Given** a new player joins the room, **When** the participant list updates, **Then** the host still sees the "Start Game" button and non-host participants still do not.

---

### User Story 2 - Host can only start with minimum 2 players (Priority: P1)

As the host, I want the "Start Game" button to only be usable when there are at least 2 players in the room so that the game has enough participants to be playable.

**Why this priority**: Game cannot function with only one player. This enforces the minimum player requirement.

**Independent Test**: Host creates a room with just themselves. "Start Game" button is disabled or shows a message. Another player joins. Now the button becomes usable.

**Acceptance Scenarios**:

1. **Given** the host is on the Lobby page with only 1 participant (themselves), **When** they look at the "Start Game" button, **Then** the button is disabled and/or a message indicates "Need at least 2 players to start".
2. **Given** the host is on the Lobby page with 2 or more participants, **When** they look at the "Start Game" button, **Then** the button is enabled and clickable.
3. **Given** the host is on the Lobby page with 2+ participants and a player leaves (dropping to 1), **When** the participant list updates, **Then** the button becomes disabled again.

---

### User Story 3 - Non-host participants see waiting message (Priority: P2)

As a non-host participant, I want to see a clear message that the game hasn't started yet and that the host is responsible for starting it.

**Why this priority**: Provides clarity to participants about why they're waiting and who controls game start.

**Independent Test**: Join a room as a non-host. Instead of a "Start Game" button, a message like "Waiting for host to start the game..." is displayed.

**Acceptance Scenarios**:

1. **Given** a non-host participant is on the Lobby page, **When** the page renders, **Then** they see a message indicating the host will start the game, instead of a "Start Game" button.

---

### Edge Cases

- **Host disconnects**: If the host leaves, the "Start Game" button disappears for all remaining participants (no one can start). Host transfer is out of scope.
- **Player count changes dynamically**: As players join and leave, the button enable/disable state updates reactively based on participant count.
- **Rapid join/leave**: Button state correctly reflects the current participant count after each poll update.
- **Host in multiple tabs**: Only the host's tab shows the button — applies to the participant ID that owns `isHost`, not the browser.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Start Game" button MUST only be visible to the host participant (the participant with `isHost: true`).
- **FR-002**: Non-host participants MUST NOT see the "Start Game" button or any clickable element that could start the game.
- **FR-003**: The host MUST be able to start the game only when there are at least 2 participants in the room (including the host).
- **FR-004**: When there are fewer than 2 participants, the "Start Game" button MUST be disabled and/or accompanied by a message explaining the minimum requirement.
- **FR-005**: The host/participant distinction MUST use the existing `isHost` flag on the Participant entity (from Feature 001).
- **FR-006**: When a non-host participant views the Lobby page, they MUST see a message indicating they are waiting for the host to start the game (in place of the "Start Game" button).

### Key Entities *(include if feature involves data)*

- **Participant**: Existing entity with `isHost: boolean`. The `isHost` flag determines button visibility. No data model changes.
- **Room**: Existing entity with `participants: Participant[]`. Participant count determines if the start button is enabled. No data model changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A non-host participant cannot see or click any "Start Game" button on the Lobby page.
- **SC-002**: The host sees an enabled "Start Game" button when 2+ participants are in the room.
- **SC-003**: The host sees a disabled "Start Game" button (or equivalent feedback) when only 1 participant is in the room.
- **SC-004**: Button visibility and enabled state update correctly as participants join and leave (no stale state).
- **SC-005**: All existing tests continue to pass.

## Assumptions

- The existing `participant.isHost` field (from Feature 001) is the single source of truth for host identification — no new role system needed.
- The existing lobby polling (Feature 004) ensures the participant list and button state update automatically.
- The button should be disabled (not hidden) for the host when < 2 players, so the host understands why they can't start yet.
- Host transfer (if host leaves) is explicitly out of scope for this feature.
- The "Start Game" action triggers navigation to `/game` and/or sets room status — the existing behavior is preserved and extended with these guards.
