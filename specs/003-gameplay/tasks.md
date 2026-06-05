# Tasks: Gameplay & Guessing

**Input**: [plan.md](./plan.md), [spec.md](./spec.md)

## Phase 1: Backend

- [ ] T001 Add active round state and guess history to `backend/src/models/game.ts` and `backend/src/services/roomStore.ts`.
- [ ] T002 Add `guessSchema` validation in `backend/src/api/schemas.ts` for trimmed, non-empty guesses.
- [ ] T003 Implement `POST /rooms/:code/guess` in `backend/src/api/rooms.ts` and return clear errors for invalid input.
- [ ] T004 Score correct guesses as 100 points and incorrect guesses as 0 in the backend service.

## Phase 2: Frontend

- [ ] T005 Add a guess form component in `frontend/src/components/GuessForm.tsx` with client-side validation.
- [ ] T006 Render a drawer-only canvas and clear control in `frontend/src/pages/GamePage.tsx`.
- [ ] T007 Display shared guess history and scoreboard for all players.

## Phase 3: Validation

- [ ] T008 Manually verify a drawer sees the secret word and guessers do not.
- [ ] T009 Confirm correct guesses award 100 points and incorrect guesses award 0.
- [ ] T010 Confirm guess history updates for both players after polling refreshes state.
