---

description: "Task list for 001-room-setup-lobby"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included. Plan §Testing Strategy and Constitution Principle V both call for backend and frontend Vitest coverage in addition to the manual two-tab gate.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- All paths below are repo-root-relative.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Unblock everything that depends on a working dev environment.

- [X] T001 Fix the sabotaged `VITE_API_URL` fallback in `frontend/src/services/api.ts` (line 22): replace `"http://localhost:3001/bug"` with `"http://localhost:3001"` so the frontend reaches the backend by default. Re-run both `npm run dev`s and confirm `http://localhost:3001/health` returns `{"ok":true}` from a successful create-room round-trip. Maps to Plan §Risks R1.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the host concept end-to-end (model + snapshot + frontend types + identity storage) so every user story can build on it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Extend `backend/src/models/game.ts`: add `hostParticipantId: string` to both `Room` and `RoomSnapshot`. Keep `availableWords` and `roles` in `RoomSnapshot` unchanged. Maps to Data Model §Backend types.
- [X] T003 Update `backend/src/services/roomStore.ts`: (a) change `generateCode` to draw from the 26-letter alphabet `ABCDEFGHIJKLMNOPQRSTUVWXYZ`; (b) in `createRoom`, capture the creator's `participant.id` and set `room.hostParticipantId` on the new `Room`; (c) in `toRoomSnapshot`, include `hostParticipantId` in the returned object. Maps to FR-002, FR-003, FR-008, FR-014.
- [X] T004 Update `backend/src/services/roomStore.test.ts`: change the code regex assertion from `/^[A-Z0-9]{4}$/` to `/^[A-Z]{4}$/`; add an assertion that the returned `result.room.hostParticipantId` equals `result.participantId`. Maps to Plan §Risks R6.
- [X] T005 [P] Mirror the snapshot extension in `frontend/src/services/api.ts`: add `hostParticipantId: string` to the local `RoomSnapshot` interface (and keep `RoomSessionResponse` shape intact). No runtime change. Maps to Data Model §Frontend types.
- [X] T006 [P] Create `frontend/src/state/identityStorage.ts` exporting three helpers — `readIdentity(roomCode: string): LocalIdentity | null`, `writeIdentity(roomCode: string, identity: LocalIdentity): void`, and `clearIdentity(roomCode: string): void` — each wrapping `localStorage` access in `try/catch` so a private/locked-down browser degrades silently. Use storage key `scribble:identity:<roomCode>` and the `LocalIdentity` shape `{participantId: string; role: "host" | "guest"}` defined in Data Model §LocalIdentity.

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Host creates a room and lands in the lobby (Priority: P1) 🎯 MVP

**Goal**: A player can create a room from the Start screen, receive a 4-letter A–Z code, and see themselves in the lobby clearly labeled as host.

**Independent Test**: With both apps running, open one tab, click Create Room, enter `Alice`, submit. Confirm the lobby loads with a 4-letter A–Z code badge and `Alice` shown as host.

### Tests for User Story 1

- [X] T007 [P] [US1] Add a case to `backend/src/services/roomStore.test.ts` that creates two rooms in sequence and asserts that neither room's `participants` array contains the other room's participant — covers FR-008 (multi-room isolation) at the service layer.
- [X] T008 [P] [US1] Add a case to `frontend/src/services/api.test.ts` that confirms `api.createRoom("Alice")` calls `fetch` with a URL beginning with `http://localhost:3001/rooms` (not `/bug/rooms`) — locks in the T001 fix and protects it from regression.

### Implementation for User Story 1

- [X] T009 [P] [US1] Update `frontend/src/pages/CreateRoomPage.tsx`: after a successful `roomStore.createRoom(playerName)`, call `writeIdentity(response.room.code, {participantId: response.participantId, role: "host"})` from `identityStorage` before navigating to `/lobby`. Maps to FR-014 + Clarification Q1.
- [X] T010 [US1] Update `frontend/src/pages/LobbyPage.tsx` (first edit of this file): (a) on mount, if `roomState.participantId` is null but a `room.code` is present in URL/router state or the most recent snapshot, read `identityStorage` and hydrate `participantId` into the store before the first poll; (b) render a `(Host)` badge next to the participant whose `id === room.hostParticipantId` in the participant list. Maps to US1 Acceptance §1, FR-003.

**Checkpoint**: User Story 1 should be fully functional — a single browser tab can create a room and see itself as host with a 4-letter A–Z code. Validate by running the US1 section of `quickstart.md`.

---

## Phase 4: User Story 2 - Player joins existing room by code, with validation (Priority: P2)

**Goal**: A second tab can join an existing room by code; empty, whitespace-only, and unknown codes are rejected with a visible message and no lobby entry is created.

**Independent Test**: With Tab A hosting a room from US1, open Tab B → Join Room → submit the host's code → land in the same lobby with both participants visible. Then submit empty / whitespace / `ZZZZ` — each must be rejected with a visible message and keep you on the Join screen.

### Tests for User Story 2

- [X] T011 [P] [US2] Extend `backend/src/api/schemas.test.ts`: add cases that assert `roomCodeParamsSchema.parse({code: ""})` throws, `roomCodeParamsSchema.parse({code: "   "})` throws, `roomCodeParamsSchema.parse({code: "abcd"})` accepts (case is allowed at the schema layer; route normalizes), and `joinRoomSchema.parse({})` accepts. Maps to FR-005, FR-006.
- [X] T012 [P] [US2] Extend `backend/src/services/roomStore.test.ts`: add a case that creates a room as `Alice`, joins as `Bob`, and asserts the returned participant id differs from `room.hostParticipantId`; add another case that creates two rooms and joins each with a unique player, asserting cross-room participant lists never overlap. Maps to FR-008.
- [X] T013 [P] [US2] Extend `frontend/src/services/api.test.ts`: add a case that mocks `fetch` to return `{ok: false, json: async () => ({message: "Room not found"})}` and asserts the rejection from `api.joinRoom("ZZZZ", "Bob")` carries `"Room not found"` as the `Error.message`. Maps to FR-007, FR-015.

### Implementation for User Story 2

- [X] T014 [US2] Tighten `backend/src/api/schemas.ts`: change `roomCodeParamsSchema` to `z.object({code: z.string().transform(s => s.trim()).refine(s => s.length > 0, {message: "Enter a room code"})})`. Export the refined schema. Maps to FR-005, FR-006.
- [X] T015 [US2] Update `backend/src/api/rooms.ts` (depends on T014): replace `code.toUpperCase()` calls with use of the already-trimmed value from the schema, then `.toUpperCase()`. Ensure the 404 path in both `POST /rooms/:code/join` and `GET /rooms/:code` throws `new HttpError(404, "Room not found")` (rename from `"Unable to join room"` / `"Unable to load room"`). Maps to FR-007, FR-015.
- [X] T016 [P] [US2] Update `backend/src/api/router.ts` `errorHandler`: when a `ZodError` is caught, inspect `error.issues[0].message` — if present and non-empty, forward it as the `message` field of the 400 response; otherwise fall back to `"Invalid request payload"`. This is what lets the `"Enter a room code"` refine message reach the client. Maps to FR-015.
- [X] T017 [P] [US2] Update `frontend/src/pages/JoinRoomPage.tsx`: after a successful `roomStore.joinRoom(...)`, call `writeIdentity(response.room.code, {participantId: response.participantId, role: "guest"})` before navigating; ensure the existing `form__error` paragraph already renders `error.message` verbatim (it does — verify and add an `aria-live="polite"` attribute to the surrounding container if missing). Maps to FR-014 + Clarification Q1, FR-015.

**Checkpoint**: Two tabs can be in the same lobby; all three rejection paths show the correct visible message and never create a lobby entry. Validate via the US2 section of `quickstart.md`.

---

## Phase 5: User Story 3 - Lobby auto-polls within ~2 seconds (Priority: P2)

**Goal**: A lobby viewer sees participant changes within ~3 seconds without pressing a refresh button; polling stops cleanly when the viewer navigates away.

**Independent Test**: With Tabs A and B already in the lobby, open Tab C and join. Within ~3 s Tabs A and B show Tab C without any click. Navigate Tab A away — devtools Network shows no further `/rooms/:code` requests from Tab A.

### Tests for User Story 3

- [X] T018 [P] [US3] Create `frontend/src/state/useLobbyPolling.test.tsx` using `@testing-library/react`-style render via Vitest + jsdom (the project already has jsdom available). Use `vi.useFakeTimers()` to: (a) assert one fetch fires immediately after mount, (b) advance time by 2000 ms and assert a second fetch fires, (c) unmount and assert no further fetches fire on additional 2000 ms ticks. Maps to FR-009, FR-010, SC-003, SC-006. **Note**: if `@testing-library/react` is not already installed, use a minimal `createRoot`/`act` harness rather than adding a dependency (Constitution Principle II).

### Implementation for User Story 3

- [X] T019 [US3] Create `frontend/src/state/useLobbyPolling.ts` exporting `useLobbyPolling(roomCode: string | null): void`. Behavior: when `roomCode` is non-null, do one immediate `roomStore.fetchRoom()`, then `setInterval(() => roomStore.fetchRoom(), 2000)`; the cleanup function calls `clearInterval`. Use `useRoomStore()` to access the store; do not introduce a new context. Wrap the body in a single `useEffect` with `[roomStore, roomCode]` as dependencies. Maps to FR-009, FR-010.
- [X] T020 [US3] Update `frontend/src/pages/LobbyPage.tsx` (second edit; depends on T010): (a) call `useLobbyPolling(room?.code ?? null)` near the top of the component; (b) remove the manual `Refresh Room` button (the `<button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>` block) and the `handleRefresh` function and the `refreshError` state — polling makes them dead weight per Plan §Phase 0 research; (c) update the Status panel copy so it no longer references "Refreshing players…" but instead reflects polling status (e.g., "Connected" when no error, error message otherwise). Maps to FR-009, FR-010.

**Checkpoint**: Both lobbies update without any button press; navigating away ends polling cleanly. Validate via the US3 section of `quickstart.md`.

---

## Phase 6: User Story 4 - Host-only Start, 2-player quorum (Priority: P3)

**Goal**: Only the host sees an actionable Start control, and only when the room has 2 or more players.

**Independent Test**: As the lone host, Start is hidden or visibly disabled. After a second player joins, within ~3 s Start becomes actionable in the host tab. In the joiner's tab, Start is never visible at all.

### Tests for User Story 4

- [X] T021 [P] [US4] Create `frontend/src/pages/LobbyPage.test.tsx` using Vitest + jsdom. Render `LobbyPage` with a stubbed `RoomStoreProvider` whose state is preset to a snapshot — four cases: (a) `hostParticipantId === participantId` and `participants.length === 1` → Start present but disabled, "Waiting for another player" copy visible; (b) same as (a) with `participants.length === 2` → Start present and enabled; (c) `hostParticipantId !== participantId` and any participant count → Start element absent from the DOM; (d) snapshot is `null` → component returns null without crashing (matches the existing `if (!room) return null` guard). Maps to FR-011, FR-012, FR-013.

### Implementation for User Story 4

- [X] T022 [US4] Update `frontend/src/pages/LobbyPage.tsx` (third edit; depends on T020): (a) derive `isHost = !!room && !!participantId && room.hostParticipantId === participantId`; (b) wrap the Start button in `{isHost && (...)}` so non-hosts never see it; (c) set `disabled={room.participants.length < 2}` on the Start button; (d) when `isHost && room.participants.length < 2`, render a short explanatory paragraph "Waiting for another player to join…" near the Start row. Keep navigation target `/game` unchanged. Maps to FR-011, FR-012, FR-013.

**Checkpoint**: Host-only and quorum-gated Start. Validate via the US4 section of `quickstart.md`.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Enforce the constitution's quality gates and confirm scenario-level acceptance.

- [X] T023 [P] Run `cd backend && npm run build` and confirm it succeeds. Maps to Constitution Principle V build gate.
- [X] T024 [P] Run `cd frontend && npm run build` and confirm it succeeds. Maps to Constitution Principle V build gate.
- [X] T025 [P] Run `cd backend && npm test` and confirm all tests pass (existing + new from T004, T007, T011, T012).
- [X] T026 [P] Run `cd frontend && npm test` and confirm all tests pass (existing + new from T008, T013, T018, T021).
- [ ] T027 Execute the full two-tab walkthrough in `specs/001-room-setup-lobby/quickstart.md` end-to-end: US1, US2 (happy + 3 rejection paths + casing), US3 (auto-refresh + polling-stop-on-navigate), US4 (host-only + quorum), cross-room isolation over 60 s, host refresh reclaim, and polling-failure resilience. Tick off the sign-off checklist in `quickstart.md`. Maps to Constitution Principle V two-tab gate, SC-001 through SC-006.
- [ ] T028 Review the branch commit history with `git log --oneline 001-room-setup-lobby`: every commit message MUST reference at least one task ID (T###) or scenario from `spec.md`; no commit may span more than one user story. If any commit fails this rule, reword/split before opening the PR. Maps to Constitution Principle V granular-commits rule.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** — T001 must complete before any frontend work; backend work can begin immediately but is meaningless without T001 for end-to-end validation.
- **Phase 2 (Foundational)** — depends on T001. T002 → T003 (T003 uses the new field on `Room`). T003 → T004 (test updates the assertion that T003 changed). T005 and T006 are file-isolated from T002–T004 and from each other; both can run in parallel with the backend work.
- **Phase 3 (US1)** — depends on full Phase 2. Within US1, T007 and T008 are parallel test files; T009 is a different file from T010; T010 must come last because it's the LobbyPage anchor.
- **Phase 4 (US2)** — depends on Phase 2 (uses Foundational types) but not on Phase 3 (independently testable). T011, T012, T013 are independent test files. T014 → T015 (T015 imports the refined schema). T016 is independent of T014/T015. T017 is independent of all backend edits.
- **Phase 5 (US3)** — depends on Phase 3 (US3 requires the LobbyPage edit anchor from T010). T018 is an independent test file. T019 → T020 (T020 imports the hook from T019). **T020 touches `LobbyPage.tsx` again; it MUST follow T010 chronologically.**
- **Phase 6 (US4)** — depends on Phase 5 (T022 is the third LobbyPage edit; must follow T020). T021 is an independent test file.
- **Phase 7 (Polish)** — depends on all preceding phases.

### User Story Dependencies

- **US1 (P1)** depends only on Foundational. MVP candidate.
- **US2 (P2)** depends only on Foundational. Can run in parallel with US1 if staffed.
- **US3 (P2)** depends on US1's LobbyPage edit (T010) being merged. Cannot start LobbyPage edits before US1 closes.
- **US4 (P3)** depends on US3's LobbyPage edit (T020) being merged. Same constraint.

### Within Each User Story

- Tests first (write, fail, then implement), per Constitution Principle V's self-review discipline.
- Models / helpers before consumers.
- Same-file edits are sequenced; different-file edits marked [P].

### Parallel Opportunities

- T005 ∥ T006 within Foundational.
- T007 ∥ T008 ∥ T009 within US1 (T010 sequential after, same file).
- T011 ∥ T012 ∥ T013 within US2; T014 → T015 sequential; T016 ∥ T017 with all of the above as long as no file overlap.
- T018 within US3 is independent of T019/T020.
- T021 within US4 is independent of T022.
- T023 ∥ T024 ∥ T025 ∥ T026 within Polish (build/test gates).

---

## Parallel Example: User Story 1

```text
# After Foundational completes, launch the three US1-independent tasks together:
T007 [US1] Backend isolation test in backend/src/services/roomStore.test.ts
T008 [US1] Frontend base-URL test in frontend/src/services/api.test.ts
T009 [US1] CreateRoomPage identity-write edit in frontend/src/pages/CreateRoomPage.tsx

# Then T010 closes the loop with the LobbyPage edit.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup) — T001 must land before anything else.
2. Phase 2 (Foundational) — T002 → T006 (T005, T006 in parallel).
3. Phase 3 (US1) — T007 → T010.
4. **STOP and VALIDATE**: run the US1 section of `quickstart.md` with one browser tab. If it passes, the MVP is real.

### Incremental Delivery

1. MVP (US1) → commit, demo if desired.
2. Add US2 → run US2 section of `quickstart.md` → commit.
3. Add US3 → run US3 section → commit.
4. Add US4 → run US4 section → commit.
5. Polish (T023–T028) → full quickstart end-to-end → open PR.

### Parallel Team Strategy

Not applicable at lab scale (single contributor), but if two contributors are available after Foundational:
- Contributor A: US1 then US3 then US4 (LobbyPage owner).
- Contributor B: US2 (backend schema + handlers, plus JoinRoomPage edit).
- Both meet at Polish for the gates and the walkthrough.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps each task to its user story for traceability (per Constitution Principle V — commit messages must reference at least one task ID).
- Each user story is independently completable and testable.
- Verify tests fail before implementing (TDD for the test-prefixed tasks within each story).
- Commit after each task or each tight logical group (Constitution Principle V — granular commits).
- Stop at any checkpoint to validate the story with the relevant `quickstart.md` section.
- Avoid: vague tasks, conflicting same-file parallel work, cross-story dependencies that break independence.
- The plan called out a sabotage (`/bug` base URL) and a divergent code regex; T001 and T004 address them explicitly so reviewers can see the corrections in the diff.
