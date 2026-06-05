---
description: "Task list for Room Setup & Lobby (Scenario 1)"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md

**Tests**: Unit tests ARE included — required by Constitution Principle VI and plan.md Testing
Strategy (deterministic logic: host, canStart, validation, isolation).

**Organization**: Tasks are grouped by user story. Priorities from spec.md — P1: US1, US2, US5;
P2: US3, US4. Phases below are ordered P1 group first, then P2 group.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US5 maps to spec.md user stories

## Path Conventions

Web app monorepo: `backend/src/`, `frontend/src/` (per plan.md Structure Decision).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a clean, runnable baseline before changing behavior.

- [X] T001 [P] Confirm backend baseline is green: `cd backend && npm install && npm test && npm run build`
- [X] T002 [P] Confirm frontend baseline is green: `cd frontend && npm install && npm test && npm run build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared host/snapshot data model that every user story reads. No story work can
begin until this is complete.

**⚠️ CRITICAL**: Blocks all user stories.

- [X] T003 [P] Add `hostId: string` to `Room` and add `hostId`/`isHost`/`canStart` to `RoomSnapshot` in `backend/src/models/game.ts`
- [X] T004 Set `hostId` on creation and make `toRoomSnapshot(room, viewerParticipantId)` honor the viewer to derive `isHost = viewerParticipantId === room.hostId` and `canStart = isHost && participants.length >= 2` in `backend/src/services/roomStore.ts` (depends on T003)
- [X] T005 [P] Mirror the new `hostId`/`isHost`/`canStart` fields on the `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Snapshots now carry host identity and a start signal for every viewer.

---

## Phase 3: User Story 1 - Create a room and become host (Priority: P1) 🎯 MVP

**Goal**: A player creates a room, receives a unique code, and is shown as the host in the lobby.

**Independent Test**: Create a room → unique code shown → lobby lists you as the only
participant, marked host.

### Tests for User Story 1

- [X] T006 [US1] Unit test in `backend/src/services/roomStore.test.ts`: creator's id equals `room.hostId`; snapshot for creator has `isHost: true` and `canStart: false` (single participant)

### Implementation for User Story 1

- [X] T007 [US1] Mark the host in the lobby participant list (badge/label next to the host) in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Creator lands in the lobby identified as host (MVP slice works end-to-end).

---

## Phase 4: User Story 2 - Join an existing room by code (Priority: P1)

**Goal**: A second player joins by code as a non-host and shares the host's lobby; unknown
codes return a clear not-found message.

**Independent Test**: With a room open, join its code from a second tab → land in lobby as
non-host; join a non-existent code → clear "Room not found" message, no navigation.

### Tests for User Story 2

- [X] T008 [US2] Unit test in `backend/src/services/roomStore.test.ts`: a joiner's snapshot has `isHost: false`; two independently created rooms have different codes and never share participants; lookup resolves a lower-case code to the same room (depends on T006 — same file)

### Implementation for User Story 2

- [X] T009 [US2] Return a distinct `404 { message: "Room not found" }` when a join targets an unknown code in `backend/src/api/rooms.ts`
- [X] T010 [US2] Surface the backend not-found `message` clearly on a failed join in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: Two players can share a lobby; unknown codes fail gracefully.

---

## Phase 5: User Story 5 - Host-only start with a two-player minimum (Priority: P1)

**Goal**: Only the host sees a usable Start control, and only when ≥2 players are present.

**Independent Test**: One player → host's Start is disabled with a "need 2 players" message;
add a second player → host's Start becomes available; non-host never sees a usable Start.

### Tests for User Story 5

- [X] T011 [US5] Unit test in `backend/src/services/roomStore.test.ts`: `canStart` is `false` for the host at 1 participant and `true` at 2+; `canStart` is always `false` for a non-host viewer (depends on T008 — same file)

### Implementation for User Story 5

- [X] T012 [US5] Gate the Start control using `canStart`: render it only for the host, disable it with a clear "at least 2 players required" message until `canStart` is true, in `frontend/src/pages/LobbyPage.tsx` (depends on T007 — same file)

**Checkpoint**: Lobby start gating matches Scenario 1 rules; all P1 stories complete.

---

## Phase 6: User Story 3 - Join input validation with clear feedback (Priority: P2)

**Goal**: Empty, whitespace-only, and unknown room codes are rejected with distinct, clear
messages and no navigation.

**Independent Test**: Submit empty code → "code required"; whitespace-only → treated as empty;
unknown code → "Room not found"; none navigate to a lobby.

### Tests for User Story 3

- [X] T013 [US3] Unit test in `backend/src/api/schemas.test.ts`: code schema rejects empty and whitespace-only values and accepts a valid trimmed code

### Implementation for User Story 3

- [X] T014 [US3] Tighten code validation with `z.string().trim().min(1)` (and trim the code param used for lookup) in `backend/src/api/schemas.ts`
- [X] T015 [US3] Block empty/whitespace-only submissions client-side with a clear "code is required" message before any request, keeping the user on the join screen, in `frontend/src/pages/JoinRoomPage.tsx` (depends on T010 — same file)

**Checkpoint**: All invalid-code paths give clear, distinct feedback.

---

## Phase 7: User Story 4 - Lobby stays current via automatic refresh (Priority: P2)

**Goal**: The lobby participant list updates automatically (~2s) without a manual button, and
polling stops on navigation; a failed poll keeps the last list.

**Independent Test**: Open a lobby, join from a second tab → first tab updates within ~2s with
no clicks; navigate away → polling stops; kill backend → lobby keeps last list, no crash.

### Tests for User Story 4

- [X] T016 [US4] Unit test in `frontend/src/services/api.test.ts`: `fetchRoom` still issues the expected `GET /rooms/:code?participantId=...` request with the new snapshot fields tolerated

### Implementation for User Story 4

- [X] T017 [US4] Add `startPolling(intervalMs)` / `stopPolling()` to the store with an in-flight guard and soft-fail refresh (preserve last `room`, set non-fatal `error`) in `frontend/src/state/roomStore.ts`
- [X] T018 [US4] Auto-start polling (~2000ms) on mount and clear it on unmount, replacing the manual-only refresh flow, in `frontend/src/pages/LobbyPage.tsx` (depends on T012 — same file)

**Checkpoint**: Lobby is live without manual refresh and resilient to transient failures.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation and traceability across all stories.

- [X] T019 [P] Run the full quickstart two-tab walkthrough in `specs/001-room-setup-lobby/quickstart.md` and confirm every row passes — backend API paths verified via smoke test (host/canStart/case-insensitive/404/400); **browser two-tab UI pass completed by human ✓**
- [X] T020 [P] Run both builds (`cd backend && npm run build`, `cd frontend && npm run build`) and full test suites; confirm green
- [X] T021 [P] Update `REFLECTION.md` "What I added" with the Scenario 1 changes (host tracking, code validation, polling, start gating)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories. T004 depends on T003; T005 is independent.
- **User Stories (Phases 3–7)**: All depend on Foundational. Ordered by priority (P1: US1, US2, US5; then P2: US3, US4).
- **Polish (Phase 8)**: Depends on all desired stories being complete.

### Cross-file sequencing (same-file = not parallel)

- `backend/src/services/roomStore.test.ts`: T006 → T008 → T011 (sequential, same file)
- `frontend/src/pages/LobbyPage.tsx`: T007 → T012 → T018 (sequential, same file)
- `frontend/src/pages/JoinRoomPage.tsx`: T010 → T015 (sequential, same file)
- `backend/src/api/rooms.ts`: T009 (then any lookup trim aligns with T014 in schemas.ts)

### User Story Dependencies

- **US1 (P1)**: After Foundational. MVP. No dependency on other stories.
- **US2 (P1)**: After Foundational. Independent (shares test file with US1 → sequence tests).
- **US5 (P1)**: After Foundational. Reads `canStart`; shares LobbyPage with US1.
- **US3 (P2)**: After Foundational. Shares JoinRoomPage with US2.
- **US4 (P2)**: After Foundational. Shares LobbyPage with US1/US5.

### Parallel Opportunities

- T001 ‖ T002 (different apps).
- T003 ‖ T005 (different files); T004 waits on T003.
- T019 ‖ T020 ‖ T021 (independent polish tasks).
- Across stories: backend-only tasks (T009, T013/T014) can proceed in parallel with
  frontend-only tasks (T010, T015, T017) when they touch different files.

---

## Parallel Example: Foundational Phase

```bash
# T003 and T005 touch different files and can run together:
Task: "Add hostId/isHost/canStart types in backend/src/models/game.ts"
Task: "Mirror snapshot fields in frontend/src/services/api.ts"
# Then T004 (roomStore.ts) once T003 is done.
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & validate**: create a
   room, confirm unique code + host badge in the lobby.

### Incremental Delivery

Foundation → US1 (host) → US2 (join + not-found) → US5 (start gating) → US3 (validation) →
US4 (auto-refresh) → Polish. Each story is independently testable per its Independent Test.

### Notes

- Commit after each task or logical group (Constitution Principle V: granular, traceable).
- Verify each new unit test fails before implementing, then passes after.
- Run the two-tab walkthrough (quickstart.md) before declaring Scenario 1 done.
