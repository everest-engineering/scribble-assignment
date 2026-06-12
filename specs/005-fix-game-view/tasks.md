---

description: "Task list for Game View Transition feature"

---

# Tasks: Game View Transition

**Input**: Design documents from `specs/005-fix-game-view/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated tests requested — manual validation per quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization (SKIP — brownfield project; all infrastructure exists)

No setup tasks needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure (SKIP — no new infrastructure; changes are additive to existing code)

No foundational tasks needed.

---

## Phase 3: User Story 1 — All Players See Game View on Start (Priority: P1) 🎯 MVP

**Goal**: When the host starts the game, every participant currently in the lobby — including the host — transitions from the lobby page to the game page via status-change detection in the polling loop. No participant remains stuck on the lobby after the game has started. The game page displays each participant's role on first load.

**Independent Test**: Open two browser windows in the same room. Host clicks "Start Game". Both windows navigate to `/game` within 3 seconds. Both show the participant's role ("drawer" or "guesser").

### Implementation for User Story 1

- [ ] T001 [P] [US1] Add poll error state tracking to roomStore at `frontend/src/state/roomStore.ts` — add `pollError: string | null` to `RoomState`; set `null` on successful poll and `"Connection issue..."` on poll failure; clear on `leaveRoom()`
- [ ] T002 [US1] Add status-change redirect and poll error indicator to LobbyPage at `frontend/src/pages/LobbyPage.tsx` — add `useEffect` that redirects to `/game` on `status === "playing"`, to `/` on `status === "finished"` or missing room; destructure `pollError` from `useRoomState()` and display in error line

**Checkpoint**: MVP complete — two-window test passes (both host and participant redirected to game page within 3 seconds).

---

## Phase 4: User Story 2 — Game Page State for Latecomers (Priority: P2)

**Goal**: A participant who refreshes their lobby page, returns after navigating away, or is on the game page when the game ends correctly transitions to the appropriate view.

**Independent Test**: Open a room as host in window A. Join as participant in window B. Start game from window A. Navigate back to `/lobby` in window B — verify redirect to `/game`. Hard-refresh window B's lobby page — verify redirect to `/game`. End the game — verify window B shows "The round has ended" message without redirect.

### Implementation for User Story 2

- [ ] T003 [US2] Add mount-time status validation to GamePage at `frontend/src/pages/GamePage.tsx` — add `useEffect` that validates room status on mount; redirect to `/` if `!room` or `status === "finished"` (late nav to ended game), redirect to `/lobby` if `status === "lobby"`; use `useRef` to ensure finished redirect only fires on mount, not on poll-triggered transitions during active play
- [ ] T004 [US2] Add poll-based transition detection to GamePage at `frontend/src/pages/GamePage.tsx` — track previous status via `useRef` in polling `useEffect`; when `"playing"` → `"finished"` transition detected, display "The round has ended" message (existing JSX) without redirecting; when status transitions to `"lobby"`, redirect to `/lobby`

**Checkpoint**: Latecomer scenarios verified — participants navigating back to lobby or refreshing during an active game are redirected correctly; game-end transition shows end message without redirect.

---

## Phase 5: Bug Fixes (Cross-Cutting)

**Purpose**: Fix bugs identified during full-app testing (see `checklists/001-found-bugs.md`). These are independent of the game view transition feature but are grouped here for delivery.

- [ ] T010 [P] Fix Scoreboard React key — change `key={entry.name}` to `key={entry.id}` in `frontend/src/components/Scoreboard.tsx:27`
- [ ] T011 Fix hardcoded `roundNumber` — derive from actual round count in `backend/src/services/canvasService.ts:29-31`
- [ ] T012 [P] Add missing `.form__error--inline` CSS class to stylesheet in `frontend/src/styles/app.css`
- [ ] T013 [P] Remove unused `redirectOnMount` ref from `frontend/src/pages/GamePage.tsx:19`
- [ ] T014 Fix optimistic stroke rollback — remove stroke from local state on API failure in `frontend/src/pages/GamePage.tsx:180-188`
- [ ] T015 Add name deduplication check — reject duplicate participant names in `backend/src/services/roomStore.ts`

## Phase 6: Polish & Edge Cases

**Purpose**: Cross-cutting verification and edge case handling.

- [ ] T005 [P] Verify missing-session redirect guards in `frontend/src/pages/LobbyPage.tsx` and `frontend/src/pages/GamePage.tsx` — confirm the existing `if (!room) navigate("/")` guards redirect users to the join page when the session is missing or expired (per FR-006); no code change expected
- [ ] T006 [P] Verify "Game already in progress" error in `frontend/src/pages/JoinRoomPage.tsx` — confirm the existing catch block surfaces the 400 error from `POST /rooms/:code/join` when the room status is `"playing"` (per FR-007); no code change expected
- [ ] T007 Run full manual validation per `specs/005-fix-game-view/quickstart.md` — execute all 5 validation scenarios with two browser windows and confirm each passes
- [ ] T008 Run final build verification — `cd backend && npm run build && cd ../frontend && npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Not applicable — skip
- **Foundational (Phase 2)**: Not applicable — skip
- **US1 (Phase 3)**: No dependencies — can start immediately
- **US2 (Phase 4)**: T003 must apply after T002 (different files, but US2 assumes redirect-to-game flow works); T004 modifies the same file (GamePage.tsx) as T003 — apply sequentially to avoid conflicts
- **Polish (Phase 5)**: Depends on US1 and US2 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies — independently implementable and testable
- **User Story 2 (P2)**: Functionally independent from US1 but applies to the same components; recommended to implement after US1 to build on the established redirect logic

### Within Each Phase

- [P] tasks can run in parallel (different files, no cross-dependencies)
- Non-[P] tasks must run sequentially
- Build verification runs last within each phase

### Parallel Opportunities

- T001 (roomStore.ts) and T002 (LobbyPage.tsx) can run in parallel — different files, no dependencies
- T003 (GamePage.tsx) can run in parallel with T002 — different files
- T005 and T006 can run in parallel — verification-only, different files
- T007 and T008 must run after all other tasks
- All [P]-marked tasks within a phase can run simultaneously

---

## Parallel Example: User Story 1

```bash
# Launch T001 and T002 together (different files):
Task: "Add poll error state tracking to roomStore at frontend/src/state/roomStore.ts"
Task: "Add status-change redirect and poll error indicator to LobbyPage at frontend/src/pages/LobbyPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001, T002)
2. **STOP and VALIDATE**: Run two-browser manual test per quickstart.md Scenario 1
3. Deliver — core bug fix is complete

### Incremental Delivery

1. Complete User Story 1 → Validate independently → Deliver (MVP!)
2. Complete User Story 2 → Validate independently → Deliver
3. Complete Polish → Final validation → Deliver

### Notes

- No backend changes needed — the API already returns `status: "playing"` in room snapshots
- No new state management methods needed — existing `pollRoom()` + `useSyncExternalStore` provides reactive room state
- No new dependencies needed — all changes use existing React Router `useNavigate` and React hooks
- LobbyPage.tsx is modified by T002 (US1) — one sequential change
- GamePage.tsx is modified by T003 and T004 (US2) — apply sequentially to avoid conflicts; T004 builds on T003's mount validation
- The finished-state redirect in GamePage must distinguish mount-time (redirect) from poll-time (stay + show message) — use `useRef` to track first mount vs subsequent poll transitions
- Each phase should be independently verifiable via manual testing per quickstart.md
- Build (`npm run build`) must pass on both backend and frontend before phase completion
- Per constitution Principle V: commits must be granular and traceable to the spec
