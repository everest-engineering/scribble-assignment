# Tasks: Game Start & Drawer Flow

## Phase 1: Artifact Setup

- [X] T001 Create `specs/002-game-start/spec.md`
- [X] T002 Create `specs/002-game-start/plan.md`

## Phase 2: Verification & Testing

- [X] T003 [P] Add a backend integration test in `backend/src/api/rooms.integration.test.ts` specifically asserting that `GET /rooms/:code` with a guesser's `participantId` returns `undefined` for `secretWord`.
- [X] T004 [P] Add a backend integration test in `backend/src/api/rooms.integration.test.ts` specifically asserting that `GET /rooms/:code` with the drawer's `participantId` returns the correct `secretWord`.
- [X] T005 [P] Add a frontend component test in `frontend/src/pages/pages.test.tsx` to verify the "Secret word" block is completely absent from the DOM when `isDrawer` is false.
- [X] T006 [P] Verify that the game title and round indicator are correctly displayed on `GamePage.tsx`.

## Phase 3: Final Validation

- [X] T007 Manually verify Scenario 2 flow in two browser tabs.
