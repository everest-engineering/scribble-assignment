# Tasks: Round End Restart

**Input**: Design documents in `specs/005-round-end-restart/`

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Update project docs to reference the feature: specs/005-round-end-restart/README.md
- [x] T002 [P] Add plan & spec links in `.github/copilot-instructions.md` (already updated)
- [x] T003 [P] Ensure TypeScript strict settings and `vitest` config are present for new tests (frontend and backend): `frontend/vitest.config.ts`, `backend/vitest.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**TEST-FIRST: Write tests first and ensure they FAIL before implementing.**

- [x] T004 [P] Add `lastRoundSummary` field to in-memory Room model: `backend/src/models/game.ts`
- [x] T005 [P] Add Zod schema for `RoundSummary` and export in `backend/src/api/schemas.ts`
- [x] T006 [P] [TEST] Add integration test asserting per-round secrets are cleared after restart: `backend/src/api/restart.secrets.test.ts`
- [x] T007 [P] Add unit/integration tests for new endpoints: `backend/src/api/restart.integration.test.ts`
- [x] T008 [P] Implement backend endpoint `GET /rooms/:code/last-round-summary` in `backend/src/api/rooms.ts`
- [x] T009 [P] Implement backend endpoint `POST /rooms/:code/restart` in `backend/src/api/rooms.ts` and ensure it clears transient round state while preserving room player roster
- [x] T010 [P] Add or update polling client helper to fetch `last-round-summary` in `frontend/src/services/api.ts`

**Checkpoint**: Foundation complete — backend endpoints and models exist and are test-covered

---

## Phase 3: User Story 1 - View Results and Persisted Players (Priority: P1) 🎯 MVP

**Goal**: Build a `ResultsPage` UI that displays the correct word, final scores, and full guess history, and supports returning players to the lobby after host restart.

**Independent Test**: Start a room, complete a round to show the ResultsPage, call `POST /rooms/:code/restart`, verify UI shows the ResultsPage and then lobby with preserved players.

### Tests (recommended)

**TEST-FIRST: Component tests must be written and failing before implementing `ResultsPage`.**

- [x] T011 [P] [US1] Add component tests for `ResultsPage` in `frontend/src/components/ResultsPage.test.tsx`
- [x] T012 [US1] Add end-to-end integration test simulating round end and host restart: `frontend/src/__tests__/restart.flow.test.tsx` or `backend/src/api/restart.integration.test.ts` (integration pair)
- [x] T013 [US1] [TEST] Add timing integration test asserting lobby shows cleared round state within 3 seconds after restart: `backend/src/api/restart.timing.test.ts` or pairing with frontend flow

### Implementation

- [x] T014 [P] [US1] Create `ResultsPage` component at `frontend/src/components/ResultsPage.tsx` displaying `word`, `finalScores`, and `guessHistory`
- [x] T015 [P] [US1] Wire `ResultsPage` into routing/pages: `frontend/src/pages/GamePage.tsx` or `frontend/src/routes/index.tsx`
- [x] T016 [P] [US1] Add `Return to Lobby` button that calls `GET /rooms/:code/last-round-summary` (for verification) then navigates to lobby: `frontend/src/components/ResultsPage.tsx` (handler)
- [x] T017 [P] [US1] Ensure `frontend/src/state/roomStore.ts` preserves player list and updates UI after restart
- [x] T018 [P] [US1] Add logging and error handling for failed fetches in `frontend/src/services/api.ts` and display polite UI errors in `ResultsPage`

**Checkpoint**: Results page implemented, tested, and integrated with existing room flow

---

## Phase 4: User Story 2 - Edge Connectivity and Rejoins (Priority: P2)

**Goal**: Ensure disconnected players during ResultsPage are preserved and can rejoin with their score after restart.

**Independent Test**: Simulate disconnect during ResultsPage, restart host, reconnect player, verify player present with preserved score.

### Tests

- [x] T019 [P] [US2] Add integration test for reconnect flow: `backend/src/api/reconnect.integration.test.ts`

### Implementation

- [x] T020 [US2] Implement reconnection reconciliation window in `backend/src/services/roomStore.ts` or `backend/src/services/roomCleanup.ts` to map reconnects back to preserved players
- [x] T021 [US2] Update `backend/src/api/rooms.ts` to accept reconnect attempts and restore player connection status without losing score
- [x] T022 [US2] Add frontend reconnect logic in `frontend/src/services/polling.ts` and `frontend/src/state/roomStore.ts` to retry joining and reconcile local UI state with server roster

**Checkpoint**: Reconnects during results are reconciled into preserved player list

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T023 [P] [Polish] Add UI tests and accessibility checks for `ResultsPage` in `frontend/src/components/ResultsPage.test.tsx`
- [x] T024 [P] [Polish] Update `specs/005-round-end-restart/quickstart.md` with exact commands and sample payloads
- [x] T025 [Polish] Add documentation of API contracts in `specs/005-round-end-restart/contracts/api-contracts.md` (already created — verify)
- [x] T026 [P] [Polish] Run `vitest` full test-suite and fix any regressions
- [x] T027 [Polish] Update CHANGELOG or release notes with feature entry

## **Notes on Test-First enforcement:** Marked tests (T006, T007, T011, T012, T013) are blocking — they should be implemented and failing before their corresponding implementation tasks are started. Update CI/dev checklist to reflect this gating.

## Dependencies & Execution Order

- Phase 1 → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (Polish)
- Tests for endpoints and core models should be added in Phase 2 and must pass before UI integration in Phase 3

## Parallel Opportunities

- Backend endpoints (`T008`, `T009`) can be implemented in parallel with frontend component scaffolding (`T014`, `T015`, `T017`) once `T004` and `T005` are in place

## Implementation Strategy

- MVP: Complete Phase 1 + Phase 2 + Phase 3 (US1) to deliver an independently testable ResultsPage and restart flow
- Incrementally add US2 and polish items after MVP verification
