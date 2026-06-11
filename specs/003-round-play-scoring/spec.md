# Feature Specification: Round Play and Scoring

**Feature Branch**: `003-round-play-scoring`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "During an active round, all players start with a score of 0. The assigned drawer can draw and clear the canvas, with drawing updates reflected on the drawer's view and persisted as the current round state. Guessers can submit guesses, which are trimmed, validated, and rejected if empty. Valid guesses are compared to the secret word case-insensitively. Guess activity and history are synchronized across all players through polling, keeping clients in sync. A correct guess awards 100 points to the guessing player, while incorrect guesses do not affect scores."

## Clarifications

### Session 2026-06-10

- Q: How many correct-guess awards can be earned in one round? → A: Each guesser can earn 100 points once per round for their first correct guess.
- Q: Can new players join after a round is already active? → A: No new players may join an already-active round; only existing participants can continue polling or reconnect.
- Q: Which drawing tools are in scope for this feature? → A: Freehand drawing with colors and stroke sizes plus clear.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Draw and Clear During the Round (Priority: P1)

The assigned drawer can create freehand drawing marks with selected colors and
stroke sizes during an active round, then clear the canvas when needed. The
current canvas state remains part of the round so players continue seeing the
latest drawing after normal refreshes.

**Why this priority**: The core gameplay loop cannot function unless the drawer
can create and reset the visual prompt for guessers.

**Independent Test**: Start an active round as the assigned drawer, draw several
freehand marks using different colors and stroke sizes, refresh the room state,
and confirm the drawer still sees the current canvas state. Clear the canvas and
confirm the current round state becomes blank.

**Acceptance Scenarios**:

1. **Given** an active round and the viewer is the assigned drawer, **When** the
   drawer adds freehand drawing marks with selected color and stroke size,
   **Then** the marks are reflected in the drawer's view and saved as the current
   round canvas state.
2. **Given** an active round with existing drawing marks, **When** the assigned
   drawer clears the canvas, **Then** the current round canvas state becomes
   blank.
3. **Given** drawing marks were saved during an active round, **When** room state
   refreshes through normal polling, **Then** players receive the latest current
   round canvas state.

---

### User Story 2 - Submit and Validate Guesses (Priority: P1)

Guessers can submit guesses during an active round. Guesses are cleaned before
evaluation, empty guesses are rejected with clear feedback, and valid guesses are
compared to the secret word without regard to letter casing.

**Why this priority**: Guessing is the primary interaction for non-drawers and
must be fair, predictable, and resistant to accidental whitespace or casing
differences.

**Independent Test**: Submit guesses with leading/trailing whitespace, different
letter casing, empty input, and incorrect wording. Confirm empty guesses are
rejected, valid guesses are recorded, and case-insensitive correct guesses are
recognized.

**Acceptance Scenarios**:

1. **Given** a guesser enters a guess with leading or trailing whitespace,
   **When** the guess is submitted, **Then** the system evaluates and records the
   trimmed guess.
2. **Given** a guesser enters an empty or whitespace-only guess, **When** the
   guess is submitted, **Then** the guess is rejected with clear feedback and is
   not added to guess history.
3. **Given** a guesser's trimmed guess matches the secret word with different
   letter casing, **When** the guess is submitted, **Then** the guess is treated
   as correct.
4. **Given** a guesser's trimmed guess does not match the secret word, **When**
   the guess is submitted, **Then** the guess is treated as incorrect and still
   appears in guess history.

---

### User Story 3 - Sync Scores and Guess History (Priority: P1)

All players begin the active round with score 0. Correct guesses award 100 points
to the guessing player, incorrect guesses do not change scores, and guess
activity plus score changes are synchronized to every player through polling.
The active-round roster is fixed once the round begins, so late joiners cannot
enter the round while existing participants can continue polling or reconnecting.

**Why this priority**: Players need shared confidence that scores and guess
history are current and fair across clients.

**Independent Test**: Start an active round with one drawer and at least one
guesser. Submit one incorrect guess and one correct guess, then confirm all
players see the same guess history and scoreboard after polling.

**Acceptance Scenarios**:

1. **Given** an active round has just begun, **When** players view the scoreboard,
   **Then** every player has a score of 0.
2. **Given** a guesser submits an incorrect valid guess, **When** the guess is
   recorded, **Then** the guesser's score remains unchanged.
3. **Given** a guesser submits a correct valid guess for the first time in the
   round, **When** the guess is recorded, **Then** that guesser receives 100
   points.
4. **Given** guess activity or scores change during an active round, **When**
   players' clients poll for room state, **Then** all players see the same guess
   history and scores.
5. **Given** a new player attempts to join a room with an already-active round,
   **When** the join is submitted, **Then** the join is rejected with clear
   feedback and the active-round roster, scores, and history remain unchanged.

### Edge Cases

- Empty or whitespace-only guesses are rejected with a clear message and are not
  recorded.
- Guesses with leading or trailing spaces are trimmed before recording and
  comparison.
- Guesses that differ from the secret word only by letter casing are treated as
  correct.
- The assigned drawer cannot submit scoring guesses for their own round.
- A guesser can receive the 100-point correct-guess award at most once per
  round; later correct guesses from the same player are recorded without adding
  more points.
- Incorrect guesses never subtract points or alter any player's score.
- Clearing the canvas removes all current drawing marks, regardless of color or
  stroke size, but does not remove guess history or scores.
- New players cannot join an already-active round; existing participants can
  continue polling or reconnecting without changing the active-round roster.
- Temporary polling failures do not erase the current canvas, guess history, or
  scores from the shared round state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST initialize every active round participant's score to 0
  when round play begins.
- **FR-002**: System MUST prevent new players from joining a room once its round
  is active, while allowing existing participants to continue polling or
  reconnecting.
- **FR-003**: System MUST allow only the assigned drawer to add freehand drawing
  marks to the active round canvas state.
- **FR-004**: System MUST allow only the assigned drawer to clear the active
  round canvas state.
- **FR-005**: System MUST allow the assigned drawer to choose drawing colors and
  stroke sizes for freehand drawing marks.
- **FR-006**: System MUST persist drawing marks, including their colors and
  stroke sizes, and clear actions as the current canvas state for the active
  round.
- **FR-007**: System MUST include the current canvas state in polled round state
  so players can stay synchronized.
- **FR-008**: System MUST allow only guessers to submit guesses during the active
  round.
- **FR-009**: System MUST trim leading and trailing whitespace from submitted
  guesses before validation, comparison, and history display.
- **FR-010**: System MUST reject empty or whitespace-only guesses with clear
  user-facing feedback and prevent them from being recorded.
- **FR-011**: System MUST compare valid guesses to the secret word
  case-insensitively.
- **FR-012**: System MUST record valid incorrect guesses in guess history without
  changing any score.
- **FR-013**: System MUST record valid correct guesses in guess history and award
  100 points to the guessing player when it is that player's first correct guess
  in the round.
- **FR-014**: System MUST prevent repeat correct guesses by the same player in
  the same round from awarding additional points.
- **FR-015**: System MUST synchronize guess history and scores to all players
  through polling.
- **FR-016**: System MUST keep canvas state, guess history, and scores isolated
  to the active room and round.
- **FR-017**: System MUST preserve guess history and scores when the drawer
  clears the canvas.

### Constitution Constraints *(mandatory)*

- **CC-001**: Feature MUST use TypeScript and ES Modules in both `frontend/` and `backend/`.
- **CC-002**: Feature MUST use HTTP REST requests and polling for synchronization.
- **CC-003**: Feature MUST keep all room/game state in memory only; databases and persistent storage are out of scope.
- **CC-004**: Feature MUST NOT add WebSockets, Socket.io, server-sent events, authentication, sessions, JWT, OAuth, deployment, Docker, or unrelated dependencies.
- **CC-005**: Backend request and response boundaries MUST use Zod validation.

### Key Entities *(include if feature involves data)*

- **Active Round**: The current playable drawing round for a room. It has one
  assigned drawer, a secret word, a canvas state, guess history, and player
  scores. Its player roster is fixed once the round begins.
- **Player Score**: A player's score for the active round. Each player starts at
  0, and a first correct guess awards 100 points.
- **Canvas State**: The saved drawing state for the active round. It can contain
  freehand drawing marks with colors and stroke sizes, or be blank after the
  drawer clears it.
- **Drawing Mark**: A unit of freehand drawing activity added by the assigned
  drawer and reflected in the current canvas state. It includes the selected
  color and stroke size.
- **Guess**: A trimmed, non-empty submission from a guesser. It records the
  guesser, display text, correctness, and submission order.
- **Guess History**: Ordered list of valid guesses visible to players during the
  active round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested active-round starts, all players begin with a
  score of 0.
- **SC-002**: In 100% of tested active-round join attempts, new players are
  rejected with clear feedback while existing participants can continue polling
  or reconnecting.
- **SC-003**: In 100% of tested drawer sessions, freehand drawing with selected
  colors and stroke sizes plus clear actions update the current canvas state and
  remain visible after normal state refresh.
- **SC-004**: In 100% of tested guess submissions, empty or whitespace-only
  guesses are rejected with clear feedback and are not added to history.
- **SC-005**: In 100% of tested case variations, guesses matching the secret word
  only by different letter casing are treated as correct.
- **SC-006**: In 100% of tested scoring scenarios, a first correct guess awards
  exactly 100 points and incorrect guesses award 0 points.
- **SC-007**: In 100% of tested repeat-correct scenarios, the same guesser cannot
  earn more than one 100-point award in the same round.
- **SC-008**: Under normal local conditions, all players see updated canvas
  state, guess history, and scores within 3 seconds after polling.

## Assumptions

- This feature begins after the round start setup feature has created an active
  round with an assigned drawer and secret word.
- The active-round roster is fixed when the round begins; spectator mode and
  late-player entry are out of scope.
- A player who is not the assigned drawer is a guesser for this feature.
- Drawing input is represented as saved canvas state suitable for freehand
  drawing with color and stroke-size controls; undo, shape tools, fill tools,
  erasers, and other advanced drawing tools are out of scope.
- This feature covers active-round drawing, clearing, guessing, guess history,
  and scoring only; timers, round completion, later-round rotation, final
  results, and room cleanup are out of scope.
