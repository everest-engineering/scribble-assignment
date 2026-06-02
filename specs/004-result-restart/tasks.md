# Tasks: Result, Restart & Final Validation

## Phase 1: Backend Refinement & Testing

- [X] T001 [P] Update `restartRoom` in `backend/src/services/roomStore.ts` to reset all participant scores to zero.
- [X] T002 [P] Update `backend/src/services/roomStore.test.ts` to assert that scores are zeroed out after a restart.
- [X] T003 [P] Add a backend integration test in `backend/src/api/rooms.integration.test.ts` verifying the full restart flow via API.

## Phase 2: Frontend Verification

- [X] T004 [P] Add a frontend component test in `frontend/src/pages/pages.test.tsx` verifying that the "Restart Round" button is visible only to the host in the `results` state.
- [X] T005 [P] Add a frontend component test verifying that the correct secret word is displayed to all players when `room.status` is `results`.

## Phase 3: Final Validation & Cleanup

- [X] T006 Manually verify Scenario 4 flow in two browser tabs (End round -> Result view -> Restart -> Lobby with zero scores).
- [X] T007 Final review of all Spec Kit artifacts and implementation consistency.
- [X] T008 Perform build validation for both frontend and backend.
