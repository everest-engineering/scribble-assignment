# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `scribble-lab`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "Scenario 4 — Result, Restart & Final Validation: Revealed word, scores, guess history, and lobby restart."

## Clarifications

### Session 2026-05-28
- Q: Should scores be reset to 0 upon restart, or should they accumulate? → A: Accumulate scores until the user explicitly clicks "Exit Game".
- Q: How is the 'Results' state triggered? → A: Manual Host Trigger; host clicks a "Finish Round" button.
- Q: Should the guess history be cleared immediately upon entering the Results state or only upon Restart? → A: Only upon Restart (players can read history in the results screen).
- Q: How should roles be handled for the next round? → A: Roles MUST rotate; if the first player was the drawer, the second player becomes the drawer for the next round.
- Q: What is the sequence for the drawer rotation? → A: Joined Order (Seniority-based).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Viewing Final Results (Priority: P1)

As a player, I want to see the correct word and everyone's final score at the end of the round so that we can celebrate the winner.

**Why this priority**: Essential closure for the game loop.

**Independent Test**: Host clicks "Finish Round". Verify that all players see the secret word ("rocket"), the final scoreboard, and the full guess history.

**Acceptance Scenarios**:

1. **Given** the round is active, **When** the host clicks "Finish Round", **Then** the room status changes to `results`.
2. **Given** the room status is `results`, **Then** the `secretWord` becomes visible to all participants.
3. **Given** I am in the `results` state, **When** I look at the scoreboard, **Then** I see the accumulated scores for all players.

---

### User Story 2 - Host Game Restart & Rotation (Priority: P1)

As the host, I want to restart the game with the current players and a new drawer so that we can take turns drawing.

**Why this priority**: Core retention and turn-based gameplay logic.

**Independent Test**: Click "Restart Game" as the host. Verify all players return to the Lobby, scores are preserved, but a different player is designated to be the drawer for the next round based on joined order.

**Acceptance Scenarios**:

1. **Given** the game is in the `results` state, **When** the host clicks "Restart Game", **Then** the room status returns to `lobby`.
2. **Given** the game has been restarted, **When** I look at the Lobby, **Then** the participant list is preserved, and all strokes and guesses are cleared.
3. **Given** the previous drawer was the participant who joined 1st, **When** the game starts again, **Then** the participant who joined 2nd is assigned the `drawer` role.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reveal the `secretWord` to all participants when `status === "results"`.
- **FR-002**: System MUST transition all polling clients from the `game` screen to a `results` view when the status becomes `results`.
- **FR-003**: System MUST provide a `Finish Round` action for the host to transition from `playing` to `results`.
- **FR-004**: System MUST provide a `Restart Game` action for the host to transition from `results` back to `lobby`.
- **FR-005**: System MUST preserve participant scores across restarts; scores are only cleared if a user leaves the room or clicks "Exit Game".
- **FR-006**: System MUST reset `strokes` and `guesses` ONLY when the `restart` action is executed.
- **FR-007**: System MUST implement a round-robin rotation for the `drawer` role based on joined order seniority.
- **FR-008**: System MUST maintain the current list of participants across the transition.

### Key Entities

- **Room Snapshot**: Updated to reveal `secretWord` if `status === "results"`.

### Edge Cases

- **EC-01: Attempted Restart by Non-Host Guest**: If a guest attempts to trigger the reset flow (e.g., via `POST /rooms/:code/restart`), the server MUST reject the action with an explicit `403 Forbidden` error.
- **EC-02: Polling Concurrency Mid-Reset**: Polling data during the transition from `results` to `lobby` MUST map cleanly to prevent frontend rendering errors or crashes.
- **EC-03: Late Guess Posting on Closed Match**: Guesses arriving at `POST /rooms/:code/guesses` after the status has changed to `results` MUST be explicitly rejected to preserve final score integrity.

## Explicitly Out Of Scope

- [ ] Automated round rotation (manual host trigger only).
- [ ] Database persistence (still strictly in-memory).
- [ ] Individual round history (only the current/most recent round is tracked).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Lobby reset happens within 3 seconds of host restart (sync via polling).
- **SC-002**: 100% of participants and their scores are retained during the restart process.
- **SC-003**: Role assignment follows a predictable sequential order (rotation based on join time).

## Assumptions

- The frontend will check the `room.status` in the polling loop to determine which screen to show.
- "Exit Game" results in removing the participant from the backend and resetting their local session state.
