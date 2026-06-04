# Tasks: Gameplay Interaction (US3)

## Phase 1: Backend

- [X] T001 Add `updateCanvas` service — drawer guard (403); store `canvasData` in `backend/src/services/roomStore.ts`
- [X] T002 Add `submitGuess` service — drawer guard (403); empty text guard (400); build `Guess`; no-double-score check; `+100` if correct in `backend/src/services/roomStore.ts`
- [X] T003 Add `canvasUpdateSchema` and `submitGuessSchema` in `backend/src/api/schemas.ts`
- [X] T004 Add `POST /:code/canvas` route — calls `updateCanvas`; returns `{ ok: true }` in `backend/src/api/rooms.ts`
- [X] T005 Add `POST /:code/guess` route — calls `submitGuess`; returns snapshot in `backend/src/api/rooms.ts`
- [X] T006 Add backend tests (6 cases) in `backend/src/services/roomStore.test.ts`
- [X] T007 Run `cd backend && npm test` — expect green

## Phase 2: Frontend

- [X] T008 Add `api.submitGuess` and `api.updateCanvas` in `frontend/src/services/api.ts`
- [X] T009 Add `roomStore.submitGuess` and `roomStore.updateCanvas` actions in `frontend/src/state/roomStore.ts`
- [X] T010 Add frontend unit tests for both API methods in `frontend/src/services/api.test.ts`
- [X] T011 Create `DrawingCanvas` component — mouse handlers, `canDraw` gate, `onStrokeEnd`, Clear button, image-load for guesser in `frontend/src/components/DrawingCanvas.tsx`
- [X] T012 Update `GuessForm` — add `onSubmit` prop, empty guard, clear on success in `frontend/src/components/GuessForm.tsx`
- [X] T013 Update `Scoreboard` — render live scores from `room.participants` × `room.scores` in `frontend/src/components/Scoreboard.tsx`
- [X] T014 Wire `GamePage` — `DrawingCanvas`, `GuessForm`, `Scoreboard`; 2s poll while `status === "playing"` in `frontend/src/pages/GamePage.tsx`
- [X] T015 Run `cd frontend && npm test` — expect green

## Validation

- [X] T016 Manual: draw syncs in ~2s; correct guess → 100pts; double → stays 100; empty → client error; drawer form disabled
