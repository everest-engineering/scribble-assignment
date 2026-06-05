# Tasks: Room Setup & Lobby

**Feature**: Group 1 — Scenario 1 (Room Setup & Lobby) | **Branch**: `001-room-setup-lobby`

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: INCLUDED — the plan's Testing Strategy and constitution Principle III require unit tests for
host/start/isolation rules. Test tasks are marked accordingly.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1=Host creates room, US2=Join by code, US3=Lobby polling sync, US4=Host-only start
- Web app paths: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the brownfield baseline runs before extending it.

- [ ] T001 Verify backend and frontend run from a clean state: `cd backend && npm install && npm run dev` (GET /health → `{ "ok": true }`) and `cd frontend && npm install && npm run dev` (loads on :5173)
- [ ] T002 Confirm the frontend reaches the backend (`VITE_API_URL` resolves to `http://localhost:3001`) per `specs/001-room-setup-lobby/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data-model changes that every later story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Widen `RoomStatus` to `"lobby" | "started"` and add `hostId: string` to `Room` in `backend/src/models/game.ts`
- [ ] T004 Update `RoomSnapshot` in `backend/src/models/game.ts` to include `hostId` and change `participants` to `Array<Participant & { isHost: boolean }>`

**Checkpoint**: Shared types compile; user stories can now proceed.

---

## Phase 3: User Story 1 - Host creates a room (Priority: P1) 🎯 MVP

**Goal**: Creating a room assigns the creator as host; the lobby shows the canonical uppercase code
and identifies the host.

**Independent Test**: Create a room in one tab → lobby shows an uppercase code and marks the creator
as host.

### Tests for User Story 1 ⚠️

- [ ] T005 [P] [US1] Unit test in `backend/src/services/roomStore.test.ts`: `createRoom` sets `hostId` to the creator's participant id and `status` is `"lobby"`
- [ ] T006 [P] [US1] Unit test in `backend/src/services/roomStore.test.ts`: `toRoomSnapshot` includes `hostId` and marks the creator participant `isHost: true`

### Implementation for User Story 1

- [ ] T007 [US1] In `backend/src/services/roomStore.ts`, set `hostId = participant.id` and `status: "lobby"` in `createRoom` (depends on T003)
- [ ] T008 [US1] In `backend/src/services/roomStore.ts`, update `toRoomSnapshot` to include `hostId` and compute per-participant `isHost` (remove the `void viewerParticipantId` no-op) (depends on T004)
- [ ] T009 [P] [US1] In `frontend/src/services/api.ts`, extend `RoomSnapshot` type: `hostId: string`, `status: "lobby" | "started"`, participants include `isHost: boolean`
- [ ] T010 [P] [US1] In `frontend/src/state/roomStore.ts`, mirror the updated `RoomSnapshot` type
- [ ] T011 [US1] In `frontend/src/pages/LobbyPage.tsx`, display the room code (uppercase) and a host indicator next to the host participant (FR-003, FR-005a) (depends on T009, T010)

**Checkpoint**: Create flow works end-to-end; host is identifiable in the lobby.

---

## Phase 4: User Story 2 - Player joins a room by code (Priority: P1)

**Goal**: A player joins by code; empty/whitespace and unknown codes are rejected with clear messages;
codes are normalized.

**Independent Test**: With a room created, join from a second tab by code → both tabs resolve to the
same room; bad codes show errors and do not navigate.

### Tests for User Story 2 ⚠️

- [ ] T012 [P] [US2] Unit test in `backend/src/api/schemas.test.ts`: room code param is trimmed/uppercased and empty/whitespace codes are rejected
- [ ] T013 [P] [US2] Unit test in `backend/src/services/roomStore.test.ts`: joining an unknown code returns no room (drives 404); joining a valid code appends the participant with `isHost: false`

### Implementation for User Story 2

- [ ] T014 [US2] In `backend/src/api/schemas.ts`, add a shared code normalization (trim + uppercase) and reject empty/whitespace codes for `:code` params (FR-005, FR-007)
- [ ] T015 [US2] In `backend/src/api/rooms.ts`, ensure join returns `404 { "message": "Room not found" }` for unknown codes and uses the normalized code (FR-006)
- [ ] T016 [US2] In `frontend/src/pages/JoinRoomPage.tsx`, block submit on empty/whitespace code with a visible message before any request; surface backend "room not found" error without navigating (FR-007, FR-019)

**Checkpoint**: Join flow works; invalid/unknown codes are handled gracefully.

---

## Phase 5: User Story 3 - Lobby stays in sync via polling (Priority: P2)

**Goal**: The lobby auto-refreshes about every 2 seconds; all tabs converge; polling stops on unmount;
transient failures don't crash the lobby.

**Independent Test**: Open lobby in tab 1, join from tab 2 → tab 1 shows the new player within ~2s with
no manual action.

### Implementation for User Story 3

- [ ] T017 [US3] In `frontend/src/pages/LobbyPage.tsx`, add a `useEffect` that calls the store's `fetchRoom()` on a `setInterval(2000)` and clears the interval on unmount (FR-009, FR-010)
- [ ] T018 [US3] In `frontend/src/pages/LobbyPage.tsx`, keep the lobby resilient: a failed poll sets a readable error but the interval continues and the participant list is not wiped (FR-011, FR-019)

**Checkpoint**: Lobby updates automatically and survives transient fetch failures.

---

## Phase 6: User Story 4 - Host-only start with a 2-player minimum (Priority: P1)

**Goal**: Only the host can start, only with ≥2 players; on success the room becomes `started` and all
participants reach the game screen (no drawer/word assigned).

**Independent Test**: Host alone → start disabled; add 2nd player → host can start; non-host can never
start; after start both tabs land on `/game`.

### Tests for User Story 4 ⚠️

- [ ] T019 [P] [US4] Unit test in `backend/src/services/roomStore.test.ts`: `startRoom` returns `forbidden` for non-host, `too-few-players` for <2, `not-found` for unknown code
- [ ] T020 [P] [US4] Unit test in `backend/src/services/roomStore.test.ts`: `startRoom` success sets `status = "started"`, is idempotent when already started, and assigns NO role/word (FR-017, FR-018)
- [ ] T021 [P] [US4] Unit test in `backend/src/services/roomStore.test.ts`: starting room A does not change room B (isolation, FR-008/SC-005)
- [ ] T022 [P] [US4] Unit test in `backend/src/api/schemas.test.ts`: `startRoomSchema` rejects missing/empty `participantId`
- [ ] T023 [P] [US4] Unit test in `frontend/src/services/api.test.ts`: `startRoom(code, participantId)` POSTs to `/rooms/:code/start` with the participant id

### Implementation for User Story 4

- [ ] T024 [US4] In `backend/src/services/roomStore.ts`, implement `startRoom(code, participantId)` returning a discriminated result (`ok`/`reason`), idempotent when already `started` (depends on T003)
- [ ] T025 [US4] In `backend/src/api/schemas.ts`, add `startRoomSchema` (`participantId: z.string().min(1)`)
- [ ] T026 [US4] In `backend/src/api/rooms.ts`, add `POST /:code/start`; parse params + body with Zod; map results to 200 / 403 / 404 / 422 with the messages in `contracts/rooms-api.md` (depends on T024, T025)
- [ ] T027 [P] [US4] In `frontend/src/services/api.ts`, add `startRoom(code, participantId)` → `POST /rooms/:code/start`
- [ ] T028 [US4] In `frontend/src/state/roomStore.ts`, add a `startGame()` action that calls `api.startRoom` and stores the returned snapshot (depends on T027)
- [ ] T029 [US4] In `frontend/src/pages/LobbyPage.tsx`, gate the Start control on `isHost && participants.length >= 2`, with explanatory copy when disabled; non-hosts see "waiting for host" (FR-012, FR-013, FR-016)
- [ ] T030 [US4] In `frontend/src/pages/LobbyPage.tsx`, replace direct `navigate("/game")` with `startGame()` then navigate; non-host tabs auto-navigate to `/game` when a poll observes `status === "started"` (FR-014, FR-017) (depends on T017, T028)

**Checkpoint**: Host-only start enforced server-side; all tabs transition to the game screen.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T031 [P] Add minor styles in `frontend/src/styles/app.css` for the host badge and disabled-start messaging (only if needed)
- [ ] T032 Confirm session-guard redirects still hold after snapshot changes: visiting `/lobby` or `/game` with no active room session redirects to `/` (`frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/GamePage.tsx`) — direct-navigation edge case
- [ ] T033 [P] Run automated suites green: `cd backend && npm test` and `cd frontend && npm test`
- [ ] T034 Run `cd backend && npm run build` and `cd frontend && npm run build`; fix any strict-TS issues from widening `RoomStatus`
- [ ] T035 Run the two-tab manual validation in `specs/001-room-setup-lobby/quickstart.md` and confirm all acceptance scenarios pass
- [ ] T036 Verify artifacts remain consistent with the implementation; document any deviation in `spec.md`/`plan.md` per constitution Principle II (`specs/001-room-setup-lobby/spec.md`, `specs/001-room-setup-lobby/plan.md`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup; BLOCKS all user stories (T003/T004 are shared types)
- **US1 (Phase 3)**: after Foundational
- **US2 (Phase 4)**: after Foundational; independent of US1
- **US3 (Phase 5)**: after Foundational; uses existing `fetchRoom()`
- **US4 (Phase 6)**: after Foundational; navigation step (T030) depends on US3's polling (T017)
- **Polish (Phase 7)**: after desired stories complete

### Key cross-task dependencies

- T007 → T003; T008 → T004
- T024 → T003; T026 → T024, T025; T028 → T027; T030 → T017, T028

### Parallel Opportunities

- T005, T006 (US1 tests) run together
- T009, T010 (frontend type mirrors) run together
- T012, T013 (US2 tests) run together
- T019–T023 (US4 tests) all run together — different assertions, two test files
- T027 ([P]) can be written alongside backend T024–T026

> ⚠️ **Single-file serialization**: T011, T017, T018, T029, T030 (and T032) all edit
> `frontend/src/pages/LobbyPage.tsx`. They are NOT parallel with each other — apply them sequentially
> to avoid conflicts, even though they belong to different stories.

## Traceability (FR → tasks)

| Requirement | Tasks |
|-------------|-------|
| FR-001 create + unique code | starter (verified T001, T035) |
| FR-002 host recorded | T003, T007, T005 |
| FR-003 host visible in snapshot/UI | T004, T006, T008, T009, T010, T011 |
| FR-004 join by code | starter (verified T035) |
| FR-005 / FR-005a code normalize + uppercase display | T014, T011 |
| FR-006 unknown code rejected (404) | T013, T015 |
| FR-007 empty/whitespace code rejected | T012, T014, T016 |
| FR-008 multi-room isolation | T021 |
| FR-009 lobby polling ~2s | T017 |
| FR-010 polling stops on unmount | T017 |
| FR-011 tabs converge | T017, T018 |
| FR-012 host-only start | T019, T024, T026, T029 |
| FR-013 ≥2-player minimum | T019, T024, T026, T029 |
| FR-014 non-host rejected server-side | T019, T026, T030 |
| FR-015 host <2 players rejected | T019, T026 |
| FR-016 start control gating + copy | T029 |
| FR-017 status→started, all reach game | T020, T024, T026, T028, T030 |
| FR-018 no role/word on start | T020, T024 |
| FR-019 UI resilient to errors | T016, T018 |

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 US1 (create + host visible).
2. **STOP and validate** US1 in one tab.

### Incremental Delivery (recommended order for this lab)

US1 (create/host) → US2 (join/validation) → US3 (polling) → US4 (host-only start). US4 last because its
auto-navigation builds on US3's polling loop. Commit after each phase (granular, traceable to FRs).

---

## Notes

- [P] = different files, no dependencies. [Story] maps each task to a spec user story.
- Write each test task and see it fail before implementing the corresponding behavior.
- Commit after each task or logical group; keep messages traceable to Scenario 1 / FR IDs.
- Do NOT assign drawer roles or select words here (FR-018) — that is Group 2.
