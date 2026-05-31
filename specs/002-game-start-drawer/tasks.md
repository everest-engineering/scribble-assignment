# Tasks: Game Start and Drawer Flow (002)

**Input**: Design documents from `specs/002-game-start-drawer/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Brownfield Baseline)

**Purpose**: Confirm the baseline is green before any changes land.

- [x] T001 Verify `npm test` passes in `backend/` (all existing suites green before changes)
- [x] T002 [P] Verify `npm test` passes in `frontend/` (all existing suites green before changes)

**Checkpoint**: Both test suites green — safe to begin incremental changes.

---

## Phase 2: Foundational (Type Model — Blocks All User Stories)

**Purpose**: Extend the shared type contract with drawer fields. Both backend and frontend types must be updated before any service or UI logic lands.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Extend `Room` interface with `drawerId: string` and `secretWord: string`; extend `RoomSnapshot` interface with `drawerId: string`, `secretWord?: string`, and `wordPlaceholder?: string` in `backend/src/models/game.ts`
- [x] T004 [P] Mirror `drawerId: string`, `secretWord?: string`, and `wordPlaceholder?: string` in the `RoomSnapshot` interface in `frontend/src/services/api.ts`
- [x] T005 Initialize `drawerId: ""` and `secretWord: ""` on the `Room` object literal inside `createRoom()` in `backend/src/services/roomStore.ts` (fixes TypeScript compile error from T003)

**Checkpoint**: `npm run build` passes in both `backend/` and `frontend/` — type contract is complete.

---

## Phase 3: User Story 1 — Host Becomes Drawer and Sees the Secret Word (Priority: P1) 🎯 MVP

**Goal**: When the host starts the game, `drawerId` and `secretWord` are set on the room. The GET snapshot endpoint returns the actual word to the drawer. The game screen identifies the drawer and displays the word.

**Independent Test**: Open Tab A (host/Alice), Tab B (Bob), Alice starts game. Tab A `/game` shows Alice as drawer with the secret word visible. Refresh Tab A — same word appears. No network response for Tab A contains `wordPlaceholder`.

### Implementation for User Story 1

- [x] T006 [US1] Implement exported pure function `selectWord(code: string, words: readonly string[]): string` using char-code-sum modulo word-list-length in `backend/src/services/roomStore.ts`
- [x] T007 [US1] Update `startRoom()` to assign `room.drawerId = room.hostId` and `room.secretWord = selectWord(room.code, STARTER_WORDS)` before persisting in `backend/src/services/roomStore.ts`
- [x] T008 [US1] Update `toRoomSnapshot()`: remove the `void viewerParticipantId` line; add `drawerId: room.drawerId` to every response; when `status === "active"` and `viewerParticipantId === room.drawerId` include `secretWord: room.secretWord`; when `status === "active"` and viewer is NOT the drawer include `wordPlaceholder` (one `_` per character joined by spaces) AND set `availableWords: []` so guessers cannot deduce the word from the candidate list plus placeholder length, in `backend/src/services/roomStore.ts`
- [x] T009 [P] [US1] Add unit tests for `selectWord`: same code returns identical word on repeated calls; `selectWord("ABCD", STARTER_WORDS)` equals the hard-coded expected word (`STARTER_WORDS[266 % STARTER_WORDS.length]`); two different codes produce different words in `backend/src/services/roomStore.test.ts`
- [x] T010 [P] [US1] Add unit tests for `startRoom` drawer assignment: after `startRoom(code, hostId)` the returned room has `drawerId === hostId` and `secretWord === selectWord(code, STARTER_WORDS)` in `backend/src/services/roomStore.test.ts`
- [x] T011 [P] [US1] Add unit test for drawer-scoped snapshot: `toRoomSnapshot(activeRoom, activeRoom.drawerId)` returns object with `secretWord` defined and `wordPlaceholder` undefined in `backend/src/services/roomStore.test.ts`
- [x] T012 [US1] Update `GamePage.tsx` to add 2-second polling via `setInterval(() => store.fetchRoom(), 2000)` in `useEffect` with interval cleanup on unmount (same pattern as `LobbyPage.tsx`); look up drawer name via `room.participants.find(p => p.id === room.drawerId)?.name`; display drawer name prominently; display `room.secretWord` when defined (drawer sees the word); display `room.wordPlaceholder` when defined (guesser sees blanks) in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: `npm test` green in `backend/`. Tab A game screen shows drawer name and secret word immediately after start.

---

## Phase 4: User Story 2 — Guessers See Drawer Identified, Word Hidden (Priority: P1)

**Goal**: Non-drawer participants on the game screen see who is drawing but receive a character-count placeholder instead of the secret word. The actual word string is absent from their GET snapshot response.

**Independent Test**: Tab B (Bob/guesser) navigates to `/game` after Alice starts. Bob sees "Alice" identified as the drawer. Bob does NOT see the actual word — only `_ _ _ _ _` (or equivalent). Network inspection confirms `secretWord` field absent from Bob's GET response body.

**Note**: The core backend change (`toRoomSnapshot` placeholder branch) is already implemented in T008. This phase focuses on verifying correctness with tests and confirming the frontend guesser view renders correctly.

### Implementation for User Story 2

- [x] T013 [P] [US2] Add unit test for guesser-scoped snapshot: `toRoomSnapshot(activeRoom, guestId)` returns object with `wordPlaceholder` defined, `secretWord` undefined, `wordPlaceholder.split(" ").length === secretWord.length` (character count matches), and `availableWords` empty (`[]`) so the secret word is not in the guesser's candidate list, in `backend/src/services/roomStore.test.ts`
- [x] T014 [P] [US2] Add unit test for lobby snapshot: `toRoomSnapshot(lobbyRoom, anyId)` returns object with both `secretWord` and `wordPlaceholder` undefined and `drawerId === ""` in `backend/src/services/roomStore.test.ts`
- [x] T015 [US2] Verify `frontend/src/pages/GamePage.tsx` renders `wordPlaceholder` in a visually distinct element (e.g. `<span>`) for guessers alongside the drawer name — confirm both branches (secretWord truthy / wordPlaceholder truthy) are covered in the JSX in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: `npm test` green in `backend/`. Tab B game screen shows drawer name and placeholder, not the actual word. Network response for Tab B contains `wordPlaceholder`, no `secretWord`.

---

## Phase 5: User Story 3 — Word Selection is Deterministic and Stable (Priority: P2)

**Goal**: Automated tests confirm that `selectWord` is reproducible: same room code always produces same word, hard-coded assertion holds, 100 calls return identical output.

**Independent Test**: Automated test creates 100 calls to `selectWord("ABCD", STARTER_WORDS)` — all return the same word. Hard-coded assertion: `selectWord("ABCD", STARTER_WORDS) === STARTER_WORDS[266 % STARTER_WORDS.length]`.

**Note**: T009 already covers the core determinism tests. This phase adds the explicit 100-call stability assertion required by SC-003.

### Implementation for User Story 3

- [x] T016 [US3] Add unit test that calls `selectWord("ABCD", STARTER_WORDS)` 100 times and asserts every result equals the first result (zero variance — SC-003 requirement) in `backend/src/services/roomStore.test.ts`

**Checkpoint**: All backend tests green including the 100-call determinism assertion.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full build validation, type safety check, and manual two-tab acceptance test.

- [x] T017 [P] Run `npm run build` in `backend/` — confirm zero TypeScript errors
- [x] T018 [P] Run `npm run build` in `frontend/` — confirm zero TypeScript errors
- [x] T019 Run `npm test` in `backend/` — all suites green (schemas, roomStore, api)
- [x] T020 [P] Run `npm test` in `frontend/` — all suites green
- [ ] T021 Perform the two-tab acceptance test from `specs/002-game-start-drawer/quickstart.md` — verify SC-001 (word visible within 3s), SC-002 (guesser sees placeholder, network has no `secretWord`), SC-003 (refresh Tab A shows same word)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — run immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 green baseline — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — core drawer/word backend + frontend game screen
- **Phase 4 (US2)**: Depends on Phase 3 (T008 must be complete before T013/T014 tests can be written against correct toRoomSnapshot behavior)
- **Phase 5 (US3)**: Depends on Phase 3 (T009 selectWord function must exist)
- **Phase 6 (Polish)**: Depends on Phases 3–5 all complete

### User Story Dependencies

- **US1 (P1)**: After Foundational phase — no dependency on US2 or US3
- **US2 (P1)**: After US1 (shares `toRoomSnapshot` implementation from T008)
- **US3 (P2)**: After US1 (requires `selectWord` from T006)

### Within Phase 3 (US1)

```
T006 (selectWord) → T007 (startRoom uses selectWord) → T008 (toRoomSnapshot uses drawerId/secretWord)
                                                              ↓
                       T009 [P], T010 [P], T011 [P] can run after T006/T007/T008 respectively
T012 (GamePage) can run in parallel with T009–T011 (different file)
```

### Parallel Opportunities

- T001 and T002 (baseline checks — different processes)
- T003 and T004 (different files: `game.ts` vs `api.ts`)
- T009, T010, T011 (same file but appending independent test cases — run sequentially in practice)
- T012 (GamePage) and T009–T011 (tests) — different files, full parallelism
- T013 and T014 (independent test cases in same file)
- T017 and T018 (build checks — different directories)
- T019 and T020 (test runs — different directories)

---

## Parallel Example: Phase 3 (US1)

```bash
# After T003–T005 complete:

# Sequential chain in roomStore.ts:
Task T006: "Implement selectWord() in backend/src/services/roomStore.ts"
Task T007: "Update startRoom() in backend/src/services/roomStore.ts"
Task T008: "Update toRoomSnapshot() in backend/src/services/roomStore.ts"

# After T008, run tests + frontend in parallel:
Task T009: "selectWord determinism tests in roomStore.test.ts"
Task T010: "startRoom drawer assignment tests in roomStore.test.ts"
Task T011: "Drawer snapshot test in roomStore.test.ts"
Task T012: "GamePage.tsx polling + drawer/word display"
```

---

## Implementation Strategy

### MVP First (US1 + US2 only — P1 stories)

1. Phase 1: Baseline verification
2. Phase 2: Foundational type changes
3. Phase 3: US1 — drawer sees word
4. Phase 4: US2 — guesser sees placeholder
5. **STOP and VALIDATE**: Two-tab acceptance test (SC-001, SC-002)
6. Phase 5: US3 — determinism tests (SC-003)
7. Phase 6: Polish + full acceptance test

### Incremental Delivery

- After Phase 2: TypeScript compiles cleanly — no functional change yet
- After Phase 3: Host/drawer flow fully functional (one tab usable)
- After Phase 4: Full two-player flow functional (two tabs usable)
- After Phase 5: Determinism contract verified by automated suite
- After Phase 6: Ready for Scenario 003

---

## Notes

- `STARTER_WORDS` is a `readonly` tuple — `selectWord` signature uses `readonly string[]` to accept it without spread
- `rooms.ts` already passes `participantId` to `toRoomSnapshot` in all four endpoints — **no changes to `rooms.ts`**
- `toRoomSnapshot` currently has `void viewerParticipantId` on line 128 — remove this line in T008
- GamePage already uses `useRoomState()` — add `useRoomStore()` import for the polling interval
- The polling `useEffect` in GamePage must list the store instance (not `fetchRoom`) as the dependency to avoid stale closure issues — mirror `LobbyPage.tsx` exactly
