# Tasks: Result, Restart, and Final Validation

**Input**: Design documents from `specs/004-result-restart/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: No new project setup required — this is a brownfield extension. All infrastructure (Express, Zod, Vitest, React) is already in place.

*(No setup tasks)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend endpoint and service function that ALL frontend user stories depend on. Must be complete before any frontend work begins.

**⚠️ CRITICAL**: Frontend US1, US2, US3 work cannot be tested end-to-end until this phase is complete.

- [x] T001 Add `restartRoomSchema` (Zod object with `participantId: z.string().uuid()`) to `backend/src/api/schemas.ts`
- [x] T002 Add exported `restartRoom(code: string, participantId: string): Room` function to `backend/src/services/roomStore.ts` — guards: 404 (not found) → 409 (not ended) → 403 (not host); resets `status → "lobby"`, `drawerId → ""`, `secretWord → ""`, `guesses → []`, `scores → {}`; preserves participants; calls `cloneRoom`
- [x] T003 Add `POST /:code/restart` route to `backend/src/api/rooms.ts` after the `/guess` route — parse `roomCodeParamsSchema` + `restartRoomSchema`, call `restartRoom(code.toUpperCase(), participantId)`, respond `{ room: toRoomSnapshot(room, participantId) }`
- [x] T004 Add `restartRoom` describe block to `backend/src/services/roomStore.test.ts` with 5 test cases: (1) successful restart clears all round state and preserves participants, (2) `HttpError(409)` when status is not `"ended"`, (3) `HttpError(403)` when caller is not host, (4) `HttpError(404)` for unknown room, (5) second restart after re-ending also succeeds

**Checkpoint**: `cd backend && npm test` passes; `POST /rooms/:code/restart` returns `200` with lobby snapshot for valid host request and correct errors for invalid requests.

---

## Phase 3: User Story 1 — All Participants See the Full Result View (Priority: P1) 🎯 MVP

**Goal**: When `room.status === "ended"`, GamePage renders a dedicated result section showing the secret word prominently, the full scoreboard, and the complete guess history. Active-game content (canvas placeholder, guess form) is hidden.

**Independent Test**: Two tabs, Bob guesses correctly → within ~4s both tabs display secret word, Bob 100pts / Alice 0pts, Bob's guess with ✓ indicator. No active-game content shown.

- [x] T005 [US1] Update `frontend/src/pages/GamePage.tsx` — when `isEnded`, replace the existing "Round Ended" banner with a structured result section rendered above or instead of the active-game layout: (a) a prominent `<h2>` or styled `<div>` showing "The word was: {room.secretWord}"; (b) the existing `<Scoreboard>` already wired to `room.scores`; (c) the existing `<ResultPanel>` already wired to `room.guesses`; ensure the guess form Card is not shown when `isEnded` (guard already exists at `!isDrawer && !isEnded`)

**Checkpoint**: With game in `"ended"` state, both tabs show secret word, scores, and guess history. No Restart button yet.

---

## Phase 4: User Story 2 — Host Restarts the Game (Priority: P1)

**Goal**: Host sees and can activate a Restart button on the result view. Server resets room to lobby. Non-hosts see no restart control. Server rejects non-host restart attempts.

**Independent Test**: Tab A (host) sees Restart button; Tab B (non-host) does not. Alice clicks Restart → server responds with `status: "lobby"`, all round fields cleared, participants preserved. Direct `POST` by Bob's UUID returns `403`.

- [x] T006 [P] [US2] Add `restartRoom(code: string, participantId: string)` method to `frontend/src/services/api.ts` — calls `request<{ room: RoomSnapshot }>(\`/rooms/${encodeURIComponent(code)}/restart\`, { method: "POST", body: JSON.stringify({ participantId }) })`
- [x] T007 [P] [US2] Add `restartRoom` test to `frontend/src/services/api.test.ts` — verifies `POST /rooms/ABCD/restart` is called with `{ participantId }` body (mirrors existing `startGame` test pattern)
- [x] T008 [US2] Add `async restartRoom()` method to `RoomStore` class in `frontend/src/state/roomStore.ts` — guards on `this.state.room` and `this.state.participantId`; calls `this.withLoading(() => api.restartRoom(...))`, then `this.setRoomSnapshot(response.room)`
- [x] T009 [US2] Add Restart button to result section in `frontend/src/pages/GamePage.tsx` — render only when `isEnded && participantId === room.hostId`; on click, call `roomStore.restartRoom()`; show store `error` if present (already surfaced by `useRoomState`)

**Checkpoint**: Host tab shows Restart button; clicking it triggers `POST /restart` and updates store snapshot. Non-host tab has no button. `npm test` passes in both backend and frontend.

---

## Phase 5: User Story 3 — All Participants Navigate Back to Lobby After Restart (Priority: P2)

**Goal**: When polling detects `room.status === "lobby"` on the GamePage, all participants automatically navigate to `/lobby` without manual action.

**Independent Test**: After Alice clicks Restart, within ~4s both Tab A and Tab B show the Lobby with all participants listed.

- [x] T010 [US3] Update navigation `useEffect` in `frontend/src/pages/GamePage.tsx` to add `else if (room.status === "lobby") { navigate("/lobby", { replace: true }); }` — this fires on every `room` change including polling updates; `replace: true` keeps browser history clean

**Checkpoint**: After restart, both browser tabs automatically navigate to `/lobby` within ~4 seconds via polling.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T011 Run `npm run build && npm test` in `backend/` and confirm all tests pass with no TypeScript errors
- [x] T012 Run `npm run build && npm test` in `frontend/` and confirm all tests pass with no TypeScript errors
- [ ] T013 Complete the two-tab acceptance test from `specs/004-result-restart/quickstart.md` — verify US1 (result view), US2 (host restart), US3 (auto-navigate), and non-host rejection test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: Must complete before Phase 3–5 can be validated end-to-end
- **Phase 3 (US1)**: Depends on Phase 2 (backend must serve `"ended"` snapshots with guess/score data — already done in Scenario 3)
- **Phase 4 (US2)**: Depends on Phase 2 (restart endpoint) and Phase 3 (result view must exist before adding Restart button to it)
- **Phase 5 (US3)**: Depends on Phase 4 (Restart must work before navigation can be triggered by it); minimal code change
- **Phase 6 (Polish)**: Depends on Phase 2–5 complete

### Task-Level Dependencies

- T002 depends on T001 (schema imported in route)
- T003 depends on T001 and T002
- T004 depends on T002
- T005 can begin independently of T006–T007 (different concern, same file — must be sequential)
- T006 and T007 are [P] — different files, no dependency on each other
- T008 depends on T006 (api method must exist before store method calls it)
- T009 depends on T005 (result view section must exist) and T008 (store method must exist)
- T010 depends on T009 (GamePage already in correct state; adds navigation guard)

### Parallel Opportunities

```bash
# Phase 2: T001 → T002 → T003 → T004 (sequential — each depends on prior)

# Phase 4: T006 and T007 can run in parallel (api.ts vs api.test.ts)
# Then T008 after T006, then T009 after T005 + T008
```

---

## Implementation Strategy

### MVP: US1 + US2 (P1 stories)

1. Complete Phase 2 (Foundational — backend)
2. Complete Phase 3 (US1 — result view)
3. Complete Phase 4 (US2 — host restart)
4. **STOP and VALIDATE**: Two-tab test for result view + restart button

### Full Delivery

5. Complete Phase 5 (US3 — auto-navigate to lobby)
6. **VALIDATE**: Full two-tab test including auto-navigation
7. Complete Phase 6 (Polish — build + tests + acceptance)

---

## Notes

- GamePage.tsx is touched in T005, T009, and T010 — implement in strict order to avoid conflicts
- The `isEnded` flag and guard for `GuessForm` already exist in GamePage from Scenario 3; T005 extends that pattern
- `toRoomSnapshot` needs no changes — it already handles all statuses correctly
- `room.hostId` is already in `RoomSnapshot` from Scenario 1 — no new snapshot field needed
- After restart, polling will return `status: "lobby"` which triggers T010's navigation guard
