# Tasks: Gameplay Interaction

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 Add `Guess`, `Drawing` types and update `Round` with `guesses`, `drawing`, `hasCorrectGuess` in `backend/src/models/game.ts`
- [x] T002 [P] Update `RoomSnapshot` with `guesses` and `drawing` in `backend/src/models/game.ts`
- [x] T003 [P] Update frontend `RoomSnapshot` type in `frontend/src/services/api.ts` with new fields

## Phase 2: Backend Services

- [x] T004 Add `guessSchema` (participantId required, text trimmed min 1) in `backend/src/api/schemas.ts`
- [x] T005 Add `submitGuess()` to `backend/src/services/roomStore.ts`
- [x] T006 Add `saveDrawing()` to `backend/src/services/roomStore.ts`
- [x] T007 Update `toRoomSnapshot()` to include `guesses` and `drawing` in `backend/src/services/roomStore.ts`
- [x] T008 Update `startGame()` to initialize `guesses`, `drawing`, `hasCorrectGuess` in `backend/src/services/roomStore.ts`

## Phase 3: Backend Routes

- [x] T009 Add `POST /:code/guess` route handler in `backend/src/api/rooms.ts`
- [x] T010 Add `POST /:code/drawing` route handler in `backend/src/api/rooms.ts`

## Phase 4: Frontend — Guess Form & Scoreboard

- [x] T011 Update `GuessForm.tsx` to accept `onSubmit` prop and submit to store
- [x] T012 Update `Scoreboard.tsx` to accept and display real participant scores
- [x] T013 Create `Canvas.tsx` component in `frontend/src/components/Canvas.tsx`
- [x] T014 Add `submitGuess()` and `saveDrawing()` to `frontend/src/services/api.ts`
- [x] T015 Add `submitGuess()` and `saveDrawing()` methods to `frontend/src/state/roomStore.ts`

## Phase 5: GamePage Integration

- [x] T016 Update `GamePage.tsx` to integrate Canvas, wire GuessForm, pass scores/guesses to children

## Phase 6: Polish & Testing

- [x] T017 [P] Add backend tests for `submitGuess()` (correct, incorrect, empty, drawer-guard)
- [x] T018 [P] Add backend tests for `saveDrawing()` (drawer succeeds, guesser rejected)
