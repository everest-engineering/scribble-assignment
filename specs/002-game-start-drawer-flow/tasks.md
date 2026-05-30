# Tasks: Game Start & Drawer Flow (Scenario 2)

**Input**: Design documents from `specs/002-game-start-drawer-flow/`  
**Prerequisites**: plan.md, spec.md; Scenario 1 complete (`specs/001-room-setup-lobby/`)  
**Branch**: `scribble-lab`

**Organization**: Tasks grouped by user story (P1→P5) for independent implementation and two-tab validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[Story]**: User story label (US1–US5) on story-phase tasks only
- Every task includes an exact file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm brownfield starter and Scenario 1 prerequisite are ready; no new project scaffolding.

- [ ] T001 Confirm Scenario 1 lobby/start flow works and starter files listed in `specs/002-game-start-drawer-flow/plan.md` exist under `backend/src/` and `frontend/src/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared round/snapshot type definitions required before user stories US2–US5.

**⚠️ CRITICAL**: Complete this phase before Phase 4+ (US2 depends on round fields in types).

- [ ] T002 Add `drawerId`, `secretWord` to `Room` and extend `ParticipantSnapshot`/`RoomSnapshot` with `role`, `viewerRole`, and viewer-specific `secretWord` in `backend/src/models/game.ts`
- [ ] T003 [P] Mirror extended snapshot types in `frontend/src/services/api.ts`

**Checkpoint**: Round snapshot types aligned — user story implementation can begin.

---

## Phase 3: User Story 1 — Player Names Are Validated at Entry (Priority: P1) 🎯 MVP

**Goal**: Create/join reject empty or whitespace-only names; valid names stored trimmed.

**Independent Test**: Submit empty/whitespace names on create and join forms — rejected with message; `" Alice "` stored as `"Alice"`.

**Maps to**: FR-001, FR-002, FR-003, FR-014, SC-001

### Implementation for User Story 1

- [ ] T004 [US1] Require trimmed `playerName` with `.trim().min(1, "Player name is required")` in `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts`
- [ ] T005 [US1] Remove `"Player"` fallback and store trimmed names from validated input in `createRoom`/`joinRoom` in `backend/src/services/roomStore.ts`
- [ ] T006 [P] [US1] Add empty and whitespace-only name schema tests in `backend/src/api/schemas.test.ts`
- [ ] T007 [US1] Trim name before submit and show error when empty in `frontend/src/pages/CreateRoomPage.tsx`
- [ ] T008 [US1] Trim name before submit and show error when empty in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: User Story 1 independently testable — name validation on both forms and API.

---

## Phase 4: User Story 2 — First Round Assigns a Single Drawer (Priority: P2)

**Goal**: After start, exactly one drawer (the host); all clients see the same drawer identity with clear role indicators.

**Independent Test**: Two-tab test after host start — both tabs show host as sole drawer; non-drawers see drawer distinguished from guessers.

**Maps to**: FR-004, FR-005, FR-006, SC-002, SC-007

### Implementation for User Story 2

- [ ] T009 [US2] Set `drawerId = hostId` in `startGame` in `backend/src/services/roomStore.ts`
- [ ] T010 [US2] Add participant `role` and snapshot `drawerId` when `status === "playing"` in `toRoomSnapshot` in `backend/src/services/roomStore.ts`
- [ ] T011 [US2] Add host-as-drawer and single-drawer invariant tests in `backend/src/services/roomStore.test.ts`
- [ ] T012 [US2] Render drawer/guesser role badges on participant rows in `frontend/src/pages/GamePage.tsx`
- [ ] T013 [P] [US2] Add `.player-list__meta--drawer` and `--guesser` badge styles in `frontend/src/styles/app.css`

**Checkpoint**: User Stories 1 and 2 work — drawer assigned and visible after start.

---

## Phase 5: User Story 3 — Secret Word Is Chosen Deterministically (Priority: P3)

**Goal**: First round picks one starter-list word via deterministic `selectWord(roomCode)`; same code always yields same word.

**Independent Test**: Vitest — `selectWord` returns starter-list word; same code → same word; room holds stable word after start (not re-rolled on poll).

**Maps to**: FR-007, FR-008, SC-003, SC-004

### Implementation for User Story 3

- [ ] T014 [P] [US3] Implement `selectWord(roomCode)` using `STARTER_WORDS[sum(charCodes) % length]` in `backend/src/services/wordSelection.ts`
- [ ] T015 [P] [US3] Add determinism and starter-list membership tests in `backend/src/services/wordSelection.test.ts`
- [ ] T016 [US3] Set `secretWord = selectWord(code)` in `startGame` in `backend/src/services/roomStore.ts`
- [ ] T017 [US3] Add word stability and starter-list tests after start in `backend/src/services/roomStore.test.ts`

**Checkpoint**: User Stories 1–3 work — round init assigns host drawer and deterministic word server-side.

---

## Phase 6: User Story 4 — Secret Word Visible Only to the Drawer (Priority: P4)

**Goal**: Drawer sees word in UI and API responses; guessers get `secretWord: null` and no word UI.

**Independent Test**: Two-tab — host (drawer) sees word; joiner (guesser) does not in UI or poll JSON.

**Maps to**: FR-009, FR-010, FR-011, SC-005, SC-006

### Implementation for User Story 4

- [ ] T018 [US4] Implement viewer-aware `secretWord` and `viewerRole` in `toRoomSnapshot` in `backend/src/services/roomStore.ts`
- [ ] T019 [US4] Add guesser-null and drawer-word snapshot leak-prevention tests in `backend/src/services/roomStore.test.ts`
- [ ] T020 [US4] Display prominent secret word panel when `viewerRole === "drawer"` in `frontend/src/pages/GamePage.tsx`
- [ ] T021 [US4] Omit secret word UI for guessers and show viewer role in Player Info in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Stories 1–4 work — asymmetric word visibility enforced server- and client-side.

---

## Phase 7: User Story 5 — Active Game Stays Synchronized via Polling (Priority: P5)

**Goal**: Game view polls ~2s while `playing`; roles and word visibility stay consistent; poll errors do not crash UI.

**Independent Test**: Both tabs on game view converge on same drawer and word visibility within one poll cycle without manual refresh.

**Maps to**: FR-012, FR-013, FR-014

### Implementation for User Story 5

- [ ] T022 [US5] Create `useGamePolling` hook with 2000ms interval and cleanup in `frontend/src/hooks/useGamePolling.ts`
- [ ] T023 [US5] Wire `useGamePolling`, poll error display, and `fetchRoomSilent` while `playing` in `frontend/src/pages/GamePage.tsx`
- [ ] T024 [P] [US5] Update test mocks for extended snapshot fields in `frontend/src/services/api.test.ts`

**Checkpoint**: All five user stories complete — full Scenario 2 acceptance criteria.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Automated checks and manual validation before Scenario 3.

- [ ] T025 Run `npm test` in `backend/` and `frontend/`
- [ ] T026 Run `npm run build` in `backend/` and `frontend/`
- [ ] T027 Manual two-tab validation per `specs/002-game-start-drawer-flow/plan.md` Testing Strategy (P1–P5 flows)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks US2–US5**
- **Phase 3 (US1)**: Can start after Phase 1 (independent of Phase 2 types)
- **Phase 4 (US2)**: Depends on Phase 2
- **Phase 5 (US3)**: Depends on Phase 4 (`startGame` round init)
- **Phase 6 (US4)**: Depends on Phase 5 (word stored server-side)
- **Phase 7 (US5)**: Depends on Phase 6 (game UI and snapshot fields stable)
- **Phase 8 (Polish)**: Depends on Phases 3–7

### User Story Dependencies

| Story | Depends on | Can test alone after |
|-------|------------|----------------------|
| US1 (P1) | Phase 1 only | Phase 3 complete |
| US2 (P2) | Foundational + US1 recommended | Phase 4 complete |
| US3 (P3) | US2 | Phase 5 complete |
| US4 (P4) | US3 | Phase 6 complete |
| US5 (P5) | US4 | Phase 7 complete |

US1 is independently deliverable as MVP. US2–US5 are sequential (each builds on prior round/snapshot capability).

### Within Each User Story

1. Backend service/logic before frontend consumer
2. Vitest before or alongside service changes (same phase)
3. Core snapshot behavior before UI polish
4. Story checkpoint before next priority

### Parallel Opportunities

- **Phase 2**: T003 `[P]` after T002 types are defined
- **Phase 3**: T006 `[P]` parallel with T004–T005; T007 `[P]` parallel with T008 after T004
- **Phase 4**: T013 `[P]` parallel with T012 after T010
- **Phase 5**: T014 `[P]` and T015 `[P]` parallel with each other; before T016
- **Phase 7**: T024 `[P]` parallel with T022–T023 after API types stable

---

## Parallel Example: User Story 3

```bash
# Launch word selection module and tests together:
Task T014: "Implement selectWord in backend/src/services/wordSelection.ts"
Task T015: "Add determinism tests in backend/src/services/wordSelection.test.ts"

# Then integrate into startGame:
Task T016: "Set secretWord in startGame in backend/src/services/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 3: User Story 1 (T004–T008)
3. **STOP and VALIDATE**: Empty names rejected; trimmed names work on create/join
4. Proceed to Foundational + US2 only after P1 passes

### Incremental Delivery

1. Setup → confirm prerequisite
2. US1 → validate name trim/reject (MVP)
3. Foundational + US2 → validate drawer assignment and badges
4. US3 → validate deterministic word selection
5. US4 → validate drawer-only word visibility
6. US5 → validate ~2s game polling sync
7. Polish → Vitest + build + two-tab sign-off

### Suggested Commit Slices

- Commit after US1 (name validation)
- Commit after US2–US3 (round init backend)
- Commit after US4–US5 (game UI + polling)
- Commit after Polish (T025–T027)

---

## Notes

- Do **not** implement drawing, guesses, scoring, or round-end (Scenario 3–4)
- Do **not** add WebSockets, DB, auth, or custom word packs
- Leave `GuessForm`, canvas, and `Scoreboard` as placeholders where present
- Never log `secretWord` in backend
- Use `fetchRoomSilent` for game interval polls to avoid UI flicker
- Name validation applies to new create/join only — no retroactive rename of legacy `"Player"` names
