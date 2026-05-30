# Feature Specification: Scenario 3 Gameplay Interaction

**Feature Branch**: `assignment`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Scenario 3 gameplay interaction with a drawing
surface for the drawer, clear canvas action, trimmed guess submission,
empty-guess rejection, case-insensitive guess matching against the secret word,
synced guess history via polling, and deterministic scoring where correct
guesses score 100 and incorrect guesses score 0. Keep this limited to Scenario
3 only. Exclude result state display, restart flow, multiple rounds, timers,
bonuses, and any Scenario 4 behavior."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Sketches the Word (Priority: P1)

When a round is active, the assigned drawer can use a shared drawing surface and
clear it when needed so the room has a usable sketch area for the guessing
phase.

**Why this priority**: Scenario 3 must first make the active round interactive
before guesses or scores have practical value.

**Independent Test**: Start a room, confirm only the drawer can add marks to the
shared drawing surface, and confirm clearing the canvas resets that shared view
for everyone in the room.

**Acceptance Scenarios**:

1. **Given** a round is active and a drawer is assigned, **When** the drawer
   uses the drawing surface, **Then** the shared canvas reflects those marks for
   the room.
2. **Given** a non-drawer is viewing the same round, **When** they interact with
   the drawing surface, **Then** they cannot change the shared canvas state.
3. **Given** the drawer has already drawn on the canvas, **When** the drawer
   chooses to clear it, **Then** the shared canvas returns to an empty state for
   all players in that room.

---

### User Story 2 - Players Submit and Track Guesses (Priority: P2)

Players submit guesses against the active word, with blank guesses rejected,
accepted guesses normalized for matching, and shared history kept in sync for
the room.

**Why this priority**: Guess submission is the core interaction that turns the
shared drawing surface into actual gameplay.

**Independent Test**: Start a round in two tabs, submit trimmed, blank, correct,
and incorrect guesses, and confirm only valid guesses enter the room history in
the same order for both players.

**Acceptance Scenarios**:

1. **Given** a player enters a guess with extra spaces around the text,
   **When** the guess is submitted, **Then** the stored guess uses the trimmed
   value.
2. **Given** a player submits an empty or whitespace-only guess, **When** the
   guess is processed, **Then** it is rejected with clear feedback and does not
   appear in shared history.
3. **Given** a player submits a guess whose letters match the secret word with
   different casing, **When** the guess is evaluated, **Then** it counts as a
   correct match.
4. **Given** multiple accepted guesses are submitted in a room, **When** other
   players refresh the round state, **Then** they see the same guess history in
   the same order for that room only.

---

### User Story 3 - Correct Guesses Score Deterministically (Priority: P3)

The game awards a predictable score outcome for each accepted guess so players
can understand whether a guess succeeded and how many points it earned.

**Why this priority**: Deterministic scoring completes the Scenario 3 gameplay
loop while staying short of result and restart behavior.

**Independent Test**: Submit one correct guess and one incorrect guess in an
active room, then confirm the correct guess earns 100 points, the incorrect
guess earns 0 points, and all players see the same score outcome.

**Acceptance Scenarios**:

1. **Given** an accepted guess matches the secret word, **When** the guess is
   scored, **Then** that guess earns 100 points.
2. **Given** an accepted guess does not match the secret word, **When** the
   guess is scored, **Then** that guess earns 0 points.
3. **Given** multiple players view the same room after guesses have been
   scored, **When** they load the round state, **Then** they receive the same
   score outcomes for the same guess history entries.

### Edge Cases

- The drawer attempts to submit a guess during the active round.
- A player submits only spaces as a guess.
- A player submits the correct word with different capitalization than the
  secret word.
- The drawer clears the canvas after guesses have already been submitted and the
  guess history must remain intact.
- Two rooms are active at the same time and drawing updates, guess history, and
  scores must remain isolated by room.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a shared drawing surface during an active
  round.
- **FR-002**: The system MUST allow only the assigned drawer to change the
  shared drawing surface.
- **FR-003**: The system MUST allow the assigned drawer to clear the shared
  canvas and MUST reset that canvas for every player in the same room.
- **FR-004**: The system MUST allow players to submit guesses during an active
  round.
- **FR-005**: The system MUST trim leading and trailing whitespace from each
  submitted guess before evaluating or storing it.
- **FR-006**: The system MUST reject empty or whitespace-only guesses with clear
  feedback and MUST keep rejected guesses out of shared history.
- **FR-007**: The system MUST evaluate accepted guesses against the secret word
  without requiring exact letter casing.
- **FR-008**: The system MUST add each accepted guess to room-specific shared
  history in submission order.
- **FR-009**: The system MUST keep drawing state, clear-canvas state, and guess
  history synchronized across players in the same room through scheduled
  refreshes.
- **FR-010**: The system MUST award 100 points to each accepted guess that
  matches the secret word.
- **FR-011**: The system MUST award 0 points to each accepted guess that does
  not match the secret word.
- **FR-012**: The system MUST expose the same guess history and score outcomes
  to every player viewing the same room state.
- **FR-013**: This feature MUST exclude result-state display, restart flow,
  multiple rounds, timers, bonuses, and any Scenario 4 behavior.

### Key Entities *(include if feature involves data)*

- **Canvas State**: The shared round drawing data that the drawer can change and
  clear while other players only observe it.
- **Guess Submission**: A player's trimmed guess attempt for the active secret
  word, including whether it was accepted for evaluation.
- **Guess History Entry**: A room-specific record of one accepted guess, its
  player identity, its normalized content, and its score outcome.
- **Round Score Outcome**: The deterministic point value assigned to an accepted
  guess, which is either 100 for a correct guess or 0 for an incorrect guess.

## Constraints & Non-Goals *(mandatory)*

- **CN-001**: Round updates in this scenario MUST continue using scheduled
  refreshes rather than instant push-based updates.
- **CN-002**: Canvas, guess, and score data for this scenario MUST remain
  temporary for the current runtime only and are not expected to survive a
  service restart.
- **CN-003**: Players MUST continue to access rooms without sign-in, account
  creation, or identity verification features.
- **CN-004**: This feature MUST build directly on the existing Scenario 1 and
  Scenario 2 round-start behavior without expanding into unrelated product
  areas.
- **CN-005**: Guess matching and score assignment MUST be deterministic for the
  same accepted guess content and active secret word.
- **CN-006**: The scope is limited to Scenario 3 gameplay interaction only.
- **CN-007**: Result-state display, restart flow, multiple rounds, timers,
  bonuses, and any Scenario 4 behavior are explicit non-goals for this
  specification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In two-tab validation, a drawer can create and clear shared marks
  and the observing player sees the same canvas state within one scheduled
  refresh cycle each time.
- **SC-002**: In manual validation, 100% of empty or whitespace-only guess
  submissions are rejected before they enter shared history.
- **SC-003**: In manual validation, guesses that differ from the secret word
  only by letter casing are accepted as correct every time.
- **SC-004**: In repeated validation, every correct accepted guess awards 100
  points, every incorrect accepted guess awards 0 points, and all players in
  the same room observe the same score outcomes.

## Assumptions

- Scenario 2 room start, drawer assignment, secret word selection, and
  drawer-only word visibility already exist and remain the source of truth for
  active rounds.
- One active round is sufficient for Scenario 3; end-of-round results,
  progression to another round, and restart logic are deferred to later
  scenarios.
- Guess history may be visible to all players in the room, but secret word
  visibility remains limited according to Scenario 2 rules.
- A drawer can continue sketching or clear the canvas after guesses have been
  submitted because this scenario does not yet end the round automatically.

## Verification Plan *(mandatory)*

- Validate drawer-only drawing and clear-canvas behavior across at least two
  tabs in the same room.
- Validate trimmed, blank, correct, and incorrect guess submission behavior.
- Validate case-insensitive guess matching against the active secret word.
- Validate shared guess-history synchronization and room isolation across active
  rooms.
- Validate deterministic 100-or-0 score outcomes for accepted guesses.
