# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/rooms-api.md ✅

**Tests**: Backend test tasks ARE included (per request) at the **service level**, targeting the existing
Vitest suites (`backend/src/services/roomStore.test.ts`, `backend/src/api/schemas.test.ts`) — no new test
dependencies. HTTP status codes (403/409) and all frontend behavior are validated via
[quickstart.md](./quickstart.md) (two browsers + optional curl in V8).

**Organization**: Tasks grouped by user story (US1–US4 from spec.md) for incremental, traceable delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different file, no dependency on an incomplete task)
- **[Story]**: US1–US4 mapping for traceability
- Exact file paths included

---

## Phase 1: Setup

**Purpose**: Confirm the brownfield baseline before changing anything (Constitution Principle V).

- [ ] T001 Verify baseline runs: `cd backend && npm install && npm run dev` (health OK) and `cd frontend && npm install && npm run dev`; confirm existing `npm test` is green in both `backend/` and `frontend/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data-shape changes every user story depends on (host identity + started state).

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [X] T002 [P] Add `hostId: string` to `Room` and `RoomSnapshot`, and widen `RoomStatus` to `"lobby" | "active"` in `backend/src/models/game.ts`.
- [X] T003 In `backend/src/services/roomStore.ts`: set `hostId = participant.id` in `createRoom()`, and include `hostId` and `status` in the object returned by `toRoomSnapshot()` (depends on T002).
- [X] T004 [P] Extend the `RoomSnapshot` type with `hostId: string` and `status: "lobby" | "active"` in `frontend/src/services/api.ts`.

**Checkpoint**: Model + snapshot now carry host identity and a started state; stories can begin.

---

## Phase 3: User Story 1 — Host creation & host badge (Priority: P1) 🎯 MVP

**Goal**: The creator is recorded as host and is visibly marked as host in the lobby (FR-001, FR-002).

**Independent Test**: Create a room in one browser; a unique code shows and the creator row is badged "host".

### Tests for User Story 1

- [ ] T005 [P] [US1] In `backend/src/services/roomStore.test.ts`: assert `createRoom()` sets `hostId` to the creator participant's id, and `toRoomSnapshot()` exposes `hostId` and `status: "lobby"`.

### Implementation for User Story 1

- [ ] T006 [US1] In `frontend/src/pages/LobbyPage.tsx`: derive `isHost = participantId === room.hostId` and render a "Host" badge on the host's row in the participant list.

**Checkpoint**: Host identity is created (T003) and visible (T006), proven by T005.

---

## Phase 4: User Story 2 — Join validation with distinct errors (Priority: P1)

**Goal**: Joining accepts valid codes (case-insensitive) and rejects empty vs unknown codes with distinct
messages (FR-003, FR-004, FR-005, FR-006, FR-014).

**Independent Test**: Join with a valid code (lowercase) succeeds; empty code → "Enter a room code."; unknown
code → "No room with that code.".

### Tests for User Story 2

- [ ] T007 [P] [US2] In `backend/src/services/roomStore.test.ts`: assert `joinRoom()` returns `null` for an unknown code (which the route maps to a 404), and succeeds for an existing code.

### Implementation for User Story 2

- [ ] T008 [US2] In `backend/src/api/rooms.ts`: change the join-not-found 404 message to `"No room with that code."` (keep the existing `code.toUpperCase()` case-insensitive match).
- [ ] T009 [US2] In `frontend/src/pages/JoinRoomPage.tsx`: trim the room code on submit; if empty/whitespace, show `"Enter a room code."` and do NOT call the API or navigate.

**Checkpoint**: Both distinct join errors and case-insensitive join work (verify V2/V3 in quickstart).

---

## Phase 5: User Story 3 — Automatic lobby polling (Priority: P2)

**Goal**: The lobby refreshes itself ~every 2s so joiners appear without manual refresh (FR-008, FR-009).

**Independent Test**: With the host's lobby open, a second player joins and appears within ~2s, no click.

### Implementation for User Story 3

- [ ] T010 [US3] In `frontend/src/pages/LobbyPage.tsx`: add a `setInterval(…, 2000)` in a `useEffect` that calls `roomStore.fetchRoom()`, cleared on unmount; keep the manual "Refresh Room" button as a fallback. (Frontend behavior validated via quickstart V4.)

**Checkpoint**: Lobby auto-updates; manual refresh still works.

---

## Phase 6: User Story 4 — Host-only start, gated, with auto-advance (Priority: P2)

**Goal**: Only the host can start, only with ≥2 players; on start, all players advance to the game screen
(FR-010, FR-011, FR-012, FR-013). Server-side enforcement is authoritative.

**Independent Test**: Start disabled with 1 player; enabled for host at 2; never enabled for non-host;
on start both tabs move to `/game` within ~2s.

### Tests for User Story 4

- [ ] T011 [P] [US4] In `backend/src/services/roomStore.test.ts`: assert `startGame()` throws a 403-class error for a non-host, throws a 409-class error with `<2` players, and sets `status: "active"` for the host with ≥2 players.

### Implementation for User Story 4

- [ ] T012 [US4] In `backend/src/api/schemas.ts`: add `startRoomSchema = z.object({ participantId: z.string().min(1) })`.
- [ ] T013 [US4] In `backend/src/services/roomStore.ts`: add `startGame(code, participantId)` — 404 if room missing, throw `HttpError(403, "Only the host can start the game.")` if `participantId !== hostId`, throw `HttpError(409, "Need at least 2 players to start.")` if `participants.length < 2`, else set `status = "active"`, bump `updatedAt`, and return the saved room (depends on T002, T003).
- [ ] T014 [US4] In `backend/src/api/rooms.ts`: add `POST /:code/start` handler parsing `startRoomSchema` and calling `startGame()`, returning `{ room: toRoomSnapshot(...) }` on success (depends on T012, T013).
- [ ] T015 [P] [US4] In `frontend/src/services/api.ts`: add `startRoom(code, participantId)` calling `POST /rooms/:code/start`, returning `{ room }`.
- [ ] T016 [US4] In `frontend/src/state/roomStore.ts`: add a `startGame()` action that calls `api.startRoom(code, participantId)` and applies the returned snapshot via `setRoomSnapshot` (depends on T015).
- [ ] T017 [US4] In `frontend/src/pages/LobbyPage.tsx`: enable Start only when `isHost && room.participants.length >= 2` (disabled otherwise with an explanation; non-hosts never get an enabled Start); wire Start to `roomStore.startGame()`; and add a `useEffect` that navigates to `/game` when `room.status === "active"` (depends on T006, T010, T016).

**Checkpoint**: Full Scenario 1 is functional end-to-end.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T018 Run [quickstart.md](./quickstart.md) V1–V7 with two browsers (V8 optional curl); record pass/fail per scenario.
- [ ] T019 [P] Confirm `npm test` passes in both `backend/` and `frontend/` (new + existing suites green).
- [ ] T020 Record any spec/implementation deviation in spec.md or plan.md (Constitution Principle VII); none expected.

---

## Dependencies & Execution Order

### Phase dependencies

- Setup (P1) → Foundational (P2, blocks all stories) → User Stories (P3–P6) → Polish (P7).

### Story dependencies

- **US1 (P1)**: needs Foundational (T002–T004).
- **US2 (P1)**: needs Foundational; independent of US1.
- **US3 (P2)**: needs Foundational; independent of US1/US2.
- **US4 (P2)**: needs Foundational; its **auto-advance** relies on polling, so complete **US3 (T010)** first; also depends on US1's `isHost` derivation (T006).

### Within-file ordering (NOT parallel — same file)

- `frontend/src/pages/LobbyPage.tsx` is touched by **T006 → T010 → T017** (do in that order).
- `backend/src/services/roomStore.ts` is touched by **T003 → T013**.
- `backend/src/services/roomStore.test.ts` is touched by **T005 → T007 → T011** (or merge into one test file edit).

### Parallel opportunities

- T002 [P] and T004 [P] (different files: backend model vs frontend type).
- Test-writing tasks T005/T007/T011 are [P] relative to other files, but share the test file — serialize those.
- T015 [P] (frontend api) can proceed alongside backend T012–T014.

---

## Implementation Strategy

### MVP (recommended first slice)

1. Phase 1 (Setup) → Phase 2 (Foundational).
2. **US1 + US2** (both P1) → host identity + visible badge + join validation. Commit + validate (quickstart V1–V3). This is the smallest meaningful, demoable slice.

### Incremental delivery (one commit per task or tight group)

US1 → US2 → US3 → US4, validating at each checkpoint. Each task maps to a granular commit
(Constitution Principle VIII), e.g. `feat: record room host on create`, `feat: add lobby polling`,
`feat: add host-only start endpoint`, `feat: auto-advance players on game start`.

---

## Notes

- Backend tests live at the **service layer** (`roomStore.ts`) where the host/start logic resides; the route
  layer (`rooms.ts`) maps thrown `HttpError`s to status codes, validated by quickstart V8.
- `[P]` = different files, no dependency. `[Story]` ties each task to its FRs via spec.md/contracts.
- Verify each new test FAILS before implementing the behavior it covers, then make it pass.
- Commit after each task or logical group; stop at any checkpoint to validate independently.
