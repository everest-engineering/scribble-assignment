---
description: "Task list for Room Setup & Lobby (Scenario 1)"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md

**Tests**: Backend Vitest tasks included per plan testing strategy; manual two-browser validation in Polish phase.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Unblock local development and confirm artifact alignment

- [x] T001 Review plan.md and contracts/rooms-api.md against spec.md acceptance criteria
- [x] T002 Fix default API_BASE_URL to `http://localhost:3001` in `frontend/src/services/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared backend model and snapshot shape required before user-story UI work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add `hostParticipantId` and extend `RoomStatus` to `"lobby" | "playing"` in `backend/src/models/game.ts`
- [x] T004 Add `hostParticipantId`, `isHost` on participants, and extended status to snapshot types in `backend/src/models/game.ts`
- [x] T005 Update `createRoom` to set `hostParticipantId` to creator id in `backend/src/services/roomStore.ts`
- [x] T006 Update `toRoomSnapshot` to include `hostParticipantId` and per-participant `isHost` in `backend/src/services/roomStore.ts`
- [x] T007 [P] Mirror updated `RoomSnapshot` and participant types in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — backend create/join responses expose host data; frontend types aligned

---

## Phase 3: User Story 1 — Host Creates a Game Room (Priority: P1) 🎯 MVP

**Goal**: Room creator becomes host and sees host indicator plus shareable code in lobby

**Independent Test**: Single browser tab — create room, land on lobby, see self as host with room code visible

### Implementation for User Story 1

- [x] T008 [US1] Render host badge on participant row when `participant.isHost` in `frontend/src/pages/LobbyPage.tsx`
- [x] T009 [US1] Add vitest case asserting `createRoom` sets `hostParticipantId` to creator in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Host create flow testable independently; room isolation verified via separate create sessions

---

## Phase 4: User Story 2 — Player Joins an Existing Room (Priority: P2)

**Goal**: Valid joins succeed; empty/invalid codes rejected with clear feedback; rooms stay isolated

**Independent Test**: Second tab joins with valid code and appears in list; empty code and `ZZZZ` rejected with errors

### Implementation for User Story 2

- [x] T010 [US2] Reject empty or whitespace-only room code before API call in `frontend/src/pages/JoinRoomPage.tsx`
- [x] T011 [US2] Display clear not-found error for failed join (404) in `frontend/src/pages/JoinRoomPage.tsx`
- [x] T012 [US2] Reject join when room `status !== "lobby"` in `backend/src/services/roomStore.ts`

**Checkpoint**: Join validation and isolation testable with two rooms and two tabs

---

## Phase 5: User Story 3 — Lobby Stays Synchronized (Priority: P3)

**Goal**: Lobby participant list auto-updates every ~2s without manual refresh; polling stops on leave

**Independent Test**: Two tabs in same room — join from second tab; first tab updates within ~3s without clicking Refresh

### Implementation for User Story 3

- [x] T013 [US3] Add `fetchRoomSilent` that skips `isLoading` toggle in `frontend/src/state/roomStore.ts`
- [x] T014 [US3] Add 2000ms polling `useEffect` with interval cleanup on unmount in `frontend/src/pages/LobbyPage.tsx`
- [x] T015 [US3] Show non-blocking poll error message while retaining last participant list in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Automatic lobby sync works; manual Refresh button may remain as fallback

---

## Phase 6: User Story 4 — Host Starts the Game When Ready (Priority: P4)

**Goal**: Host-only start with ≥2 players; all clients navigate to game when status becomes `playing`

**Independent Test**: Start blocked with one player; host starts with two; non-host cannot start; all tabs reach `/game`

### Implementation for User Story 4

- [x] T016 [US4] Implement `startRoom(code, participantId)` with host and min-player checks in `backend/src/services/roomStore.ts`
- [x] T017 [P] [US4] Add `startRoomSchema` with required `participantId` in `backend/src/api/schemas.ts`
- [x] T018 [US4] Wire `POST /rooms/:code/start` route with 403/409 error handling in `backend/src/api/rooms.ts`
- [x] T019 [P] [US4] Add `startRoom(code, participantId)` client method in `frontend/src/services/api.ts`
- [x] T020 [US4] Add `startGame()` action using `withLoading` in `frontend/src/state/roomStore.ts`
- [x] T021 [US4] Disable start button with messaging for non-host and `<2` players in `frontend/src/pages/LobbyPage.tsx`
- [x] T022 [US4] Navigate all lobby clients to `/game` when polled snapshot `status === "playing"` in `frontend/src/pages/LobbyPage.tsx`
- [x] T023 [US4] Redirect `/game` to `/lobby` when room status is still `lobby` in `frontend/src/pages/GamePage.tsx`
- [x] T024 [US4] Add vitest cases for non-host and single-player start rejection in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Full Scenario 1 flow complete — create, join, poll, host start, shared navigation

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and build gates before Scenario 2

- [x] T025 Run manual two-browser validation per `specs/001-room-setup-lobby/quickstart.md`
- [x] T026 [P] Run `npm run build` in `backend/` and `frontend/` and fix any type errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T002 — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational; independently testable after US1 create flow exists
- **User Story 3 (Phase 5)**: Depends on Foundational + join flow (US2) for meaningful two-tab test
- **User Story 4 (Phase 6)**: Depends on Foundational; full test needs US2 join + US3 poll
- **Polish (Phase 7)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on other stories
- **US2 (P2)**: After Foundational — uses existing create flow from starter + US1 host snapshot
- **US3 (P3)**: After Foundational — best validated once US2 join works
- **US4 (P4)**: After Foundational — backend start can be built in parallel with US3; UI start button needs lobby polling for multi-client navigation (T022 after T014)

### Within Each User Story

- Backend store/service before API routes
- API routes before frontend client methods
- Frontend store before page UI wiring
- Story complete before Polish validation

### Parallel Opportunities

- T007 can run parallel to T003–T006 once T003 types exist (after T003–T004)
- T017 and T019 parallel after T016 schema needs known
- T026 parallel backend/frontend builds
- US1 and US2 frontend tasks touch different pages (`LobbyPage` vs `JoinRoomPage`) after Foundational

---

## Parallel Example: User Story 4

```bash
# After T016 startRoom store logic exists, launch in parallel:
Task T017: "Add startRoomSchema in backend/src/api/schemas.ts"
Task T019: "Add startRoom client method in frontend/src/services/api.ts"

# After routes wired:
Task T021: "Gate start button in frontend/src/pages/LobbyPage.tsx"
Task T024: "Add vitest cases in backend/src/services/roomStore.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T007)
3. Complete Phase 3: User Story 1 (T008–T009)
4. **STOP and VALIDATE**: Create room, confirm host badge and code in lobby
5. Demo host-create slice before join/poll/start work

### Incremental Delivery

1. Setup + Foundational → shared model ready
2. Add US1 → host create validated (MVP)
3. Add US2 → join + validation validated
4. Add US3 → live lobby polling validated
5. Add US4 → start-game gating and navigation validated
6. Polish → quickstart + builds

### Suggested Commit Granularity

- Commit after Foundational (backend + frontend types)
- Commit after each user story phase passes its checkpoint
- Final commit after quickstart validation

---

## Notes

- Total tasks: **26** (Setup: 2, Foundational: 5, US1: 2, US2: 3, US3: 3, US4: 9, Polish: 2)
- MVP scope: Phases 1–3 (T001–T009)
- Name trimming deferred to Scenario 2 per spec assumptions
- Drawer/word selection out of scope — `playing` status is the Scenario 1 handoff signal only
