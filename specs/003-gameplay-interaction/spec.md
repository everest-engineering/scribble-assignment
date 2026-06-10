# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Gameplay Interaction — Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Draws and Clears the Canvas (Priority: P1)

A round is active. The drawer sees a canvas on their game screen. They draw freely using a pointer
device. They can also clear the canvas at any time to start over. The drawing is always visible on
the drawer's own screen.

**Why this priority**: The canvas is the core mechanic of the game. Without the ability to draw,
no guessing is possible. This is the foundational interaction for every round.

**Independent Test**: Open a game as the drawer. Draw lines on the canvas. Verify the drawing
appears on the drawer's screen. Click "Clear" and verify the canvas is blank.

**Acceptance Scenarios**:

1. **Given** the drawer is on the game screen during an active round, **When** they draw on the
   canvas, **Then** the drawing is visible on the drawer's screen in real time.
2. **Given** the drawer has drawn on the canvas, **When** they click the clear button, **Then**
   the canvas is wiped blank.

---

### User Story 2 — Guesser Submits a Guess (Priority: P1)

A round is active. A guesser types a word in the guess input field and submits it. The system
trims whitespace, rejects empty submissions, and compares the guess case-insensitively against the
secret word. A correct guess awards 100 points to that guesser; an incorrect guess awards 0 points
(but is still recorded).

**Why this priority**: Guessing is the other half of the core gameplay loop. Without scoring,
the game has no outcome.

**Independent Test**: As a guesser, submit "  " (whitespace only) — expect rejection. Submit
"ROCKET" (uppercase) when the secret word is "rocket" — expect 100 points awarded. Submit "pizza"
when the word is "rocket" — expect 0 points, guess recorded.

**Acceptance Scenarios**:

1. **Given** a guesser submits an empty or whitespace-only guess, **When** the system processes
   it, **Then** the guess is rejected and no guess is recorded.
2. **Given** a guesser submits a guess that matches the secret word (case-insensitively), **When**
   the system processes it, **Then** the guesser's score increases by 100.
3. **Given** a guesser submits a guess that does not match the secret word, **When** the system
   processes it, **Then** the guesser's score increases by 0 and the guess is still recorded in
   the guess history.
4. **Given** a guesser submits "ROCKET" and the secret word is "rocket", **When** the comparison
   runs, **Then** it is treated as a correct guess (case-insensitive match).

---

### User Story 3 — Guess History Visible to All Players (Priority: P2)

All players — drawer and guessers — can see the full history of guesses submitted during the
round. The guess history updates for every player via polling, so no player has to refresh
manually.

**Why this priority**: Shared visibility of guesses creates the social game experience. Players
need to see what has been tried so they can refine guesses and the drawer can react. Polling
keeps all players in sync without requiring persistent connections.

**Independent Test**: Open two browser tabs (one drawer, one guesser). As the guesser, submit a
guess. Within the next polling interval, verify the guess appears in both the guesser's and the
drawer's guess history list.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** the next polling cycle completes for all players,
   **Then** the guess appears in the guess history visible to every player in the room.
2. **Given** multiple guesses have been submitted, **When** any player views the game screen,
   **Then** all submitted guesses are shown in chronological order.
3. **Given** a guess is submitted, **When** the drawer's game screen polls for updates, **Then**
   the new guess appears in the drawer's guess history without a manual refresh.

---

### Edge Cases

- What if the guesser submits only spaces? → The guess is trimmed to an empty string and rejected
  with a validation message.
- What if two guessers submit the correct answer? → Both receive 100 points; all correct guesses
  are recorded.
- What if the drawer submits a guess? → Out of scope; the drawer does not have a guess input
  field.
- What if a player's score is already > 0 and they guess correctly again? → Score increases by
  100 per correct guess (additive).
- What if the poll interval is slow and a player sees a stale guess list? → Acceptable; guess
  history is eventually consistent within the polling interval.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The canvas MUST be visible and interactive on the drawer's game screen during an
  active round.
- **FR-002**: The drawer MUST be able to clear the entire canvas with a single action.
- **FR-003**: Guessers MUST have a text input field to submit guesses during an active round.
- **FR-004**: The system MUST reject guesses that are empty or consist solely of whitespace.
- **FR-005**: Guesses MUST be compared to the secret word in a case-insensitive manner.
- **FR-006**: A correct guess MUST award exactly 100 points to the guessing player.
- **FR-007**: An incorrect guess MUST award 0 additional points to the guessing player but MUST
  still be recorded in the guess history.
- **FR-008**: All submitted guesses (correct and incorrect) MUST be recorded in a per-round
  guess history.
- **FR-009**: The guess history MUST be synced to all players in the room via polling.
- **FR-010**: All players' scores start at 0 at the beginning of each round.

### Key Entities

- **Guess**: belongs to a Round; has `participantId`, `text` (trimmed), `isCorrect` (boolean),
  and `submittedAt` timestamp.
- **Score**: per participant per round; starts at 0; incremented by 100 on each correct guess.
- **Canvas State**: the current drawing on the canvas; owned by the round; clearable by the
  drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of empty or whitespace-only guess submissions are rejected — verifiable by
  attempting to submit blank inputs and confirming no guess is recorded.
- **SC-002**: Correct guesses always award exactly 100 points — verifiable by checking the
  player's score before and after a correct guess.
- **SC-003**: Guess history updates for all players within the polling interval (≤ 3 seconds
  after submission) — verifiable by measuring time between submission and appearance on a
  second player's screen.
- **SC-004**: The canvas clear action removes all drawn content instantly from the drawer's screen.
- **SC-005**: Case-insensitive comparison succeeds for at least these variants: uppercase,
  lowercase, mixed-case — verifiable by submitting the word in each form.

## Assumptions

- Only the drawer can draw on the canvas; guessers have view-only canvas access (canvas visibility
  for guessers is out of scope for this feature — guessers see the canvas but cannot interact with
  it).
- The canvas does not sync to guessers in real time in this feature — syncing canvas state to
  guessers is a separate concern (out of scope here).
- A single guesser can submit multiple guesses, and each correct guess awards 100 points
  additively.
- The drawer does not have a guess input; only participants with the `guesser` role can guess.
- Scores persist for the duration of the round (in-memory); no cross-round persistence is needed.
- The polling interval for guess history sync is ≤ 3 seconds (matches existing room polling).
- All scores start at 0 when the round begins; there is no carry-over from a prior round.
