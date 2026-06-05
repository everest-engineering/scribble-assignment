# Tasks: Game Start & Drawer Flow

**Feature**: Group 2 — Scenario 2 (Game Start & Drawer Flow) | **Branch**: `002-game-start-drawer`

**Input**: Design documents from `/specs/002-game-start-drawer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: INCLUDED — the plan's Testing Strategy and constitution Principle III require unit tests for
name validation, deterministic word selection, role assignment, and viewer-specific word hiding.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1=Name validation, US2=Host becomes drawer, US3=Deterministic word, US4=Drawer-only word visibility
- Web app paths: `backend/src/`, `frontend/src/`
- Builds on Group 1 (host, status, `startRoom`, viewer-aware `toRoomSnapshot`, lobby polling, `/game` nav)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm Group 1 baseline is green before extending it.

- [ ] T001 Confirm Group 1 suites/builds pass from a clean state: `cd backend && npm test` and `cd frontend && npm test`, then `npm run build` in each (baseline for the Group 2 changes)
- [ ] T002 Re-read `backend/src/seed/starterData.ts` to confirm `STARTER_WORDS` (5 words) and `STARTER_ROLES` are the source for word/role logic

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared model changes every later story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 In `backend/src/models/game.ts`, add `RoundState` interface (`drawerId: string`, `secretWord: string`, `roles: Record<string, ParticipantRole>`)
- [ ] T004 In `backend/src/models/game.ts`, add `round: RoundState | null` to `Room`
- [ ] T005 In `backend/src/models/game.ts`, extend `SnapshotParticipant` with `role: ParticipantRole | null`, and `RoomSnapshot` with `drawerId: string | null` and optional `secretWord?: string`
- [ ] T006 In `backend/src/services/roomStore.ts`, initialize `round: null` in `createRoom` so existing construction stays type-correct (depends on T004)

**Checkpoint**: Shared types compile; user stories can now proceed.

---

## Phase 3: User Story 1 - Player names validated at create & join (Priority: P1)

**Goal**: Empty/whitespace-only names are rejected with a clear message; accepted names are trimmed;
no silent `"Player"` default.

**Independent Test**: Create/join with `"   "` → rejected; with `"  Ada "` → stored as `Ada`.

### Tests for User Story 1 ⚠️

- [ ] T007 [P] [US1] Unit test in `backend/src/api/schemas.test.ts`: `createRoomSchema` and `joinRoomSchema` reject empty and whitespace-only `playerName`, and trim accepted names (`"  Ada "` → `"Ada"`)
- [ ] T008 [P] [US1] Unit test in `backend/src/services/roomStore.test.ts`: `createRoom`/`joinRoom` store the provided trimmed name and never substitute `"Player"`

### Implementation for User Story 1

- [ ] T009 [US1] In `backend/src/api/schemas.ts`, add a shared `playerNameSchema` (`z.string().transform(trim).pipe(z.string().min(1, "Player name is required"))`) and use it in `createRoomSchema` and `joinRoomSchema`
- [ ] T010 [US1] In `backend/src/services/roomStore.ts`, remove the `displayName(name) = name || "Player"` default; store the (already-validated, trimmed) name as-is (depends on T009)
- [ ] T011 [P] [US1] In `frontend/src/pages/CreateRoomPage.tsx`, block submit on empty/whitespace name with a visible message before calling the server (FR-022)
- [ ] T012 [P] [US1] In `frontend/src/pages/JoinRoomPage.tsx`, add an empty/whitespace name guard alongside the existing room-code guard (FR-022)

**Checkpoint**: Name validation enforced at the edge and mirrored in the UI.

---

## Phase 4: User Story 3 - Deterministic secret word (Priority: P1)

**Goal**: A pure function maps a room code to one starter word; same code → same word; always in list.

**Independent Test**: `selectWord("ABCD", STARTER_WORDS)` returns the same in-list word on repeat calls.

> Sequenced before US2 because round initialization (US2) consumes `selectWord`.

### Tests for User Story 3 ⚠️

- [ ] T013 [P] [US3] Unit test in `backend/src/services/wordSelection.test.ts`: same code returns same word (determinism); result is always a member of the list; at least two different codes can map to different words

### Implementation for User Story 3

- [ ] T014 [US3] Create `backend/src/services/wordSelection.ts` with pure `selectWord(code, words)` = `words[ sum(code char codes) % words.length ]`, no randomness (FR-026, FR-027)

**Checkpoint**: Deterministic word function exists and is unit-tested.

---

## Phase 5: User Story 2 - Host becomes the drawer on start (Priority: P1)

**Goal**: On first `started` transition, assign host=`drawer`, others=`guesser`, and select the word —
all inside `startRoom`; idempotent; GET stays read-only.

**Independent Test**: Start with host+joiner → snapshot `drawerId === hostId`, host `role: "drawer"`,
others `role: "guesser"`.

### Tests for User Story 2 ⚠️

- [ ] T015 [P] [US2] Unit test in `backend/src/services/roomStore.test.ts`: after `startRoom` success, `room.round` has `drawerId === hostId`, host role `"drawer"`, every other participant `"guesser"`, and a `secretWord` from the starter list
- [ ] T016 [P] [US2] Unit test in `backend/src/services/roomStore.test.ts`: round init is idempotent — calling `startRoom` again while `started` does not re-select the word or change roles
- [ ] T017 [P] [US2] Unit test in `backend/src/services/roomStore.test.ts`: starting room A creates no `round` in room B (isolation, SC-005)

### Implementation for User Story 2

- [ ] T018 [US2] In `backend/src/services/roomStore.ts`, in the `startRoom` success branch, build `round` once on first `started` transition: `drawerId = hostId`, `roles` map (host=drawer, others=guesser), `secretWord = selectWord(room.code, STARTER_WORDS)`; leave existing host/2-player/idempotency gates intact (depends on T014, T004)
- [ ] T019 [US2] In `backend/src/services/roomStore.ts`, update `toRoomSnapshot` to set `drawerId = room.round?.drawerId ?? null` and per-participant `role = room.round?.roles[p.id] ?? null` (FR-024) (depends on T005, T018)

**Checkpoint**: Drawer identity and roles are assigned on start and visible in every snapshot.

---

## Phase 6: User Story 4 - Secret word visible only to the drawer (Priority: P1)

**Goal**: `secretWord` appears only in the drawer's snapshot; omitted entirely for guessers; enforced
server-side; surfaced on the game screen only for the drawer.

**Independent Test**: Drawer GET includes `secretWord`; guesser GET has no `secretWord` key.

### Tests for User Story 4 ⚠️

- [ ] T020 [P] [US4] Unit test in `backend/src/services/roomStore.test.ts`: `toRoomSnapshot(room, drawerId)` includes `secretWord`; `toRoomSnapshot(room, guesserId)` omits the `secretWord` key entirely (not null) (FR-028, FR-029)
- [ ] T021 [P] [US4] Unit test in `backend/src/services/roomStore.test.ts`: `toRoomSnapshot` with missing/unknown viewer id omits `secretWord` (safe default, FR-030)

### Implementation for User Story 4

- [ ] T022 [US4] In `backend/src/services/roomStore.ts`, in `toRoomSnapshot`, conditionally attach `secretWord` only when `room.round && viewerParticipantId === room.round.drawerId` (use conditional spread so the key is absent otherwise) (FR-028, FR-029, FR-030) (depends on T019)
- [ ] T023 [P] [US4] In `frontend/src/services/api.ts`, extend the `RoomSnapshot` type: add `drawerId: string | null`, `role: ParticipantRole | null` on participants, optional `secretWord?: string`
- [ ] T024 [P] [US4] In `frontend/src/state/roomStore.ts`, mirror the extended snapshot type (no new action needed; `fetchRoom()`/`startGame()` already pass the viewer id) (depends on T023)
- [ ] T025 [US4] In `frontend/src/pages/GamePage.tsx`, show the drawer's name to everyone; if the current viewer is the drawer (or `secretWord` is present), show the secret word; otherwise show a guesser prompt (FR-031) (depends on T023, T024)

**Checkpoint**: Word is hidden from guessers over the wire and shown to the drawer in the UI.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Minor styles in `frontend/src/styles/app.css` for drawer badge / secret-word display (only if needed)
- [ ] T027 [P] Run automated suites green: `cd backend && npm test` and `cd frontend && npm test`
- [ ] T028 Run `cd backend && npm run build` and `cd frontend && npm run build`; fix any strict-TS issues from the new `round`/optional `secretWord` types
- [ ] T029 Run the two-tab manual validation in `specs/002-game-start-drawer/quickstart.md` (drawer sees word, guesser does not — verify in UI and network response)
- [ ] T030 Verify artifacts remain consistent with the implementation; document any deviation in `spec.md`/`plan.md` per constitution Principle II

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup; BLOCKS all user stories (T003–T006 are shared types)
- **US1 (Phase 3)**: after Foundational; independent of the round-state stories
- **US3 (Phase 4)**: after Foundational; provides `selectWord` for US2
- **US2 (Phase 5)**: after US3 (needs `selectWord`) and Foundational
- **US4 (Phase 6)**: after US2 (needs `round`/`drawerId` and snapshot roles)
- **Polish (Phase 7)**: after desired stories complete

### Key cross-task dependencies

- T006 → T004; T010 → T009
- T018 → T014, T004; T019 → T005, T018; T022 → T019
- T024 → T023; T025 → T023, T024

### Parallel Opportunities

- T007, T008 (US1 tests) run together
- T011, T012 (frontend name guards) run together
- T015, T016, T017 (US2 store tests) run together
- T020, T021 (US4 projection tests) run together
- T023, T024 (frontend type mirrors) run together

> ⚠️ **Single-file serialization**: T006, T010, T018, T019, T022 all edit
> `backend/src/services/roomStore.ts`. They are NOT parallel with each other — apply sequentially.

## Traceability (FR → tasks)

| Requirement | Tasks |
|-------------|-------|
| FR-020 reject empty/whitespace name | T007, T009 |
| FR-021 trim name, no "Player" default | T008, T009, T010 |
| FR-022 UI blocks empty name | T011, T012 |
| FR-023 host=drawer, others=guesser on start | T015, T018 |
| FR-024 drawer identifiable in snapshot | T019, T025 |
| FR-025 init in start, idempotent, GET read-only | T016, T018 |
| FR-026 deterministic word formula | T013, T014 |
| FR-027 same code → same word | T013, T014 |
| FR-028 drawer snapshot includes word | T020, T022 |
| FR-029 guesser snapshot omits word | T020, T022 |
| FR-030 hiding enforced server-side | T021, T022 |
| FR-031 game screen shows word only to drawer | T025 |
| FR-032 no drawing/guess/score/result/restart | (scope guard — verified T029, T030) |

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 US1 (name validation) for an immediately testable slice.
2. Then US3 (word) → US2 (drawer/round) → US4 (visibility), since round init and projection build on each other.

### Incremental Delivery

US1 (names) → US3 (word fn) → US2 (round assignment) → US4 (viewer projection + UI). Commit after each
phase (granular, traceable to FR IDs).

---

## Notes

- [P] = different files, no dependencies. [Story] maps each task to a spec user story.
- Write each test task and see it fail before implementing the corresponding behavior.
- Commit after each task or logical group; keep messages traceable to Scenario 2 / FR IDs.
- Do NOT implement drawing, guessing, scoring, results, or restart here (FR-032) — those are Groups 3–4.
