---
description: "Task list for Room Setup & Lobby"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/api.md ✅ | research.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the starter builds cleanly before any changes are made.

- [x] T001 Confirm `cd backend && npm run build` passes on the unmodified starter
- [x] T002 Confirm `cd frontend && npm run build` passes on the unmodified starter

**Checkpoint**: Both builds green — safe to begin modifications.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add `isHost` to the shared `Participant` type and update the backend
store. These changes are the structural prerequisite for every user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Add `isHost: boolean` to `Participant` interface in `backend/src/models/game.ts`
- [x] T004 Update `createParticipant(name: string, isHost: boolean)` signature in `backend/src/services/roomStore.ts` — remove the optional `name` fallback (`displayName()`)
- [x] T005 Pass `isHost: true` in the `createRoom()` call to `createParticipant` in `backend/src/services/roomStore.ts`
- [x] T006 Pass `isHost: false` in the `joinRoom()` call to `createParticipant` in `backend/src/services/roomStore.ts`
- [x] T007 Add `isHost: boolean` to `Participant` interface in `frontend/src/services/api.ts`
- [x] T008 Confirm `cd backend && npm run build` still passes after T003–T006
- [x] T008b Confirm `cd frontend && npm run build` still passes after T007

**Checkpoint**: Foundation ready — `isHost` is typed throughout and builds pass.

---

## Phase 3: User Story 1 — Host Creation & Name Validation (Priority: P1) 🎯 MVP

**Goal**: Player names are validated and trimmed on Create Room; the creator is
stored as host; the Lobby shows a host indicator.

**Independent Test**: Submit a blank name on Create Room — inline error, no
navigation. Submit `"  Ada  "` — Lobby loads, participant list shows "Ada" with
host indicator. `GET /rooms/:code` returns `isHost: true` on the first participant.

### Implementation for US1

- [x] T009 [US1] Tighten `createRoomSchema` in `backend/src/api/schemas.ts` to `z.string().trim().min(1, "Player name is required")`
- [x] T010 [US1] Add client-side trim + empty guard in `frontend/src/pages/CreateRoomPage.tsx` submit handler — set inline error if trimmed name is empty, no API call made
- [x] T011 [US1] Add host indicator to the participant list in `frontend/src/pages/LobbyPage.tsx` — display "(Host)" or equivalent label next to the participant whose `isHost === true`
- [x] T012 [US1] Verify TypeScript builds pass: `cd backend && npm run build` and `cd frontend && npm run build`

**Checkpoint**: US1 complete — blank name rejected inline; creator shown as host in Lobby.

---

## Phase 4: User Story 2 — Join & Invalid Code Handling (Priority: P2)

**Goal**: Player names validated on Join Room; unknown room codes return 404 and
show an inline error; joiner's `isHost` is `false`.

**Independent Test**: Submit blank name on Join Room — inline error. Submit a
non-existent code — inline error "Room not found…". Submit valid name + valid code
— Lobby loads, joiner has no host indicator.

### Implementation for US2

- [x] T013 [US2] Tighten `joinRoomSchema` in `backend/src/api/schemas.ts` to `z.string().trim().min(1, "Player name is required")`
- [x] T014 [US2] Add client-side trim + empty guard in `frontend/src/pages/JoinRoomPage.tsx` submit handler — set inline error if trimmed name is empty, no API call made
- [x] T015 [US2] Add room-code trim (strip surrounding whitespace) in `frontend/src/pages/JoinRoomPage.tsx` before the API call
- [x] T016 [US2] Map a 404 API error to the message "Room not found. Check the code and try again." in the `catch` block of `JoinRoomPage.tsx`
- [x] T017 [US2] Verify TypeScript builds pass: `cd backend && npm run build` and `cd frontend && npm run build`

**Checkpoint**: US2 complete — all join error paths show inline messages; joiner has no host indicator.

---

## Phase 5: User Story 3 — Lobby Auto-Polling (Priority: P3)

**Goal**: Replace the manual Refresh button with silent `setTimeout`-after-response
polling; polling stops cleanly on unmount.

**Independent Test**: Open two Lobby tabs for the same room. Join from a third tab.
Within ≤ 4 s, the first Lobby tab's participant list updates with no button press.
Navigate away — DevTools network panel shows no further polling requests.

### Implementation for US3

- [x] T018 [US3] Add `pollRoom()` method to `RoomStore` in `frontend/src/state/roomStore.ts` — calls `api.fetchRoom` directly (no `withLoading` wrapper) and calls `setRoomSnapshot` on success; sets `error` on failure only
- [x] T019 [US3] Replace the manual refresh button and `handleRefresh` logic in `frontend/src/pages/LobbyPage.tsx` with a `useEffect` that: (a) on mount calls `fetchRoom()` (with loading state) for the initial load, then (b) after each response schedules `pollRoom()` via `setTimeout` with a 2 000 ms delay, and (c) clears the timeout in the cleanup function
- [x] T020 [US3] Remove the `refreshError` state and the manual "Refresh Room" button from `frontend/src/pages/LobbyPage.tsx`
- [x] T021 [US3] Verify TypeScript builds pass: `cd backend && npm run build` and `cd frontend && npm run build`

**Checkpoint**: US3 complete — participant list updates automatically every ~2 s; no spinner during polls; no requests after unmount.

---

## Phase 6: User Story 4 — Host-Only Start Game Gate (Priority: P4)

**Goal**: Start Game button visible only to the host, disabled until ≥ 2 participants.

**Independent Test**: Host tab with 1 participant — Start Game present but disabled.
Non-host tab — Start Game absent. After second player joins and poll fires — Start
Game enabled for host. Click Start Game — navigates to `/game`.

### Implementation for US4

- [x] T022 [US4] In `frontend/src/pages/LobbyPage.tsx`, derive `isHost` from `room.participants.find(p => p.id === participantId)?.isHost ?? false`
- [x] T023 [US4] Conditionally render the Start Game button in `frontend/src/pages/LobbyPage.tsx` only when `isHost === true`
- [x] T024 [US4] Disable the Start Game button in `frontend/src/pages/LobbyPage.tsx` when `room.participants.length < 2`
- [x] T025 [US4] Verify TypeScript builds pass: `cd backend && npm run build` and `cd frontend && npm run build`

**Checkpoint**: US4 complete — host-only Start Game gate enforced end-to-end.

---

## Phase 7: User Story 5 — Room Isolation (Priority: P5)

**Goal**: Verify two rooms never share participant data. No code change expected
(the in-memory `Map` already isolates by code); this phase is a validation-only
checkpoint.

**Independent Test**: Create two rooms in separate tabs. Join room A from a third
tab. Fetch room B (`GET /rooms/:codeB`) and confirm room A's joiner is absent.

### Implementation for US5

- [x] T026 [US5] Manually validate room isolation using the steps in `specs/001-room-setup-lobby/quickstart.md` Scenario 5 — create two rooms, join one, confirm the other is unaffected
- [x] T027 [US5] Optionally confirm via curl: `GET /rooms/:codeB` returns only room B's participants (see quickstart.md manual API verification section)

**Checkpoint**: US5 confirmed — rooms are fully isolated.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T028 [P] Run full two-tab end-to-end validation for all 5 scenarios using `specs/001-room-setup-lobby/quickstart.md`
- [x] T029 [P] Final TypeScript build check: `cd backend && npm run build` and `cd frontend && npm run build`
- [x] T030 Confirm no out-of-scope changes were introduced (no new npm deps, no WebSockets, no auth, no persistence)
- [ ] T031 Review all AI-generated code against the spec acceptance criteria before committing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational; independent of US1
- **US3 (Phase 5)**: Depends on Foundational; depends on US1 (requires `isHost` in Lobby for host indicator context) — implement after US1
- **US4 (Phase 6)**: Depends on US1 (isHost) and US3 (polling updates participant count) — implement after US3
- **US5 (Phase 7)**: Depends on Foundational; can run in parallel with US1–US4 as a validation step
- **Polish (Phase 8)**: Depends on all user stories

### Within Each User Story

- Backend schema/store changes before frontend changes that depend on the response shape
- Build verification after every story completes
- No story phase may be marked complete until its two-tab acceptance test passes

### Parallel Opportunities

- T001 and T002 can run in parallel (independent build checks)
- T003–T007 are sequential (each modifies a dependent layer)
- T009 and T013 can run in parallel (different schema objects in the same file — take care of merge order)
- T010 and T014 can run in parallel (different page files)
- T026 and T027 can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# These must be sequential (each builds on the previous):
T003 → T004 → T005 → T006  # backend type + store
T007                        # frontend type (can overlap with T005/T006 since different repo area)
T008 → T008b               # build verification
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Host Creation & Name Validation)
4. **STOP and VALIDATE**: Test US1 independently with two browser tabs
5. Proceed to US2 only after US1 passes

### Incremental Delivery

1. Setup + Foundational → type infrastructure ready
2. US1 → host flag + name validation visible in Lobby (MVP!)
3. US2 → join validation + 404 handling
4. US3 → auto-polling replaces manual refresh
5. US4 → host-only Start Game gate
6. US5 → isolation verified

---

## Notes

- [P] tasks operate on different files and have no blocking dependencies
- Build verification (`npm run build`) is required after every story phase
- Two-tab manual validation is the acceptance gate for each story
- The manual Refresh Room button must be completely removed (not just hidden) as part of US3
- `pollRoom()` must NOT call `withLoading()` — this is the key difference from `fetchRoom()`
- The `participantId` from `roomStore.getSnapshot().participantId` is used in LobbyPage to determine `isHost`
