# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-state-host`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Result state, host restart, and final validation — round end, shared results, lobby reset (Scribble lab Scenario 4)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round End Transition (Priority: P1)

When any guesser submits a correct guess during an active round, the round ends and the room moves to a result state. No further drawing or guessing is accepted after the round has ended.

**Why this priority**: Without a defined end condition, the game never reaches the result screen; this unlocks the final phase of the round.

**Independent Test**: Two tabs — guesser submits correct word → both clients reach the result view within a few seconds without manual navigation.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a guesser submits a correct guess (case-insensitive, trimmed), **Then** the room transitions to a result state.
2. **Given** the room is in result state, **When** the drawer attempts to draw or clear the canvas, **Then** the action is rejected.
3. **Given** the room is in result state, **When** a guesser attempts to submit another guess, **Then** the action is rejected.
4. **Given** an active round with no correct guess yet, **When** participants continue playing, **Then** the room remains in the active playing state.
5. **Given** a correct guess ends the round, **When** all participants receive room updates via polling, **Then** they are shown the result view (not the active game canvas).

---

### User Story 2 - Shared Result Display (Priority: P2)

After the round ends, every participant sees the same outcome: the correct secret word, final scores for all players, and the complete guess history from that round.

**Why this priority**: The result screen closes the loop socially — everyone learns the answer and sees who scored.

**Independent Test**: Two tabs after round end — both show identical word, scores, and guess history.

**Acceptance Scenarios**:

1. **Given** the room is in result state, **When** any participant views the result screen, **Then** they see the correct secret word (no longer hidden from guessers).
2. **Given** the room is in result state, **When** any participant views the result screen, **Then** they see final scores reflecting all correct guesses from the round.
3. **Given** the room is in result state, **When** any participant views the result screen, **Then** they see the full guess history from the round in the same order as during play.
4. **Given** multiple participants, **When** they poll for updates during result state, **Then** all see consistent word, scores, and history content.

---

### User Story 3 - Host Restart to Lobby (Priority: P3)

The host can restart after a round ends. Restart returns all participants to the lobby with the same players and room code, but all round-specific state is cleared so a new round can begin.

**Why this priority**: Restart enables replay without re-creating the room; it completes the full game loop required for lab validation.

**Independent Test**: Host clicks restart → both tabs return to lobby; host can start a new round; prior round strokes/guesses do not carry over.

**Acceptance Scenarios**:

1. **Given** the room is in result state and the viewer is the host, **When** they choose restart, **Then** the room returns to lobby state.
2. **Given** the room is in result state and the viewer is not the host, **When** they look for restart controls, **Then** no restart action is available to them.
3. **Given** the host restarts the room, **When** all participants receive the next room update, **Then** they are shown the lobby (not game or result).
4. **Given** a restarted room, **When** participants are listed in the lobby, **Then** the same players remain connected with the same room code and host.
5. **Given** a restarted room, **When** the host starts a new round, **Then** scores reset to zero, guess history is empty, canvas is empty, and a new secret word is assigned per existing deterministic rules.
6. **Given** a restarted room, **When** a non-host tries to restart via any means, **Then** the restart is rejected.

---

### Edge Cases

- What happens if two guessers submit a correct guess nearly simultaneously? The first accepted correct guess ends the round; subsequent guesses after result transition are rejected.
- What happens if the drawer refreshes during result state? They see the same result content as other players, including the revealed word.
- What happens if a player opens `/game` while the room is in result state? They are redirected to the result view (or equivalent route guard aligned with server status).
- What happens if the host restarts while a guest is on the result screen? The guest reaches the lobby on the next poll without manual refresh.
- What happens if the backend restarts mid-result? In-memory state is lost; acceptable per lab constraints.
- What happens if no correct guess is ever submitted? The round stays in playing state; ending without a correct guess is out of scope (no manual "end round" button required).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transition the room from playing to result when a guesser submits a correct guess during an active round.
- **FR-002**: System MUST reject drawing, clearing, and new guess submissions while the room is in result state.
- **FR-003**: System MUST expose the correct secret word to all participants in result state (not drawer-only).
- **FR-004**: System MUST expose final scores and full guess history to all participants in result state.
- **FR-005**: System MUST keep result state synchronized across participants through polling at approximately 2-second intervals.
- **FR-006**: System MUST allow only the host to restart the room from result state.
- **FR-007**: System MUST return the room to lobby state on successful restart.
- **FR-008**: System MUST preserve participants, host identity, and room code across restart.
- **FR-009**: System MUST clear round-specific state on restart (secret word, drawer assignment, scores, strokes, guesses, and related round fields).
- **FR-010**: System MUST navigate or render clients to the lobby when server status becomes lobby after restart.
- **FR-011**: System MUST navigate or render clients to the result view when server status becomes result after a correct guess.
- **FR-012**: System MUST allow the host to start a new round from the restarted lobby using existing start-game rules (minimum two players).

### Key Entities

- **Result state**: A room phase after the round ends where outcomes are read-only and visible to everyone.
- **Final scores**: Participant point totals at round end; unchanged after transition to result until restart.
- **Round snapshot**: The secret word, guess history, and scores preserved for display during result state.
- **Restart**: Host action that resets round fields and returns the room to lobby without removing players.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a correct guess, 100% of connected participants reach the result view within 5 seconds via polling.
- **SC-002**: In two-browser testing, both tabs show the same secret word, scores, and guess history on the result screen.
- **SC-003**: 100% of draw, clear, and guess attempts after round end are rejected without changing displayed results.
- **SC-004**: After host restart, all participants reach the lobby within 5 seconds without manual refresh.
- **SC-005**: After restart and a new round start, prior round strokes and guesses do not appear in the new round.
- **SC-006**: Non-host participants cannot trigger restart in manual testing.
- **SC-007**: A full two-tab flow (join → play → correct guess → result → restart → lobby) completes without errors.

## Assumptions

- Scenarios 1–3 are implemented: lobby, start game, drawer/word visibility, drawing, guessing, scoring, and gameplay polling.
- The round ends on the **first correct guess** from any guesser; there is no separate manual "end round" control.
- Result and lobby/game views follow server `status` via polling and route guards rather than client-only navigation.
- Single round per play session; after restart the room may begin one new round using the same rules (no multi-round rotation or drawer switching).
- Secret word selection on the next round uses the same deterministic rule from Scenario 2 (same room code yields the same word).
- Host-only permissions match Scenario 1 patterns (only host starts game and restarts).

## Scope Boundaries

**In scope**: Round-end trigger on correct guess, result status, shared result UI (word, scores, history), result polling sync, host-only restart, lobby reset with players preserved, route guards for result/lobby transitions, regression validation across Scenarios 1–3.

**Out of scope**: Drawer rotation, timers, multiple concurrent rounds, spectator mode, persistence across server restart, WebSockets, new scoring rules, manual end-round without a correct guess.

**Depends on**: `001-room-setup-lobby`, `002-game-start-drawer`, and `003-gameplay-interaction`.
