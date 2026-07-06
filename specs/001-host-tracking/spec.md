# Feature Specification: Host Tracking on Room Creation

**Feature Branch**: `001-host-tracking`

**Created**: 2026-07-05

**Status**: Draft

**Input**: User description: "Implement host tracking on room creation. The player who creates the room is labeled as host and the label is displayed."

## Clarifications

### Session 2026-07-05

- Q: Host label visibility scope → A: Visible on all screens wherever the player's name is shown (lobby, game screen, scoreboard).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Label on Room Creation (Priority: P1)

As a player, when I create a new room I want to be automatically recognized as the host so that I have host status and other players can identify me.

**Why this priority**: This is the core feature — the only thing this spec covers. Host assignment is a prerequisite for host-only actions (starting the game, restarting) in later scenarios.

**Independent Test**: Can be fully tested by creating a room and verifying the creator sees a "Host" label next to their name in the lobby, and that other players who join also see that label.

**Acceptance Scenarios**:

1. **Given** a player is on the Create Room screen, **When** they enter a name and click "Create and Continue", **Then** the room is created and that player is designated as the host.
2. **Given** a room has been created by a player, **When** they arrive at the lobby, **Then** their name is displayed with a "Host" label.
3. **Given** a second player joins the same room, **When** they view the lobby, **Then** they see the creator's name with a "Host" label.
4. **Given** a room has been created, **When** another player creates a different room, **Then** that second room has its own host (the second creator), and the two rooms are fully isolated.
5. **Given** a game is in progress, **When** any player views the game screen or scoreboard, **Then** the host label is still shown next to the creator's name.

---

### Edge Cases

- Player creates a room with a name that is only whitespace: system rejects and shows an error message (name is not accepted, no room created)
- Player creates a room, then opens a second tab and attempts to rejoin as a different player — that player is not the host
- Very long player names: host label still displays correctly alongside the name
- Room code is generated and the creator is always the host of that specific code — no way to have a room without a host

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a room is created, the creator MUST be automatically designated as the host.
- **FR-002**: The host designation MUST be stored as part of the room state and persisted for the lifetime of the room.
- **FR-003**: The host label MUST be visible to all participants on every screen where player names appear (lobby, game screen, scoreboard), not only to the host.
- **FR-004**: Each room MUST have exactly one host at any time.
- **FR-005**: A player joining an existing room MUST NOT be designated as host.

### Key Entities *(include if feature involves data)*

- **Room**: Contains room code, list of participants, and host identifier. Created when a player submits the create-room form.
- **Participant**: A player in a room. Has a name and a host status flag indicating whether they are the room host.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player who creates a room sees "Host" next to their name immediately upon reaching the lobby, and the label persists on the game screen and scoreboard.
- **SC-002**: A player who joins an existing room sees the creator's "Host" label within one lobby refresh cycle and on all subsequent screens.
- **SC-003**: Two rooms created independently each have their own correct host — no cross-room host assignment.
- **SC-004**: A joining player is never shown as host.

## Assumptions

- The host label is visible to all players on every screen where player names appear, not just the host.
- Host designation occurs once at room creation and does not transfer to another player.
- No host-only actions (start game, restart) are implemented in this feature — only the label and tracking.
- The lobby UI already has the capability to display player names; the host label is an addition to the existing display.
