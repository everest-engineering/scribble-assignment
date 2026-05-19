# Tasks: Game Start and Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Manual two-tab testing per constitution (no test framework configured)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions
- US2 is a verification-only phase (implementation covered by US1 tasks)

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Core building blocks that MUST be in place before game start flow can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Expand STARTER_WORDS in `backend/src/seed/starterData.ts` from 5 to 20+ unique, common, drawable words — **DONE**
- [X] T002 [P] Create Round interface + RoundSnapshot type in `backend/src/models/game.ts` — **DONE**
- [X] T003 Implement deterministic selectWord(roomCode, wordList) helper in `backend/src/services/roomStore.ts` using char-code-sum modulo word list length — **DONE**

**Checkpoint**: Foundation ready — Round model exists, words available, word selection works

---

## Phase 2: User Story 1 - Game Starts with Drawer and Word (Priority: P1) 🎯 MVP

**Goal**: When host starts a game with 2+ valid players, the system atomically transitions to active, creates Round 1 with host-as-drawer, selects a secret word, and exposes it only to the drawer via the snapshot API.

**Independent Test**: Host with 2+ players starts the game and immediately sees themselves as drawer with the secret word visible. The guesser sees the drawer identified but the word field is undefined in all API responses and the UI shows a placeholder.

### Implementation for User Story 1

- [X] T004 [US1] Extend startGame() in `backend/src/services/roomStore.ts` to: create Round, assign host as drawer, select word via T003, re-validate all participant names (reject with FR-001 message if any fail), reject with 503 if word list is empty (FR-008), atomically transition status to "active". Also add `currentRound: null` to `createRoom()` — **DONE**
- [X] T005 [US1] Update toRoomSnapshot() in `backend/src/services/roomStore.ts` to include currentRound in RoomSnapshot and filter secretWord per viewer (undefined for non-drawer) — **DONE**
- [X] T006 [US1] Update POST /rooms/:code/start route in `backend/src/api/rooms.ts` to pass participantId to toRoomSnapshot for correct word filtering — **DONE**
- [X] T007 [US1] Update GET /rooms/:code handler in `backend/src/api/rooms.ts` to pass query participantId to toRoomSnapshot for word filtering — **VERIFIED**: already passes participantId, no change needed
- [X] T008 [P] [US1] Update RoomSnapshot type and add RoundSnapshot type in `frontend/src/services/api.ts` — **DONE**
- [X] T009 [US1] Update GamePage in `frontend/src/pages/GamePage.tsx` to show drawer label + secret word when current participant is drawer; show placeholder with animation/meme for guessers — **DONE**

**Checkpoint**: User Story 1 fully functional — game starts atomically, drawer sees word, guessers see placeholder

---

## Phase 3: User Story 2 - Scaled Word List and Drawer Isolation (Priority: P2)

**Goal**: Confirm the word list meets the 20+ minimum and the secret word is never exposed to guessers through any API response or UI element.

**Independent Test**: Inspect all API responses (POST /rooms/:code/start, GET /rooms/:code) from a guesser's perspective — secretWord is always undefined. Count STARTER_WORDS entries — at least 20.

- [X] T010 [US2] Verify word isolation: confirm secretWord is undefined for non-drawer in POST /rooms/:code/start and GET /rooms/:code responses — **DONE** (verified via curl: drawer sees "sunflower", guesser response has no secretWord field)
- [X] T011 [US2] Verify word list size: confirm STARTER_WORDS in `backend/src/seed/starterData.ts` has 20+ entries — **DONE**: 24 words, no action needed

**Checkpoint**: Word isolation confirmed, word list sized correctly

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verification, build, and cleanup

- [X] T012 Build backend: `cd backend && npm run build` — **DONE** (1 TS error fixed: cast `STARTER_WORDS as readonly string[]` for length check)
- [X] T013 Build frontend: `cd frontend && npm run build` — **DONE**
- [X] T014 Run manual two-tab test per `specs/002-game-start-drawer/quickstart.md` — **DONE** (API-level verification: all 7 scenarios pass; servers running for browser test)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: T003 only remaining — T001 and T002 are DONE
- **User Story 1 (Phase 2)**: Depends on T003 (word selection) — then T004→T005→T006 (backend chain) + T008→T009 (frontend chain)
- **User Story 2 (Phase 3)**: Depends on US1 implementation — T010 verification only; T011 DONE
- **Polish (Phase 4)**: Depends on US1 and US2 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P2)**: Verification-only — implementation baked into US1 tasks (T001, T005, T007)

### Within Each User Story

- Models before services
- Services before endpoints  
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001 and T002 can run in parallel (different files, no overlap)
- T008 can run in parallel with backend tasks (frontend-only change)

---

## Parallel Example: User Story 1

```bash
# Launch all independent tasks for US1 together:
Task: "Expand word list in backend/src/seed/starterData.ts"
Task: "Create Round type in backend/src/models/game.ts"

# After T001-T003 complete, run T004-T009 sequentially:
# T004 → T005 → T006 → T007 (backend chain)
# T008 → T009 (frontend chain, T008 independent of T006/T007)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: T003 only — T001, T002 are DONE
2. Complete Phase 2: User Story 1 (T004-T009)
3. **STOP and VALIDATE**: Test US1 independently via quickstart.md steps 1-4
4. Build and verify (T012-T013)

### Incremental Delivery

1. T003 → Word selection ready
2. Add User Story 1 (T004-T009) → Game start flow with drawer/word → Test → Demo (MVP!)
3. Add User Story 2 (T010) → Word isolation verification
4. Build + manual test (T012-T014)
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on each other
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- US2 implementation is fully covered by US1 tasks (T001, T005, T007) — US2 phase is verification-only
