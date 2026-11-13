# Feature Specification: Result & Restart Flow

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-02

**Status**: Draft

**Input**: Group 4 features (F14-F15) from document.md

## Clarifications

### Session 2026-06-02
- Q: How does the game round end? → A: The host (drawer) can end the round manually by clicking an "End Round" button, OR the round ends automatically when all guessers have guessed the word correctly.
- Q: What does the result state display? → A: All players see a results view showing the correct word, the final scores of all participants, and the full chronological guess history log.
- Q: How is the restart triggered? → A: The host triggers restart via a "Restart Game" button on the result view. Other players see a waiting screen.
- Q: What is cleared on restart? → A: The room status returns to `"lobby"`, roles are cleared, round data (guesses, drawing) is cleared, and participant scores are reset to `0`.

## User Scenarios & Testing

### User Story 1 - Shared Result State (Priority: P1)

As a player, I want to view the correct word, final scoreboard, and full guess history once the round finishes, so I can see who won and what guess attempts were made.

**Why this priority**: Core game lifecycle completion. Closes the game loop and shows game outcomes.

**Independent Test**: Host starts game, guest submits correct guess. Host clicks "End Round". Verify both host and guest transition to a result screen showing the secret word "rocket", guest's score as 100, and the guess log.

**Acceptance Scenarios**:
1. **Given** a game is active, **When** the host clicks the "End Round" button, **Then** the room status transitions to `"result"`.
2. **Given** a game is active with a drawer and guessers, **When** all guessers submit correct guesses, **Then** the room status automatically transitions to `"result"`.
3. **Given** the room status is `"result"`, **When** the page polls, **Then** all participants render a results view showing the secret word, final player scores, and chronological guess list.

---

### User Story 2 - Clean Restart to Lobby (Priority: P1)

As the host, I want to restart the game back to the lobby so that we can play another round with the same players.

**Why this priority**: Supports game replayability without forcing users to re-create rooms.

**Independent Test**: From the results view, Host clicks "Restart Game". Confirm both host and guest automatically navigate back to the Lobby Page, their roles and scores are cleared, and the start button is enabled again.

**Acceptance Scenarios**:
1. **Given** the room status is `"result"`, **When** the host clicks "Restart Game", **Then** the backend resets the room status to `"lobby"`, deletes the round data, clears participant roles, and resets scores to `0`.
2. **Given** the host triggers a restart, **When** the next poll occurs, **Then** all participants automatically redirect back to the Lobby Page.

## Requirements

### Functional Requirements

- **FR-011**: System MUST support a new RoomStatus of `"result"`.
- **FR-012**: System MUST allow host to trigger round end via `POST /api/rooms/:code/end`, transitioning the room status to `"result"`.
- **FR-013**: System MUST automatically transition the room status to `"result"` when all guessers (at least one) have guessed the secret word correctly.
- **FR-014**: System MUST render a Results view on the Game Page when `room.status === "result"` showing:
  - The correct secret word.
  - The final scoreboard.
  - The complete guess history log.
- **FR-015**: System MUST render a "Restart Game" button on the Results view ONLY for the host.
- **FR-016**: System MUST allow host to trigger restart via `POST /api/rooms/:code/restart`.
- **FR-017**: On restart, backend MUST reset room status to `"lobby"`, clear participant roles, reset participant scores to `0`, and clear the round object.
- **FR-018**: Frontend MUST automatically redirect participants from `/game` back to `/lobby` when the polled room snapshot status becomes `"lobby"`.

## Success Criteria

### Measurable Outcomes

- **SC-005**: Game page transitions to Results view on all clients within 2.5 seconds of round end.
- **SC-006**: Lobby redirect is triggered on all clients within 2.5 seconds of restart.
