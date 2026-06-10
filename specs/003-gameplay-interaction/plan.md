# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-09 | **Spec**: ../spec.md

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Implement the core gameplay interaction for Scribble: an interactive HTML5 canvas for the drawer, guess submission with validation and scoring, and synced game state via HTTP polling. This work adds `POST /rooms/:code/canvas` for stroke sync, `POST /rooms/:code/guess` for guess submission, canvas rendering on all clients, live scoreboard updates, and guess history display. The round auto-ends when all guessers have guessed correctly.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Node.js 18+

**Primary Dependencies**: React, React Router v6, Vite, Express, Zod, Vitest

**Storage**: Server-side in-memory room store

**Testing**: Vitest for frontend and backend units

**Target Platform**: Web application (browser with local dev backend)

**Constraints**: No WebSocket or real-time push. Canvas strokes synced via HTTP polling at 2-second intervals.

## Constitution Check

- TypeScript strict mode and no silent `any` values throughout.
- Frontend UIs use functional components and hooks only.
- Vitest coverage at 80% surface minimum for new logic.
- No new major dependencies beyond starter stack.
- Canvas implementation uses plain HTML5 Canvas API — no drawing library dependency.

## Project Structure

### Documentation (this feature)

```
specs/003-gameplay-interaction/
├── plan.md
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code Changes

```
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          ← add POST /:code/canvas, POST /:code/guess
│   │   └── schemas.ts        ← add canvas/guess schemas
│   ├── models/
│   │   └── game.ts           ← add Point, Stroke types
│   └── services/
│       └── roomStore.ts      ← add updateCanvas(), submitGuess(), round-end logic
frontend/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx         ← NEW interactive canvas (drawer) / read-only (guesser)
│   │   ├── GuessForm.tsx      ← rewrite: submit to API, validate, show feedback
│   │   ├── ResultPanel.tsx    ← rewrite: render guess history
│   │   └── Scoreboard.tsx     ← rewrite: render live scores
│   ├── pages/
│   │   └── GamePage.tsx       ← wire canvas and guess form to room state
│   ├── services/
│   │   └── api.ts             ← add submitGuess(), updateCanvas()
│   └── state/
│       └── roomStore.ts       ← may need canvas sync helper
```

## Implementation Plan

### Phase 1 — Backend canvas & guess endpoints

1. Add `Point` and `Stroke` types to `backend/src/models/game.ts`:
   - `Point: { x: number, y: number }`
   - `Stroke: Point[]`

2. Add `updateCanvas(code, participantId, strokes)` to `roomStore.ts`:
   - Validate drawer identity.
   - Replace `canvasState.strokes` with submitted strokes.
   - Save and return clone.

3. Add `submitGuess(code, participantId, text)` to `roomStore.ts`:
   - Validate caller is not the drawer.
   - Validate caller hasn't already guessed correctly.
   - Trim text, reject empty.
   - Compare case-insensitively against `currentRound.secretWord`.
   - Record guess in `currentRound.guesses[]`.
   - If correct: add 100 to score, mark guesser as correct in round.
   - If all guessers correct: set `currentRound.isComplete = true`, set `status = "result"`.
   - Save and return clone.

4. Add `POST /rooms/:code/canvas` route in `rooms.ts`:
   - Body: `{ participantId, strokes }`.
   - 403 if not drawer, 400 if room not playing.

5. Add `POST /rooms/:code/guess` route in `rooms.ts`:
   - Body: `{ participantId, text }`.
   - 403 if drawer, 400 if empty or already guessed correctly.

6. Update `toRoomSnapshot()` to include current `canvasState`.

7. Add backend tests for:
   - Canvas update + retrieval.
   - Correct guess → +100 score, recorded.
   - Incorrect guess → 0 score, recorded.
   - All guessers correct → status "result".
   - Drawer cannot guess.
   - Already-correct guesser rejected.
   - Empty guess rejected.
   - Case-insensitive comparison.

### Phase 2 — Frontend canvas component

1. Create `frontend/src/components/Canvas.tsx`:
   - HTML5 Canvas element with mouse/touch event handlers.
   - State: array of strokes (each stroke is array of points).
   - Props: `strokes`, `onStrokesChange`, `readOnly`, `onClear`.
   - Drawing mode: mousedown starts stroke, mousemove adds points, mouseup ends stroke.
   - Clear button: emits `onClear` and clears canvas.
   - For read-only mode: no event handlers attached, just renders provided strokes.

2. Implement stroke rendering: on each render, clear canvas and redraw all strokes as polylines.

### Phase 3 — Frontend guess form

1. Rewrite `GuessForm.tsx`:
   - Accept `onSubmit(text)` callback prop.
   - Validate non-empty client-side before calling callback.
   - Show loading state while submitting.
   - Disable input after correct guess (if `disabled` prop).
   - Display `disabled` reason (e.g., "You already guessed correctly!").

### Phase 4 — Frontend scoreboard & result panel

1. Rewrite `Scoreboard.tsx`:
   - Props: `participants`, `scores`, `drawerParticipantId`.
   - Display each participant with name, score, and "drawer" badge.
   - Show "Waiting for scores..." if no round data.

2. Rewrite `ResultPanel.tsx`:
   - Props: `guesses`, `participants`.
   - Render ordered list of guesses (newest first or oldest first?).
   - Each entry: participant name, guess text, correct/incorrect indicator (green check / red x).
   - Show "Waiting for guesses..." if no round data.

### Phase 5 — Wire into GamePage

1. Update `GamePage.tsx`:
   - Pass strokes from `room.currentRound?.canvasState?.strokes` to Canvas.
   - For drawer: Canvas is interactive, `onStrokesChange` debounces and calls `api.updateCanvas()`.
   - For guessers: Canvas is read-only.
   - Pass `onSubmit` to GuessForm that calls `api.submitGuess()`.
   - Pass scores/participants/guesses to Scoreboard and ResultPanel.
   - Guesses and scores update via the existing 2-second polling.

### Phase 6 — Testing and validation

1. Frontend tests:
   - Canvas renders strokes correctly.
   - GuessForm validates empty input.
   - GamePage passes correct props to child components.
2. Manual verification: two browser tabs — drawer draws, guesser sees drawing within 2s, guesser submits guess, all see history + score update.

## Risks and Mitigations

- **Canvas performance**: Frequent stroke sync could cause many API calls. Mitigate by debouncing canvas updates (e.g., send every 500ms of inactivity, or every 2s). Keep stroke data lean (no base64, just coordinate arrays).
- **Guess race condition**: Two guessers submitting simultaneously could both see "all guessers correct" before the other's guess is recorded. Acceptable at this scope since the game is turn-agnostic.
- **Case-insensitive comparison**: Ensure `toLowerCase()` is used on both the guess and the secret word before comparison. Handle special characters gracefully.

## Next Steps

- Create `specs/003-gameplay-interaction/tasks.md` with ordered implementation tasks.
- Implement backend canvas and guess endpoints.
- Implement frontend canvas, guess form, scoreboard, and result panel.
- Wire everything into GamePage.
- Add vitest coverage.
