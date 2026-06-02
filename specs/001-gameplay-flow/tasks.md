# Tasks: Gameplay Flow Build-Out (001-gameplay-flow)

**Input**: Design documents from `/specs/001-gameplay-flow/`

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create task list and plan for gameplay feature — specs/001-gameplay-flow/plan.md
- [x] T002 Install project dependencies (backend/frontend) — run in repo root: `npm install` in `backend/` and `frontend/`
- [x] T003 [P] Configure linting and formatting (prettier/eslint) — .eslintrc / package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Update backend game models — backend/src/models/game.ts
- [x] T005 Add room lifecycle functions & endpoints — backend/src/services/roomStore.ts, backend/src/api/rooms.ts
- [x] T006 Add Zod schemas for start/guess/restart — backend/src/api/schemas.ts
- [x] T007 Extend frontend API with server actions — frontend/src/services/api.ts
- [x] T008 Update frontend store and add polling — frontend/src/state/roomStore.ts

---

## Phase 3: User Story 1 - Hosted room setup and validation (Priority: P1)

Goal: Create/join flows with validation and host assignment.

- [x] T009 [US1] Add client-side create/join validation — frontend/src/pages/CreateRoomPage.tsx, frontend/src/pages/JoinRoomPage.tsx
- [x] T010 [US1] Enforce server-side validation for create/join — backend/src/api/schemas.ts
- [x] T011 [US1] Mark room creator as host and expose hostId in snapshot — backend/src/services/roomStore.ts

Independent Test: Create a room, confirm host badge and room code, join from second tab, reject invalid codes.

---

## Phase 4: User Story 2 - Lobby polling and host-only start (Priority: P2)

Goal: Lobby auto-refresh and host-only start control.

- [x] T012 [US2] Implement lobby polling (~2s) to fetch room snapshot — frontend/src/state/roomStore.ts
- [x] T013 [US2] Add host-only Start Game endpoint and UI wiring — backend/src/api/rooms.ts, frontend/src/pages/LobbyPage.tsx
- [x] T014 [US2] Disable start until >=2 players — frontend/src/pages/LobbyPage.tsx

Independent Test: Two tabs join, lobby updates within ~2s, only host can start.

---

## Phase 5: User Story 3 - Round start, secret word visibility, and guessing (Priority: P2)

Goal: Assign drawer, show secret word only to drawer, accept trimmed guesses.

- [x] T015 [US3] Implement `startRound` server logic (drawer selection, round state) — backend/src/services/roomStore.ts
- [x] T016 [US3] Reveal `secretWord` only to drawer in snapshot — backend/src/services/roomStore.ts
- [x] T017 [US3] Implement guess submission endpoint and normalization — backend/src/api/rooms.ts, backend/src/api/schemas.ts
- [x] T018 [US3] Wire `GuessForm` to submit trimmed guesses and show errors — frontend/src/components/GuessForm.tsx

Independent Test: Start round, drawer sees word, guessers do not, trimmed guesses accepted.

---

## Phase 6: User Story 4 - Results, scoring, and restart flow (Priority: P3)

Goal: Show results with scores and allow host to restart a round.

 - [x] T019 [US4] Add scoring (100 points on correct guess) and result transition — backend/src/services/roomStore.ts
 - [x] T020 [US4] Implement restart endpoint and UI (host-only) — backend/src/api/rooms.ts, frontend/src/pages/GamePage.tsx or ResultPanel
 - [x] T021 [US4] Ensure scoreboard displays cumulative scores — frontend/src/components/Scoreboard.tsx

Independent Test: Complete a round, verify results show correct word and scores; host restarts and returns to lobby.

---

## Phase 7: Tests & Verification

 - [x] T022 Add backend Vitest unit/integration tests for `startRound`, `submitGuess`, and `restartRound` — backend/src/services/roomStore.test.ts
- [ ] T023 Add frontend tests (optional) for polling and GuessForm behavior — frontend/src/services/api.test.ts, frontend/src/components/GuessForm.test.tsx
- [x] T024 Manual smoke verification performed (create → join → start → guess → results → restart)

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T025 Documentation: update `specs/001-gameplay-flow/quickstart.md` with manual verification steps
- [ ] T026 Code cleanup and small refactors (types, naming) — across `backend/src` and `frontend/src`
- [ ] T027 Run linting and fix issues — repo root lint scripts

---

## Dependencies & Execution Order

- Foundation (Phase 2) completed — enables user story work
- US1 → US2 → US3 → US4 are independent once foundational work is in place; testing (T022) should be implemented before or alongside server changes.

---

## Notes

- Completed tasks reflect the current implementation state observed during manual verification.
- Remaining tasks prioritize tests (T022) and scoring/restart wiring (T019–T021).
