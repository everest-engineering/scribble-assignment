# Feature Specification: Gameplay Interaction

**Feature Branch**: *(continues on current branch; no new branch required)*

**Created**: 2026-05-29

**Status**: Draft

**Input**: Scenario 3 from README — Gameplay Interaction: when a round is active with a drawer and guessers (all scores start at 0), the drawer draws/clears the canvas and guessers submit guesses; the drawing is visible on the game view; guesses are trimmed, case-insensitively compared, and empty ones rejected; guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scores Start at Zero (Priority: P1)

When a round becomes active, every participant's score is initialized to zero and displayed on the scoreboard. Scores remain visible and update as gameplay progresses.

**Why this priority**: A visible zero baseline confirms round state is ready for gameplay and gives players a shared reference before any guesses are scored.

**Independent Test**: After game start, all tabs show every participant at score 0 on the scoreboard without manual refresh.

**Acceptance Scenarios**:

1. **Given** a room that has just entered active play with at least two participants, **When** clients view the game screen, **Then** every participant's score is 0.
2. **Given** multiple clients viewing the same active room, **When** they load or poll the game snapshot, **Then** all clients show identical starting scores of 0 for each participant.
3. **Given** a participant on the scoreboard, **When** the round is active and no guesses have been scored yet, **Then** that participant's displayed score remains 0.

---

### User Story 2 - Drawer Draws and Clears the Canvas (Priority: P2)

The drawer can draw on an interactive canvas and clear it. Only the drawer may create or modify drawing strokes. All participants see the current drawing on the game view, kept consistent through polling.

**Why this priority**: Drawing is the core expressive mechanic; without an interactive, synced canvas, guessers have nothing to interpret.

**Independent Test**: Drawer tab draws strokes and clears the canvas; guesser tab sees the same drawing update within one poll cycle without manual refresh.

**Acceptance Scenarios**:

1. **Given** a participant who is the drawer, **When** they draw on the canvas, **Then** their strokes appear on their game view immediately.
2. **Given** a participant who is the drawer, **When** they clear the canvas, **Then** all prior strokes are removed from the drawing on their game view.
3. **Given** a guesser viewing the game, **When** the drawer adds or removes strokes, **Then** the guesser sees the updated drawing within one poll cycle without manual refresh.
4. **Given** a guesser viewing the game, **When** they interact with the canvas, **Then** they cannot add or modify strokes (read-only view).
5. **Given** multiple clients viewing the same active room, **When** they poll the game snapshot, **Then** all clients show the same drawing state.

---

### User Story 3 - Guessers Submit Validated Guesses (Priority: P3)

Guessers submit text guesses through the game UI. Guesses are trimmed before validation. Empty or whitespace-only guesses are rejected with a clear message. Valid guesses are recorded and compared to the secret word case-insensitively.

**Why this priority**: Guess submission with validation is the primary interaction for non-drawers and must be reliable before history sync or scoring matter.

**Independent Test**: As a guesser, submit empty, whitespace-only, wrong-case, and correct guesses — empty rejected; trimmed guesses accepted; comparison is case-insensitive.

**Acceptance Scenarios**:

1. **Given** a guesser on the active game screen, **When** they submit a guess consisting only of whitespace, **Then** the guess is rejected with a clear message and no new entry is recorded.
2. **Given** a guesser on the active game screen, **When** they submit a guess with leading or trailing spaces around valid text, **Then** the guess is stored trimmed before comparison.
3. **Given** a guesser on the active game screen, **When** they submit a non-empty trimmed guess, **Then** the guess is accepted and evaluated against the secret word without regard to letter case.
4. **Given** the secret word is `rocket`, **When** a guesser submits `Rocket` or `ROCKET`, **Then** the guess is treated as correct.
5. **Given** a participant who is the drawer, **When** they attempt to submit a guess, **Then** guess submission is not available (disabled or blocked).

---

### User Story 4 - Guess History Syncs via Polling (Priority: P4)

Every accepted guess appears in a shared guess history visible to all participants. The history stays consistent across clients through the same polling pattern used elsewhere in the game (~2 seconds).

**Why this priority**: Shared history lets all players follow the round's progress and validates multi-client sync for gameplay data beyond roles and scores.

**Independent Test**: Two-tab test — guesser submits a guess in Tab B; Tab A shows the new history entry within one poll cycle.

**Acceptance Scenarios**:

1. **Given** a guesser submits a valid guess, **When** any client polls or loads the game snapshot, **Then** the guess appears in the shared history with the guesser's identity and guess text.
2. **Given** multiple guesses from different participants, **When** clients view the guess history, **Then** entries appear in submission order.
3. **Given** clients on the game view during an active round, **When** polling runs on an interval of approximately 2 seconds, **Then** guess history remains consistent across all clients.
4. **Given** a rejected empty guess, **When** clients poll the game snapshot, **Then** no new history entry appears.

---

### User Story 5 - Correct Guesses Score 100 Points (Priority: P5)

When a guess matches the secret word (case-insensitive), the guessing participant's score increases by 100. Incorrect guesses add 0 points. The scoreboard reflects updated totals for all participants.

**Why this priority**: Scoring closes the gameplay loop and confirms server-authoritative evaluation of guesses.

**Independent Test**: Submit one correct and one incorrect guess — correct participant gains 100; incorrect participant stays at 0; scoreboard updates on all tabs within one poll cycle.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess that matches the secret word case-insensitively, **When** the guess is evaluated, **Then** that participant's score increases by exactly 100.
2. **Given** a guesser submits a guess that does not match the secret word, **When** the guess is evaluated, **Then** that participant's score increases by 0.
3. **Given** a participant whose score was 0, **When** they submit their first correct guess, **Then** their score becomes 100.
4. **Given** multiple clients viewing the scoreboard, **When** a guess is scored, **Then** all clients show the same updated score within one poll cycle.
5. **Given** a participant already at score 100 from a prior correct guess, **When** they submit another correct guess, **Then** their score increases by 100 again (each correct submission awards 100).

---

### Edge Cases

- **Empty or whitespace-only guess**: Rejected client- and server-side; no history entry; score unchanged.
- **Guess trim preserves inner spaces**: `"Big Bird"` remains valid after trim if that were the word (inner spaces preserved).
- **Case variants of secret word**: `rocket`, `Rocket`, and `ROCKET` all count as correct for word `rocket`.
- **Drawer cannot guess**: Guess input disabled or blocked for the drawer role.
- **Non-guessers cannot draw**: Canvas interaction disabled for guessers; strokes from non-drawers rejected server-side if attempted.
- **Clear canvas during active drawing**: All strokes removed; guessers see empty canvas on next poll.
- **Poll failure during gameplay**: Temporary poll failure surfaces a non-crashing error; polling continues; drawing, history, and scores reconcile on next successful poll.
- **Multiple guesses per participant**: Allowed during the active round; each valid submission is recorded and scored independently.
- **Round end deferred**: Scenario 3 does not transition to a result/end state when the word is guessed correctly; the round remains active (Scenario 4 owns round end).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST initialize every participant's score to 0 when the round enters active play.
- **FR-002**: System MUST display each participant's current score on the scoreboard during active play.
- **FR-003**: System MUST allow only the drawer to add drawing strokes to the canvas during an active round.
- **FR-004**: System MUST allow only the drawer to clear all strokes from the canvas during an active round.
- **FR-005**: System MUST persist the authoritative drawing state on the server and include it in room snapshots during active play.
- **FR-006**: System MUST show the current drawing to all participants on the game view (drawer and guessers).
- **FR-007**: System MUST sync drawing state to all clients via polling on an interval of approximately 2 seconds.
- **FR-008**: System MUST trim leading and trailing whitespace from guess text before validation and comparison.
- **FR-009**: System MUST reject guess submissions when trimmed guess text is empty and display a clear, user-visible message.
- **FR-010**: System MUST compare accepted guesses to the secret word case-insensitively.
- **FR-011**: System MUST prevent the drawer from submitting guesses during active play.
- **FR-012**: System MUST record each accepted guess in a shared guess history with participant identity and guess text.
- **FR-013**: System MUST sync guess history to all clients via polling on an interval of approximately 2 seconds.
- **FR-014**: System MUST increase a guesser's score by exactly 100 when their guess matches the secret word case-insensitively.
- **FR-015**: System MUST increase a guesser's score by 0 when their guess does not match the secret word.
- **FR-016**: System MUST keep scores and guess history consistent across all clients viewing the same room on each poll cycle.
- **FR-017**: System MUST surface API and validation errors in the UI without crashing the client.

### Key Entities

- **Score**: Numeric points per participant during the active round; starts at 0; updated on each scored guess.
- **Drawing stroke**: A segment of canvas drawing data attributed to the active round; only the drawer may create or clear strokes; authoritative copy held server-side.
- **Guess**: A trimmed text submission from a guesser, timestamped and linked to the submitting participant; evaluated case-insensitively against the secret word.
- **Guess history**: Ordered list of accepted guesses visible to all participants on the game view.
- **Game snapshot (extended)**: Client-visible room state during active play — includes scores, drawing state, and guess history in addition to roles and word visibility from Scenario 2.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of participants show score 0 immediately after round start across all connected clients.
- **SC-002**: Drawing changes made by the drawer appear on all guesser clients within one poll cycle (~2 seconds) during manual two-tab validation.
- **SC-003**: 100% of empty or whitespace-only guess submissions are rejected with an explicit error message.
- **SC-004**: 100% of case-variant matches against the secret word (e.g., `Rocket` vs `rocket`) are scored as correct.
- **SC-005**: 100% of incorrect guesses add 0 points to the submitting participant's score.
- **SC-006**: 100% of correct guesses add exactly 100 points to the submitting participant's score.
- **SC-007**: Guess history entries submitted in one client appear on all other clients within one poll cycle.
- **SC-008**: Scoreboard totals are identical across all connected clients within one poll cycle after any scored guess.

## Assumptions

- **Scenario 1–2 dependency**: Room lobby, start flow, drawer assignment, secret word visibility, name validation, and game-view polling are implemented per `specs/001-room-setup-lobby/spec.md` and `specs/002-game-start-drawer-flow/spec.md`.
- **Drawing visibility**: README phrasing "visible on the drawer's screen" is interpreted as the drawer having an interactive canvas; the synced drawing is visible to all participants on the game view (guessers need it to guess).
- **Polling cadence**: Gameplay sync (drawing, history, scores) uses the same ~2 second HTTP polling pattern established in prior scenarios.
- **Single round, no round end**: Scenario 3 keeps the round in active play even after a correct guess; result/reveal/end belongs to Scenario 4.
- **Multiple guesses allowed**: Participants may submit multiple guesses during the round; each accepted guess is recorded and scored independently.
- **Scoring rule**: Each correct guess submission awards +100; each incorrect submission awards +0 (no speed bonus, no drawer bonus).
- **Guessers only**: Only participants with the guesser role may submit guesses; the drawer may draw and clear only.
- **Constitution alignment**: HTTP polling only, in-memory rooms, Zod validation, starter word list from Scenario 2, Vitest for pure logic (scoring, guess validation), two-tab manual validation.

## Out of Scope (Explicit Reminders)

The following MUST NOT appear in implementation work for this scenario:

- **Transport**: WebSockets, Socket.io, SSE, or any real-time push protocol — HTTP polling only.
- **Persistence**: Databases or durable storage across server restarts.
- **Identity**: Authentication, accounts, sessions, JWT, or OAuth.
- **Lobby and round setup**: Room create/join, host start, drawer assignment, word selection — owned by Scenarios 1–2 except score/drawing/guess extensions added here.
- **Round lifecycle end**: Result screen, reveal word to all, round-over transition, restart to lobby (Scenario 4).
- **Multiple rounds**: Drawer rotation, second rounds, timers, countdowns, speed bonuses, drawer bonuses.
- **Content**: Custom or random word packs beyond the starter list.
- **Social/moderation**: Spectators, kick, mute, room passwords.
- **Infrastructure**: Deployment, CI, Docker, new top-level dependencies without plan justification.

**Boundary note**: Scenario 3 begins when the round is active with drawer, guessers, and scores at 0. Scenario 4 owns what happens when the round ends and how players restart.
