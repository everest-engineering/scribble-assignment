# Tasks: Room Setup & Lobby

**Feature**: Room Setup & Lobby
**Branch**: 001-room-setup-lobby

## Phase 1 — Setup

- [ ] T001 Create `specs/001-room-setup-lobby/tasks.md` and confirm feature metadata in `.specify/feature.json` (specs/001-room-setup-lobby/tasks.md)

## Phase 2 — Foundational (BLOCKS user stories)

- [x] T002 Update Room model to include `hostParticipantId` (backend/src/models/game.ts)
- [x] T003 Set host on room creation and preserve on join in `roomStore.ts` (backend/src/services/roomStore.ts)
- [x] T004 Include host identity in room snapshot returned by `toRoomSnapshot()` (backend/src/services/roomStore.ts)
- [x] T005 Ensure `GET /rooms/:code` returns host-aware snapshot (backend/src/api/rooms.ts)
- [x] T006 Add backend tests for host assignment, join failures, and snapshot contents (backend/src/services/roomStore.test.ts)

## Phase 3 — User Stories (Priority order)

### User Story 1 — Create and host a room (Priority: P1)

- [x] T007 [US1] Persist `participantId` in browser storage (localStorage) in `roomStore.ts` so refresh preserves host identity (frontend/src/state/roomStore.ts)
- [x] T008 [US1] Trim and validate display name on `CreateRoomPage.tsx` and call `roomStore.createRoom(playerName)` (frontend/src/pages/CreateRoomPage.tsx)
- [x] T009 [US1] Add frontend test covering create-room flow and `participantId` persistence (frontend/src/services/api.test.ts)
- [x] T010 [US1] Show room code prominently via `RoomCodeBadge.tsx` after creation (frontend/src/components/RoomCodeBadge.tsx)

### User Story 2 — Join an existing room by code (Priority: P2)

- [x] T011 [US2] Trim/uppercase and validate `roomCode` and `playerName` in `JoinRoomPage.tsx` (frontend/src/pages/JoinRoomPage.tsx)
- [x] T012 [US2] Ensure `api.joinRoom()` handles invalid codes gracefully and surfaces readable errors (frontend/src/services/api.ts)
- [x] T013 [US2] Add frontend tests for join flow success and invalid-code rejection (frontend/src/services/api.test.ts)

### User Story 3 — Lobby polling and room isolation (Priority: P3)

- [x] T014 [US3] Implement polling in `LobbyPage.tsx` to call `roomStore.fetchRoom()` every 2 seconds while mounted (frontend/src/pages/LobbyPage.tsx)
- [x] T015 [US3] Display host identity in the participant list and mark host visually (frontend/src/pages/LobbyPage.tsx)
- [x] T016 [US3] Make Start Game button host-only and enable it only when `room.participants.length >= 2` (frontend/src/pages/LobbyPage.tsx)
- [x] T017 [US3] Prevent non-hosts from navigating to `/game` from the lobby (frontend/src/pages/LobbyPage.tsx or frontend/src/routes/index.tsx)
- [x] T018 [US3] Add tests that simulate lobby polling and verify participant list updates within 2s (frontend/src/pages/LobbyPage.test.tsx)


## Final Phase — Polish & Cross-Cutting Concerns

- [ ] T019 Accessibility: Ensure forms and error messages meet WCAG 2.1 AA (frontend/src/pages/CreateRoomPage.tsx, frontend/src/pages/JoinRoomPage.tsx)
- [ ] T020 Coverage: Add/adjust Vitest tests to reach 80% coverage for modified modules (frontend and backend tests)
- [ ] T023 Bundle-size: Verify production client build is within the 150KB budget (run `npm run build` in `frontend/` and measure gzipped JS size); add remediation tasks if exceeded. (frontend/ - build verification)
- [ ] T024 Isolation: Add test to verify cross-room isolation — create two rooms and assert participants from one room are not visible in the other (backend and frontend integration/unit tests as appropriate). (backend/src/services/roomStore.test.ts, frontend/src/pages/LobbyPage.test.tsx)
- [ ] T021 Documentation: Update `specs/001-room-setup-lobby/plan.md` and `specs/001-room-setup-lobby/spec.md` with implementation notes (specs/001-room-setup-lobby/plan.md)
- [ ] T022 Commit: Commit completed work and reference spec artifact; run `speckit.git.commit` if auto-commit is configured (repo root)

## Dependencies

- Phase 2 tasks (T002..T006) block Phase 3 tasks that rely on host-aware snapshots.
- T007 must be implemented before T009 and T014 (so participantId is present for polling & tests).
- T014 (polling) depends on T004/T005 (backend snapshot) and T007 (participantId storage).

## Parallel Work

- [P] T009 and T013 (frontend tests) can be written in parallel by different engineers.
- [P] T019 (accessibility checks) and T020 (test coverage) can be worked in parallel after core behavior is implemented.

## Acceptance / Done Criteria

- All tasks completed and tests passing.
- Manual verification: two browser tabs can create/join the same room, show lobby updates within ~2s, and only the host can start the game.
- Vitest coverage for modified modules >= 80%.
- Spec and plan updated and committed.
