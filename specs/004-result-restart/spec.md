# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `scribble-assignment` (single-branch lab; feature dir `specs/004-result-restart`)

**Created**: 2026-06-18

**Status**: Draft

**Feature Group**: 4 of 4 — Scenario 4 (Result, Restart & Final Validation)

**Builds on**: Groups 1–3 (room/lobby/start, drawer + secret word, gameplay/guessing/scoring). This group closes the loop: end-of-round result and restart.

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round-end result is shown to everyone (Priority: P1)

When the round ends, all players see a result state: the correct word (now revealed to everyone), the final
scores, and the full guess history. The result is the same for every player and stays visible until restart.

**Why this priority**: The result is the payoff of the round — it reveals the answer and declares the
outcome. Without it the round has no conclusion.

**Independent Test**: End a round; confirm every player's screen shows the same correct word, the same final
scores, and the full guess history, and that it persists until the host restarts.

**Acceptance Scenarios**:

1. **Given** an active round, **When** the host ends the round, **Then** the room enters a result state observed by all players (via polling).
2. **Given** the result state, **When** any player views their screen, **Then** they see the correct word revealed (including former guessers who could not see it during play).
3. **Given** the result state, **When** any player views their screen, **Then** they see the final scores for all participants and the full guess history.
4. **Given** the result state, **When** players compare screens, **Then** the revealed word, final scores, and history are identical for everyone.
5. **Given** an active round, **When** a non-host tries to end the round, **Then** it is refused (only the host can end the round).

---

### User Story 2 - Host restarts back to a clean lobby (Priority: P1)

From the result state, the host restarts. Everyone returns to the lobby with the same players still present,
and all round-specific state is cleared so a fresh round can begin.

**Why this priority**: Restart is what makes the game replayable and is the explicit close of Scenario 4. It
depends on the result state existing (US1).

**Independent Test**: From a result state, the host restarts; confirm all players land back in the lobby with
the same participant list, and that drawer, secret word, guesses, and scores have all been cleared/reset.

**Acceptance Scenarios**:

1. **Given** the result state, **When** the host restarts, **Then** the room returns to the lobby state and every player's screen returns to the lobby (via polling).
2. **Given** a restart, **When** the lobby is shown, **Then** all participants who were in the room are still present (players preserved), including the host.
3. **Given** a restart, **When** round state is inspected, **Then** the drawer assignment, secret word, and guess history are cleared and every score is reset to 0.
4. **Given** a restart, **When** the lobby is shown, **Then** the host can start a new round (the normal start gating from Group 1 applies again).
5. **Given** the result or active state, **When** a non-host tries to restart, **Then** it is refused (only the host can restart).

### Edge Cases

- **Non-host attempts end or restart** → refused; only the host controls round lifecycle.
- **Word revealed at result** → during the round only the drawer saw the word; at result it is revealed to all.
- **Restart preserves players** → participant identities remain; no one is dropped or duplicated.
- **Round state fully cleared on restart** → drawer, word, guesses all cleared; scores reset to 0 (so a new round starts clean).
- **Result/lobby transitions while polling** → all clients converge on the new state within ~2 seconds; no player is stranded on the old screen.
- **Restart available only from a meaningful state** → restart applies to a room that has started/ended, returning it to lobby.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let the host end the active round, transitioning the room into a result state.
- **FR-002**: The system MUST refuse a round-end request from a non-host.
- **FR-003**: In the result state, the system MUST reveal the correct word to ALL players (not only the drawer).
- **FR-004**: In the result state, the system MUST present the final scores for all participants and the full guess history to all players.
- **FR-005**: The system MUST make the result state identical for every player and keep it current via polling (~2s).
- **FR-006**: The system MUST let the host restart from the result (or active) state, returning the room to the lobby state.
- **FR-007**: The system MUST refuse a restart request from a non-host.
- **FR-008**: On restart, the system MUST preserve all participants currently in the room (including the host) with their identities intact.
- **FR-009**: On restart, the system MUST clear all round-specific state: drawer assignment, secret word, and guess history, and MUST reset every participant's score to 0.
- **FR-010**: On restart, the system MUST cause every player's client to return to the lobby (observed via polling), and the normal Group 1 start gating MUST apply again for the next round.
- **FR-011**: The system MUST preserve Groups 1–3 behaviors (host/lobby/start/auto-advance, name validation, drawer + deterministic word + drawer-only visibility during play, drawing, guessing, scoring) without regression.

### Key Entities *(include if feature involves data)*

- **Result state**: The ended-round view of a room — the revealed correct word, the final per-participant scores, and the full guess history. Shared identically with all players; a room lifecycle state distinct from lobby and active.
- **Room lifecycle**: lobby → active → result → (restart) → lobby. Restart returns to the start of the cycle with players preserved.
- **Round-specific state**: drawer assignment, secret word, guess history, and scores — created/changed during a round and cleared/reset on restart (participants themselves are not round-specific and are preserved).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When a round ends, 100% of players see the same revealed word, the same final scores, and the same full guess history within ~2 seconds.
- **SC-002**: A former guesser who could not see the word during play can see it in the result state (the word is revealed to all at result).
- **SC-003**: Only the host can end the round and restart; non-host attempts are refused in 100% of cases.
- **SC-004**: After a restart, all players are back in the lobby within ~2 seconds with the same participant list (0 players lost or duplicated) and a fresh round state (drawer/word/guesses cleared, all scores 0).
- **SC-005**: A full game can be played end to end — create → join → start → draw/guess/score → result → restart → lobby — and a second round can then be started.
- **SC-006**: All Groups 1–3 acceptance criteria still pass (no regression).

## Assumptions

- **The host ends the round** via an explicit action (the host controls the round lifecycle, consistent with host-only start in Group 1). An alternative trigger (auto-end when the word is first guessed) is possible. (Clarification candidate.)
- The result state is a distinct room lifecycle state; reaching it reveals the word to everyone (the secrecy from Group 2 applies only during the active round).
- Restart returns to the **lobby** (not straight into a new active round); the host then starts the next round using the existing Group 1 start flow. (Clarification candidate.)
- "All round state cleared" means: drawer, secret word, and guess history removed, and every score reset to 0; participants (and the host) are preserved. (Addresses the Group 3 carry-forward note.)
- This lab covers a single round per start (no automatic rotation or multi-round scoring carry-over); restart simply enables playing again from the lobby.
- Work extends the Groups 1–3 in-memory model and polling; no persistence, auth, real-time transport, or new libraries (brownfield).
