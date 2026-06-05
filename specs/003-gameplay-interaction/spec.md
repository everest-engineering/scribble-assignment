# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Scenario 3 — Gameplay Interaction (README business scenarios, third one)"

## Clarifications

### Session 2026-06-05

- Q: Should guessers be able to see the drawer's drawing, and if so how should it sync (given the no-WebSockets / no real-time push constraint)? → A: Yes — the drawing syncs to guessers via polled canvas snapshots (the drawer's canvas is periodically sent to the backend; guessers render it from the room snapshot they already poll, ~2s). This supersedes the earlier "drawing is drawer-local" decision.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit a guess with validation (Priority: P1)

In an active round, a guesser types a guess and submits it. The guess is trimmed and compared
to the secret word case-insensitively. Empty or whitespace-only guesses are rejected with a clear
message and not recorded. The drawer cannot submit guesses.

**Why this priority**: Guessing is the central interaction of the round and the thing two
browsers can exercise together. Validation is the graded edge-case core. This is the MVP slice.

**Independent Test**: As a guesser, submit (a) a blank guess, (b) a whitespace-only guess, (c) a
correct word in different casing/whitespace, and (d) a wrong word; confirm (a)/(b) are rejected
with a message, (c) is accepted as correct, (d) is accepted as incorrect, and the drawer has no
way to submit a guess.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a guesser submits an empty or whitespace-only guess,
   **Then** they see a clear "guess cannot be empty" message and nothing is recorded.
2. **Given** an active round with secret word "castle", **When** a guesser submits "  CASTLE ",
   **Then** the guess is trimmed and matched case-insensitively and counts as correct.
3. **Given** an active round, **When** a guesser submits a word that is not the secret word,
   **Then** the guess is accepted and recorded as incorrect.
4. **Given** an active round, **When** the drawer attempts to guess, **Then** no guess submission
   is available to the drawer.

---

### User Story 2 - Synced guess history for everyone (Priority: P1)

Every valid guess is recorded and the guess history is kept in sync for all players via polling,
so each player sees the same running list of who guessed and whether each guess was correct —
without a correct guess revealing the secret word to other guessers.

**Why this priority**: A shared, synced history is what makes the round feel multiplayer and is
explicitly required ("synced to all players via polling"). It depends on guesses existing (US1).

**Independent Test**: With a drawer and two guessers across tabs, submit guesses from each; confirm
all tabs converge on the same history within ~2 seconds, and that a correct guess shows as correct
without exposing the word to the other guesser.

**Acceptance Scenarios**:

1. **Given** a guesser submits a valid guess, **When** other players' screens refresh, **Then**
   the new guess appears in everyone's history within ~2 seconds.
2. **Given** the guess history, **When** any player views it, **Then** it lists guesses in
   submission order with the guesser's identity and a correct/incorrect indicator.
3. **Given** a guesser guesses correctly, **When** another guesser views the history, **Then**
   the entry is marked correct but the matched text is not revealed to them (the secret word stays
   hidden from non-drawers).

---

### User Story 3 - Deterministic scoring (Priority: P1)

All scores start at 0. A correct guess awards exactly 100 points to that guesser; an incorrect
guess awards 0. Scores are synced to all players. A guesser scores at most once per round.

**Why this priority**: Scoring is the deterministic outcome of the round and a graded rule. It
depends on guesses being evaluated (US1).

**Independent Test**: Start a round; confirm all scores are 0; have a guesser guess wrong (score
stays 0), then correct (score becomes 100), then correct again (score stays 100); confirm a second
guesser can independently reach 100.

**Acceptance Scenarios**:

1. **Given** a round has just begun, **When** scores are inspected, **Then** every participant's
   score is 0.
2. **Given** a guesser submits a correct guess for the first time, **When** scoring is applied,
   **Then** their score becomes 100.
3. **Given** a guesser submits an incorrect guess, **When** scoring is applied, **Then** their
   score is unchanged (0 added).
4. **Given** a guesser who has already guessed correctly, **When** they submit another correct
   guess, **Then** their score remains 100 (no additional points).
5. **Given** scores change, **When** other players' screens refresh, **Then** the updated scores
   appear for everyone within ~2 seconds.

---

### User Story 4 - Interactive drawing, clear canvas, and shared view (Priority: P2)

The drawer can draw freehand on the canvas and clear it. The drawing is also visible to guessers,
kept in sync via polled canvas snapshots (~2s). Drawing and clearing are available only to the
drawer; guessers see the drawing read-only.

**Why this priority**: Drawing is the drawer-side action of the round and what guessers rely on to
guess. It is supporting (P2) relative to the synced guessing/scoring loop, but the drawing must be
visible to guessers for the round to be playable.

**Independent Test**: As the drawer, draw strokes on the canvas and confirm they appear; clear the
canvas and confirm it empties; from a guesser tab, confirm the drawing appears (and updates within
~2s) read-only, with no drawing or clear controls.

**Acceptance Scenarios**:

1. **Given** the drawer's game view, **When** the drawer draws on the canvas, **Then** the strokes
   appear on the drawer's screen.
2. **Given** the drawer has drawn something, **When** the drawer clears the canvas, **Then** the
   canvas is emptied of all strokes (and the cleared state syncs to guessers).
3. **Given** a guesser's game view, **When** they look for drawing tools, **Then** no drawing or
   clear controls are available to them.
4. **Given** the drawer draws or clears, **When** a guesser's screen refreshes, **Then** the
   guesser sees the updated drawing within ~2 seconds.

---

### Edge Cases

- **Empty / whitespace-only guess**: rejected with a clear message; not recorded; no score change.
- **Casing / surrounding whitespace**: "  Castle " matches "castle" (trim + case-insensitive).
- **Drawer guessing**: the drawer cannot submit guesses (they already know the word).
- **Repeat correct guess**: a guesser who already scored does not accumulate more points.
- **Multiple correct guessers**: each guesser can independently reach 100.
- **Guessing outside an active round**: guesses are only accepted while the round is active; a
  lobby room rejects guess submission.
- **Word secrecy in history**: a correct guess never exposes the secret word to other guessers.
- **History sync lag**: a guess submitted in one tab appears in others within ~2 seconds via
  polling; a transient refresh failure keeps the last known history and recovers next cycle.

## Requirements *(mandatory)*

### Functional Requirements

**Guess submission & validation**

- **FR-001**: System MUST let a guesser submit a guess while the round is active.
- **FR-002**: System MUST trim leading/trailing whitespace from a guess before evaluating it.
- **FR-003**: System MUST reject an empty or whitespace-only guess with a clear message and MUST
  NOT record it or change any score.
- **FR-004**: System MUST compare a guess to the secret word case-insensitively after trimming.
- **FR-005**: System MUST prevent the drawer from submitting guesses.
- **FR-006**: System MUST only accept guesses while the room is in the active-round state.

**Guess history & sync**

- **FR-007**: System MUST record each valid guess with the guesser's identity, a correct/incorrect
  result, and submission order.
- **FR-008**: System MUST sync the guess history to all players via polling (~2s cadence).
- **FR-009**: System MUST NOT reveal the secret word to non-drawers through the guess history; a
  correct guess is shown as correct without exposing the matched text to other guessers.
- **FR-010**: System MUST present the guess history in submission order to every player.

**Scoring**

- **FR-011**: System MUST initialize every participant's score to 0 when the round begins.
- **FR-012**: System MUST award exactly 100 points for a guesser's first correct guess.
- **FR-013**: System MUST add 0 points for an incorrect guess.
- **FR-014**: System MUST NOT award additional points to a guesser who has already guessed
  correctly in the round.
- **FR-015**: System MUST sync scores to all players via polling (~2s cadence).

**Drawing**

- **FR-016**: System MUST let the drawer draw freehand on the canvas, with strokes appearing on the
  drawer's screen.
- **FR-017**: System MUST let the drawer clear the canvas, removing all current strokes.
- **FR-018**: System MUST make drawing and clear controls available only to the drawer; guessers see
  the drawing read-only.
- **FR-021**: System MUST make the drawer's current drawing visible to guessers, kept in sync via
  polled canvas snapshots (~2s cadence), using HTTP polling only (no real-time push). Clearing the
  canvas MUST propagate to guessers the same way.

**State**

- **FR-019**: System MUST keep all gameplay state (guesses, scores, drawing) consistent with the
  in-memory-only constraint of the project constitution.
- **FR-020**: System MUST keep the round in the active state throughout gameplay; ending the round
  and showing results is out of scope here (owned by Scenario 4).

### Key Entities *(include if data involved)*

- **Guess**: A single submission by a guesser during the round. Captures who guessed, the result
  (correct/incorrect), submission order/time, and the text (with correct-guess text withheld from
  non-drawers in the shared history).
- **Score**: A per-participant point total for the round, starting at 0, reaching 100 on a first
  correct guess. Synced to all players.
- **Room (extended)**: Gains an ordered guess history, per-participant scores, and the drawer's
  current drawing snapshot for the active round. Still in memory only.
- **Drawing snapshot**: A serialized representation of the drawer's current canvas, updated by the
  drawer and read by guessers via polling. Empty when the canvas is cleared.
- **Secret word**: From Scenario 2 — the target a correct guess must match (trim + case-insensitive).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of empty or whitespace-only guesses are rejected with a clear message and leave
  the history and scores unchanged.
- **SC-002**: Guesses differing only by casing or surrounding whitespace from the secret word are
  judged correct 100% of the time.
- **SC-003**: A correct guess yields exactly 100 points and an incorrect guess yields 0, every time
  (deterministic).
- **SC-004**: Every participant's score is 0 at the start of the round, 100% of the time.
- **SC-005**: A guesser's score never exceeds 100 within a round regardless of how many correct
  guesses they submit.
- **SC-006**: A guess submitted in one player's view appears in every other player's guess history
  within ~2 seconds.
- **SC-007**: The secret word is never exposed to a non-drawer through the guess history (0
  leakage across trials).
- **SC-008**: The drawer can draw and clear the canvas on their own screen; guessers have no
  drawing controls, 100% of the time.
- **SC-009**: A change to the drawer's canvas (a new stroke or a clear) becomes visible to a
  guesser within ~2 seconds, via polling only.

## Assumptions

- **Drawing syncs via polled snapshots** (clarified 2026-06-05): The drawer's canvas is periodically
  serialized and sent to the backend; guessers render it from the room snapshot they already poll
  (~2s). This uses HTTP polling only (no real-time push), so it stays within the constitution.
  Guessers see the drawing read-only with up to ~2s lag; continuous live (sub-second) streaming of
  strokes is out of scope.
- **Score once per round**: A guesser earns 100 for their first correct guess and does not
  accumulate further points that round; this keeps scoring deterministic and prevents farming.
- **Correct-guess secrecy**: Correct guesses are shown in the shared history as "correct" without
  revealing the matched text, preserving the drawer-only word visibility from Scenario 2.
- **Round end deferred**: What ends the round and the result display/restart are owned by Scenario
  4; this scenario keeps the room in the active state and only adds drawing, guessing, history, and
  scoring.
- **Sync mechanism**: Guess-history and score syncing reuses the ~2s polling from Scenario 1; no
  new real-time mechanism is introduced.
- **Guess content in history**: Incorrect guesses may show their text to all players (they don't
  reveal the secret word); only correct-guess text is withheld from non-drawers.
- **No per-guess identity restriction beyond role**: Any guesser may submit multiple guesses; only
  scoring is capped at one award per player.
