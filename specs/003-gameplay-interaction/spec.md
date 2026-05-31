# Feature Specification: Gameplay Interaction

**Feature Branch**: `feat/scribble-spec-kit`
**Created**: 2026-05-31
**Status**: Draft
**Input**: User description: "Gameplay interaction. A round is active with a drawer and guessers; all participant scores start at 0. The drawer draws on an interactive canvas and can clear it — the drawing is local to the drawer's screen and is NOT transmitted to guessers (no image sync). Guessers submit guesses: each guess is trimmed, empty guesses are rejected with a message, and the guess is compared case-insensitively against the secret word. The full guess history (who guessed what, and whether it was correct) is stored on the room and synced to all players via the existing ~2s polling. Scoring is deterministic: a correct guess awards 100 points to that guesser, an incorrect guess awards 0. Name validation and the deterministic secret word are inherited from scenarios 1 and 2 — reference them, don't re-specify."

**Prerequisites**: Player name validation is fully specified in `specs/001-room-setup-lobby/spec.md`
(FR-001, FR-014). The deterministic secret word selection is fully specified in
`specs/002-game-start-drawer/spec.md` (FR-002, FR-003, FR-004). This spec does not re-specify
those behaviors.

## Clarifications

### Session 2026-05-31

- Q: When the room transitions to "ended", what does the game screen show before Scenario 4 takes over? → A: Show a "round ended" / "game over" banner on the game screen; keep the guess history and scores visible; hide the guess submission form. No redirect occurs — Scenario 4 layers a richer result view on top of this state.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Guesser Submits a Guess and Receives Feedback (Priority: P1)

A non-drawer participant types a word and submits it as their guess. The system trims the input,
rejects empty submissions with a clear message, and compares the guess case-insensitively against
the secret word. A correct guess awards 100 points to the guesser and transitions the game to
"ended". An incorrect guess awards 0 points and the game continues. Every accepted guess —
correct or incorrect — is appended to the room's ordered guess history and becomes visible to all
participants within the next poll cycle.

**Why this priority**: Guess submission is the single interactive act that drives the game
forward. Without it, guessers have no role and the game cannot reach a conclusion. All other
behaviors in this scenario depend on guesses being accepted, compared, and scored.

**Independent Test**: Open two browser tabs. Tab A (host/Alice) creates a room; Tab B (Bob)
joins. Alice starts the game. In Tab B (Bob, guesser): type a wrong word and submit — confirm
the guess appears in both tabs' history within ~2 seconds and Bob's score remains 0. Then type
the correct word and submit — confirm 100 points are awarded to Bob, the guess is marked correct,
and the game status appears as ended in both tabs within ~2 seconds.

**Acceptance Scenarios**:

1. **Given** the game is active, **When** a guesser submits a non-empty guess that does not
   match the secret word, **Then** the guess is recorded as incorrect, 0 points are awarded
   to the guesser, and the guess appears in the history for all participants.
2. **Given** the game is active, **When** a guesser submits a guess that matches the secret
   word (case-insensitively, after trimming), **Then** the guess is recorded as correct,
   100 points are awarded to the guesser, and the game transitions to "ended".
3. **Given** the game is active, **When** a guesser submits an empty or whitespace-only guess,
   **Then** the submission is rejected with a clear, user-visible error message and no guess
   is recorded.
4. **Given** the game is active, **When** a guesser submits the correct word with different
   casing or surrounding whitespace, **Then** it is treated as a correct guess identical to
   an exact match.
5. **Given** the game has transitioned to "ended", **When** any participant attempts to submit
   a guess, **Then** the submission is rejected and no further guesses are recorded.
6. **Given** the game has transitioned to "ended", **When** all participants' screens next
   refresh, **Then** a "round ended" banner is displayed, the guess history and scores remain
   visible, and the guess submission form is hidden.

---

### User Story 2 — Drawer Uses the Local Canvas (Priority: P1)

The drawer sees an interactive drawing canvas on their game screen. They can draw freely with a
pointer and clear the canvas at any point. The canvas is purely local — no drawing data is
transmitted to guessers or stored on the server. The drawer also sees the full guess history and
scores so they know whether guessers are making progress.

**Why this priority**: The canvas is the drawer's only meaningful interaction during the round.
Without it the drawer role is passive and the product does not match the drawing-game format. It
is independently testable in the drawer's browser tab without requiring guess interaction.

**Independent Test**: Start a game (two tabs minimum). On Tab A (drawer/Alice): confirm a
drawing canvas is visible; draw strokes with the pointer — confirm strokes appear on screen;
click the clear control — confirm all strokes are removed and the canvas is blank. On Tab B
(guesser/Bob): confirm no canvas, no strokes, and no drawing-related content appears at any
point during the round.

**Acceptance Scenarios**:

1. **Given** the game is active and the viewer is the drawer, **When** they view the game
   screen, **Then** an interactive drawing canvas is visible with a clear control.
2. **Given** the drawer has drawn strokes on the canvas, **When** they activate the clear
   control, **Then** all strokes are removed and the canvas returns to a blank state.
3. **Given** the drawer draws on their canvas, **When** a guesser views their game screen,
   **Then** no representation of the drawing appears — the guesser's screen contains no canvas
   or stroke data.

---

### User Story 3 — All Participants See Guess History and Running Scores (Priority: P2)

All participants — drawer and guessers alike — see a live, ordered list of every guess submitted
so far, along with each participant's current score. The list and scores update automatically
without a page refresh, driven by the existing polling cadence.

**Why this priority**: Shared awareness of guesses and scores is what makes the experience
social. Without it, participants cannot follow the game's progress. This is P2 because the
core guess and scoring mechanics (US1) must be working before display completeness matters.

**Independent Test**: With Tab A (drawer) and Tab B (guesser) both on the game screen: Bob
submits an incorrect guess. Within ~2 seconds both tabs display the entry (Bob's name, the
guessed word, incorrect indicator) and Bob's score remains 0. Bob submits the correct guess.
Within ~2 seconds both tabs show the correct guess entry and Bob's score updated to 100.

**Acceptance Scenarios**:

1. **Given** a guess is submitted, **When** all participants' screens next refresh (within
   ~2 seconds), **Then** the new guess entry appears in the ordered guess history for every
   participant.
2. **Given** a correct guess is submitted, **When** all participants view the scores section,
   **Then** the guesser's score reflects 100 points and all other scores are unchanged.
3. **Given** multiple guesses have been submitted, **When** any participant views the history,
   **Then** guesses appear in submission order, each showing the guesser's name, the guessed
   text, and a correct/incorrect indicator.
4. **Given** the game is active, **When** the drawer views the game screen, **Then** they see
   the same guess history and score display as guessers (but without a guess submission form).

---

### Edge Cases

- What if a guesser submits the same wrong word multiple times? → Each submission is a
  separate guess entry with 0 points. No deduplication is enforced; repeat guesses are allowed.
- What if two guessers submit the correct word at nearly the same time? → The server processes
  requests sequentially; the first one received marks the game "ended" and earns 100 points.
  The second submission is rejected because the room is no longer "active".
- Can the drawer submit a guess? → No. The guess form is absent from the drawer's screen.
  Any direct attempt to submit from the drawer's participant ID is rejected by the server.
- What happens after the game ends? → The room transitions to "ended"; all guess submissions
  are rejected. The game screen displays a "round ended" banner, keeps the guess history and
  scores visible, and hides the guess submission form. No automatic redirect occurs in this
  scenario — Scenario 4 (result/restart) adds the richer result view.
- What is the drawer's score? → Initialized to 0 at game start and remains 0 for the round.
  It is still shown in the scores list. Drawer scoring is out of scope per the constitution.
- What if the canvas has many strokes and the clear button is clicked? → All strokes are
  removed instantly on the drawer's local screen; no server interaction is involved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow any non-drawer participant to submit a guess when the room
  status is "active".
- **FR-002**: The system MUST trim leading and trailing whitespace from every submitted guess
  before processing.
- **FR-003**: The system MUST reject a guess that is empty or whitespace-only after trimming
  and MUST return a clear, user-visible error message to the submitter.
- **FR-004**: Guess comparison MUST be case-insensitive: a guess that matches the secret word
  after trimming and lowercasing is treated as correct regardless of the original casing.
- **FR-005**: A correct guess MUST award exactly 100 points to the guessing participant. All
  other participants' scores MUST remain unchanged.
- **FR-006**: An incorrect guess MUST award 0 points — the guesser's score is unchanged.
- **FR-007**: Every accepted guess (correct or incorrect) MUST be appended to the room's
  ordered guess history, recording at minimum: the guesser's participant ID, the guesser's
  display name, the trimmed guess text, and whether the guess was correct.
- **FR-008**: The first correct guess MUST transition the room status from "active" to "ended".
  No subsequent guesses are accepted once the room is "ended".
- **FR-009**: The system MUST reject any guess submission when the room status is not "active",
  with a clear error response.
- **FR-010**: The system MUST reject any guess submission where the submitter is the drawer,
  with a clear error response.
- **FR-011**: The guess history and all participant scores MUST be included in the room snapshot
  returned by the existing polling endpoint and visible to all participants (drawer and guessers).
- **FR-012**: All participant scores MUST be initialized to 0 when the room transitions to
  "active" status.
- **FR-013**: The game screen MUST display a drawing canvas to the drawer, with a control to
  clear all strokes. No drawing data is transmitted to or stored on the server.
- **FR-014**: The game screen MUST display the guess submission form only to non-drawer
  participants. The form MUST be absent or disabled for the drawer.
- **FR-015**: The game screen MUST display the ordered guess history and each participant's
  current score to all participants, updated via the existing ~2-second polling cadence.
- **FR-016**: Player name validation is inherited from Scenario 1
  (`specs/001-room-setup-lobby/spec.md`, FR-001, FR-014) and is not re-specified here.
- **FR-017**: The secret word and its deterministic selection are inherited from Scenario 2
  (`specs/002-game-start-drawer/spec.md`, FR-002, FR-003, FR-004) and are not re-specified here.
- **FR-018**: When the room status is "ended", the game screen MUST display a "round ended"
  banner to all participants. The guess history and scores MUST remain visible. The guess
  submission form MUST be hidden. No automatic navigation away from the game screen occurs
  in this scenario.

### Key Entities

- **Guess**: A single accepted guess submission. Attributes: guesser participant ID, guesser
  display name, trimmed guess text, correctness flag (boolean), submission order index.
- **Room** (updated): gains `guesses: Guess[]` — ordered list of all accepted guesses; gains
  `scores: Record<string, number>` — current point total per participant ID, initialized to 0
  at game start.
- **RoomSnapshot** (updated): exposes `guesses: Guess[]` and `scores: Record<string, number>`
  to all participants in every poll response.
- **Participant** (unchanged): as defined in Scenario 1.
- **Canvas state** (client-only): Stroke data held exclusively in the drawer's browser. Never
  stored on the server or transmitted to other clients.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A submitted guess (correct or incorrect) appears in the guess history on all
  participants' screens within 4 seconds of submission, reflecting the ~2-second polling cadence
  plus network round-trip.
- **SC-002**: A correct guess awards exactly 100 points to the guesser — verified by inspecting
  the scores in the room snapshot after submission; all other scores are unchanged.
- **SC-003**: 100% of empty or whitespace-only guess submissions are rejected with a user-visible
  message and produce no entry in the guess history — verified in the two-tab acceptance test.
- **SC-004**: The game transitions to "ended" status within 4 seconds of the first correct guess;
  all participants' screens display the "round ended" banner and the hidden guess form within
  that window, without a page refresh.
- **SC-005**: The canvas clear action removes all strokes from the drawer's view immediately
  upon activation — no delay or partial clear is acceptable.
- **SC-006**: No drawing data appears on any guesser's screen or in any guesser's network
  responses at any point during the round.
- **SC-007**: All existing automated test suites (`schemas.test.ts`, `roomStore.test.ts`,
  `api.test.ts`) remain green after implementation.

## Assumptions

- The game ends as soon as the first correct guess is received. There is no timer, no
  maximum-guess limit, and no mechanism for the drawer to end the round early.
- Only one guesser can win a round (first correct guess wins 100 points). Sequential server
  processing determines the winner when two submissions arrive nearly simultaneously.
- The drawer's score is initialized to 0 and remains 0 for the round; drawers do not earn
  points. Drawer scoring and rotation are out of scope per the constitution.
- The canvas requires only freehand drawing with a pointer and a full-clear action. No shape
  tools, color selection, line thickness, or undo/redo are required.
- Scores accumulate only within the current in-memory session. Because all state resets on
  server restart (per the project constitution), there is no persistent leaderboard.
- The guess history is displayed in chronological submission order; no sorting or filtering is
  required.
- A guess is submitted as a single text field — no multi-step confirmation is needed.
- The polling interval for guess history and score updates is the same ~2-second cadence
  established in Scenarios 1 and 2; no separate polling mechanism is introduced.
- The drawer's game screen continues to show the secret word (inherited from Scenario 2) and
  the full guess history during the round, so the drawer can follow guesser progress.
