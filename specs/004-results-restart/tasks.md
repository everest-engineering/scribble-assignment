# Tasks: Results & Restart

**Input**: [plan.md](./plan.md), [spec.md](./spec.md)

## Phase 1: Backend

- [ ] T001 Add `result` status to room lifecycle in `backend/src/models/game.ts` and `backend/src/services/roomStore.ts`.
- [ ] T002 Implement `restartGame(code, participantId)` in `backend/src/services/roomStore.ts` with host-only guard.
- [ ] T003 Add `POST /rooms/:code/restart` in `backend/src/api/rooms.ts` and restart schema validation in `backend/src/api/schemas.ts`.

## Phase 2: Frontend

- [ ] T004 Add a shared result panel component in `frontend/src/components/ResultPanel.tsx`.
- [ ] T005 Render the result state in `frontend/src/pages/GamePage.tsx` and show a host-only restart button.
- [ ] T006 Ensure UI returns to the lobby after restart and that the participant roster remains intact.

## Phase 3: Validation

- [ ] T007 Confirm the result state shows the same word and guess history for all players.
- [ ] T008 Confirm only the host can restart and that restart clears the previous round state.
