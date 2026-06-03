---

description: "Task list for 002-game-start-drawer"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included. Plan §Testing Strategy and Constitution Principle V both call for backend and frontend Vitest coverage alongside the manual two-tab gate.

**Organization**: Tasks are grouped by user story (US1, US2) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- All paths below are repo-root-relative.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new setup is required — the dev environment, lockfiles, and `.gitignore` are all carried over from Scenario 1.

(intentionally empty — proceed to Phase 2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the `currentRound` field to the shared `RoomSnapshot` type on both ends. Every existing snapshot-building helper (in tests and in the store) needs the field present (`null` for lobby) before any US-specific work compiles.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Extend `backend/src/models/game.ts`: change `RoomStatus` from `"lobby"` to `"lobby" \| "playing"`; add `Round { drawerParticipantId: string; secretWord: string }`; add `currentRound: Round \| null` to `Room`; add `SnapshotRound { drawerParticipantId: string; secretWord: string \| null }`; add `currentRound: SnapshotRound \| null` to `RoomSnapshot`. Maps to Data Model §Backend types.
- [X] T002 [P] Mirror the type extensions in `frontend/src/services/api.ts`: add `SnapshotRound { drawerParticipantId: string; secretWord: string \| null }`; add `currentRound: SnapshotRound \| null` to the local `RoomSnapshot`; widen the `status` union from `"lobby"` to `"lobby" \| "playing"`. No runtime change. Maps to Data Model §Frontend types.

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Host starts the game; drawer and secret word are assigned (Priority: P1) 🎯 MVP

**Goal**: When the host presses Start with ≥2 players, the room transitions to `"playing"`, the host is designated drawer, and a deterministic secret word from `STARTER_WORDS` is delivered only to the drawer's session.

**Independent Test**: With two browser tabs in the same lobby (host in Tab A, guest in Tab B), press Start in Tab A. Within ~3 seconds both tabs leave the lobby for the game view. Tab A shows the secret word; Tab B shows a fixed placeholder. Tab B's network response contains `secretWord: null`. Refreshing either tab preserves the same role and the same word visibility.

### Tests for User Story 1

- [X] T003 [P] [US1] Extend `backend/src/services/roomStore.test.ts` with: (a) `selectWord(code)` invariants — pure function returning a `STARTER_WORDS` member; same code → same word across 50 invocations; (b) `startRoom(code, hostId)` with 2+ players sets `status === "playing"`, sets `currentRound.drawerParticipantId === hostId`, sets `secretWord` to a `STARTER_WORDS` member; (c) `startRoom(code, nonHostId)` returns a host-rejection sentinel (status stays `lobby`); (d) `startRoom(code, hostId)` with 1 player returns a quorum-failure sentinel; (e) re-calling `startRoom` on a `playing` room as host returns the same `currentRound` (idempotent — selector not re-run); (f) `toRoomSnapshot(room, drawerId).currentRound.secretWord` is the real word; `toRoomSnapshot(room, nonDrawerId).currentRound.secretWord === null`; `toRoomSnapshot(room, undefined).currentRound.secretWord === null`; (g) `toRoomSnapshot(roomWithStatusLobby, anyId).currentRound === null`; (h) `joinRoom(code, name)` against a `playing` room returns a `"room-not-open"` discriminator (distinct from `null` for not-found). Maps to FR-003, FR-004, FR-006, FR-007, FR-008, FR-010, FR-011, FR-012, SC-002, SC-003.
- [X] T004 [P] [US1] Add a case to `backend/src/api/schemas.test.ts`: `startRoomSchema` (to be created in T008) accepts `{participantId: "abc"}` and rejects `{}`, `{participantId: ""}`, and `{participantId: 42}` with `"Invalid request payload"`. Maps to the contract in `contracts/POST_rooms_code_start.md`.
- [X] T005 [P] [US1] Add a case to `frontend/src/services/api.test.ts`: `api.startGame("ABCD", "host-id")` (to be added in T010) calls `fetch` with `POST http://localhost:3001/rooms/ABCD/start`, body `{"participantId":"host-id"}`, and the JSON `Content-Type` header. Add a second case asserting that a non-ok response with `{message: "Only the host can start the game"}` is surfaced as `Error.message`. Maps to FR-011.
- [X] T006 [P] [US1] Create `frontend/src/pages/GamePage.test.tsx` (new file) using Vitest + jsdom + MemoryRouter, mirroring the harness from `LobbyPage.test.tsx`. Cover: (a) viewer is drawer (`participantId === room.currentRound.drawerParticipantId`) with `secretWord: "rocket"` → DOM contains the literal text `"rocket"` and a "You're the drawer" / similar indicator; (b) viewer is guesser with `secretWord: null` → DOM does NOT contain any of `rocket|pizza|castle|guitar|sunflower` and shows the fixed placeholder; (c) viewer is guesser → DOM shows the drawer participant's name (looked up by id from `participants`); (d) `room === null` returns `null` from the component (existing guard). Maps to FR-006, FR-007, SC-002.

### Implementation for User Story 1

- [X] T007 [P] [US1] Update `backend/src/services/roomStore.ts`: (a) add `selectWord(code: string): string` — `STARTER_WORDS[sumOfCharCodes(code) % STARTER_WORDS.length]`; (b) add `startRoom(code: string, participantId: string)` — looks up room, rejects unknown (returns `null`), rejects non-host (returns a `{error: "not-host"}` sentinel), rejects `participants.length < 2` (returns `{error: "needs-quorum"}`), if already `playing` returns the existing room snapshot, otherwise sets `status = "playing"` and `currentRound = { drawerParticipantId: room.hostParticipantId, secretWord: selectWord(room.code) }`; (c) update `joinRoom` so it returns a `{error: "room-not-open"}` sentinel when the targeted room exists but `status !== "lobby"` (keeps existing `null` for not-found, success object unchanged); (d) update `toRoomSnapshot(room, viewerParticipantId)` to filter — when `room.currentRound !== null`, emit `currentRound: { drawerParticipantId, secretWord: viewerParticipantId === drawerParticipantId ? secretWord : null }`; otherwise emit `currentRound: null`. Maps to FR-003, FR-004, FR-006, FR-007, FR-008, FR-010, FR-012, SC-002, SC-003.
- [X] T008 [P] [US1] Update `backend/src/api/schemas.ts`: add `startRoomSchema = z.object({ participantId: z.string().min(1) })`. Maps to contract `POST_rooms_code_start.md`.
- [X] T009 [US1] Update `backend/src/api/rooms.ts` (depends on T007 + T008): (a) add `POST /:code/start` route — parse `roomCodeParamsSchema` then `startRoomSchema`, call `startRoom`, map sentinels: `null` → `HttpError(404, "Room not found")`, `{error: "not-host"}` → `HttpError(403, "Only the host can start the game")`, `{error: "needs-quorum"}` → `HttpError(400, "Need at least 2 players to start")`, success → respond `{room: toRoomSnapshot(result.room, participantId)}`; (b) update the `:code/join` route to map the new `{error: "room-not-open"}` sentinel from `joinRoom` to `HttpError(409, "Room is no longer open to new players")`. Maps to FR-003, FR-011, FR-012, FR-014.
- [X] T010 [P] [US1] Update `frontend/src/services/api.ts`: add `api.startGame(code: string, participantId: string)` that POSTs `{participantId}` to `/rooms/${encodeURIComponent(code)}/start` and returns `{room: RoomSnapshot}`. Re-use the existing `request<T>` helper. Maps to contract `POST_rooms_code_start.md`.
- [X] T011 [US1] Update `frontend/src/state/roomStore.ts` (depends on T010): (a) add `async startGame()` action that requires `this.state.room` and `this.state.participantId` to be present, calls `api.startGame(room.code, participantId)`, and stores `response.room` via `setRoomSnapshot`; (b) update `hydrateSession`'s placeholder `room` literal to include `currentRound: null` so the new type compiles. Maps to FR-003.
- [X] T012 [US1] Update `frontend/src/pages/LobbyPage.tsx` (depends on T011): (a) the existing Start button's `onClick` becomes an `async` handler that calls `roomStore.startGame()` and surfaces errors into `refreshError` (`error.message` verbatim); (b) add a `useEffect` that watches `room?.status`: when it flips to `"playing"`, call `navigate("/game", {replace: true})`; (c) keep the existing host-only + quorum-gated rendering of the Start button from US4 of Scenario 1. Maps to FR-003, FR-010, FR-011.
- [X] T013 [US1] Update `frontend/src/pages/LobbyPage.test.tsx` (depends on T012): (a) add `currentRound: null` to the existing `snapshot()` helper; (b) add a test case that renders LobbyPage with a snapshot whose `status === "playing"` and `currentRound !== null`, then asserts the test's `navigate` spy receives `"/game"` with `{replace: true}`. Maps to FR-003.
- [X] T014 [US1] Update `frontend/src/pages/GamePage.tsx` (depends on T011): (a) derive `isDrawer = !!room?.currentRound && participantId === room.currentRound.drawerParticipantId`; (b) derive `drawerName` by looking up `room.currentRound.drawerParticipantId` in `room.participants`; (c) replace the "Canvas" placeholder card with two branches — drawer sees a "Your word" card containing `room.currentRound.secretWord`, guesser sees a card containing the drawer's name and the fixed placeholder `"Waiting for the drawer to begin…"`; (d) keep Scoreboard / GuessForm / ResultPanel as the existing placeholders (Scenarios 3 and 4 fill them). Maps to FR-005, FR-006, FR-007.
- [X] T015 [P] [US1] Update `frontend/src/state/useLobbyPolling.test.tsx`: add `currentRound: null` to the `StoreSeed` snapshot literal so it satisfies the new type. No behavioral test change. Maps to T002 type widening.

**Checkpoint**: User Story 1 should be fully functional. Validate by running the US1 sections of `quickstart.md` (start → drawer → word → determinism → idempotency → non-host attempt → late-join blocked).

---

## Phase 4: User Story 2 - Player names are validated at room creation and join (Priority: P2)

**Goal**: An empty or whitespace-only name is rejected at both client and server with a visible `"Enter your name"` message; surrounding whitespace is trimmed.

**Independent Test**: From the Start screen, submit Create Room with name `""` → expect visible error, no navigation. With `"   "` → same. With `"  Alice  "` → accepted, lobby shows `Alice`. Repeat for Join Room.

### Tests for User Story 2

- [X] T016 [US2] Extend `backend/src/api/schemas.test.ts`: add cases that `createRoomSchema.parse({playerName: ""})` and `{playerName: "   "}` both throw with the first-issue message `"Enter your name"`; `joinRoomSchema` same; `createRoomSchema.parse({playerName: "  Alice  "})` returns `{playerName: "Alice"}` (trimmed). Maps to FR-001, FR-002, FR-014.

### Implementation for User Story 2

- [X] T017 [P] [US2] Update `backend/src/api/schemas.ts`: replace `playerName: z.string().optional()` in both `createRoomSchema` and `joinRoomSchema` with `playerName: z.string().transform((s) => s.trim()).refine((s) => s.length > 0, {message: "Enter your name"})`. Re-exports unchanged. Maps to FR-001, FR-002.
- [X] T018 [P] [US2] Update `backend/src/services/roomStore.ts`: delete the `displayName(name) → "Player"` fallback in `createParticipant` (it becomes unreachable once T017 ships); change `createParticipant`'s signature so `name` is required `string`. Update `createRoom` and `joinRoom` signatures to accept required `playerName: string`. Maps to Data Model §Migration notes.
- [X] T019 [P] [US2] Update `frontend/src/pages/CreateRoomPage.tsx`: in `handleSubmit`, compute `const trimmed = playerName.trim();` and reject pre-flight with `setError("Enter your name")` when `trimmed.length === 0`. Pass `trimmed` (not `playerName`) to `roomStore.createRoom`. Maps to FR-001, FR-002, SC-004, SC-005.
- [X] T020 [P] [US2] Update `frontend/src/pages/JoinRoomPage.tsx`: in `handleSubmit`, compute `const trimmedName = playerName.trim();` and reject pre-flight with `setError("Enter your name")` when `trimmedName.length === 0`. Pass `trimmedName` (not `playerName`) to `roomStore.joinRoom`. The existing empty-code guard for the room code is unchanged. Maps to FR-001, FR-002, SC-004, SC-005.

**Checkpoint**: Both forms reject empty / whitespace-only names with a visible message; trim is honoured end-to-end. Validate via the US2 section of `quickstart.md`.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Enforce the constitution's quality gates and confirm scenario-level acceptance.

- [X] T021 [P] Run `cd backend && npm run build` and confirm it succeeds. Maps to Constitution Principle V build gate.
- [X] T022 [P] Run `cd frontend && npm run build` and confirm it succeeds (`tsc -b && vite build`). Maps to Constitution Principle V build gate.
- [X] T023 [P] Run `cd backend && npm test` and confirm all tests pass (existing 12 + new from T003, T004, T016).
- [X] T024 [P] Run `cd frontend && npm test` and confirm all tests pass (existing 10 + new from T005, T006, T013, T015).
- [ ] T025 Execute the full two-tab walkthrough in `specs/002-game-start-drawer/quickstart.md` end-to-end: US2 name validation, US1 start transition, drawer word visibility, **network-tab inspection of guesser's `secretWord: null`** (SC-002), determinism across refresh, idempotent re-press, non-host start attempt blocked (SC-006), late-join blocked (SC-007). Tick off the sign-off checklist in `quickstart.md`. Maps to Constitution Principle V two-tab gate.
- [ ] T026 Review the branch commit history with `git log --oneline main..HEAD`: every commit message MUST reference at least one task ID (T###) or scenario from `spec.md`; no commit may span more than one user story. If any commit fails this rule, reword/split before opening the PR. Maps to Constitution Principle V granular-commits rule.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)** — T001 → T002 (T002 mirrors T001). Both must complete before any US task can compile.
- **Phase 3 (US1)** — depends on Phase 2 only; can run in parallel with Phase 4 if staffed.
  - Within US1 backend: T003/T004 (tests) and T007/T008 (impl) all four can run in parallel after Phase 2; T009 (route) depends on T007 + T008.
  - Within US1 frontend: T005/T006 (tests) and T010 (impl) can run in parallel after Phase 2; T011 → T012 → T013; T011 → T014; T015 is fully independent after Phase 2.
- **Phase 4 (US2)** — depends only on Phase 2 (the name validation is independent of the round model). Can run in parallel with Phase 3.
  - T016 (test) depends on T017 (schema impl).
  - T017 (schemas.ts) and T018 (roomStore.ts) are independent files, parallel.
  - T019 (CreateRoomPage) and T020 (JoinRoomPage) are independent files, parallel.
- **Phase 5 (Polish)** — depends on Phase 3 and Phase 4 both being complete.

### Cross-phase same-file conflicts (sequencing notes)

- `backend/src/api/schemas.test.ts` is touched by both T004 (US1) and T016 (US2). Both are append-only; do US1 first to keep the file's diff history clean.
- `backend/src/api/schemas.ts` is touched by both T008 (US1) and T017 (US2). They edit different schemas (`startRoomSchema` vs `createRoomSchema`/`joinRoomSchema`). No conflict.
- `backend/src/services/roomStore.ts` is touched by both T007 (US1) and T018 (US2). T018 removes the now-unreachable `displayName` fallback. Sequence T007 first; T018 is a small cleanup on top.

### Parallel Opportunities

- T002 within Foundational.
- T003 ∥ T004 ∥ T005 ∥ T006 within US1 tests (all four different files).
- T007 ∥ T008 within US1 backend impl (different files); T010 within US1 frontend impl is also [P] with them.
- T015 within US1 is fully independent and can be done in parallel with most of US1.
- T017 ∥ T018 ∥ T019 ∥ T020 within US2.
- T021 ∥ T022 ∥ T023 ∥ T024 within Polish.

---

## Parallel Example: User Story 1

```text
# After Foundational completes, launch the four US1 test scaffolds together:
T003 [US1] backend roomStore.test.ts — selectWord + startRoom + snapshot filter + late-join
T004 [US1] backend schemas.test.ts — startRoomSchema cases
T005 [US1] frontend api.test.ts — startGame request + error message passthrough
T006 [US1] frontend GamePage.test.tsx (NEW) — drawer vs guesser

# In parallel with those, the backend impl pair:
T007 [US1] backend roomStore.ts — selectWord, startRoom, filter, late-join sentinel
T008 [US1] backend schemas.ts — startRoomSchema

# Then T009 (rooms.ts) once T007+T008 are in.
# Frontend impl chain T010 → T011 → T012 → T013, with T014 branching off T011 and T015 free-floating.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 2 Foundational — T001 → T002.
2. Phase 3 US1 — tests (T003–T006) and impl (T007–T015).
3. **STOP and VALIDATE**: run the US1 section of `quickstart.md` with two browser tabs. Game-start transition + drawer + word + secrecy enforcement all work. MVP demoable.

### Incremental Delivery

1. MVP US1 → commit, demo.
2. Add US2 → commit. Form-level name validation now matches the spec's explicit FR-001/FR-002.
3. Polish (T021–T026) → both builds green, both test suites green, two-tab walkthrough green, commit hygiene reviewed. Open the PR.

### Parallel Team Strategy

Not applicable at lab scale (single contributor), but two contributors after Foundational could partition as:
- Contributor A: US1 backend (T007/T008/T009) + frontend store wiring (T010/T011).
- Contributor B: US1 frontend pages (T012/T013/T014/T015) + US2 (entire).
- Meet at Polish.

---

## Notes

- [P] tasks = different files, no in-flight dependencies on incomplete tasks.
- [Story] label maps each task to its user story for traceability (Constitution Principle V — commit messages must reference at least one task ID).
- Each user story is independently completable and testable. US2 in particular is a UX-polish layer that does not depend on US1; it can ship in either order.
- Verify tests fail before implementing (TDD for the test-prefixed tasks within each story).
- Commit after each task or each tight logical group (Constitution Principle V — granular commits).
- Stop at any checkpoint to validate the story with the relevant `quickstart.md` section.
- Snapshot-filtering enforcement at the server (T007) is the most important quality lever in this feature — the SC-002 "0 leakage in network payload" criterion can only be satisfied if the snapshot itself never contains the word for a non-drawer. Reviewers should pay special attention to T007 (d) and the corresponding tests in T003 (f).
