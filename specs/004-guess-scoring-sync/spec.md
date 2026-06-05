# Feature Specification: Guess Submission, Scoring, and History Sync

**Feature Branch**: `004-guess-scoring-sync`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Uses the Canvas (Priority: P1)

The drawer sees a live drawing canvas on the game screen. They can draw freely by clicking and dragging. A "Clear" button resets the canvas to a blank state. No other player sees the canvas — guessers see a static placeholder while the drawer works. The canvas is purely local (not synced to guessers) for this feature.

**Why this priority**: The drawing mechanic is the core input for the game. Without a functional canvas, the drawer has no way to communicate the secret word to guessers. This is the foundational action of every round.

**Independent Test**: Two tabs open. Tab A (drawer) sees a canvas that responds to mouse draw events and has a Clear button. Drawing on Tab A is visible only on Tab A. Tab B (guesser) still shows the waiting placeholder — the canvas content is not transferred. Clearing the canvas on Tab A removes all strokes.

**Acceptance Scenarios**:

1. **Given** an active game with the player identified as the drawer, **When** the game screen loads, **Then** a drawable canvas is displayed to the drawer — replacing the word-card area with a canvas the drawer can interact with.
2. **Given** the drawer has drawn strokes on the canvas, **When** the drawer presses the "Clear Canvas" button, **Then** all strokes are erased and the canvas returns to a blank white state.
3. **Given** a guesser's game screen is displayed, **When** the guesser views the main canvas area, **Then** they see a static placeholder ("Waiting for drawer to draw…") — the drawer's canvas content is not visible to guessers.

---

### User Story 2 — Guessers Submit Guesses (Priority: P1)

A guesser types a word into the guess form and submits it. The system trims whitespace from both ends and rejects empty or whitespace-only input with a clear inline message. The guess is compared to the secret word case-insensitively. If correct, the guesser scores 100 points for the round; if incorrect, the score does not change (0 points added).

**Why this priority**: Guess submission is the primary guesser action. Without it, guessers cannot participate. Validation is essential to prevent silent empty submissions.

**Independent Test**: Tab B (guesser) submits "  Rocket  " when the secret word is "rocket". After submission the form clears, the guess appears in the activity panel marked correct, and the guesser's score on the scoreboard increases to 100. Then Tab B submits "   " (whitespace-only) — the form does not submit and shows an error: "Please enter a guess."

**Acceptance Scenarios**:

1. **Given** a guesser is on the game screen, **When** they submit a guess with leading/trailing whitespace (e.g., "  rocket  "), **Then** the whitespace is trimmed before comparison and the guess is treated as "rocket".
2. **Given** a guesser types only whitespace or leaves the field empty, **When** they press Submit, **Then** the submission is rejected and an inline error message "Please enter a guess." is shown — no API call is made.
3. **Given** a guesser submits a guess that matches the secret word (case-insensitively), **When** the result is received, **Then** the guess is marked correct and the guesser's score increases by 100.
4. **Given** a guesser submits a guess that does not match the secret word, **When** the result is received, **Then** the guess is marked incorrect and the guesser's score does not change.
5. **Given** the viewer is the drawer, **When** they view the game screen, **Then** the guess form is not displayed — only guessers can submit guesses.

---

### User Story 3 — Guess History and Scores Sync to All Players (Priority: P2)

All players — drawer and guessers alike — see the guess history in the Activity panel and the live scoreboard. Both panels refresh automatically every 2 seconds by polling the room state from the server. The scoreboard lists every participant with their current score. The Activity panel lists each guess in order, showing the guesser's name, their guess text, and whether it was correct or incorrect.

**Why this priority**: Shared visibility of guesses and scores is what makes the game feel live and fair. It is not required for the core submit-and-score mechanic (Story 2), but it completes the social loop and is required for all players to track progress.

**Independent Test**: Tab A (drawer) and Tab B (guesser) both have the game screen open. Tab B submits a correct guess. Within 2 seconds (next poll), Tab A's Activity panel shows the new guess and Tab A's Scoreboard shows Tab B's score updated to 100.

**Acceptance Scenarios**:

1. **Given** an active game, **When** any player's game screen is open, **Then** the scoreboard and activity panel are automatically refreshed approximately every 2 seconds without any user action.
2. **Given** a guesser has submitted a correct guess, **When** the next poll completes, **Then** all players see the updated score on the scoreboard and the correct guess in the activity panel.
3. **Given** multiple guesses have been submitted, **When** the activity panel updates, **Then** guesses are listed in submission order (oldest first), each showing the guesser's name, the guess text, and a correct/incorrect indicator.
4. **Given** all participants start the round with 0 points, **When** the scoreboard is first displayed, **Then** every participant is shown with a score of 0.

---

### Edge Cases

- What if a guesser submits the same word multiple times? Each submission is recorded independently; subsequent correct guesses still award 100 points each (no de-duplication in this feature).
- What if the guesser's name cannot be found (e.g., data inconsistency)? The Activity panel shows "Unknown player" as a fallback.
- What happens if the polling request fails (e.g., server unreachable)? The existing error state in the store handles this; the panel shows the last known state without crashing.
- Can the drawer submit guesses? No — the guess form is not rendered for the drawer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render an interactive drawing canvas in the main content area for the drawer on the game screen.
- **FR-002**: System MUST provide a "Clear Canvas" button that resets the canvas to a blank state when pressed.
- **FR-003**: System MUST NOT sync canvas drawing data to other participants — the canvas is local to the drawer's screen.
- **FR-004**: System MUST render a guess submission form for guessers only; the form MUST NOT appear for the drawer.
- **FR-005**: System MUST reject empty or whitespace-only guess submissions client-side before any API call, displaying "Please enter a guess."
- **FR-006**: System MUST trim leading and trailing whitespace from a guess before sending it to the server.
- **FR-007**: System MUST compare the submitted guess to the secret word case-insensitively on the server.
- **FR-008**: System MUST award 100 points to a guesser for a correct guess; incorrect guesses add 0 points.
- **FR-009**: System MUST store each submitted guess (trimmed text, guesser ID, correctness, timestamp) on the server in memory.
- **FR-010**: System MUST expose the current guess history and participant scores through the existing room polling endpoint so clients can retrieve them.
- **FR-011**: Frontend MUST poll for updated room state (including guesses and scores) approximately every 2 seconds while the game screen is active.
- **FR-012**: System MUST display the guess history in the Activity panel for all players, ordered by submission time (oldest first), showing guesser name, guess text, and correct/incorrect status.
- **FR-013**: System MUST display each participant's current score in the Scoreboard, starting at 0.

### Key Entities *(include if feature involves data)*

- **Guess**: A single guess attempt submitted by a guesser. Attributes: unique ID, guesser participant ID, submitted text (trimmed), correctness flag, submission timestamp.
- **Score**: Computed per participant from accumulated correct guesses (each correct guess = 100 points). Not stored separately — derived from the guess list.
- **Room** (extended): The existing Room entity gains a `guesses` list to hold all guess attempts for the active round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All guesses submitted with only whitespace are rejected before reaching the server — 0% of empty guesses appear in the server-side guess history.
- **SC-002**: Correct guess detection is 100% accurate — every case-insensitive match of the secret word is scored as correct, and every non-match is scored 0.
- **SC-003**: All players see the same guess history and scores within 2 seconds of a guess being submitted — cross-tab consistency is verifiable by manual two-tab testing.
- **SC-004**: Scores shown in the Scoreboard match the number of correct guesses × 100 for each participant — no score discrepancy between players' views.
- **SC-005**: The drawer's canvas responds to mouse interaction (draw and clear) with no visible delay — drawing feels immediate on the drawer's screen.

## Assumptions

- The secret word used for comparison is always the first word in the starter list (`availableWords[0]`) — already established in feature 003.
- All guesses are stored in the server's in-memory `Room` object and are lost if the server restarts — no persistence layer exists or is needed.
- A guesser may submit multiple guesses; each is recorded separately and each correct guess awards 100 points independently. No de-duplication or "one correct guess per guesser" rule is applied in this feature.
- Polling uses the existing `GET /rooms/:code` endpoint; guesses and computed scores are included in the `RoomSnapshot` returned by that endpoint.
- The canvas is rendered using the browser's native HTML5 Canvas API — no third-party drawing library is introduced.
- The game screen is already reached only via valid room state (per feature 003); no additional navigation guarding is needed here.
- Guessers and the drawer are already identified by `participantId` stored in the frontend `RoomStore` — no new session or auth mechanism is required.
