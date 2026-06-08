# Feature Specification: Active Round Drawing, Guessing & Scoring

**Feature Branch**: `003-drawing-guessing-scoring`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## Clarifications

### Session 2026-06-08

- Q: Should the drawer's canvas strokes be synchronized to guessers' screens, or stay local to the drawer for this feature? → A: Drawer-local only — the canvas renders only on the drawer's screen for this slice; guessers play from the shared guess history (and word-length cue from feature 002), not a live drawing. Streaming canvas state over ~2s polling is out of scope.
- Q: When a guesser submits the correct word, should the round end immediately or continue so others can also score? → A: Continue for all guessers — the round does not end on a correct guess; every guesser can independently earn 100 (once each). Round termination (timer / all-correct) is handled by a later feature.
- Q: How should a correct guess appear in the shared history so the word does not leak to players who have not guessed it? → A: Mask the correct guess's text in the shared feed — show a "guessed the word!" indicator with the player's name, never the word text, to everyone (incorrect guesses are still shown verbatim).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guessers submit guesses and correct ones are scored (Priority: P1)

During an active round, each guessing player types a guess and submits it. The system trims the guess, rejects it if it is empty, and compares it to the round's secret word ignoring letter casing. A correct guess awards the guesser 100 points; an incorrect guess awards nothing and the guesser may keep trying. Every guess (correct or not) becomes part of a shared guess history that all players can see, so the room collectively follows the progress of the round.

**Why this priority**: This is the heart of the game loop — the moment a guesser earns points by identifying the drawer's word. Without scored guessing there is no game, only a drawing. It is the smallest slice that delivers the core "play and win" value.

**Independent Test**: Can be fully tested by starting a round with a known secret word, submitting a correct guess (matching the word in different casing and with surrounding whitespace) and confirming the guesser's score becomes 100, submitting an incorrect guess and confirming the score is unchanged, and submitting an empty/whitespace guess and confirming it is rejected.

**Acceptance Scenarios**:

1. **Given** an active round whose secret word is "apple" and a guesser with score 0, **When** the guesser submits "  Apple ", **Then** the guess is trimmed and matched case-insensitively as correct and the guesser's score becomes 100.
2. **Given** an active round and a guesser with score 0, **When** the guesser submits an incorrect guess, **Then** the guesser's score remains 0 and the guess is recorded in the history as incorrect.
3. **Given** an active round, **When** a guesser submits an empty or whitespace-only guess, **Then** the guess is rejected with a clear message and is not recorded in the history.
4. **Given** a guesser who has already guessed the word correctly this round, **When** they submit further guesses, **Then** their score does not increase beyond the single 100 awarded for the correct guess.

---

### User Story 2 - Shared guess history stays in sync for all players (Priority: P1)

As guesses are submitted, every player in the room — drawer and guessers alike — sees the same running list of guesses, kept up to date automatically. Players do not need to refresh; the history updates on its own within a couple of seconds, so everyone follows the round together.

**Why this priority**: Shared awareness of who has guessed what (and who got it right) is what makes the round feel like a live, multiplayer game rather than isolated solo attempts. It is essential to the experience and tightly coupled to the scoring slice.

**Independent Test**: Can be tested by having two players in a round, having one submit a guess, and confirming the other player's view reflects that guess (with its correct/incorrect outcome) within the expected sync interval, in the same order, without a manual refresh.

**Acceptance Scenarios**:

1. **Given** two or more players in an active round, **When** one guesser submits a guess, **Then** within the sync interval every player's guess history includes that guess.
2. **Given** several guesses submitted over time, **When** any player views the guess history, **Then** all players see the same guesses in the same chronological order.
3. **Given** a guess that was correct, **When** any player views the history, **Then** the entry is shown as correct without exposing the secret word to players who have not yet guessed it.

---

### User Story 3 - Drawer illustrates the word on a canvas (Priority: P2)

The drawer draws on a canvas to illustrate the secret word and can clear the canvas to start over. The drawing renders on the drawer's own screen as they draw, giving them a working illustration surface for the round.

**Why this priority**: The canvas is what the drawer uses to communicate the word, but the scored guessing loop (P1) can be exercised and demonstrated independently of pixel-level drawing. This story provides the drawer's illustration tool for the round.

**Independent Test**: Can be tested by acting as the drawer, drawing strokes on the canvas and confirming they render, then clearing the canvas and confirming it returns to a blank state.

**Acceptance Scenarios**:

1. **Given** an active round and the drawer's screen, **When** the drawer draws strokes on the canvas, **Then** the strokes render on the drawer's screen.
2. **Given** a canvas with existing strokes, **When** the drawer clears the canvas, **Then** the canvas returns to a blank state on the drawer's screen.

---

### Edge Cases

- **Empty or whitespace-only guess**: Rejected with a clear message; not scored and not added to the shared history.
- **Casing and surrounding whitespace differences**: "APPLE", "apple", and "  apple  " all match a secret word of "apple"; only leading/trailing whitespace is trimmed and casing is ignored.
- **Repeated correct guess by the same player**: A player can earn the 100 points for a correct guess only once per round; subsequent submissions do not add more points.
- **Drawer attempting to guess**: The drawer is illustrating the word and is not a scoring guesser for the round; the drawer's own submissions do not earn points.
- **Guess submitted when no round is active**: Guesses are only accepted while a round is in progress.
- **Multiple players guess correctly**: A correct guess does not end the round; each correct guesser is independently awarded 100 (once each), and others can keep guessing.
- **History ordering under concurrent guesses**: All players observe a single, consistent chronological order of guesses.
- **Correct guess in the shared feed**: A correct guess is shown as a masked "guessed the word!" indicator with the player's name (never the word text), so it cannot leak the answer; only incorrect guesses display their verbatim text.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept guess submissions from guessing players only while a round is in progress.
- **FR-002**: System MUST trim leading and trailing whitespace from each submitted guess before evaluating it.
- **FR-003**: System MUST reject a guess that is empty or whitespace-only (after trimming) with a clear message, and MUST NOT record it in the guess history or score it.
- **FR-004**: System MUST compare a submitted guess to the round's secret word case-insensitively (ignoring letter casing).
- **FR-005**: System MUST award exactly 100 points to a guesser for a correct guess and award 0 points (no change) for an incorrect guess.
- **FR-006**: System MUST initialize every player's score to 0 at the start of the round.
- **FR-007**: System MUST award the 100-point correct-guess bonus to a given guesser at most once per round (a player cannot accumulate points by re-submitting the correct word).
- **FR-008**: System MUST record each accepted guess (correct or incorrect) in a shared, ordered guess history visible to all players in the room.
- **FR-009**: System MUST keep the guess history synchronized across all players in the room via periodic polling, updating each player's view within the established polling interval without a manual refresh.
- **FR-010**: System MUST present the guess history in a single, consistent chronological order to every player.
- **FR-011**: System MUST indicate, for each history entry, whether the guess was correct. For a correct guess, the system MUST mask the guess text in the shared history (showing a "guessed the word!" indicator with the submitting player's name) so the secret word is never disclosed through the feed; incorrect guesses MUST be shown verbatim.
- **FR-012**: System MUST provide the drawer a canvas on which strokes drawn render on the drawer's screen.
- **FR-013**: System MUST allow the drawer to clear the canvas, returning it to a blank state.
- **FR-014**: System MUST NOT award guessing points to the drawer for the round they are drawing.
- **FR-015**: Drawing strokes MUST render on the drawer's screen and MUST NOT be synchronized to guessers' screens in this feature (the canvas is drawer-local; guesser-facing canvas sync is out of scope).
- **FR-016**: A correct guess MUST NOT end the round; the round MUST continue so that additional guessers can each still earn the 100-point correct-guess bonus (round termination is out of scope for this feature).

### Key Entities *(include if data involved)*

- **Round (active)**: The in-progress round within a room. Key attributes: the secret word, the designated drawer, the round state (in progress), and the ordered guess history. Relationship: belongs to one room; references one drawer and many guesses.
- **Guess**: A single submission by a player during the round. Key attributes: the submitting player, the (trimmed) guess text, the correctness outcome, and its position in the chronological history. In the shared feed the text is masked when the guess is correct (only the player name and a "guessed the word!" indicator are exposed). Relationship: belongs to one round and one player.
- **Player score**: A player's accumulated points for the game. Key attributes: numeric score (starts at 0), and whether the player has already guessed correctly this round. Relationship: one per player.
- **Canvas / Drawing**: The drawer's illustration surface for the round, supporting drawing strokes and a clear action.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of correct guesses (matching the word ignoring case and surrounding whitespace), the guesser's score increases by exactly 100.
- **SC-002**: In 100% of incorrect guesses, the guesser's score is unchanged.
- **SC-003**: 100% of empty or whitespace-only guesses are rejected with a clear message and never appear in the guess history.
- **SC-004**: A guess submitted by one player appears in every other player's guess history within the polling interval (≈2 seconds) without a manual refresh, in 100% of cases.
- **SC-005**: All players observe the guess history in an identical chronological order in 100% of cases.
- **SC-006**: A player who submits the correct word multiple times in a round gains at most 100 points total for that round, in 100% of cases.
- **SC-007**: The drawer can draw strokes and clear the canvas, with both actions reflected on the drawer's screen within 1 second, in 100% of attempts.
- **SC-008**: The secret word is never disclosed through the guess history to a player who has not guessed it, in 100% of cases.

## Assumptions

- This feature builds on the active round established by feature 002 (a round in progress with a designated drawer, guessers, and a deterministically selected secret word that is drawer-only). Round start, drawer selection, and word reveal are out of scope here.
- All player scores begin at 0 when the round starts; this feature defines how scores change during the round.
- "Correct" means the trimmed, case-insensitively compared guess exactly equals the secret word; partial or fuzzy matches are not considered correct.
- The shared guess history is synchronized using the existing ~2-second REST polling mechanism (no WebSockets, no new dependencies), consistent with prior features.
- The drawer illustrates the word and is not a scoring guesser; the drawer's own input does not earn guessing points.
- Each guesser may submit multiple guesses in a round; only the first correct guess earns the 100-point bonus.
- The history entry for a correct guess indicates correctness without echoing the secret word, so it cannot leak the answer to players who have not solved it.
- The canvas is drawer-local for this feature: strokes render only on the drawer's screen and are not streamed to guessers (guesser-facing canvas sync is deferred).
- A correct guess does not end the round; the round continues so every guesser can earn the bonus. Round termination (timer or all-correct) is a separate, later feature.
- Round timing, drawer rotation across rounds, end-of-game scoreboards, and undo/redo on the canvas are out of scope for this feature.
