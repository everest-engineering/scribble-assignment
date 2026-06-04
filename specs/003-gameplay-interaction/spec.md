# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-04

**Status**: Clarified

**Input**: User description: "Gameplay Interaction — Brownfield enhancement of the Scribble starter. Scenario: Given a round is active with a drawer assigned and all scores starting at 0, When the drawer submits canvas strokes (clear action) and guessers submit text guesses, Then the canvas state (list of strokes) is stored on the backend and returned in the room snapshot so all players see the same drawing via polling; guesses are trimmed server-side, case-insensitively compared against currentWord, empty/whitespace-only guesses are rejected with an error; a correct guess awards 100 points to the guesser (incorrect guesses add 0); the guess history (guesser name + guess text + correct flag) is stored on the backend and synced to all players via the existing polling mechanism; scores per participant are stored on the backend and reflected in the room snapshot."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Canvas Stroke Sync (Priority: P1)

The drawer adds strokes to a canvas in their browser. Each stroke (or a clear action) is
submitted to the backend and stored on the room. All players — including the drawer — see
the current canvas state on every poll cycle without any manual refresh.

**Why this priority**: The canvas is the core medium of the game. Without shared drawing
state, the guessing interaction is impossible. This is the foundational P1 capability that
all other gameplay builds on.

**Independent Test**: Open two tabs (drawer + guesser). In the drawer tab, submit a stroke
via `POST /rooms/:code/strokes`. Poll `GET /rooms/:code` from the guesser tab and confirm
the stroke appears in `room.strokes`. Confirm a clear action empties the stroke list.

**Acceptance Scenarios**:

1. **Given** the game is `playing` and the viewer is the drawer, **When** `POST /rooms/:code/strokes`
   is called with a valid stroke payload, **Then** the stroke is appended to `room.strokes`
   and returned in the next `GET /rooms/:code` snapshot for all viewers.
2. **Given** the game is `playing`, **When** `POST /rooms/:code/strokes` is called with a
   clear action (`{ type: "clear" }`), **Then** `room.strokes` is reset to an empty array
   and all players see a blank canvas on their next poll.
3. **Given** the game is NOT `playing` (lobby or finished), **When** `POST /rooms/:code/strokes`
   is called, **Then** the server responds with 400 and the stroke is not stored.
4. **Given** a non-drawer participant, **When** `POST /rooms/:code/strokes` is called with
   their `participantId`, **Then** the server responds with 403 and no stroke is stored.

---

### User Story 2 — Guess Submission & Validation (Priority: P1)

A guesser types a word and submits it. The server trims whitespace, rejects empty guesses
with a clear error message, and compares the trimmed guess case-insensitively against the
secret word. The result (correct or incorrect) is immediately returned to the submitter.

**Why this priority**: Guess validation is the second half of the core game loop alongside
canvas drawing. Without it the game has no win condition.

**Independent Test**: In a guesser tab, submit `POST /rooms/:code/guess` with a correct
guess (matching `currentWord` case-insensitively). Confirm the response includes
`correct: true`. Submit an incorrect guess — confirm `correct: false`. Submit a
whitespace-only guess — confirm 400 error.

**Acceptance Scenarios**:

1. **Given** the game is `playing` and the guess (after trim) matches `currentWord`
   case-insensitively, **When** `POST /rooms/:code/guess` is called, **Then** the response
   includes `correct: true` and the guesser's score increases by 100.
2. **Given** the game is `playing` and the guess (after trim) does NOT match `currentWord`,
   **When** `POST /rooms/:code/guess` is called, **Then** the response includes
   `correct: false` and the guesser's score is unchanged.
3. **Given** the guess is empty or whitespace-only after trim, **When**
   `POST /rooms/:code/guess` is called, **Then** the server responds with 400 and no
   guess is recorded.
4. **Given** the drawer submits a guess with their own `participantId`, **When**
   `POST /rooms/:code/guess` is called, **Then** the server responds with 403; the drawer
   cannot guess their own word.
5. **Given** the game is NOT `playing`, **When** `POST /rooms/:code/guess` is called,
   **Then** the server responds with 400 and no guess is recorded.

---

### User Story 3 — Guess History Synced to All Players (Priority: P2)

Every guess (correct or incorrect) is appended to a shared guess history on the backend.
All players see the full guess history — including guesser name, guess text, and whether
it was correct — via the existing polling mechanism.

**Why this priority**: The guess history provides social context and lets all players follow
the game's progress. It is display logic layered on top of the P1 guess submission core.

**Independent Test**: Submit several guesses (correct and incorrect) from a guesser tab.
Poll `GET /rooms/:code` from any tab and confirm `room.guesses` contains all submitted
guesses with correct `name`, `text`, and `correct` fields in submission order.

**Acceptance Scenarios**:

1. **Given** a guess is submitted (correct or incorrect), **When** the next poll returns,
   **Then** `RoomSnapshot.guesses` contains the new entry with `{ participantName, text, correct }`.
2. **Given** multiple guesses have been submitted, **When** any player polls
   `GET /rooms/:code`, **Then** the full guess history is returned in submission order.
3. **Given** a guess is rejected (empty/whitespace or 403), **When** the next poll returns,
   **Then** the rejected guess does NOT appear in `RoomSnapshot.guesses`.

---

### User Story 4 — Scores Reflected for All Players (Priority: P2)

Each participant's score is stored on the backend and included in the `RoomSnapshot`
participant list. All players see up-to-date scores via polling without any manual action.

**Why this priority**: Scores give meaning to correct guesses and create the game's
competitive dynamic. They are derived from the guess submission logic (US2) and require no
separate API — scores are embedded in the participant snapshot.

**Independent Test**: Submit a correct guess. Poll `GET /rooms/:code` and confirm the
guesser's participant entry shows `score: 100`. Submit another correct guess from the same
player and confirm `score: 200`.

**Acceptance Scenarios**:

1. **Given** a round starts, **When** any player views the snapshot, **Then** all
   participants have `score: 0`.
2. **Given** a guesser submits a correct guess, **When** the next snapshot is returned,
   **Then** that participant's `score` has increased by 100.
3. **Given** a guesser submits an incorrect guess, **When** the next snapshot is returned,
   **Then** that participant's `score` is unchanged.
4. **Given** multiple correct guesses by the same player, **When** the snapshot is returned,
   **Then** their `score` accumulates correctly (e.g., 3 correct = 300).

---

### Edge Cases

- What if the drawer submits a stroke after another player has already correctly guessed?
  The round end / word reveal is Scenario 4 (out of scope here); strokes continue to be
  accepted while `room.status === "playing"`.
- What if two guessers submit the same correct guess simultaneously? Both receive
  `correct: true` and both scores increase; no de-duplication is required in this scenario.
- What if `room.strokes` grows very large? No cap is enforced in this scenario — stroke
  volume limits are a Scenario 4 / polish concern.
- Can non-drawer participants draw on the canvas? No — the canvas is rendered in read-only
  (view-only) mode for non-drawers. The server enforces 403 for non-drawer stroke submissions
  as the authoritative guard; the frontend read-only state is a UX convenience.
- How does the frontend render strokes after each poll? Full redraw — the canvas element is
  cleared and all strokes are replayed from index 0 on every poll cycle. No incremental
  diffing or last-index tracking is performed client-side.
- When does the drawer submit a stroke to the backend? On mouse-up / touch-end — one
  `POST /rooms/:code/strokes` per completed drag gesture. No per-pixel streaming.
- Can a guesser score more than once on the same word? No — each player is capped at one
  correct guess per round. Once a player has a correct guess recorded, subsequent correct
  guess attempts from the same player MUST be rejected with 400.
- Is the guess form visible to the drawer? No — the guess input form is hidden for the
  drawer. Only non-drawer participants see the `GuessForm` component.
- What if a guesser's `participantId` is not found in `room.participants`? The server MUST
  respond with 404 and reject the guess.
- What if `currentWord` is `null` (room not fully started)? Guess submission MUST be
  rejected with 400 — game is not in a valid playing state.
- What if a stroke payload is malformed (missing required fields)? Zod validation MUST
  reject it with 422.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `POST /rooms/:code/strokes` MUST accept a stroke payload from the drawer and
  append it to `room.strokes`; the `participantId` in the request body MUST match
  `room.drawerId` or the server responds with 403.
- **FR-002**: A stroke with `{ type: "clear" }` MUST reset `room.strokes` to an empty array.
- **FR-003**: Stroke submission MUST be rejected with 400 if `room.status !== "playing"`.
- **FR-003a**: The frontend canvas MUST be rendered in read-only / view-only mode for
  non-drawer participants; only the drawer can initiate drawing gestures (FR-001 remains
  the authoritative server-side guard).
- **FR-004**: `RoomSnapshot` MUST include `strokes: Stroke[]` forwarded to all viewers
  without viewer-gating (all players see the same canvas state).
- **FR-004a**: The frontend canvas MUST perform a full redraw on every poll cycle: clear
  the canvas element and replay all strokes from index 0. No incremental diffing.
- **FR-005**: `POST /rooms/:code/guess` MUST accept `{ participantId, guess }`, trim the
  guess server-side, and reject empty/whitespace-only guesses with 400.
- **FR-005a**: A guesser who has already submitted a correct guess in the current round
  MUST be rejected with 400 on any further guess attempt; one correct guess per player
  per round is the cap.
- **FR-006**: The trimmed guess MUST be compared case-insensitively against `room.currentWord`.
- **FR-007**: A correct guess MUST add 100 to the guessing participant's `score`; an
  incorrect guess MUST leave the score unchanged.
- **FR-008**: The drawer (`room.drawerId`) MUST NOT be allowed to submit guesses; attempts
  MUST be rejected with 403.
- **FR-008a**: The frontend MUST hide the `GuessForm` component when the current participant
  is the drawer (`participantId === room.drawerId`); only non-drawer participants see the
  guess input.
- **FR-009**: Guess submission MUST be rejected with 400 if `room.status !== "playing"` or
  `room.currentWord === null`.
- **FR-010**: Every accepted guess (correct or incorrect) MUST be appended to `room.guesses`
  as `{ participantName: string; text: string; correct: boolean }`.
- **FR-011**: `RoomSnapshot` MUST include `guesses: GuessRecord[]` in submission order,
  forwarded to all viewers without viewer-gating.
- **FR-012**: `RoomSnapshot` MUST include `score: number` on each `Participant` entry
  (initialised to 0 at room creation).
- **FR-013**: Scores MUST be stored on the in-memory `Room` object and MUST survive across
  multiple `GET /rooms/:code` poll calls for the lifetime of the room.
- **FR-014**: All new Zod schemas (stroke, guess) MUST validate required fields and reject
  malformed payloads with 422.

### Key Entities

- **Stroke**: A single drawing action. Has a `type` field: `"draw"` (with `x0`, `y0`, `x1`,
  `y1` coordinates and `color`, `lineWidth`) or `"clear"` (no coordinates). Stored as an
  ordered array on `Room`.
- **GuessRecord**: An accepted guess entry. Has `participantName: string`, `text: string`,
  `correct: boolean`. Stored as an ordered array on `Room`.
- **Participant** (extended): gains `score: number` initialised to 0 at join/create time.
- **Room** (extended): gains `strokes: Stroke[]` (empty array at creation) and
  `guesses: GuessRecord[]` (empty array at creation).
- **RoomSnapshot** (extended): gains `strokes: Stroke[]` and `guesses: GuessRecord[]`
  (both forwarded without viewer-gating) plus `score` on each participant entry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A stroke submitted by the drawer appears in the guesser's snapshot within one
  poll cycle (~2 seconds) without any manual action.
- **SC-002**: A clear action results in an empty canvas for all players within one poll cycle.
- **SC-003**: A correct guess response is returned synchronously with `correct: true` and
  the player's score in the snapshot increases by exactly 100 on the next poll.
- **SC-004**: An empty or whitespace-only guess always returns a 400 error and is never
  stored in the guess history.
- **SC-005**: The drawer's guess attempt always returns 403 and is never stored.
- **SC-006**: The complete guess history is identical across all polling tabs — no entries
  are missing or reordered.

## Assumptions

- A stroke is the minimal unit of drawing state: a line segment (`"draw"`) or a full clear
  (`"clear"`). No bezier curves, fills, or shapes are introduced in this scenario.
- The `"draw"` stroke carries: `x0`, `y0`, `x1`, `y1` (numbers, canvas pixel coordinates),
  `color` (CSS hex string), `lineWidth` (positive number). These are the minimum fields
  needed to replay the drawing.
- Scores are initialised to 0 when a participant joins or creates a room (not at game start),
  so the `score` field is always present in the snapshot from lobby onwards.
- Each player is capped at one correct guess per round. The backend tracks which participants
  have already guessed correctly (via the `guesses` list) and rejects a second correct
  attempt from the same player with 400. Incorrect guesses after a correct one are also
  rejected with 400 to prevent guess-spam once the word is known.
- The drawer cannot guess; this is enforced server-side regardless of the client UI state.
- `room.strokes` and `room.guesses` are both returned to all viewers without viewer-gating —
  the stroke list is not a secret; neither is the guess history.
- In-memory session loss on page refresh is expected and out of scope.
- No new top-level npm dependencies are introduced.
- The `GamePage` canvas is currently a placeholder (`"Waiting for drawer..."`); this scenario
  wires up the stroke submission and rendering on the frontend. Guess input (`GuessForm`) is
  already a placeholder component in `GamePage` — this scenario activates it for non-drawers
  only; the drawer sees canvas controls instead.
- Strokes are submitted one at a time on mouse-up / touch-end (one drag = one POST). The
  frontend does not batch or stream strokes continuously.
- Round-end / game-finished transition (e.g., status → `"finished"`) is Scenario 4 and is
  out of scope here.
