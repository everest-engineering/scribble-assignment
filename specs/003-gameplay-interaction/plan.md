# Implementation Plan: Drawing, Guessing, and Scoring

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-02 | **Spec**: `/specs/003-gameplay-interaction/spec.md`

## Summary

Implement interactive drawing (canvas), drawing clear, guess submission with empty rejection and case-insensitive comparison, synchronized guess history, 100-point scoring on first correct guess, and round-end transition to result state.

## Technical Context

**Language/Version**: TypeScript (backend Node.js/Express, frontend React/Vite)

**Primary Dependencies**: Express, Zod (backend); React, plain HTML Canvas (frontend)

**Storage**: In-memory — drawing and guesses held in RoundState on Room object

**Testing**: Vitest (backend unit tests + frontend API tests), manual two-tab validation

**Constraints**: No WebSockets; no external canvas library; drawing stored as full snapshot replacement

## Constitution Check

- Backend as source of truth: PASS — all strokes, guesses, scores validated and stored on backend.
- Deterministic/testable behavior: PASS — `trim().toLowerCase()` comparison, 100/0 scoring rule.
- Clear user-facing validation: PASS — empty guess rejection, drawer/guesser permission errors.

## Project Structure

```
specs/003-gameplay-interaction/
├── spec.md
├── plan.md
└── tasks.md
```

### Source files to modify

```
backend/src/
├── api/schemas.ts              — add updateDrawingSchema, clearDrawingSchema, submitGuessSchema
├── api/rooms.ts                — add drawing, clear, guesses routes
├── services/roomStore.ts       — add updateDrawing, clearDrawing, submitGuess functions
└── services/roomStore.test.ts  — add tests for all gameplay actions

frontend/src/
├── services/api.ts             — add updateDrawing, clearDrawing, submitGuess methods
├── state/roomStore.ts          — add updateDrawing, clearDrawing, submitGuess store methods
├── pages/GamePage.tsx          — wire canvas and guess form to store
├── components/Canvas.tsx       — new interactive canvas component
├── components/GuessForm.tsx    — wire submit, client-side validation
├── components/ResultPanel.tsx  — render guess history list
└── components/Scoreboard.tsx   — update with polling data
```

## Implementation Steps

1. Add Zod schemas for drawing update, drawing clear, and guess submission.
2. Add `updateDrawing()`, `clearDrawing()`, `submitGuess()` service functions with permission checks.
3. Wire routes for `POST /:code/drawing`, `POST /:code/drawing/clear`, `POST /:code/guesses`.
4. Add frontend API methods and store actions.
5. Build Canvas component using HTML Canvas API (drawer mode: interactive; guesser mode: read-only).
6. Wire GuessForm submit handler with client-side trim + empty check.
7. Render guess history in ResultPanel.
8. Render real scores in Scoreboard.

## Risks

- Drawing snapshot replacement: if multiple rapid strokes are sent, the full-replace model ensures consistency at the cost of potential lost strokes on concurrent edits (mitigated by single-drawer constraint).
- Polling-based guess sync: correct guess triggers result transition; all clients see it within 2 seconds.
