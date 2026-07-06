---

description: "Task list for automatic lobby polling feature"
---

# Tasks: Automatic Lobby Polling

**Input**: Design documents from `specs/004-lobby-polling/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No new tests required per spec — existing tests must continue to pass.

**Organization**: Tasks are grouped by phase. Three user stories: US1 (P1), US2 (P2), US3 (P3).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 for user story tasks
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`
- Paths reflect the actual web app structure from plan.md

## Phase 1: Setup (Brownfield Discovery)

**Purpose**: Read and understand existing code patterns before making changes

- [X] T001 Read existing LobbyPage in `frontend/src/pages/LobbyPage.tsx` to understand current refresh mechanism, state usage, and navigation patterns
- [X] T002 Read existing RoomStore in `frontend/src/state/roomStore.ts` to understand `fetchRoom()`, `getSnapshot()`, and state shape
- [X] T003 Read existing `frontend/src/services/api.ts` to confirm `RoomSnapshot.status` field signature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish polling infrastructure in the LobbyPage

- [X] T004 Add `useEffect` with `setInterval` (~2000ms) to `frontend/src/pages/LobbyPage.tsx` that calls `roomStore.fetchRoom()` on each tick
- [X] T005 Add `useRef<boolean>` flag to track in-flight requests and skip overlapping poll cycles (per FR-009)
- [X] T006 Add cleanup logic in the `useEffect` return to clear the interval on component unmount (per FR-002)

**Checkpoint**: Lobby auto-polls every ~2s. Navigate away and back — no interval leaks.

---

## Phase 3: User Story 1 - Auto-refresh lobby player list (Priority: P1) 🎯 MVP

**Goal**: Player list updates automatically without manual refresh.

**Independent Test**: Open two tabs. Tab 1 creates room. Tab 2 joins. Within ~2s, Tab 1's player list updates.

- [X] T007 [US1] Integrate poll response into existing room state: assign `fetchRoom()` result to update participant list via `roomStore.setRoomSnapshot()` (already handled by `fetchRoom()` internally — verify state propagation)
- [X] T008 [US1] Add status-check logic: after each successful poll, inspect `room.status`. If status is no longer `"lobby"`, call `navigate("/game")` to auto-advance to game page

**Checkpoint**: Two-browser test passes — joiner appears in lobby list within ~2s without manual refresh.

---

## Phase 4: User Story 2 - Graceful polling error handling (Priority: P2)

**Goal**: Transient errors don't break polling; 404 navigates to home with error.

**Independent Test**: Simulate network error — polling continues. Simulate 404 — user navigated to home.

- [X] T009 [US2] Ensure poll errors are caught silently (interval continues, previous data remains visible, error surfaced via roomStore's existing error state)
- [X] T010 [US2] Add 404 handling: when `fetchRoom()` throws with a 404 error, clear the interval and call `navigate("/", { replace: true })` with the error message

**Checkpoint**: Stop backend — lobby navigates to home with error message within ~2s.

---

## Phase 5: User Story 3 - Manual refresh still works (Priority: P3)

**Goal**: "Refresh Room" button remains functional alongside auto-polling.

**Independent Test**: Click "Refresh Room" while auto-polling is active — immediate update.

- [X] T011 [US3] Verify existing `handleRefresh()` still works and does not conflict with auto-polling interval. Ensure manual refresh resets any in-flight tracking ref

**Checkpoint**: Both auto-polling and manual refresh work simultaneously.

---

## Phase 6: Build & Validation

**Purpose**: Verify the frontend compiles and all acceptance criteria pass

- [X] T012 Run `cd frontend && npm run build` to verify frontend compiles without errors
- [ ] T013 Run two-browser validation per `specs/004-lobby-polling/quickstart.md` to verify all acceptance scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — review only, can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on US1 completion (navigates to game on status change, 404 handling is additive)
- **User Story 3 (Phase 5)**: Depends on Foundational phase (manual refresh is independent of auto-polling feature)
- **Build & Validation (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation + core polling loop
- **User Story 2 (P2)**: Error handling on top of US1's polling foundation
- **User Story 3 (P3)**: Independent of US1/US2 — works as long as Phase 2 is done

### Within Each Phase

- Setup before implementation (Phase 1 before Phase 2+)
- Core interval before status-check logic (T004+T005+T006 before T007+T008)
- Base error handling before 404-specific logic (T009 before T010)

### Parallel Opportunities

- T001, T002, T003 are independent file reviews — can run in parallel
- T004, T005, T006 are tightly coupled (same useEffect) — sequential within Phase 2
- T012, T013 are independent — can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (polling infrastructure)
3. Complete Phase 3: User Story 1 (auto-refresh + status navigation)
4. **STOP and VALIDATE**: Two-browser test per quickstart.md
5. Add US2 (Phase 4) for error resilience
6. Add US3 (Phase 5) — quick verification
7. Run Phase 6 for final build validation

### Iterative Delivery

1. Phase 1-2 → Polling infrastructure ready
2. Phase 3 (US1) → Core auto-refresh + navigation on game start
3. Phase 4 (US2) → Error handling (transient + 404)
4. Phase 5 (US3) → Manual refresh coexistence
5. Phase 6 → Build + validation

---

## Notes

- All changes are in `frontend/src/pages/LobbyPage.tsx` — no other files need modification
- No new dependencies required — uses existing React hooks (useEffect, useRef, useCallback) and react-router-dom v6 (useNavigate)
- The `roomStore.fetchRoom()` method already calls `setRoomSnapshot()` internally — poll task is to call fetchRoom and let the store handle state updates
- Existing manual refresh button (`handleRefresh`) continues to work — it calls the same `roomStore.fetchRoom()`
- Follow existing patterns: functional component, hooks, existing CSS classes
- Commit after each meaningful slice: polling infrastructure commit, US1 commit, US2 commit, US3 commit
