# Implementation Plan: Guess Submission, Scoring, and History Sync

**Branch**: `004-guess-scoring-sync` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-guess-scoring-sync/spec.md`

## Summary

When an active round is in progress, the drawer gets a working HTML5 canvas to draw and clear locally. Guessers submit typed guesses through the existing GuessForm, which are validated (trimmed, non-empty, case-insensitive match against `availableWords[0]`), persisted server-side as `Guess` records, and scored (100 for correct, 0 for incorrect). All players poll `GET /rooms/:code` every 2 seconds to see the live guess history and scoreboard. Backend changes touch 4 existing files; frontend touches 5 existing files and adds 1 new component (`DrawingCanvas.tsx`). Zero new npm dependencies.

## Technical Context

**Language/Version**: TypeScript (strict). React 18 (frontend). Node.js + Express (backend).

**Primary Dependencies**: Existing — React Router 6, Zod (backend schemas), native HTML5 Canvas API (frontend). All already installed.

**Storage**: In-memory only. `guesses: Guess[]` added to the `Room` object in `roomStore.ts`. No database.

**Testing**: Manual two-tab browser verification per constitution Principle IV. Existing Vitest setup available.

**Target Platform**: Local development. Backend on `localhost:3001`, frontend on `localhost:5173`.

**Project Type**: Web application — fullstack change (`backend/src/` + `frontend/src/`).

**Performance Goals**: Guess submission response < 200ms at local dev scale. Polling every 2 seconds (constitution Principle IV).

**Constraints**: No new npm dependencies. No WebSockets. Canvas data NOT synced to server. Single `Guess` type shared via `RoomSnapshot`.

**Scale/Scope**: 2–8 players, single round, in-memory.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | 9 existing files modified, 1 new component added. All existing imports and patterns preserved. |
| II. Spec-Driven Development | ✅ Pass | `spec.md` exists with 13 FRs and 3 user stories. All FRs map to concrete tasks. |
| III. Deterministic Game Rules | ✅ Pass | Guess comparison: `guess.toLowerCase() === word.toLowerCase()`. Score: correct × 100. Both deterministic. |
| IV. Incremental Validation | ✅ Pass | Each user story independently testable in two browser tabs. Polling at exactly 2 seconds. |
| V. Simplicity & Scope | ✅ Pass | No WebSockets, no canvas sync, no new dependencies, no new routing. Canvas is local-only. |

**Post-design re-check**: No violations introduced in Phase 1 design. `DrawingCanvas.tsx` is the only new file and is justified as an isolated UI concern too large to inline in `GamePage.tsx`.

## Project Structure

### Documentation (this feature)

```text
specs/004-guess-scoring-sync/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: decisions and rationale
├── data-model.md        # Phase 1: Guess entity, Score derivation, Room extension
├── contracts/
│   └── api.md           # Phase 1: POST /rooms/:code/guesses + extended GET /rooms/:code
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code

```text
backend/src/
├── models/
│   └── game.ts              # Add Guess interface; add guesses[] to Room; add guesses+scores to RoomSnapshot
├── services/
│   └── roomStore.ts         # Add submitGuess(); update toRoomSnapshot() with guesses+scores
└── api/
    ├── schemas.ts            # Add submitGuessSchema (guesserId UUID + text non-empty)
    └── rooms.ts              # Add POST /:code/guesses handler

frontend/src/
├── services/
│   └── api.ts               # Add Guess/Score types; update RoomSnapshot; add submitGuess() method
├── state/
│   └── roomStore.ts         # Add submitGuess() method to RoomStore class
├── pages/
│   └── GamePage.tsx         # Add polling useEffect; wire DrawingCanvas for drawer
└── components/
    ├── DrawingCanvas.tsx     # NEW — self-contained HTML5 canvas (draw + clear button)
    ├── GuessForm.tsx         # Wire submit to store.submitGuess(); add validation + error; clear on success
    ├── Scoreboard.tsx        # Render actual scores from room.scores[]
    └── ResultPanel.tsx       # Render guess history from room.guesses[]
```

**Structure Decision**: Web application (existing layout). One new component file created; all other changes are modifications to existing files.

## Implementation Notes

### Backend

**`game.ts`** — Add at top level:

```typescript
export interface Guess {
  id: string;
  guesserId: string;
  text: string;       // stored trimmed
  isCorrect: boolean;
  submittedAt: string;
}

export interface Score {
  participantId: string;
  score: number;
}
```

Add `guesses: Guess[]` to `Room`. Add `guesses: Guess[]` and `scores: Score[]` to `RoomSnapshot`.

**`roomStore.ts`** — New `submitGuess()` logic:
- Get room by code; return error if not found or not `active`
- Trim text; compare `text.toLowerCase()` to `STARTER_WORDS[0].toLowerCase()` for `isCorrect`
- Push new `Guess` (with `randomUUID()` id and `now()` timestamp) to `room.guesses`
- `saveRoom(room)` then return the new guess

Update `toRoomSnapshot()` to compute `scores` (one `Score` per participant, value = correct guesses count × 100) and include both `guesses` and `scores` in the returned snapshot.

**`schemas.ts`** — Add:

```typescript
export const submitGuessSchema = z.object({
  guesserId: z.string().uuid(),
  text: z.string().trim().min(1, "Guess text is required")
})
```

**`rooms.ts`** — Add `POST /:code/guesses` handler using `submitGuessSchema`. Return 201 `{ guess }` on success; 404 if room not found; 409 if room not active.

### Frontend

**`api.ts`** — Add `Guess` and `Score` interfaces. Add `guesses: Guess[]` and `scores: Score[]` to `RoomSnapshot`. Add `submitGuess(code, guesserId, text)` method posting to `/rooms/:code/guesses`.

**`roomStore.ts`** — Add `submitGuess(text: string)` to `RoomStore`: reads room/participantId from state, calls `api.submitGuess()` via `withLoading()`.

**`DrawingCanvas.tsx`** — New component:
- `useRef<HTMLCanvasElement>` + `useEffect` to attach `mousedown/mousemove/mouseup/mouseleave` listeners
- Track `isDrawing` with a `useRef<boolean>` (not state — avoids re-renders mid-stroke)
- `handleClear()` calls `ctx.clearRect(0, 0, canvas.width, canvas.height)`
- Renders `<canvas>` + `<button>Clear Canvas</button>`

**`GamePage.tsx`** — Add polling `useEffect` with `setInterval(() => store.fetchRoom(), 2000)` and cleanup `clearInterval` on unmount. Replace the drawer's word-card with `<DrawingCanvas />`.

**`GuessForm.tsx`** — On submit: trim input; show "Please enter a guess." if empty; call `store.submitGuess(trimmed)`; clear input and error on success.

**`Scoreboard.tsx`** — Replace placeholder: render `room?.scores ?? []` sorted descending by score, showing participant name and score.

**`ResultPanel.tsx`** — Replace placeholder: render `room?.guesses ?? []` in order, showing guesser name (lookup from `room.participants`), guess text, and ✓ / ✗ indicator.

## Complexity Tracking

> No constitution violations — table not required.
