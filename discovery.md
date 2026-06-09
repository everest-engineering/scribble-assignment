# Discovery File

## Incomplete Behaviors Identified

### 1. Drawer correct-guess count not shown in standings (FR-004)
The spec requires: "for the drawer, how many guessers guessed correctly." The current standings just label the drawer as "(Drawer)" without showing the count of correct guesses they received. The data is available (`room.guesses`), but the UI doesn't compute or display it.

**Location**: `frontend/src/pages/GamePage.tsx` — `sortedStandings` render, line ~171

### 2. No stroke batching during long continuous strokes (FR-003)
The drawing spec requires: "Submit frequency: on mouse-up finalization AND periodic flush (every 1s) for long strokes." The current implementation only submits on `pointerUp`. A drawer who holds the mouse down for many seconds won't have partial stroke data flushed to the server until they release. This means guessers won't see any progress of a long stroke until it's finished.

**Location**: `frontend/src/components/DrawingCanvas.tsx` — `handlePointerMove` only renders locally, never flushes to server

### 3. No draw-phase timeout / inactivity detection
If a drawer starts drawing but walks away, the round stays in `"drawing"` phase indefinitely. There's no server-side timeout to detect inactivity and auto-end the round. The constitution prohibits WebSockets, so this would need a periodic check or a TTL on the round phase.

**Location**: `backend/src/services/roomStore.ts` — no time-based phase transitions exist

### 4. Race condition on simultaneous correct guesses
If two guessers both submit the correct word within the same server tick (before the first submission updates the phase to `"finished"`), both could receive `{ correct: true }`. The phase only transitions after the first submission completes. The second guesser's guess is recorded as correct even though the round was technically over. This is a low-probability edge case but violates the spec's intent that "only the first correct guess triggers the round end."

**Location**: `backend/src/services/roomStore.ts` — `submitGuess()` transitions phase after pushing the guess, no atomic lock

### 5. Canvas clear error feedback is silent
The `handleClear()` function in `GamePage.tsx` silently swallows all errors. If the clear request fails (network error, server error), the user gets no visual feedback. Compare with `handleGuess()` which displays error messages via `setGuessFeedback`.

**Location**: `frontend/src/pages/GamePage.tsx` — `handleClear()` catch block is empty

### 6. Non-host restart in lobby gives misleading error
If a non-host player attempts to restart when the room is already in lobby (after a prior restart), they receive `400 "Round is not finished yet"` instead of `403 "Only the host can restart the game"`. The authorization check is correct in the restart handler, but the phase check runs first when `room.round` is null, masking the 403. This only matters if a non-host sends a manual API request after the room is already reset; the UI never shows a restart button to non-hosts so this doesn't affect normal gameplay.

**Location**: `backend/src/services/roomStore.ts` — `restartGame()` checks phase before host

### 7. T021 — Manual validation not yet completed
The quickstart manual validation (T021) for Feature 003 was never executed. This covers: verifying drawing appears on guessers' screens, incorrect/correct guess flow, drawer-can't-guess enforcement, already-correct rejection, and stroke persistence across page refreshes.

**Location**: `specs/003-drawing-and-guessing/tasks.md` — T021 is `[ ]`

### 8. No drawing-phase loading indicator during word selection
When the drawer is selecting a word and guessers are waiting, the guesser UI shows "The drawer is selecting a word..." text but there's no visual indicator (spinner, skeleton) to suggest that the game is progressing. Minor UX gap.

**Location**: `frontend/src/pages/GamePage.tsx` — word-selection guesser view

---

## Assumptions

### From Feature 003 spec (Drawing & Guessing)

| # | Assumption | Implication |
|---|---|---|
| A1 | Canvas uses HTML5 Canvas 2D API with pointer events (mouse only for v1) | Touch and stylus not supported |
| A2 | Initial drawing tool is a single black pen with fixed width (3px normalized) | No color picker, brush size, or eraser |
| A3 | Stroke points normalized to 0-1 range | Resolution-independent rendering; assumes consistent aspect ratio across clients |
| A4 | Canvas has fixed 4:3 aspect ratio enforced consistently | Must be same on drawer and guesser views |
| A5 | Polling for drawing data uses 500ms interval | Below the 2s constitution cap; acceptable responsiveness |
| A6 | Drawer must not be able to guess | Server-enforced via drawerId check |
| A7 | Already-correct guesser prevented from further guesses | Server-enforced, no UI workaround possible |
| A8 | Round-end conditions (timer, all-correct, manual host action) out of scope | Handled by a subsequent feature (Feature 004) |
| A9 | Multi-round gameplay out of scope | This feature handles a single round only |
| A10 | Stroke history grows unboundedly in memory | Acceptable since games are short-lived and rooms are cleaned |
| A11 | "Clear Canvas" is a new capability added mid-spec | Was not in original spec; handles accidental drawings |

### From Feature 004 spec (Post Game Experience)

| # | Assumption | Implication |
|---|---|---|
| A12 | "Final player standings" refers to who guessed correctly/incorrectly, not a numerical score | Scoring is handled by a future feature |
| A13 | A new round phase "finished" added to RoundPhase alongside "word-selection" and "drawing" | Three-phase lifecycle per round |
| A14 | Result screen is a shared state — all players see the same information | No per-player filtering beyond guess correctness |
| A15 | Drawing strokes remain visible on the result screen for reference | Canvas is rendered in read-only mode |
| A16 | After restart, next game assigns a new random drawer and new word options | Existing startGame() flow handles this |
| A17 | Host is determined by existing `hostId` field on the room | Unchanged by the round lifecycle |
| A18 | In-memory storage is sufficient for party-game scale (2-8 players per room) | No database needed per constitution |
| A19 | No authentication — anyone who knows the room code can join | Room code serves as the access token |
| A20 | HTTP polling only (max 2s interval) | No WebSockets or server-sent events |
| A21 | Single round result + restart cycle | Implementation is scoped to one iteration |
