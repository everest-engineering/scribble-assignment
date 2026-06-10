# Tasks: Result, Restart & Final Validation

**Feature**: Result, Restart & Final Validation
**Branch**: 004-result-restart

## Phase 1 — Backend restart logic (BLOCKS US1, US2)

- [x] T301 Add `restartRoom(code, callerParticipantId)` to roomStore with host validation + status check (backend/src/services/roomStore.ts)
- [x] T302 Update `toRoomSnapshot()` to reveal secretWord to ALL viewers when status is `"result"` (backend/src/services/roomStore.ts)
- [x] T303 Add `POST /rooms/:code/restart` route with 403/400 error responses (backend/src/api/rooms.ts)
- [x] T304 Add `restartGameSchema` to schemas (backend/src/api/schemas.ts)
- [x] T305 Add backend tests: successful restart, non-host rejection, wrong-status rejection, state cleared, participants preserved (backend/src/services/roomStore.test.ts)

## Phase 2 — Frontend API & store (BLOCKS US2)

- [x] T306 Add `api.restartGame(code, participantId)` to API service (frontend/src/services/api.ts)
- [x] T307 Add `restartGame()` method to RoomStore (frontend/src/state/roomStore.ts)

## Phase 3 — User Story 1: All players see result state (Priority: P1)

- [x] T308 [US1] Add result view to GamePage when `room.status === "result"`: revealed word, final scores, full guess history (frontend/src/pages/GamePage.tsx)
- [x] T309 [US1] Update Scoreboard to accept `scores` and `drawerParticipantId` props for result display (frontend/src/components/Scoreboard.tsx)
- [x] T310 [US1] Update ResultPanel to show revealed word + guess history in result mode (frontend/src/components/ResultPanel.tsx)

## Phase 4 — User Story 2: Host restarts the game (Priority: P1)

- [x] T311 [US2] Add "Restart Game" button in result view, visible only to host (frontend/src/pages/GamePage.tsx)
- [x] T312 [US2] Show "Waiting for the host to restart..." message to non-hosts (frontend/src/pages/GamePage.tsx)
- [x] T313 [US2] Wire restart button to call `roomStore.restartGame()`, navigate to `/lobby` on success (frontend/src/pages/GamePage.tsx)

## Phase 5 — User Story 3: Full round-trip verification (Priority: P2)

- [x] T314 [US3] Ensure LobbyPage restores correctly after restart: `status: "lobby"`, participants intact, start button enabled (frontend/src/pages/LobbyPage.tsx)
- [x] T315 [US3] Verify host can start a new game after restart: fresh canvas, empty guesses, reset scores, new word (manual check)

## Phase 6 — Edge Cases

- [x] T316 Non-host sends `POST /rooms/:code/restart` → 403 `not_host` (backend/src/services/roomStore.test.ts)
- [x] T317 Host tries restart from `"lobby"` status → 400 `cannot_restart` (backend/src/services/roomStore.test.ts)
- [x] T318 Player joins room in `"result"` status → sees result data (snapshot includes completed round)
- [x] T319 Host refreshes during result → restoreRoomSession shows same result data (frontend/src/state/roomStore.ts)
- [x] T320 Scores reset to 0 on restart, round state cleared (backend/src/services/roomStore.test.ts)

## Phase 7 — Polish & Cross-Cutting

- [x] T321 Coverage: Add/adjust Vitest tests to reach 80% coverage for modified modules
- [x] T322 Bundle-size: Verify production client build is within 150KB budget — 59KB ✓
- [x] T323 Documentation: Update spec and plan with implementation notes
- [x] T324 Commit: Commit completed work and reference spec artifact

## Dependencies

- T301 (restartRoom) blocks T303 (API route).
- T303 (restart route) blocks T306..T307 (frontend API/store).
- T306..T307 (frontend API/store) block T311..T313 (restart button wiring).

## Parallel Work

- [P] T305 (backend tests) and T321 (coverage) can be written in parallel.
- [P] T308..T310 (result view) and T311..T313 (restart wiring) can be worked in parallel after backend is ready.

## Acceptance / Done Criteria

- All tasks completed and tests passing.
- Manual verification: two browser tabs complete lobby → start → draw → guess correct → see result → restart → lobby → start again.
- Vitest coverage for modified modules >= 80%.
- Spec and plan updated and committed.
