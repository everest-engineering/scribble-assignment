# Feature Specification: Gameplay Interaction

**Feature Branch**: `scribble-assignment` (single-branch lab; feature dir `specs/003-gameplay-interaction`)

**Created**: 2026-06-17

**Status**: Draft

**Feature Group**: 3 of 4 — Scenario 3 (Gameplay Interaction)

**Builds on**: Group 1 (room/lobby/start) and Group 2 (drawer assignment + secret word). This group makes the active round playable.

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## Clarifications

### Session 2026-06-17

- Q: Is the drawer's canvas synced to guessers, or local to the drawer? → A: Drawer-local only — the canvas is interactive and clearable for the drawer, and stroke data is NOT sent to guessers (no pixel sync over polling).
- Q: How are guesses shown in the shared history? → A: Verbatim to all players — every guess shows its exact text, so a correct guess reveals the word in the history (the word is revealed at round end anyway).
- Q: After a guesser guesses correctly, what happens to their guess input? → A: It is disabled for the rest of the round (they have scored their 100 and cannot submit further guesses).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The drawer can draw and clear the canvas (Priority: P1)

The drawer sees an interactive drawing surface they can draw on freehand, and a control to clear it. The
drawing is visible on the drawer's own screen.

**Why this priority**: Drawing is the drawer's core action in the round. Without it the drawer has nothing to do.

**Independent Test**: As the drawer, draw strokes on the canvas and confirm they appear; click clear and
confirm the canvas empties. As a guesser, confirm there is no drawing surface to draw on.

**Acceptance Scenarios**:

1. **Given** the active round and the viewer is the drawer, **When** they drag on the canvas, **Then** freehand strokes appear on their screen.
2. **Given** strokes on the canvas, **When** the drawer activates clear, **Then** the canvas is emptied.
3. **Given** the active round and the viewer is a guesser, **When** they view the canvas area, **Then** they cannot draw on it (drawing is a drawer-only action).

---

### User Story 2 - Guessers submit validated guesses (Priority: P1)

A guesser types a guess and submits it. Empty/whitespace guesses are rejected; accepted guesses are trimmed
and compared to the secret word case-insensitively to determine correctness. The drawer cannot submit guesses.

**Why this priority**: Guessing is the guessers' core action and the basis for scoring and history. It is the
heart of Scenario 3.

**Independent Test**: As a guesser, submit an empty guess (rejected with a message), a wrong guess (accepted,
marked incorrect), and the word in different casing/with spaces (accepted, marked correct). As the drawer,
confirm the guess input is unavailable.

**Acceptance Scenarios**:

1. **Given** a guesser, **When** they submit an empty or whitespace-only guess, **Then** it is rejected with a clear message and nothing is recorded.
2. **Given** a guesser, **When** they submit a guess that matches the secret word ignoring case and surrounding spaces (e.g. "  Castle " vs "castle"), **Then** it is recorded as correct.
3. **Given** a guesser, **When** they submit a guess that does not match, **Then** it is recorded as incorrect.
4. **Given** the drawer, **When** they view the game screen, **Then** no guess-submission control is available to them.

---

### User Story 3 - Guess history is synced to all players (Priority: P1)

Every submitted guess appears in a shared guess history visible to all players, kept current via polling.

**Why this priority**: Shared visibility of guesses is what makes the round a multiplayer experience and lets
players follow progress. It depends on US2 producing guesses.

**Independent Test**: With two browsers, submit guesses from a guesser and confirm they appear in the history
on both the drawer's and other players' screens within a couple of seconds without manual refresh.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** other players' screens next poll, **Then** the guess appears in their guess history within ~2 seconds.
2. **Given** multiple guesses over time, **When** any player views the history, **Then** they see the guesses in a consistent order with who made each.
3. **Given** the history is shared, **When** compared across players, **Then** all players see the same set of guesses.

---

### User Story 4 - Correct guesses score 100 (Priority: P1)

All participants start the round with a score of 0. A correct guess awards the guesser 100 points; incorrect
guesses award nothing. Scores are visible to all via the scoreboard and kept current by polling.

**Why this priority**: Scoring is the measurable outcome of the round and the payoff of guessing correctly.
It depends on US2 (correctness) and US3 (sync).

**Independent Test**: Confirm scores begin at 0; submit a correct guess and confirm that guesser's score
becomes 100 on all screens; submit incorrect guesses and confirm no score change.

**Acceptance Scenarios**:

1. **Given** a freshly started round, **When** the scoreboard is viewed, **Then** every participant's score is 0.
2. **Given** a guesser submits a correct guess, **When** scores update, **Then** that guesser's score is 100 and is reflected on all players' scoreboards within ~2 seconds.
3. **Given** a guesser submits an incorrect guess, **When** scores update, **Then** no score changes.
4. **Given** a guesser has already scored for a correct guess, **When** the round continues, **Then** their guess input is disabled and their score does not increase further.

### Edge Cases

- **Empty/whitespace-only guess** → rejected with a clear message; not recorded; no score change.
- **Case/spacing differences** ("  CASTLE " vs "castle") → treated as correct (trim + case-insensitive).
- **Drawer attempts to guess** → no guess control available to the drawer; a drawer guess is not accepted.
- **Repeat correct guess by the same guesser** → scores once only; no double-award, and their guess input is disabled after the first correct guess.
- **Guess submitted before/after the active round** → only meaningful while the room is in the active round state.
- **History/scoreboard while polling** → no duplicate entries; consistent across players.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide the drawer an interactive freehand drawing surface during the active round, with strokes appearing on the drawer's screen.
- **FR-002**: The system MUST provide the drawer a control to clear the canvas.
- **FR-003**: The system MUST NOT allow non-drawers (guessers) to draw on the canvas.
- **FR-004**: The system MUST allow a guesser to submit a guess during the active round, and MUST NOT offer guess submission to the drawer.
- **FR-005**: The system MUST trim a guess and reject an empty/whitespace-only guess with a clear message, recording nothing for it.
- **FR-006**: The system MUST compare an accepted guess to the secret word case-insensitively (after trimming) to determine correctness.
- **FR-007**: The system MUST record each accepted guess in a shared guess history with the guesser's identity, the guess text, and whether it was correct.
- **FR-008**: The system MUST sync the guess history to all players via polling (~2s), with a consistent ordering and no duplicates.
- **FR-009**: The system MUST initialize every participant's score to 0 for the round.
- **FR-010**: The system MUST award exactly 100 points to a guesser for a correct guess and 0 for an incorrect guess.
- **FR-011**: The system MUST NOT award additional points for a repeat correct guess by a guesser who has already scored.
- **FR-011a**: After a guesser has guessed correctly, the system MUST disable further guess submission for that guesser for the remainder of the round.
- **FR-012**: The system MUST make scores visible to all players and keep them current via polling.
- **FR-013**: The system MUST preserve Group 1 & 2 behaviors (host/lobby/start/auto-advance, name validation, drawer assignment, deterministic word, drawer-only word visibility) without regression.

### Key Entities *(include if feature involves data)*

- **Guess**: One submission by a guesser within the active round — who submitted it, the (trimmed) text, and whether it matched the secret word. Part of an ordered, shared history.
- **Score**: A per-participant point total for the round, starting at 0; increases to 100 on that participant's first correct guess.
- **Canvas drawing**: The drawer's freehand strokes, shown on the drawer's screen for the round (local to the drawer; see Assumptions).
- **Guess history**: The ordered collection of all guesses in the round, shared with and synced to every player.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can draw visible strokes and clear them; a guesser is never able to draw.
- **SC-002**: 100% of empty/whitespace guesses are rejected with a message and not recorded; guesses matching the word in any casing/with surrounding spaces are recorded as correct.
- **SC-003**: A guess submitted by one player appears in every other player's history within ~2 seconds, with all players seeing the same set of guesses.
- **SC-004**: Every score starts at 0; a correct guess yields exactly 100 for that guesser (and only once), reflected on all scoreboards within ~2 seconds; incorrect guesses never change scores.
- **SC-005**: All Group 1 & 2 acceptance criteria still pass (no regression).

## Assumptions

- **Drawing is local to the drawer's screen** for this group: the canvas is interactive and clearable for the drawer, but stroke data is NOT synced to guessers (real-time/transport-heavy pixel sync is out of scope under the polling-only constraint). Guessers see the canvas area but not live strokes (confirmed in Clarifications).
- Guess **text is shown verbatim** in the shared history to all players; a correct guess therefore reveals the word in the history (consistent with how the word is revealed at round end) (confirmed in Clarifications).
- Only **guessers** submit guesses; the drawer knows the word and has no guess control.
- A guesser scores **once** for a correct guess; after a correct guess their guess input is disabled for the round and their score never changes again (confirmed in Clarifications).
- Scoring is fixed at **100 for correct, 0 otherwise**; no speed/order bonuses, no penalties (out of scope).
- This group covers a **single active round**: no round end/result reveal, restart, multiple rounds, or drawer rotation (Group 4 / explicitly out of scope).
- Work extends the Group 1–2 in-memory room model and polling; no persistence, auth, real-time transport, or new libraries (brownfield).
