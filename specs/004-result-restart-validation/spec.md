# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Result, Restart & Final Validation Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

- Q: Who can restart the room from the results screen, and what happens when they do? → A: Only the designated host sees a Restart / Play Again button. Clicking it clears all temporary round data, including the drawing canvas, round guess history, and round score display, keeps the current players in the room, and returns everyone to the lobby through the existing polling refresh.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Final Result State (Priority: P1)

When a round ends, every player sees the final outcome before anything is reset. The result view shows the actual secret word revealed to everyone, the full ordered guess history for that round, and the final scores for all players.

**Why this priority**: Players need a shared, authoritative end-of-round view before the room can be restarted.

**Independent Test**: End a round and verify that every connected player sees the same final word, score table, and guess history on the next refresh.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** any player views the room on the next poll, **Then** the actual secret word, final scores, and full guess history are visible to everyone.
2. **Given** a round has ended, **When** a player refreshes or reconnects, **Then** they still see the same final result state.
3. **Given** a round has ended, **When** additional room updates are checked, **Then** the result state remains read-only until the host restarts the room.

---

### User Story 2 - Host Restarts Room (Priority: P1)

The host can restart the room after the result has been shown, sending everyone back to the lobby without recreating the room or losing the player list.

**Why this priority**: Restart is the only way to continue using the room after a completed round.

**Independent Test**: Complete a round, restart as the host, and verify that every connected player returns to the lobby with the same participants still present.

**Acceptance Scenarios**:

1. **Given** the result state is displayed, **When** the host restarts the room, **Then** all connected players return to the lobby.
2. **Given** the result state is displayed, **When** a non-host tries to restart the room, **Then** the restart does not occur.
3. **Given** the result state is displayed, **When** the host clicks Restart or Play Again, **Then** the host-only button is removed from the result screen after the room returns to the lobby.
4. **Given** the room has been restarted, **When** players view the lobby, **Then** the same participants are preserved in the room and no one must re-enter a name or room code.

---

### User Story 3 - Clear Round State on Restart (Priority: P1)

Restarting the room clears all round-specific state so the lobby starts clean. The final result is no longer shown, and the next round begins from a blank slate.

**Why this priority**: Players should never carry stale round data into the next game.

**Independent Test**: Restart the room and verify that drawing, guess history, the current word, the current drawer, and round scores are cleared while the player list remains.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** the host restarts the room, **Then** drawing, guess history, the current word, the current drawer, and the round score display are cleared.
2. **Given** a room has been restarted, **When** players view the lobby, **Then** each participant’s score has returned to 0 for the next round.
3. **Given** a room has been restarted, **When** the next round begins later, **Then** the previous round’s result state is no longer visible.

### Edge Cases

- What happens when the host restarts the room before any result is available? → The restart does not apply until a round has actually ended.
- What happens when a non-host attempts to restart? → The room stays in the result state and nothing is reset.
- What happens when a player reconnects during the result state? → They should see the same final result as everyone else.
- What happens when the restart completes while a player is viewing the result screen? → The player is moved back to the lobby on the next refresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a round ends, the room MUST present a shared result state to all connected players.
- **FR-002**: The result state MUST show the actual secret word, the full guess history, and the final scores for all players.
- **FR-003**: The result state MUST remain visible to all players until the host restarts the room.
- **FR-004**: The host MUST be able to restart a finished room from the result state.
- **FR-005**: Non-host players MUST NOT be able to restart the room.
- **FR-006**: Restarting the room MUST return all connected players to the lobby while preserving the player list and room membership.
- **FR-007**: Restarting the room MUST clear all round-specific state, including the current word, the current drawer, the drawing, the guess history, and the round score display.
- **FR-008**: Restarting the room MUST reset all player scores to 0 for the next round.
- **FR-009**: If a player reconnects or refreshes during the result state, they MUST see the same final result as the rest of the room.
- **FR-010**: After restart, the lobby MUST no longer display the previous round’s result state.

### Key Entities *(include if feature involves data)*

- **Round Result**: The final shared view of a completed round, including the correct word, guess history, and final scores.
- **Room Lobby State**: The reset room state after restart, with the player list preserved but round-specific data cleared.
- **Participant Score**: The per-player score value that is shown in the result state and reset when the room restarts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of connected players see the same revealed secret word, score table, and guess history after a round ends.
- **SC-002**: The host can return a finished room to the lobby without recreating the room or re-adding players.
- **SC-003**: After restart, the room shows no residual round data and every player’s score is reset to 0.
- **SC-004**: Non-host restart attempts never change the room state.
- **SC-005**: A reconnecting player can recover the same final result state as existing players.

## Assumptions

- A round ends when the first correct guess is accepted and the room enters the result state.
- The host is the only player allowed to restart a finished room.
- Final scores are shown on the result screen, but scores reset to 0 when the room returns to the lobby.
- The result panel is delivered through the existing polling refresh; no push transport is introduced.
- The player list and room membership remain intact across restart; only round-specific state is cleared.
- No new round-timer, matchmaking, or multi-round flow is introduced.

> **Out-of-scope reminder (Constitution VI)**: WebSockets, databases, auth,
> deployment, Docker, new state/routing libs, multiple rounds, drawer rotation,
> timers, bonuses, custom word packs, spectator mode, room moderation, room
> passwords, and starter rewrites are permanently excluded. Do not include them
> here or in any downstream plan or task list.
