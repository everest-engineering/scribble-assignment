# Tasks: Room Setup & Lobby (Scenario 1)

**Input**: Design documents from `specs/001-room-setup-lobby/`  
**Prerequisites**: plan.md, spec.md  
**Branch**: `scribble-lab`

**Organization**: Tasks grouped by user story (P1→P4) for independent implementation and two-tab validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[Story]**: User story label (US1–US4) on story-phase tasks only
- Every task includes an exact file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm brownfield starter is ready; no new project scaffolding.

- [x] T001 Confirm starter files listed in plan.md exist under `backend/src/` and `frontend/src/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type definitions required before any user story work.

**⚠️ CRITICAL**: Complete this phase before Phase 3+.

- [x] T002 Extend `Room`, `RoomSnapshot`, `ParticipantSnapshot`, and `RoomStatus` (`lobby` | `playing`) with `hostId`, `isHost`, and `canStart` in `backend/src/models/game.ts`
- [x] T003 [P] Mirror extended snapshot types in `frontend/src/services/api.ts`

**Checkpoint**: Types aligned — user story implementation can begin.

---

## Phase 3: User Story 1 — Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: Creator gets a unique room code, enters lobby as host, sees self in participant list with host indicator.

**Independent Test**: One tab — create room → lobby shows code, 1 participant, host badge, start not yet actionable with 2 players.

**Maps to**: FR-001, FR-002, FR-007, FR-008, FR-009

### Implementation for User Story 1

- [x] T004 [US1] Set `hostId` to creator participant id in `createRoom` in `backend/src/services/roomStore.ts`
- [x] T005 [US1] Implement viewer-aware `toRoomSnapshot` (`isHost`, `canStart`, participant `isHost`) in `backend/src/services/roomStore.ts`
- [x] T006 [US1] Add host assignment and snapshot tests in `backend/src/services/roomStore.test.ts`
- [x] T007 [US1] Render host indicator on participant rows in `frontend/src/pages/LobbyPage.tsx`
- [x] T008 [P] [US1] Add host badge styles in `frontend/src/styles/app.css`

**Checkpoint**: User Story 1 independently testable — create room and verify host lobby UI.

---

## Phase 4: User Story 2 — Player Joins an Existing Room (Priority: P2)

**Goal**: Valid joins add player to correct lobby; empty, unknown, and post-start codes rejected with clear errors.

**Independent Test**: Tab A hosts; Tab B joins with valid code; empty/invalid/post-start codes show errors without entering lobby.

**Maps to**: FR-003, FR-003a, FR-004, FR-005, FR-006, FR-007, FR-016

### Implementation for User Story 2

- [x] T009 [US2] Add `.trim().min(1)` validation to `roomCodeParamsSchema` in `backend/src/api/schemas.ts`
- [x] T010 [US2] Reject `joinRoom` when room status is not `lobby` in `backend/src/services/roomStore.ts`
- [x] T011 [US2] Map non-lobby join to 400 with clear message in `backend/src/api/rooms.ts`
- [x] T012 [US2] Add join isolation, unknown code, and lobby-only join tests in `backend/src/services/roomStore.test.ts`
- [x] T013 [P] [US2] Add empty/whitespace room code schema tests in `backend/src/api/schemas.test.ts`
- [x] T014 [US2] Add client-side empty code validation before API call in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: User Stories 1 and 2 both work — create, join, validation errors, room isolation.

---

## Phase 5: User Story 3 — Lobby Stays Synchronized via Polling (Priority: P3)

**Goal**: Lobby auto-refreshes ~every 2s so new joins appear without manual action; manual refresh remains as fallback.

**Independent Test**: Tab A host + Tab B joiner — host sees joiner within ~3s without clicking Refresh; poll errors do not crash UI.

**Maps to**: FR-010, FR-011, FR-016 (joins-only sync per clarifications)

### Implementation for User Story 3

- [x] T015 [US3] Add `fetchRoomSilent` (no global loading toggle) in `frontend/src/state/roomStore.ts`
- [x] T016 [US3] Create `useLobbyPolling` hook with 2000ms interval and cleanup in `frontend/src/hooks/useLobbyPolling.ts`
- [x] T017 [US3] Wire auto-polling and poll error display in `frontend/src/pages/LobbyPage.tsx`
- [x] T018 [US3] Keep manual Refresh Room using `fetchRoom` alongside polling in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: User Stories 1–3 work — multi-tab lobby sync via polling.

---

## Phase 6: User Story 4 — Host Starts the Game When Ready (Priority: P4)

**Goal**: Only host can start with ≥2 players; room transitions to `playing`; all clients leave lobby together.

**Independent Test**: Solo start blocked; non-host cannot start; host start moves both tabs to `/game` within one poll cycle.

**Maps to**: FR-012, FR-013, FR-014, FR-015, FR-016

### Implementation for User Story 4

- [x] T019 [US4] Add `startGameSchema` in `backend/src/api/schemas.ts`
- [x] T020 [US4] Implement `startGame` with host, headcount, and lobby preconditions in `backend/src/services/roomStore.ts`
- [x] T021 [US4] Add start-game precondition tests in `backend/src/services/roomStore.test.ts`
- [x] T022 [US4] Add `POST /:code/start` route in `backend/src/api/rooms.ts`
- [x] T023 [US4] Add `startGame` API method in `frontend/src/services/api.ts`
- [x] T024 [US4] Add `startGame` store action in `frontend/src/state/roomStore.ts`
- [x] T025 [US4] Show Start only for host when `canStart`; hide/disable for non-host in `frontend/src/pages/LobbyPage.tsx`
- [x] T026 [US4] Call start API and navigate to `/game` on success or when poll sees `playing` in `frontend/src/pages/LobbyPage.tsx`
- [x] T027 [P] [US4] Update test mocks for extended snapshot fields in `frontend/src/services/api.test.ts`

**Checkpoint**: All four user stories complete — full Scenario 1 acceptance criteria.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Automated checks and manual validation before Scenario 2.

- [x] T028 Run `npm test` in `backend/` and `frontend/`
- [x] T029 Run `npm run build` in `backend/` and `frontend/`
- [x] T030 Manual two-tab validation per plan.md Testing Strategy (P1–P4 flows)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 3 (needs working create + host snapshot)
- **Phase 5 (US3)**: Depends on Phase 4 (needs multi-player lobby to test sync)
- **Phase 6 (US4)**: Depends on Phase 5 (needs polling so non-host tabs detect start)
- **Phase 7 (Polish)**: Depends on Phases 3–6

### User Story Dependencies

| Story | Depends on | Can test alone after |
|-------|------------|----------------------|
| US1 (P1) | Foundational | Phase 3 complete |
| US2 (P2) | US1 | Phase 4 complete |
| US3 (P3) | US2 | Phase 5 complete |
| US4 (P4) | US3 | Phase 6 complete |

Stories are **sequential by priority** for this feature (each builds on the prior lobby capability).

### Within Each User Story

1. Backend service/logic before API routes (where applicable)
2. Backend before matching frontend consumer
3. Core behavior before UI polish
4. Story checkpoint before next priority

### Parallel Opportunities

- **Phase 2**: T003 `[P]` parallel with T002 after T002 types are defined (backend first, then frontend mirror)
- **Phase 3**: T008 `[P]` parallel with T007 after T005 completes
- **Phase 4**: T013 `[P]` parallel with T009–T012 after schema changes land
- **Phase 6**: T027 `[P]` parallel with T025–T026 after API types stable

---

## Parallel Example: User Story 1

```bash
# After T005 completes:
Task T007: "Render host indicator in frontend/src/pages/LobbyPage.tsx"
Task T008: "Add host badge styles in frontend/src/styles/app.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T003)
3. Complete Phase 3: User Story 1 (T004–T008)
4. **STOP and VALIDATE**: One tab — create room, verify host lobby
5. Proceed to US2 only after P1 passes

### Incremental Delivery

1. Setup + Foundational → types ready
2. US1 → validate create/host (MVP)
3. US2 → validate join + errors + isolation
4. US3 → validate ~2s polling sync
5. US4 → validate host-only start + status transition
6. Polish → Vitest + build + two-tab sign-off

### Suggested Commit Slices

- Commit after Phase 2 (types)
- Commit after each user story phase (US1–US4)
- Commit after Polish (T028–T030)

---

## Notes

- Do **not** implement drawing, guesses, scoring, drawer/word logic (Scenario 2+)
- Do **not** add WebSockets, DB, auth, or participant leave/disconnect
- Polling reflects **new joins only** — closing a tab does not remove participants
- Join rejected when room status is not `lobby` (FR-003a)
- Use `fetchRoomSilent` for interval polls to avoid UI flicker (FR-010)
