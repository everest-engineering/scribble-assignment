# Implementation Plan: Active Round Drawing, Guessing, and Scoring

**Branch**: `003-round-draw-guess` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

## Summary

During `drawing` status: drawer updates **canvas** (draw/clear) with immediate local feedback; **guessers** submit trimmed guesses (case-insensitive match, empty rejected); **scores** (+100 correct, +0 incorrect) and **guess history** sync to all clients via **~2s HTTP polling**. Brownfield: extend `roomStore`, add canvas/guess routes, replace placeholders on `GamePage`.

## Technical Context

**Language/Version**: TypeScript (Node + React 18)  
**Primary Dependencies**: Express, Zod, Vite, HTML Canvas API  
**Storage**: In-memory room state (strokes, guesses, scores on `Room`)  
**Testing**: Unit tests for guess comparison/scoring; contract tests for canvas/guess endpoints  
**Constraints**: No WebSockets; polling only; constitution scoring 100/0; no secret word leak to guessers  
**Depends on**: `002-first-round-drawer` (active round, drawer, `secretWord`, roles)

## Constitution Check

*GATE: Pass*

| Principle | Compliance |
|-----------|------------|
| Game Logic | Trim guesses; case-insensitive compare; exactly 100/0 scoring |
| V. Testing | Test-first for `compareGuess`, `submitGuess`, canvas guards |
| No WebSockets | Poll `GET /rooms/:code` every 2000ms on game screen |

## Project Structure

### Documentation

```text
specs/003-round-draw-guess/
├── plan.md, spec.md, research.md, data-model.md
├── contracts/gameplay-api.md, quickstart.md
└── tasks.md
```

### Source Code

```text
backend/src/
├── api/rooms.ts, schemas.ts
├── models/game.ts
├── services/roomStore.ts
└── services/guessLogic.ts          (new)

frontend/src/
├── components/DrawingCanvas.tsx    (new)
├── components/GuessHistory.tsx     (new)
├── components/GuessForm.tsx, Scoreboard.tsx
├── pages/GamePage.tsx
├── state/roomStore.ts
└── services/api.ts
```

## Gap Analysis

| Requirement | Starter | Action |
|-------------|---------|--------|
| FR-001–004 Canvas | Placeholder div | `DrawingCanvas` + `PUT` canvas + poll |
| FR-005–009 Guesses | Form no-op | `POST` guess + validation |
| FR-010–011 Scores | Static 0 UI | `score` on participant; update on guess |
| FR-012–013 History | None | `guesses[]` in snapshot |
| FR-014 No word leak | `availableWords` exposed | Remove from guesser view; history shows correct/incorrect only |

## Out of Scope (this feature)

- Transition to `result` on first correct guess → `004-result-restart-lobby`
- Round timer, eraser tool, partial undo

## Implementation Sequence

1. Models: `CanvasStroke`, `Guess`, `score`, `canvasStrokes`, `guesses[]`
2. `guessLogic.ts`: trim, compare, score delta
3. `updateCanvas`, `submitGuess` in roomStore with role guards
4. API routes + Zod
5. Tests
6. Frontend canvas, guess form, history, scoreboard, game poll

## Testing Strategy

- Unit: empty guess rejected; case-insensitive match; +100/0; drawer cannot guess
- Contract: guesser GET has no `secretWord`; canvas update 403 for guesser
- Manual: two-browser quickstart

## Complexity Tracking

No constitution violations.
