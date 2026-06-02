---

description: "Task list for drawing, guessing, and scoring"

# Tasks: Drawing, Guessing, and Scoring

**Input**: Design documents from `/specs/003-gameplay-interaction/`

## Phase 1: Backend — Drawing and guess endpoints

- [ ] T030 Add `updateDrawingSchema`, `clearDrawingSchema`, `submitGuessSchema` in `backend/src/api/schemas.ts`
- [ ] T031 Add `updateDrawing()` in `backend/src/services/roomStore.ts` — drawer-only, full stroke replacement
- [ ] T032 Add `clearDrawing()` in `backend/src/services/roomStore.ts` — drawer-only, reset to empty array
- [ ] T033 Add `submitGuess()` in `backend/src/services/roomStore.ts` — drawer rejection, trim + lowercase comparison, 100/0 scoring, result transition
- [ ] T034 Wire `POST /:code/drawing`, `POST /:code/drawing/clear`, `POST /:code/guesses` routes in `backend/src/api/rooms.ts`
- [ ] T035 Add tests for drawing permissions, guess validation, scoring, and result transition in `backend/src/services/roomStore.test.ts`

## Phase 2: Frontend — Canvas component

- [ ] T036 Create `Canvas.tsx` component with HTML Canvas API in `frontend/src/components/Canvas.tsx`
- [ ] T037 Implement mouse event handlers (down/move/up) for drawer drawing mode in `Canvas.tsx`
- [ ] T038 Implement read-only rendering for guesser and result states in `Canvas.tsx`
- [ ] T039 Wire Canvas to store via `onStrokesChange` callback in `GamePage.tsx`
- [ ] T040 Add clear button for drawer in `GamePage.tsx`

## Phase 3: Frontend — Guess and history

- [ ] T041 Wire GuessForm submit to store `submitGuess()` in `frontend/src/pages/GamePage.tsx`
- [ ] T042 Add client-side trim + empty validation with error display in `frontend/src/components/GuessForm.tsx`
- [ ] T043 Update `ResultPanel.tsx` to render real guess history from room state
- [ ] T044 Add `updateDrawing`, `clearDrawing`, `submitGuess` methods to `frontend/src/state/roomStore.ts`
- [ ] T045 Add `updateDrawing`, `clearDrawing`, `submitGuess` methods to `frontend/src/services/api.ts`

## Phase 4: Validation

- [ ] T046 Manual two-tab validation: drawer draws/clears, guesser submits blank/wrong/correct guesses, history syncs, scoring is correct
- [ ] T047 Run backend and frontend test suites
