# Tasks: Result, Restart & Final Validation

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Backend — Round End on Correct Guess

- [x] T001 Update `submitGuess()` in `backend/src/services/roomStore.ts` to set round status to "revealed" and room status to "round_end" when a correct guess is submitted
- [x] T002 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to expose `secretWord` to all viewers when room status is "round_end" or "game_over"
- [x] T003 Update `submitGuess()` to reject guesses when round status is not "drawing" (i.e., round already ended)

## Phase 2: Backend — Next Round & Game Over

- [x] T004 Add `participantOnlySchema` (participantId required) in `backend/src/api/schemas.ts`
- [x] T005 Add `nextRound()` to `backend/src/services/roomStore.ts` — validate host, rotate drawer, pick next word, clear canvas; if all participants have been drawer, set "game_over" instead
- [x] T006 Add `POST /:code/next-round` route handler in `backend/src/api/rooms.ts`

## Phase 3: Backend — Restart

- [x] T007 Add `restartGame()` to `backend/src/services/roomStore.ts` — reset scores to 0, clear rounds, set status to "lobby"
- [x] T008 Add `POST /:code/restart` route handler in `backend/src/api/rooms.ts`

## Phase 4: Backend Tests

- [x] T009 [P] Add backend tests for `submitGuess()` round-end behavior (correct guess ends round, secret word revealed, duplicate guesses rejected)
- [x] T010 [P] Add backend tests for `nextRound()` (new drawer, new word, empty canvas, game_over detection, non-host rejection)
- [x] T011 [P] Add backend tests for `restartGame()` (scores reset, rounds cleared, status back to lobby, non-host rejection)

## Phase 5: Frontend — API & Store

- [x] T012 Add `nextRound()` and `restartGame()` to `frontend/src/services/api.ts`
- [x] T013 Add `nextRound()` and `restartGame()` methods to `frontend/src/state/roomStore.ts`

## Phase 6: Frontend — UI Integration

- [x] T014 Update `GamePage.tsx` to show round results (revealed word, correct guesser) when room status is "round_end"
- [x] T015 Update `GamePage.tsx` to show "Next Round" button for host when room status is "round_end"
- [x] T016 Update `GamePage.tsx` to show final scores and "Restart Game" button for host when room status is "game_over"
