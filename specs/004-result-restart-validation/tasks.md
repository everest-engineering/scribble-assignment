---

description: "Task list for result state and restart"

# Tasks: Result State and Restart

**Input**: Design documents from `/specs/004-result-restart-validation/`

## Phase 1: Backend — Result visibility and restart

- [ ] T048 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to reveal secret word to all viewers in result phase
- [ ] T049 Add `restartRoom()` in `backend/src/services/roomStore.ts` — host-only, validate "result" status, clear round, preserve participants/scores
- [ ] T050 Wire `POST /:code/restart` route in `backend/src/api/rooms.ts`
- [ ] T051 Add tests for restartRoom (validation errors, state clearing, participant preservation) and result-phase toRoomSnapshot (word visible to all) in `backend/src/services/roomStore.test.ts`

## Phase 2: Frontend — Result display and restart action

- [ ] T052 Add `restartGame()` method to `frontend/src/services/api.ts`
- [ ] T053 Add `restartGame()` store method to `frontend/src/state/roomStore.ts`
- [ ] T054 Update GamePage.tsx to show result card (correct word, winner name) in result state
- [ ] T055 Add host-only restart button in GamePage.tsx result state
- [ ] T056 Add auto-redirect to lobby on room status change to "lobby" in GamePage.tsx

## Phase 3: Validation

- [ ] T057 Add API test for restartGame in `frontend/src/services/api.test.ts`
- [ ] T058 Manual two-tab validation: finish round, verify result in both tabs, host restarts, verify lobby return with preserved players and cleared round state
- [ ] T059 Run backend and frontend test suites
