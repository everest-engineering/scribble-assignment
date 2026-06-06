# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Create a specification for Scenario 3: Gameplay Interaction. Requirements: interactive drawing canvas for the drawer with clear-canvas support; guess submission with trim, case-insensitive comparison, and rejection of empty guesses; guess history and scores synced to all players via polling (~2 seconds); deterministic scoring (all players start at 0, correct guess +100, incorrect +0); drawing visible to all participants through the polled room snapshot."

**Depends on**: Groups 1–2 — room lifecycle, lobby polling, host-only start, drawer assignment, deterministic secret word, drawer-only word visibility, and navigation to `/game` when the round is active.

## Clarifications

### Session 2026-06-05

- Q: How are strokes represented and submitted? → A: Each stroke is an ordered list of `{x, y}` points; the drawer submits one completed stroke via `POST /rooms/:code/strokes`; the room snapshot returns `strokes: Stroke[]` and clients redraw the canvas from that list.
- Q: How is "round ended" represented after the first correct guess? → A: Add `round.ended: boolean` on `RoundState` (default false, set true on first correct guess); `Room.status` stays `"started"` until Group 4 restart returns everyone to lobby.
- Q: What API clears the canvas? → A: `POST /rooms/:code/canvas/clear` with `{ participantId }` in the body; drawer-only; sets the room's `strokes` list to empty when `round.ended` is false.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer draws and clears the canvas (Priority: P1)

The drawer can draw on an interactive canvas while the round is active. Strokes are sent to the server
and appear on the drawer's screen immediately. Other players see the drawing update through polling.

The drawer can clear the canvas; the clear action removes all strokes for everyone once synchronized.

**Why this priority**: Drawing is the core mechanic guessers react to; without a live, shared canvas the
game cannot function.

**Independent Test**: In two tabs (drawer + guesser), the drawer draws a visible stroke; the guesser sees
it within about one poll interval without manual refresh. Clear removes strokes for both.

**Acceptance Scenarios**:

1. **Given** an active round and the viewer is the drawer, **When** they complete a stroke on the canvas,
   **Then** the stroke (as an ordered list of points) is sent to the server and appended to the room's
   stroke list.
2. **Given** strokes exist on the canvas, **When** the drawer clears the canvas,
   **Then** all strokes for that room are removed and all clients eventually show an empty canvas.
3. **Given** a guesser (non-drawer), **When** they view the game screen,
   **Then** they cannot draw or clear the canvas (controls disabled or absent).
4. **Given** two rooms in play, **When** the drawer draws in room A,
   **Then** room B's canvas is unchanged.

---

### User Story 2 - Guessers submit guesses with validation (Priority: P1)

Guessers can submit text guesses while the round is active and not yet ended. Guesses are trimmed;
empty or whitespace-only submissions are rejected with a clear message. Comparison against the secret
word is case-insensitive.

**Why this priority**: Guessing is the primary interaction for non-drawers and must be validated at the
edge like other inputs.

**Independent Test**: Guesser submits `"  Rocket  "` against secret word `rocket` → accepted and scored;
submits `"   "` → rejected with no history entry.

**Acceptance Scenarios**:

1. **Given** an active round and a guesser, **When** they submit a non-empty trimmed guess,
   **Then** the guess is recorded in the room's guess history with their identity and timestamp.
2. **Given** a guesser submits only whitespace, **When** they attempt to submit,
   **Then** the guess is rejected client- and server-side with a clear message and no history entry.
3. **Given** the secret word is `castle` and a guesser submits `CASTLE` (any casing),
   **Then** the guess is evaluated as correct per the scoring rules.
4. **Given** the drawer, **When** they attempt to submit a guess,
   **Then** the guess control is unavailable (drawer does not guess in this round).
5. **Given** the round has ended (a correct guess already occurred), **When** a guesser submits,
   **Then** the submission is rejected with a clear message.

---

### User Story 3 - Deterministic scoring and shared guess history (Priority: P1)

Every participant starts the round with a score of 0. A correct guess adds 100 points to that
guesser; an incorrect guess adds 0. Scores and the ordered guess history are part of the authoritative
room state and are visible to all players in the snapshot (the secret word remains drawer-only per
Group 2).

**Why this priority**: Scoring and history are the measurable outcomes of guessing and are required
by the constitution's deterministic game rules.

**Independent Test**: Two guessers submit one wrong and one right guess; scoreboard shows 0 and 100;
history lists both entries in order.

**Acceptance Scenarios**:

1. **Given** a newly started round, **When** any client fetches the room,
   **Then** every participant's score is 0.
2. **Given** a guesser submits an incorrect guess, **When** it is accepted,
   **Then** their score increases by 0 and the guess appears in history as incorrect.
3. **Given** a guesser submits a correct guess (trimmed, case-insensitive match), **When** it is accepted,
   **Then** their score increases by 100, the guess appears in history as correct, and the round
   transitions to ended (no further guesses or drawing).
4. **Given** multiple guesses from the same or different players, **When** clients fetch the room,
   **Then** guess history reflects all accepted guesses in submission order.

---

### User Story 4 - Game screen stays in sync via polling (Priority: P2)

While on the game screen, each client automatically refreshes room state about every 2 seconds so
strokes, scores, and guess history converge across tabs without manual action.

**Why this priority**: HTTP polling is the only sync mechanism; the lobby already polls, and the game
screen must do the same for gameplay state.

**Independent Test**: Drawer draws in tab 1; guesser in tab 2 sees the stroke within ~2s. Guesser
submits; drawer tab shows new history/score within ~2s.

**Acceptance Scenarios**:

1. **Given** a client on `/game` with an active session, **When** the page is open,
   **Then** the room snapshot is refreshed automatically about every 2 seconds.
2. **Given** polling is running, **When** the user navigates away from `/game`,
   **Then** polling stops (no background requests).
3. **Given** a transient fetch failure during polling, **When** the next poll succeeds,
   **Then** the UI shows the latest strokes, scores, and history without crashing.

---

### Edge Cases

- **Drawer draws after round ended** → rejected; canvas read-only.
- **Duplicate rapid guesses from one player** → each valid submission is recorded (no debounce required).
- **Correct guess while another request is in flight** → first correct guess ends the round; later
  guesses rejected.
- **Clear canvas with no strokes** → succeeds (idempotent empty canvas).
- **Very large stroke payload** → rejected at validation with a clear error (reasonable size limit).
- **Unknown room or participant on draw/guess** → appropriate 404/403; no state change.
- **Backend restart** → all gameplay state lost (in scope assumption: in-memory only).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-033**: The system MUST provide an interactive drawing surface on the game screen for the drawer
  only while the round is active.
- **FR-034**: The drawer MUST be able to clear all strokes via `POST /rooms/:code/canvas/clear`
  (`{ participantId }`); clear MUST set the room's stroke list to empty in authoritative state.
- **FR-035**: Drawing and clear actions MUST be rejected for non-drawers and for any participant after
  the round has ended.
- **FR-036**: The system MUST persist strokes as an append-only list on the room; each stroke is an
  ordered array of `{x, y}` points submitted via `POST /rooms/:code/strokes` (one completed stroke per
  request). The snapshot MUST include `strokes: Stroke[]` for all participants (strokes are not secret).
- **FR-037**: The system MUST accept guess submissions via `POST /rooms/:code/guess`
  (`{ participantId, guess }`) from guessers only while `round.ended` is false.
- **FR-038**: The system MUST reject empty or whitespace-only guesses with a clear validation message
  and HTTP 400 (or equivalent client-side block before request).
- **FR-039**: The system MUST trim guess text before evaluation and compare guesses to the secret word
  case-insensitively.
- **FR-040**: Every participant MUST begin the round with score 0; a correct guess MUST add exactly
  100 points; an incorrect guess MUST add 0 points (no other scoring rules).
- **FR-041**: The system MUST append each accepted guess to an ordered guess history visible to all
  participants (participant identity, guess text, correct/incorrect, timestamp or sequence).
- **FR-042**: On the first correct guess in a round, the system MUST set `round.ended = true` and reject
  further guesses and drawing/clear actions while leaving `Room.status` as `"started"` (Group 4 handles
  lobby return on restart).
- **FR-043**: Guess evaluation and scoring MUST be implemented as deterministic, testable logic
  (pure functions), not ad hoc in route handlers only.
- **FR-044**: The game screen MUST poll `GET /rooms/:code` about every 2 seconds while active and
  update strokes, scores, and guess history from the snapshot.
- **FR-045**: Game polling MUST stop when the game screen unmounts.
- **FR-046**: The scoreboard MUST display each participant's current score from the snapshot (not a
  hard-coded placeholder).
- **FR-047**: The guess history panel MUST list accepted guesses from the snapshot (not static text).
- **FR-048**: This group MUST NOT implement the full result/restart experience (word reveal to all,
  final results layout, return to lobby) — those belong to Group 4.

### Key Entities

- **Stroke**: `{ points: Array<{ x: number; y: number }> }` — one completed stroke; the room holds an
  append-only `strokes[]` redrawn by all clients from the snapshot.
- **Guess**: A submitted guess text, submitter, correctness flag, and ordering metadata; append-only
  during the round.
- **Score**: Per-participant integer, starting at 0 for the round; updated only when guesses are accepted.
- **Round (extended)**: Gains `strokes`, `guesses`, `scores`, and `ended: boolean` in addition to
  drawer/word/roles from Group 2; `ended` becomes true on the first correct guess.
- **Room View (extended)**: Includes `strokes`, `guesses`, and per-participant `scores` for all viewers;
  still omits `secretWord` for non-drawers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of empty or whitespace-only guess attempts are rejected with a user-visible message
  and do not appear in history.
- **SC-002**: A correct guess (any casing, with outer trim) awards exactly 100 points and ends the round
  100% of the time.
- **SC-003**: After a drawer draws, every other tab in the same room shows the stroke within about 2
  seconds without manual refresh.
- **SC-004**: After a guesser submits, every tab in the same room shows the updated history and scores
  within about 2 seconds.
- **SC-005**: Zero cross-room leakage: strokes, guesses, and scores in room A never appear in room B.
- **SC-006**: 100% of non-drawer clients cannot draw, clear, or submit guesses labeled as drawer actions.

## Assumptions

- Groups 1 and 2 are complete: host, start gate, drawer/word, `/game` navigation, name validation.
- Polling interval on the game screen is about 2 seconds, matching the lobby (constitution V).
- Strokes are `{x,y}` point arrays; one stroke per `POST /rooms/:code/strokes`; clear via
  `POST /rooms/:code/canvas/clear`. Guesses via `POST /rooms/:code/guess` with `{ participantId, guess }`
  (plan will detail). Canvas redraws from `snapshot.strokes` on each poll.
- One correct guess sets `round.ended = true`; `Room.status` remains `"started"` until Group 4 restart.
- There is no drawer rotation or second word in this lab.
- Result presentation (showing the word to everyone, restart button) is Group 4; this group only
  transitions the round to an ended state and disables further play.
- Drawing sync is snapshot-based (poll), not real-time push.
