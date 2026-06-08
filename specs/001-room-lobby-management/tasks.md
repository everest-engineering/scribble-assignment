---
description: "Task list for Room & Lobby Management"
---

# Tasks: Room & Lobby Management

**Input**: Design documents from `specs/001-room-lobby-management/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/rooms-api.md](./contracts/rooms-api.md), [quickstart.md](./quickstart.md)

**Tests**: Per the constitution, **manual two-browser validation is the primary acceptance gate** and automated tests are optional. Test tasks below are marked _(optional)_ and are NOT TDD-ordered; the existing Vitest files are extended in Polish to preserve regression coverage (Constitution V).

**Organization**: Tasks are grouped by user story (priority order from spec.md). This is a **brownfield extension** of the existing starter — tasks modify existing files; no rewrites.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US5 maps to the spec's user stories
- Exact file paths included in every task

## Path Conventions

Web app layout (existing): `backend/src/...`, `frontend/src/...` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a known-green baseline before changes (brownfield — structure already exists).

- [X] T001 Ensure dependencies are installed (`cd backend && npm install`; `cd frontend && npm install`) and capture a green baseline by running `cd backend && npm run build` and `cd frontend && npm run build`.
- [X] T002 [P] Run existing tests to record the regression baseline: `cd backend && npm test` and `cd frontend && npm test` (all currently passing).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type and infrastructure changes every story depends on.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [X] T003 Extend domain types in `backend/src/models/game.ts`: change `RoomStatus` to `"lobby" | "playing"`; add `hostId: string` to `Room`; add `lastSeenAt: string` to `Participant`; add `hostId: string` to `RoomSnapshot`.
- [X] T004 Add shared constants near the top of `backend/src/services/roomStore.ts`: `MAX_PLAYERS = 8` and `PRESENCE_TIMEOUT_MS = 10_000` (reuse existing `now()` helper).
- [X] T005 [P] Update frontend types and error surface in `frontend/src/services/api.ts`: set `RoomSnapshot.status` to `"lobby" | "playing"`, add `hostId: string`; introduce an `ApiError` (carrying HTTP `status` and `message`) thrown by `request()` instead of a bare `Error`.

**Checkpoint**: Types compile; stories can begin.

---

## Phase 3: User Story 1 - Host creates a room (Priority: P1) 🎯 MVP

**Goal**: A player creates a room, receives a unique 4-char code, and is the host with a (disabled-until-2-players) Start control.

**Independent Test**: Create a room in one window → a 4-char code shows, the creator is marked **Host**, and **Start Game** is visible but disabled with only 1 player.

- [X] T006 [US1] In `backend/src/services/roomStore.ts` `createRoom`: set `room.hostId = participant.id` and `participant.lastSeenAt = now()` when constructing the room.
- [X] T007 [US1] In `backend/src/services/roomStore.ts` `toRoomSnapshot`: include `hostId: room.hostId` in the returned snapshot.
- [X] T008 [US1] In `frontend/src/pages/LobbyPage.tsx`: render a "Host" indicator next to the participant whose `id === room.hostId`, and surface whether the current viewer (`participantId`) is the host.
- [X] T009 [US1] In `frontend/src/pages/LobbyPage.tsx`: show the **Start Game** control only when the viewer is the host, and disable it while `room.participants.length < 2` (endpoint wiring deferred to US5).

**Checkpoint**: Host creation + host indicator + start-gating baseline work independently.

---

## Phase 4: User Story 2 - Player joins a room via code (Priority: P1)

**Goal**: A second player joins via the code and appears in the shared lobby as a regular (non-host) player; duplicate names are disambiguated.

**Independent Test**: Window 2 joins with the valid code → both players appear (manual refresh available pre-polling); the joiner has no Host badge and no Start control; two players named the same show as distinct entries.

- [X] T010 [US2] In `backend/src/services/roomStore.ts` `joinRoom`: trim the name, default empty to `"Player"`, and disambiguate against current members case-insensitively by appending ` (2)`, ` (3)`, …; set the new participant's `lastSeenAt = now()`. (FR-017)
- [X] T011 [US2] In `frontend/src/pages/JoinRoomPage.tsx`: confirm the trimmed player name and code are passed to `joinRoom`, and that a successful join navigates to `/lobby` showing the non-host view.

**Checkpoint**: Create (US1) + Join (US2) form a working shared lobby.

---

## Phase 5: User Story 3 - Code validation & clear feedback (Priority: P2)

**Goal**: Empty, wrong, and full-room join attempts are rejected with distinct, clear messages; codes are accepted case-insensitively with surrounding whitespace ignored.

**Independent Test**: Empty code → "Please enter a room code"; wrong code → "Room not found"; full room → "This room is full"; ` k7p2 ` (lowercase + spaces) → joins.

- [X] T012 [US3] In `frontend/src/pages/JoinRoomPage.tsx`: add a client-side guard that rejects empty/whitespace-only codes with "Please enter a room code" (no API call), and `trim().toUpperCase()` the code before submitting. (FR-005, FR-007)
- [X] T013 [US3] In `frontend/src/pages/JoinRoomPage.tsx`: display the specific server message from `ApiError` for not-found (404) and full (409) cases. (FR-006, FR-016)
- [X] T014 [US3] In `backend/src/services/roomStore.ts` `joinRoom`: enforce `MAX_PLAYERS` and return a typed "full" signal; in `backend/src/api/rooms.ts` join handler, map it to `409 { message: "This room is full" }`. (FR-016)

**Checkpoint**: All join-validation feedback paths behave distinctly.

---

## Phase 6: User Story 4 - Room isolation (Priority: P2)

**Goal**: Multiple concurrent rooms never leak players or state across each other.

**Independent Test**: Create two rooms with different players → each lobby shows only its own members; actions in one (join/start) leave the other unchanged.

- [X] T015 [US4] In `backend/src/services/roomStore.ts`: verify and, if needed, harden isolation — confirm all access is keyed by `code` in the `Map`, and snapshots are deep-cloned (`structuredClone`) so no mutable state is shared across rooms or requests. (FR-008)
- [X] T016 [P] [US4] _(optional test)_ Add an isolation case to `backend/src/services/roomStore.test.ts`: create two rooms, join different players, and assert each room's participant list is independent.

**Checkpoint**: Isolation verified across concurrent rooms.

---

## Phase 7: User Story 5 - Lobby auto-refresh & host-controlled start (Priority: P3)

**Goal**: The lobby polls ~2s and reflects joins/leaves; departed players time out (~10s); the host (and only the host) starts the game with ≥2 players, transitioning everyone into the game; joining a started room is rejected; the host leaving closes the room.

**Independent Test**: A join/leave is reflected in other windows within ~2s; a closed tab disappears within ~10s; host Start (≥2 players) moves all windows to `/game`; a non-host cannot start; joining after start says "already started"; closing the host window ejects remaining players.

- [X] T017 [US5] In `backend/src/services/roomStore.ts`: add presence handling used on read — refresh the viewer's `lastSeenAt`, prune participants idle > `PRESENCE_TIMEOUT_MS`, and if the prune removes `hostId` or empties the room, delete the room from the store. (FR-010a, FR-015, FR-015a)
- [X] T018 [US5] In `backend/src/api/rooms.ts` `GET /:code`: route the request's `participantId` through the presence/prune path so each poll registers the caller's heartbeat and returns the pruned snapshot. (FR-010)
- [X] T019 [P] [US5] In `backend/src/api/schemas.ts`: add `startRoomSchema = z.object({ participantId: z.string() })`.
- [X] T020 [US5] In `backend/src/services/roomStore.ts`: add `startGame(code, participantId)` — after pruning, guard room-exists, requester-is-host, ≥2 players, and not-already-playing; on success set `status = "playing"` and return the snapshot, surfacing typed errors for each failure. (FR-011, FR-012, FR-013)
- [X] T021 [US5] In `backend/src/api/rooms.ts`: add `POST /:code/start` parsing `startRoomSchema`, calling `startGame`, and mapping failures to `403` (not host), `404` (no room), `409` (too few players / already started). (FR-011, FR-012)
- [X] T022 [US5] In `backend/src/services/roomStore.ts` `joinRoom`: reject joins when `status === "playing"` with a typed signal; map to `409 { message: "This game has already started" }` in `backend/src/api/rooms.ts`. (FR-014)
- [X] T023 [P] [US5] In `frontend/src/services/api.ts`: add `startRoom(code, participantId)` → `POST /rooms/:code/start`.
- [X] T024 [US5] In `frontend/src/state/roomStore.ts`: add a `startGame()` action (calls `api.startRoom`), and update `fetchRoom` to detect an `ApiError` with status `404` during polling as a room-closed condition (clear room state / flag closed).
- [X] T025 [US5] In `frontend/src/pages/LobbyPage.tsx`: add a `useEffect` that polls `fetchRoom` every ~2000ms and clears the interval on unmount. (FR-010)
- [X] T026 [US5] In `frontend/src/pages/LobbyPage.tsx`: wire the host **Start Game** button to `roomStore.startGame()`; when polled `room.status === "playing"` navigate to `/game`; when the room is closed (404 during polling) eject to `/` with a "host left / room closed" message. (FR-013, FR-015)

**Checkpoint**: Live lobby, presence timeout, host-only start, late-join rejection, and host-leave closure all function.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Regression coverage and final validation gate.

- [X] T027 [P] _(optional test)_ Extend `backend/src/services/roomStore.test.ts`: host assignment on create, name disambiguation, capacity-full rejection, presence prune + host-leave closure, and `startGame` guards (host-only, ≥2 players, already-playing).
- [X] T028 [P] _(optional test)_ Extend `backend/src/api/schemas.test.ts`: `startRoomSchema` accepts `{ participantId }` and rejects missing `participantId`.
- [X] T029 [P] _(optional test)_ Extend `frontend/src/services/api.test.ts`: `startRoom` issues the correct request and `ApiError` carries the HTTP status.
- [X] T030 Run the build gate (must pass before PR): `cd backend && npm run build` and `cd frontend && npm run build`.
- [ ] T031 Execute the two-browser acceptance script in [quickstart.md](./quickstart.md) (sections A–I) and confirm every ✅ check passes. _(Backend flow validated end-to-end via API smoke test; full two-browser UI run pending manual validation.)_

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories** (shared types/constants/error surface).
- **User Stories (Phase 3–7)**: All depend on Foundational. Recommended order is priority order (US1 → US2 → US3 → US4 → US5).
- **Polish (Phase 8)**: Depends on the user stories you intend to ship.

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories. _(MVP)_
- **US2 (P1)**: After Foundational. Independent; complements US1 (shared lobby).
- **US3 (P2)**: After Foundational. Builds on US2's join path but independently testable (validation feedback).
- **US4 (P2)**: After Foundational. Independent (isolation verification).
- **US5 (P3)**: After Foundational. Independently testable; its late-join rejection (FR-014) relies on the `"playing"` status it introduces.

### File-Contention Notes (why several tasks are NOT [P])

- `backend/src/services/roomStore.ts` is touched by T004, T006/T007, T010, T014, T017, T020, T022 → these run **sequentially**.
- `backend/src/api/rooms.ts` is touched by T018, T021, T022 → **sequential**.
- `frontend/src/pages/LobbyPage.tsx` is touched by T008/T009, T025/T026 → **sequential**.
- `frontend/src/pages/JoinRoomPage.tsx` is touched by T011, T012/T013 → **sequential**.
- Tasks marked **[P]** (T002, T005, T016, T019, T023, T027, T028, T029) are in distinct files with no incomplete-task dependency.

---

## Parallel Opportunities

- **Setup**: T002 can run alongside T001's build.
- **Foundational**: T005 (frontend `api.ts`) is [P] with the backend type/constant work (T003, T004).
- **US5**: T019 (`schemas.ts`) and T023 (frontend `api.ts`) are [P] with each other and with backend `roomStore.ts` work.
- **Polish**: T027, T028, T029 (three different test files) can all run in parallel.

### Parallel Example: Foundational

```bash
# After T003/T004 begin on the backend, in parallel:
Task: "T005 Update frontend types + ApiError in frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1.
4. **STOP and VALIDATE**: create a room, confirm code + Host badge + disabled Start.
5. Demo the host-creation slice.

### Incremental Delivery

1. Setup + Foundational → ready.
2. US1 (host creation) → validate → demo (MVP).
3. US2 (join) → two-player lobby → demo.
4. US3 (validation) → robust join feedback.
5. US4 (isolation) → multi-room safety.
6. US5 (polling + start) → live lobby and game transition → full feature.
7. Polish → regression tests + build gate + quickstart acceptance.

### Notes

- [P] = different files, no dependency on an incomplete task.
- [Story] label maps each task to its user story for traceability.
- Commit after each task or logical group; keep messages traceable to task IDs (Constitution V).
- Manual two-browser validation (T031) is the primary acceptance gate; both builds (T030) must pass before any PR.
- Do not introduce WebSockets, persistent storage, auth, or new dependencies (Constitution III & IV).
