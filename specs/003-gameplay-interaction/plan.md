# Implementation Plan: Gameplay Interaction

**Branch**: `scribble-lab` (spec dir `003-gameplay-interaction`) | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Add drawing (vector strokes), clear-canvas, and guess submission with
deterministic scoring, all synced through the existing 2s snapshot poll. Strokes,
guesses, and scores live on the room and appear in the snapshot. The drawer draws
and clears; guessers submit validated, case-insensitive guesses scored 100/0; all
players see a shared history and scoreboard. Round stays `playing` (Scenario 4
owns the finish/restart).

## Technical Context

**Language/Version**: TypeScript (Node 18+ / React 18).
**Primary Dependencies**: Express + Zod; React + React Router v6; native Canvas
API (no new deps).
**Storage**: In-memory `Map`.
**Testing**: Vitest (store + schemas) + manual two-tab.
**Constraints**: Polling only; in-memory; deterministic scoring (100/0).

## Constitution Check

- **I. Brownfield-First** — PASS. Extends model/store/schemas/routes + existing
  components; one new component `DrawingCanvas`. No new libraries.
- **II. Spec-Driven** — PASS. specify → clarify → plan complete; tasks trace FRs.
- **III. Deterministic Game Rules** — PASS. Scoring fixed 100/0; case-insensitive
  trimmed compare; no randomness.
- **IV. Polling-Only** — PASS. Strokes/guesses/scores sync via the 2s snapshot;
  drawer POSTs stroke on pointer-up (request, not push).
- **V. Incremental Validation** — PASS. Builds + tests + two-tab before Scenario 4.
- **VI. AI Review Discipline** — PASS. Granular commits, reviewed, no co-author.

No violations → Complexity Tracking empty.

## State Model

### Backend (`backend/src/models/game.ts`)

```
Point  = { x: number; y: number }       // normalized 0..1
Stroke = Point[]
Guess  = { participantId: string; name: string; text: string;
           correct: boolean; at: string }

Room (extended) {
  ...existing
  strokes: Stroke[]                      // NEW
  guesses: Guess[]                       // NEW
  scores: Record<string, number>        // NEW — participantId -> score
}

RoomSnapshot (extended) {
  ...existing
  strokes: Stroke[]                      // NEW
  guesses: Guess[]                       // NEW
  scores: Record<string, number>        // NEW
}
```

`createRoom`/`joinRoom` initialize `scores[participant.id] = 0`; `strokes`/
`guesses` start empty.

### Store (`backend/src/services/roomStore.ts`)

- `addStroke(code, requesterId, stroke)` — drawer-only; append; return room.
- `clearCanvas(code, requesterId)` — drawer-only; empty strokes; return room.
- `submitGuess(code, requesterId, text)` — validate (trim/non-empty, not drawer,
  known participant); compare case-insensitively to `STARTER_WORDS[wordIndex]`;
  set score 100 once if correct; append to `guesses`; return room or typed error.

### Frontend

- `api.ts`: extend snapshot type; add `addStroke`, `clearCanvas`, `submitGuess`.
- `state/roomStore.ts`: add `addStroke`, `clearCanvas`, `submitGuess`.
- New `components/DrawingCanvas.tsx`: renders `strokes`; if drawer, captures
  pointer strokes (normalized) and calls `onStrokeComplete` on pointer-up; if
  guesser, read-only.
- `GamePage.tsx`: use `DrawingCanvas` (drawer vs read-only), Clear button for the
  drawer, pass guess-submit to `GuessForm`, real `Scoreboard`/`ResultPanel`.
- `GuessForm.tsx`: trim + reject empty; call submit; show inline error.
- `Scoreboard.tsx`: render `scores` sorted desc with names.
- `ResultPanel.tsx`: render `guesses` history with ✓/✗.

## Data Flow

1. **Draw**: drawer pointer-down→move accumulates normalized points; pointer-up →
   `POST /strokes` with the stroke → room appended. Guessers' poll picks up the
   new `strokes` and renders them.
2. **Clear**: drawer → `POST /clear-canvas` → strokes emptied → all see empty.
3. **Guess**: guesser → `GuessForm` trims, blocks empty → `POST /guess` → backend
   validates + scores + appends history → snapshot. Everyone's poll shows updated
   history + scores.

## File-Level Plan

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `Point`, `Stroke`, `Guess`; extend `Room` + `RoomSnapshot` with `strokes`, `guesses`, `scores`. |
| `backend/src/services/roomStore.ts` | Init `scores`/`strokes`/`guesses`; `addStroke`, `clearCanvas`, `submitGuess`; include new fields in snapshot. |
| `backend/src/api/schemas.ts` | Schemas for stroke, clear, guess bodies. |
| `backend/src/api/rooms.ts` | `POST /:code/strokes`, `/:code/clear-canvas`, `/:code/guess`. |
| `backend/src/services/roomStore.test.ts` | Tests: guess validation/scoring/case-insensitive/drawer-reject; clear; init scores 0. |
| `frontend/src/services/api.ts` | Extend snapshot type; add 3 calls. |
| `frontend/src/state/roomStore.ts` | Add 3 store methods. |
| `frontend/src/components/DrawingCanvas.tsx` | NEW canvas component (draw + read-only). |
| `frontend/src/components/GuessForm.tsx` | Wire to submit + validation + error. |
| `frontend/src/components/Scoreboard.tsx` | Render real scores sorted desc. |
| `frontend/src/components/ResultPanel.tsx` | Render guess history with ✓/✗. |
| `frontend/src/pages/GamePage.tsx` | Use canvas + clear + wired components. |

## Testing Strategy

- **Unit (vitest)**: scores init 0; correct guess → 100 (and capped at 100);
  incorrect → unchanged; "  Rocket " matches `rocket`; empty rejected; drawer
  rejected; clearCanvas empties strokes; addStroke drawer-only.
- **Manual two-tab**: draw on drawer → appears on guesser ≤2s read-only; clear;
  guess flows; scoreboard + history sync.
- **Builds**: backend + frontend zero errors.

## Risks

- **Canvas coordinate alignment**: use normalized 0–1 points so different canvas
  sizes render consistently.
- **Score double-count**: guard so a repeat correct guess stays at 100.
- **Snapshot size**: vector strokes keep payloads modest; acceptable for the lab.
- **Pointer events**: use Pointer Events for mouse/touch; cleanup listeners on
  unmount.

## Project Structure

```text
specs/003-gameplay-interaction/
├── spec.md
├── plan.md
├── checklist.md
├── tasks.md
└── analysis.md
```

**Structure Decision**: Reuse existing layout; one new component, three new
endpoints.

## Complexity Tracking

No constitution violations — none.
