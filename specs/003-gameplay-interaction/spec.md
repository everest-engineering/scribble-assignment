# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 3 — Gameplay interaction: drawer draws and clears canvas; strokes sync via polling; guessers submit guesses with trim and case-insensitive compare; empty rejected; guess history synced to all; scoring correct +100 incorrect +0 all start at 0; first correct guess ends round (A3) without full result/restart UI (Scenario 4)."

## Clarifications

### Session 2026-06-03

- Q: What happens when the first correct guess arrives? → A: Room transitions to result state, guesser receives +100, all further guesses rejected (A3).
- Q: What is the stroke data shape and lifecycle? → A: Append-only `{ points, color, width }`; clear resets strokes array; no undo (A7).
- Q: What guess history do non-guessers see? → A: Full chronological history including incorrect guesses for all players (Q1).
- Q: Canvas size and stroke rendering? → A: 600×400 CSS pixels; straight-line segments between pointer samples; no smoothing (Q3).
- Q: Volume caps? → A: 500 strokes, 200 guesses, 250 points per stroke enforced server-side with conflict rejection (constitution IV).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer draws and clears (Priority: P1)

The assigned drawer can draw on an interactive canvas and clear it. All participants see the same strokes within one polling cycle. Non-drawers cannot draw or clear.

**Why this priority**: Drawing is the core interaction that enables guessing; without synced strokes the game cannot be played.

**Independent Test**: Two tabs after start; drawer draws lines; guest tab shows the same strokes within ~3 s without manual refresh; guest cannot draw; drawer clears and both tabs show empty canvas.

**Acceptance Scenarios**:

1. **Given** an active round and the viewer is the drawer, **When** they draw on the canvas, **Then** strokes appear on their screen and are persisted for sync.
2. **Given** an active round and the viewer is a guesser, **When** they view the canvas, **Then** they see strokes from polling but cannot add strokes or use clear.
3. **Given** the drawer has drawn strokes, **When** a guesser polls the room, **Then** they see the same stroke list as the drawer within one poll interval.
4. **Given** the drawer clicks clear, **When** polling runs, **Then** all participants see an empty canvas (stroke list reset).
5. **Given** a non-drawer attempts to send a stroke or clear action, **Then** the action is rejected with a clear forbidden message.

---

### User Story 2 - Guessers submit and sync guesses (Priority: P1)

Guessers submit text guesses that are trimmed and compared case-insensitively to the secret word. Empty guesses are rejected. All players see the full guess history (correct and incorrect) via polling.

**Why this priority**: Guessing and shared history are the primary loop alongside drawing.

**Independent Test**: Guest submits wrong then correct guess; both tabs show chronological history with player names; empty submit blocked client and server.

**Acceptance Scenarios**:

1. **Given** an active round and the viewer is a guesser, **When** they submit a non-empty trimmed guess, **Then** the guess is recorded and appears in history for all players on next poll.
2. **Given** a guesser submits whitespace-only input, **When** submitted, **Then** the guess is rejected with a clear required-guess message (client and server).
3. **Given** a guesser submits text that matches the secret word ignoring case and surrounding trim, **When** processed, **Then** the guess is marked correct.
4. **Given** a guesser submits text that does not match, **When** processed, **Then** the guess is marked incorrect and remains in history.
5. **Given** multiple guesses from different players, **When** any participant polls, **Then** they see the full chronological guess history including incorrect guesses.
6. **Given** the viewer is the drawer, **When** they attempt to submit a guess, **Then** the guess is rejected (drawer does not guess).

---

### User Story 3 - Scoring and round end on first correct (Priority: P1)

All participant scores start at zero when the round begins. A correct guess awards 100 points to the guesser; incorrect guesses award 0. The first correct guess ends the round (transitions to result state) and disables further guesses.

**Why this priority**: README Scenario 3 requires deterministic scoring; A3 locks round termination on first correct guess.

**Independent Test**: Start round; verify all scores 0; wrong guess leaves scores unchanged; correct guess adds 100 to guesser only and room enters result state; further guesses rejected.

**Acceptance Scenarios**:

1. **Given** a round has just started, **When** any participant views scores, **Then** every player shows score 0.
2. **Given** an incorrect guess is submitted, **When** scores refresh, **Then** no player's score changes.
3. **Given** the first correct guess in a round, **When** processed, **Then** the guessing player receives +100 and the room transitions to result state.
4. **Given** the room is in result state after a correct guess, **When** a player attempts another guess, **Then** the guess is rejected with a conflict-style message.
5. **Given** result state is reached, **When** participants poll, **Then** guess history and scores remain visible; full result panel polish and restart are deferred to Scenario 4.

---

### Edge Cases

- Stroke or guess caps exceeded (constitution: 500 strokes, 200 guesses, 250 points per stroke) return conflict-style rejection.
- Drawer draws after round ended (result state): stroke actions rejected.
- Case variants of the secret word (e.g., "Rocket" vs "rocket") count as correct.
- Concurrent correct guesses from two tabs: first processed wins +100; second rejected as round ended.
- Backend restart clears all rooms; clients show recoverable not-found on poll/actions.
- Result state UI shows guess history and scores; does not require host restart button or revealed-word banner (Scenario 4).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow only the drawer to add strokes during an active playing round.
- **FR-002**: System MUST allow only the drawer to clear all strokes for the current round.
- **FR-003**: System MUST store strokes as an append-only list per round with shape `{ points: {x,y}[], color: string, width: number }`; clear resets the list to empty with no undo (A7).
- **FR-004**: System MUST include the current round's stroke list in room snapshots so all participants see identical drawing data via polling.
- **FR-005**: System MUST reject stroke and clear actions from non-drawers, from guessers, and when the room is not in playing state.
- **FR-006**: System MUST accept guess submissions only from non-drawer participants while the room is in playing state.
- **FR-007**: System MUST trim guess text before validation and comparison; reject empty or whitespace-only guesses with a clear message.
- **FR-008**: System MUST compare guesses to the secret word case-insensitively after trim.
- **FR-009**: System MUST record each guess with participant identity, text, correctness flag, and timestamp order in an append-only history.
- **FR-010**: System MUST expose full guess history (correct and incorrect) to all participants in room snapshots (Q1).
- **FR-011**: System MUST initialize every participant's score to 0 when the round starts.
- **FR-012**: System MUST award exactly 100 points to the guesser on a correct guess and 0 on incorrect guesses.
- **FR-013**: System MUST transition the room to `"result"` status on the first correct guess, award +100 to that guesser only, disable further guesses with conflict rejection, and preserve scores and history (A3).
- **FR-014**: Frontend MUST render an interactive drawing canvas for the drawer only; guessers see a read-only canvas (Q3: 600×400 display, straight-line segments between pointer samples).
- **FR-015**: Frontend MUST provide a clear-canvas control visible only to the drawer.
- **FR-016**: Frontend MUST wire guess submission with client-side trim and empty rejection matching server messages.
- **FR-017**: Frontend MUST display live scores and guess history from polled snapshots; disable guess input when round is not in playing state.
- **FR-018**: System MUST enforce constitution caps: 500 strokes per round, 200 guesses per round, 250 points per stroke (server-side; client decimates pointer samples).

### Key Entities

- **Stroke**: A drawable segment with ordered points, color, and width; append-only until clear (A7).
- **Guess**: A participant's submitted text, correctness, and ordering metadata; append-only history.
- **Score**: Per-participant integer starting at 0 for the round; updated on correct guess (+100).
- **Current Round (extended)**: Adds strokes, guesses, scores, and optional winner id when result is reached.
- **Room Snapshot (extended)**: Includes strokes, guess history, and scores for all viewers equally (secret word remains drawer-only per Scenario 2).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drawer and guesser in two tabs see stroke updates within 3 seconds of a draw action (one poll cycle).
- **SC-002**: 100% of non-drawer stroke/clear attempts are rejected without mutating stroke data.
- **SC-003**: Empty guess submissions are blocked before network call on the client and rejected on the server with the same message.
- **SC-004**: All connected clients display identical guess history order within one poll cycle after a guess.
- **SC-005**: First correct guess yields exactly +100 for that guesser and 0 change for others; room reaches result state immediately after.
- **SC-006**: After result state, 100% of new guess attempts are rejected.
- **SC-007**: At round start, every participant score reads 0 in snapshots.

## Assumptions

- **A3**: First correct guess ends the round, awards +100, transitions to `"result"`, disables further guesses (discovery.md).
- **A5**: Polling at 2000 ms; pause when tab hidden (Scenarios 1–2).
- **A7**: Strokes append-only; clear resets array; shape `{ points: {x,y}[], color, width }` (discovery.md).
- **Q1**: Full guess history including incorrect guesses visible to all players, chronological (discovery.md default).
- **Q3**: Canvas 600×400 CSS pixels; straight-line interpolation between pointer samples; no smoothing (discovery.md default).
- Scenarios 1–2 (host, lobby polling, start, drawer, masked secret word) are complete before this ships.
- Result panel polish, revealed correct word banner, and restart flow are Scenario 4; this scenario only needs history + scores visible in result state.

## Dependencies

- Scenario 2: `playing` status, `currentRound`, drawer assignment, masked snapshots, game page polling.
- Constitution v2.0.0 caps on strokes, guesses, and stroke points.

## Out of Scope

- Host restart action and lobby return (Scenario 4).
- Full result UI (revealed word, restart button, exit-game server sync) beyond displaying scores and guess history when status is result.
- Drawer rotation, timers, speed bonuses, multi-round logic.
- WebSockets, databases, authentication.

## Validation

Two-tab manual check:

1. Host starts game (Scenario 2); confirm scores all 0.
2. Drawer draws; guest sees strokes within ~3 s.
3. Guest submits wrong guess; both tabs show it in history; scores unchanged.
4. Guest submits correct guess (case variant allowed); guest +100; room status result; guess form disabled.
5. Drawer clear during playing round empties canvas for both tabs.
6. Non-drawer cannot draw or clear (UI hidden/disabled and API forbidden).
