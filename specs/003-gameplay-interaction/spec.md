# Feature Specification: Gameplay Interaction

**Feature Branch**: `assignment`

**Created**: 2026-05-28

**Status**: Draft

**Feature Directory**: `specs/003-gameplay-interaction`

---

## Overview

Once a round is active, the drawer uses an interactive canvas to draw the secret
word. Guessers submit text guesses that are trimmed, case-insensitively compared
to the secret word, and validated (empty guesses rejected). All guesses are stored
on the room and synced to every player via polling. Correct guesses score 100
points; incorrect guesses score 0. All scores start at 0.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawing Canvas (Priority: P1)

The drawer can draw freehand on an interactive canvas. A Clear button wipes the
canvas back to blank. Guessers see the canvas area (drawing sync is out of scope
— guessers see a static placeholder, drawer draws locally).

**Why this priority**: The canvas is the core of the game for the drawer. Without
it the drawing experience is broken.

**Independent Test**: Start a game as host (drawer). Confirm the canvas is
interactive — mouse/touch draws lines. Click Clear — canvas returns to blank.

**Acceptance Scenarios**:

1. **Given** the game is in `"playing"` status and the viewer is the drawer,
   **When** the game screen loads, **Then** an interactive canvas element is
   displayed (not a placeholder div).

2. **Given** the drawer has drawn some lines on the canvas, **When** they click
   the Clear Canvas button, **Then** the canvas is wiped back to a blank white
   surface.

3. **Given** the viewer is a guesser, **When** the game screen loads, **Then**
   a non-interactive canvas placeholder is shown (drawing sync is out of scope).

---

### User Story 2 — Guess Submission (Priority: P1)

Guessers type a guess and submit it. The guess is trimmed and validated — empty
guesses are rejected with a message. The guess is compared case-insensitively to
the secret word and stored on the room with a correct/incorrect result.

**Why this priority**: Guess submission is the core interaction for guessers and
the trigger for scoring. Nothing in Group 4 works without it.

**Independent Test**: As a guesser, submit "ROCKET" → should be marked correct.
Submit "pizza" → marked incorrect. Submit empty/spaces → error "Guess cannot be
empty", not submitted.

**Acceptance Scenarios**:

1. **Given** a guesser is on the game screen, **When** they submit a non-empty
   guess, **Then** the guess is stored on the room with the guesser's participant
   id, the text (trimmed), a timestamp, and a `correct` boolean.

2. **Given** a guesser submits "ROCKET" (case-insensitive match to "rocket"),
   **When** the guess is evaluated, **Then** `correct` is `true` and the
   guesser's score increases by 100.

3. **Given** a guesser submits "pizza" (no match), **When** the guess is
   evaluated, **Then** `correct` is `false` and the guesser's score increases
   by 0.

4. **Given** a guesser submits an empty or whitespace-only guess, **When** they
   click Submit Guess, **Then** the form shows "Guess cannot be empty" and no
   API call is made.

5. **Given** a guesser has already submitted a correct guess, **When** they
   submit another guess, **Then** the additional guess is still accepted and
   stored (no lock-out required for this lab).

---

### User Story 3 — Synced Guess History (Priority: P1)

All players (drawer and guessers) see the full guess history via polling. The
list updates automatically every ~2 seconds. Each entry shows the guesser's name,
their guess text, and whether it was correct.

**Why this priority**: Without synced history, neither the drawer nor other
guessers can see what has been tried. Scoring also depends on history being
consistent across clients.

**Independent Test**: Tab 1 (drawer) and Tab 2 (guesser). Tab 2 submits a guess.
Within 3 seconds, Tab 1's guess history shows the new entry with the guesser's
name and result.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** all players' next poll fires,
   **Then** the new guess appears in the guess history panel for all players
   within approximately 2 seconds.

2. **Given** multiple guesses have been submitted, **When** any player views
   the guess history, **Then** all guesses are shown in submission order with
   guesser name, guess text, and correct/incorrect indicator.

3. **Given** a player is on the game screen, **When** they navigate away,
   **Then** game-screen polling stops.

---

### User Story 4 — Scoreboard (Priority: P2)

All players see a live scoreboard showing each participant's current score. Scores
update via the same polling cycle as guess history. All scores start at 0.

**Why this priority**: Scores provide feedback on progress and are required for
the result screen in Group 4.

**Independent Test**: Start game. Scoreboard shows all players at 0. Guesser
submits a correct guess. Within 3 seconds scoreboard shows guesser at 100.

**Acceptance Scenarios**:

1. **Given** the game starts, **When** any player views the scoreboard,
   **Then** all participants are listed with score 0.

2. **Given** a guesser submits a correct guess (100 points), **When** the next
   poll fires, **Then** the scoreboard reflects the updated score for that
   guesser.

---

### Edge Cases

- Empty/whitespace-only guess: rejected client-side with "Guess cannot be empty"; no API call.
- Case-insensitive comparison: "ROCKET", "Rocket", "rocket" all match.
- Drawer submitting a guess: the guess form is not shown to the drawer (from Group 2); drawer cannot submit.
- Multiple correct guesses from same player: all stored, score accumulates (no cap for this lab).
- Canvas interaction only available to drawer; guesser sees static placeholder.
- Poll errors on game screen are non-fatal; history retains last known state.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The room model MUST store a `guesses` array and a `scores` map
  (participantId → number, initialised to 0 for all participants on game start).
- **FR-002**: `POST /rooms/:code/guess` MUST accept `{ participantId, text }`,
  trim the text, reject empty with 400, compare case-insensitively to
  `secretWord`, store the guess with `correct` boolean, and update the score.
- **FR-003**: A correct guess MUST add exactly 100 to the guesser's score; an
  incorrect guess MUST add 0.
- **FR-004**: `GET /rooms/:code` MUST return `guesses[]` and `scores` in the
  room snapshot for all viewers.
- **FR-005**: The game screen MUST poll `GET /rooms/:code` every ~2 seconds to
  sync guess history and scores (reusing the same polling mechanism as the lobby).
- **FR-006**: The guess history panel MUST display each guess with guesser name,
  guess text, and a correct/incorrect indicator for all players.
- **FR-007**: The scoreboard MUST display all participants with their current
  score, updated each poll cycle.
- **FR-008**: The drawer's game screen MUST include an interactive HTML canvas
  element with freehand drawing support (mouse events).
- **FR-009**: A Clear Canvas button MUST wipe the canvas back to blank white.
- **FR-010**: The guess form MUST NOT be shown to the drawer; the canvas MUST
  NOT be interactive for guessers.

### Key Entities

- **Guess**: participantId, text (trimmed), correct (boolean), submittedAt (ISO timestamp).
- **Room** (extended): adds `guesses: Guess[]` (empty on start) and
  `scores: Record<participantId, number>` (all 0 on start).
- **RoomSnapshot** (extended): adds `guesses` and `scores` fields, visible to
  all players.

---

## Success Criteria *(mandatory)*

- **SC-001**: The drawer can draw freehand and clear the canvas without page
  reload or errors.
- **SC-002**: A guesser submitting "ROCKET" sees a correct result; submitting
  "pizza" sees an incorrect result; submitting empty text sees "Guess cannot be
  empty" with no submission.
- **SC-003**: Both players see the same guess history within 3 seconds of any
  guess being submitted, without any manual refresh.
- **SC-004**: The scoreboard shows 0 for all players at game start; after a
  correct guess it shows 100 for the correct guesser within 3 seconds.
- **SC-005**: Navigating away from the game screen stops all polling.

---

## Assumptions

- Drawing is local-only for the drawer — no canvas sync to guessers (WebSockets
  are out of scope). Guessers see a static placeholder.
- Canvas uses HTML5 Canvas API with mouse events (mousedown, mousemove, mouseup).
  Touch events are out of scope.
- The guess endpoint is `POST /rooms/:code/guess` — a new endpoint not in the
  starter.
- Scores are stored in a `Record<string, number>` on the Room, keyed by
  `participantId`, initialised to 0 for all participants when `startGame` fires.
- There is no lock-out after a correct guess — guessers can keep submitting.
- The drawer cannot submit guesses (UI-enforced from Group 2: guess form hidden
  for drawer).
- Guess history and scores are included in every `GET /rooms/:code` response
  regardless of viewer role.
