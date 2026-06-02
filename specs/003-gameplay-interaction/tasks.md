# Tasks: Gameplay Interaction

## Phase 1: Verification & Backend Testing

- [X] T001 [P] Add backend unit tests in `backend/src/services/roomStore.test.ts` for `appendDrawing` and `clearDrawing`.
- [X] T002 [P] Add backend integration tests in `backend/src/api/rooms.integration.test.ts` for correct/incorrect guess submission and verify scoring (+100).
- [X] T003 [P] Add backend integration tests verifying the room status transitions from `active` to `results` upon a correct guess.

## Phase 2: Frontend Verification

- [X] T004 [P] Add frontend component tests in `frontend/src/components/ui.test.tsx` ensuring `GuessForm` is disabled for the drawer.
- [X] T005 [P] Add frontend component tests in `frontend/src/components/ui.test.tsx` ensuring `DrawingCanvas` is read-only for guessers.
- [X] T006 [P] Verify that `ResultPanel` displays the correct winner message when `room.status` is `results`.

## Phase 3: Final Validation

- [X] T007 Manually verify drawing synchronization between two tabs (drawer stroke finish -> guesser refresh).
- [X] T008 Manually verify that a correct guess immediately stops the round and awards points.
