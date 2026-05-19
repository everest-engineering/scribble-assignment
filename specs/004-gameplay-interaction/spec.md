# Feature Specification: Phase 3 Gameplay Interaction

**Feature Branch**: `004-gameplay-interaction`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "I am starting Phase 3 of the Scribble lab. Phase 1 (R1–R5, G1) and Phase 2 (G2–G4) are complete. This phase covers gameplay interaction — features G5, G6, G7, G8, and G9.

Before writing the spec, do discovery first. Read these files and note what already exists vs what's missing now that Phase 1 and Phase 2 are in place:
- backend/src/models/game.ts
- backend/src/services/roomStore.ts
- backend/src/api/rooms.ts
- backend/src/api/schemas.ts
- frontend/src/pages/GamePage.tsx
- frontend/src/components/GuessForm.tsx
- frontend/src/components/Scoreboard.tsx
- frontend/src/components/ResultPanel.tsx
- frontend/src/state/roomStore.ts
- frontend/src/services/api.ts

Pay special attention to:
- The Room model now has drawerId, guesserIds, secretWord, and status "playing" from Phase 2
- The viewer-specific snapshot logic in toRoomSnapshot — guessers don't receive secretWord
- The existing GuessForm component has an empty handleSubmit
- The Scoreboard and ResultPanel components are placeholders
- The canvas placeholder in GamePage is a styled div, not a real canvas element
- The polling pattern established in Phase 1 for the lobby — reuse it for game-state sync

Then write a feature specification for Phase 3 covering:

G5 — Drawing on canvas: The drawer can draw locally on an interactive canvas. The canvas is visible on the drawer's screen. Live stroke broadcast is out of scope — drawing is local only.

G6 — Clear canvas: A button clears the drawer's local canvas completely.

G7 — Guess submission: Guessers can submit guesses. Guesses are trimmed; empty or whitespace-only guesses are rejected with a message. Comparison to the secret word is case-insensitive.

G8 — Guess history (synced): All players in the room see the guess history refresh via polling. New guesses appear for everyone within about 2 seconds.

G9 — Scoring: Score starts at 0. A correct guess sets the final score to 100. Incorrect guesses add 0. The first correct guess ends the round (triggers result state in Phase 4).

For each feature, include:
- Acceptance criteria
- Edge cases discovered during inspection
- Discovery notes — what already works (including Phase 1 and Phase 2 additions), what is missing or broken

Stay strictly within these features. Do not include result state rendering or restart flow — those are for Phase 4. However, note that G9's correct guess must trigger the transition to result status so Phase 4 can render it.

Out of scope (do not include in this spec): WebSockets, live drawing stroke broadcast to other clients, persistent storage, authentication, multiple rounds, drawer rotation, timers, speed bonuses, custom word packs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Draw Locally as the Drawer (Priority: P1)

As the assigned drawer, I want an interactive drawing surface that responds to my
pointer input and can be cleared so I can conduct the round locally without waiting
for any live broadcast system.

**Why this priority**: The round has no playable interaction unless the drawer can
actually draw and reset the drawing surface during the active round.

**Independent Test**: Start a room, become the drawer, draw visible marks on the
game canvas, clear them, and confirm the drawing surface resets completely without
affecting other rooms.

**Acceptance Scenarios**:

1. **Given** a room is in the playing state and the viewer is the assigned drawer,
   **When** the drawer drags across the game canvas, **Then** visible marks appear
   on that drawer's local canvas during that session.
2. **Given** the drawer has already made marks on the local canvas, **When** the
   drawer chooses to clear the canvas, **Then** every existing mark on that local
   canvas is removed.
3. **Given** a viewer is not the assigned drawer, **When** that viewer opens the
   game screen, **Then** the drawing surface is not interactive for that viewer and
   no live remote strokes are expected in this phase.

**Edge Cases Discovered During Inspection**:

- The current game screen only contains a styled placeholder block, so there is no
  actual drawing interaction or clear action yet.
- The room state already distinguishes drawer versus guesser, so canvas
  interactivity must follow that existing round-role split instead of lobby role.
- Because drawing is local-only for this phase, refreshing the page may reset the
  local sketch without affecting server room state.

**Discovery Notes**:

- Phase 2 already exposes the drawer identity and the playing room state to the
  game screen.
- The current game layout already reserves a visible canvas area for the round.
- The starter does not yet provide a real drawing surface or a clear control.

---

### User Story 2 - Submit and Share Guesses (Priority: P2)

As a guesser, I want to submit guesses with clear validation and see guess history
update for everyone in the room so the round feels shared even without live drawing
broadcast.

**Why this priority**: Guess input and shared history are the core multiplayer
interaction loop for the non-drawer players in this phase.

**Independent Test**: Start a room, submit valid and invalid guesses as a guesser,
and confirm trimmed guesses appear in room history for both the drawer and other
guessers within about 2 seconds.

**Acceptance Scenarios**:

1. **Given** the viewer is a guesser in a playing room, **When** they submit a
   guess containing leading or trailing spaces, **Then** the stored guess uses the
   trimmed text.
2. **Given** the viewer is a guesser, **When** they submit an empty or
   whitespace-only guess, **Then** the submission is rejected and a clear message is
   shown without adding an item to guess history.
3. **Given** a new valid guess has been accepted for a room, **When** other players
   in that same room remain on the game screen, **Then** the guess appears in their
   room history through the normal refresh cycle within about 2 seconds.
4. **Given** players are in different rooms, **When** guesses are submitted in one
   room, **Then** those guesses never appear in another room's history.

**Edge Cases Discovered During Inspection**:

- The current guess form stops submission immediately and has no validation or
  request behavior.
- The existing room polling pattern only covers lobby state, so active-room guess
  history currently has no shared refresh path.
- The current activity and scoreboard panels are placeholders, so there is no place
  yet where shared guess history is rendered as real round data.

**Discovery Notes**:

- Phase 1 already established a successful room polling pattern with a roughly
  2-second cadence and background-tab pause behavior.
- Phase 2 already keeps viewer-specific room snapshots in sync and restores the
  active room after refresh.
- The starter does not yet store guesses, submit guesses, or render synchronized
  guess history.

---

### User Story 3 - End the Round on the First Correct Guess (Priority: P3)

As a player in the room, I want correct guesses to score the round and end it
immediately so later phases can render the result state from a clear, deterministic
outcome.

**Why this priority**: Shared guess history has limited value unless the game can
recognize a winning guess, award the fixed score, and stop the round at the right
moment.

**Independent Test**: Start a room, submit incorrect guesses and confirm scores
remain at 0, then submit the first correct guess with different letter casing and
confirm the guesser receives 100 points and the room leaves the playing state for a
result state.

**Acceptance Scenarios**:

1. **Given** a playing room has started with all player scores at 0, **When** a
   guesser submits an incorrect guess, **Then** the guess is recorded, no player
   score changes, and the room remains in the playing state.
2. **Given** a playing room has an active secret word, **When** a guesser submits
   the correct word using any letter casing, **Then** the comparison succeeds, that
   guesser becomes the round winner with a score of 100, and the room transitions
   out of the playing state into a result state.
3. **Given** the first correct guess has already ended the round, **When** players
   refresh room data, **Then** they all see the same ended-round status, winner, and
   final scores for that room.

**Edge Cases Discovered During Inspection**:

- The current room model does not yet track guesses, scores, winner identity, or a
  result status, so scoring has no authoritative place to live yet.
- The secret word is currently drawer-only in room snapshots, so correctness checks
  must happen without exposing the word to guessers.
- The current scoreboard and result panels are placeholders, so round-end and final
  scoring information are not rendered yet even though later phases depend on that
  state.

**Discovery Notes**:

- Phase 2 already stores the secret word on the room and protects it from guesser
  snapshots.
- The current game store already knows how to keep room state in memory and can
  refresh it from the backend.
- The starter does not yet compare guesses, assign scores, or transition a room to
  a result status after the first correct guess.

### Edge Cases

- The drawer attempts to submit a guess during the active round; guess submission
  must remain a guesser action only.
- A guess matches the secret word except for letter casing or surrounding spaces and
  must still count as correct after normalization.
- Two players submit guesses close together; the first correct guess must be the one
  that ends the round and fixes the final score outcome.
- A player refreshes during the active round and must recover the same guess
  history, scores, and round status for that room on the next fetch.
- A player refreshes after the winning guess and must recover the same result round
  state instead of re-entering an active playing state.
- Local canvas content clears for the drawer without deleting room history, scores,
  or other server-owned round state.
- Guess history in one room must never appear in another room, even when both rooms
  are in the playing state at the same time.

## Constitution Alignment *(mandatory)*

- **Typed Contract Impact**: Room-view data will expand to include gameplay round
  information beyond drawer identity, including guess history, player scores, and a
  result status after the first correct guess. Guess submission introduces a new
  room-scoped action and response shape.
- **Validation Boundaries**: The system must validate guess submission rights,
  trimmed non-empty guess text, case-insensitive correctness checks, first-correct
  round completion, and viewer-safe room snapshots that still hide the secret word
  from guessers.
- **State & Storage Impact**: Room state remains in-memory and room-scoped. Phase 3
  adds only the gameplay state needed for one active round: local-only drawing on
  the drawer screen, synchronized guess history, per-player scores, and the result
  transition data required for later rendering.
- **Scope Guardrail**: This specification is limited to local drawing, clear-canvas
  behavior, trimmed guess submission, synchronized guess history, fixed-score
  outcomes, and ending the round on the first correct guess. Result rendering,
  restart flow, live stroke sharing, multiple rounds, rotation, timers, speed
  bonuses, persistence, and authentication remain out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (G5)**: When the viewer is the assigned drawer in a playing room, the
  system MUST provide an interactive drawing surface on that drawer's game screen.
- **FR-002 (G5)**: Marks drawn on the Phase 3 canvas MUST remain local to the
  drawer's current browser session and MUST NOT be broadcast live to other players.
- **FR-003 (G5)**: Non-drawer players MUST NOT be able to draw on the active round
  canvas.
- **FR-004 (G6)**: The drawer MUST be able to clear all marks from the local canvas
  with a single clear action.
- **FR-005 (G6)**: Clearing the local canvas MUST NOT remove guesses, scores, or
  other shared room state.
- **FR-006 (G7)**: Guessers MUST be able to submit guesses while the room is in the
  playing state.
- **FR-007 (G7)**: Guess submission MUST trim leading and trailing whitespace before
  validation and storage.
- **FR-008 (G7)**: Empty or whitespace-only guesses MUST be rejected with a clear
  message and MUST NOT be added to room history.
- **FR-009 (G7)**: Guess comparison against the secret word MUST be case-insensitive.
- **FR-010 (G7)**: The drawer MUST NOT be allowed to use the guess-submission flow
  as an active guesser during that round.
- **FR-011 (G8)**: Each accepted guess MUST be recorded in room-scoped guess
  history together with the identity of the player who submitted it.
- **FR-012 (G8)**: Guess history for a room MUST become visible to all players in
  that same room through the normal refresh cycle within about 2 seconds.
- **FR-013 (G8)**: Transient refresh failures during the active round MUST NOT blank
  already-visible guess history or scores for players who are still in the room.
- **FR-014 (G8)**: Guess history from one room MUST NOT appear in any other room.
- **FR-015 (G9)**: Every player score MUST start at 0 at the beginning of the round.
- **FR-016 (G9)**: An incorrect guess MUST add 0 points and leave the room in the
  playing state.
- **FR-017 (G9)**: The first correct guess of the round MUST set the winning
  guesser's final score to 100.
- **FR-018 (G9)**: Once the first correct guess is accepted, the room MUST end the
  round immediately and transition from the playing state to a result status for
  later rendering.
- **FR-019 (G9)**: After the round ends, all players in that room MUST see the same
  winner identity, final scores, and ended-round status on refresh.
- **FR-020 (G9)**: Secret-word checks used for scoring MUST NOT expose the drawer's
  secret word to guessers through guess history, scores, or any room view available
  to them.

### Key Entities *(include if feature involves data)*

- **Drawing Surface**: The local round canvas available only to the assigned drawer
  during the active round, including the ability to clear the current sketch without
  changing server-owned room data.
- **Guess Entry**: A single room-scoped guess attempt containing the submitting
  player identity, normalized guess text, and whether the guess ended the round.
- **Score Entry**: The current score for one player in the room, starting at 0 and
  reaching 100 only for the first correct guesser in this phase.
- **Round Outcome**: The shared ended-round state created by the first correct
  guess, including the winner identity, final scores, and result room status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a two-player room, the assigned drawer can create visible marks on
  the game canvas and clear them completely in under 10 seconds without leaving the
  game screen.
- **SC-002**: 100% of empty or whitespace-only guess submissions are rejected with a
  clear message and do not create a history entry.
- **SC-003**: In manual multi-player validation, newly accepted guesses appear for
  every player in the same room within 2 seconds of submission.
- **SC-004**: In repeated manual validation across fresh rooms, incorrect guesses
  leave every score at 0 and the first correct guess consistently awards 100 points
  to the winning guesser and ends the round.
- **SC-005**: In cross-room validation, guess history, winner identity, and final
  scores from one room never appear in another room.

## Assumptions

- Each Phase 3 room still contains only one active round and ends immediately on the
  first correct guess.
- The existing Phase 2 drawer assignment and secret word remain authoritative for
  the active round and are reused for guess validation.
- Scores in this phase are round-local and deterministic: only the first correct
  guesser receives 100 points, and all other players remain at 0.
- If the drawer refreshes the page, local canvas marks may be lost because live
  stroke persistence and sync are explicitly out of scope for this phase.
- Result presentation details are deferred to Phase 4 even though Phase 3 must
  create the result room state that later rendering depends on.

## Verification Plan *(mandatory)*

- **Build Validation**: `backend npm run build`, `frontend npm run build`
- **Story Validation**: User Story 1 is verified by starting a room as drawer,
  drawing visible marks, and clearing them. User Story 2 is verified by submitting
  trimmed, blank, and incorrect guesses and confirming shared history updates within
  about 2 seconds for every player in the room. User Story 3 is verified by
  submitting at least one incorrect guess followed by the first correct guess with
  varied letter casing and confirming the fixed score and result transition.
- **Manual Multiplayer Checks**: Use at least two browser sessions in one room to
  verify drawer-only canvas interactivity, guesser-only guess submission, synchronized
  guess history, and consistent ended-round status after the first correct guess.
