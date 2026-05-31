# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Includes Vitest unit and schema validation tests on both backend and frontend, and manual two-browser verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(No setup tasks needed for this feature as the project structure is already set)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model and schema updates that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Define `"result"` status and optional/nullable `correctGuesserId?: string | null` in `backend/src/models/game.ts`
- [x] T002 Update Zod schemas in `backend/src/api/schemas.ts` to add `"RESTART_REQUIRES_HOST"`, `"GAME_NOT_IN_RESULT"`, and `"GAME_ALREADY_ENDED"` to `errorCodeSchema`, `"result"` to `roomStatusSchema`, and `correctGuesserId` to `roomSnapshotSchema`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Round Results and Word Reveal (Priority: P1) 🎯 MVP

**Goal**: Transition room status to `"result"` on correct guess, reveal unmasked secret word to all players, highlight correct guesser, and display scoreboard and logs.

**Independent Test**: Bob submits a correct guess. Both Alice's and Bob's screens transition to the result view within 2 seconds. The secret word is unmasked, Bob is highlighted as correct, and scoreboard is sorted descending. No guesses can be made while in `"result"` status.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [P] [US1] Create backend unit tests in `backend/src/services/roomStore.test.ts` verifying correct guess transitions status to `"result"`, sets `correctGuesserId` only on the first correct guess (subsequent correct guesses do not alter winner or score), and guess submissions when current room status is NOT `"in-game"` (i.e. status is `"result"`) are rejected with error code `"GAME_ALREADY_ENDED"`
- [x] T004 [P] [US1] Create Zod schema tests in `backend/src/api/schemas.test.ts` verifying Zod parses `"result"` status and nullable/optional `correctGuesserId` successfully in `roomSnapshotSchema`
- [x] T005 [P] [US1] Create API tests in `frontend/src/services/api.test.ts` covering updated snapshot mapping for results state

### Implementation for User Story 1

- [x] T006 [US1] Implement single source of truth guard and correct guess transition inside backend `submitGuess` function in `backend/src/services/roomStore.ts` (reject guesses with error `"GAME_ALREADY_ENDED"` if status === `"result"`, transition status to `"result"`, and set `correctGuesserId` only on first correct guess)
- [x] T007 [US1] Update backend `toRoomSnapshot` in `backend/src/services/roomStore.ts` to unmask/reveal `secretWord` to all players when status is `"result"`, include `correctGuesserId`, and ensure `correctGuesserId` is `null`/`undefined` when status is `"lobby"`
- [x] T008 [P] [US1] Update `RoomSnapshot` and `Participant` interfaces in `frontend/src/services/api.ts` to support `"result"` status and `correctGuesserId`
- [x] T010 [US1] Modify `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to:
  - Modify polling `useEffect` to continue running when status is `"result"` (so restart redirect can be caught)
  - Render a Results view when status is `"result"` displaying revealed word, winner highlight, final scoreboard, and full guess history

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Host-Initiated Game Restart (Priority: P2)

**Goal**: Host triggers game restart to return all connected players to the lobby, resetting scores to 0 and atomically clearing round-specific states in memory.

**Independent Test**: Host clicks "Restart Game" on results screen. Both players are redirected to `/lobby` with preserved names, scores reset to 0, and guess logs cleared. Non-hosts cannot see the restart button.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T011 [US2] Create backend unit tests in `backend/src/services/roomStore.test.ts` verifying `restartRoom` atomically resets all round state (`status` to `"lobby"`, `roundState = undefined`, `guessHistory = []`, `correctGuesserId = null`, scores to `0`), restricts access to host, and is idempotent (subsequent restarts from `"lobby"` are rejected with `"GAME_NOT_IN_RESULT"` and do not mutate state again)
- [x] T012 [P] [US2] Create endpoint validation tests in `backend/src/api/schemas.test.ts` for `/restart` schema payload validation and error codes
- [x] T013 [P] [US2] Create store tests in `frontend/src/state/roomStore.test.ts` verifying `restartRoom` action updates store snapshot and triggers lobby redirect updates

### Implementation for User Story 2

- [x] T014 [P] [US2] Register `restartRoomSchema` in Zod schemas in `backend/src/api/schemas.ts` (validating request body `{ participantId }`)
- [x] T015 [US2] Implement backend service `restartRoom(code, participantId)` inside `backend/src/services/roomStore.ts` to atomically clear round state in memory
- [x] T016 [US2] Register backend route `POST /rooms/:code/restart` in `backend/src/api/rooms.ts` and handle restart errors (`ROOM_NOT_FOUND`, `RESTART_REQUIRES_HOST`, `GAME_NOT_IN_RESULT`)
- [x] T017 [P] [US2] Add `restartRoom(code, participantId)` API client method in `frontend/src/services/api.ts`
- [x] T018 [US2] Add `restartRoom` action in `frontend/src/state/roomStore.ts`
- [x] T019 [US2] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to:
  - Render a **Restart Game** button for host on the results view (triggering `roomStore.restartRoom`)
  - Render `"Waiting for host to restart..."` waiting message for non-hosts
  - Modify redirection `useEffect` to navigate to `/lobby` if `room.status === "lobby"`

**Checkpoint**: At this point, both User Stories should be fully completed and integrated.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final E2E manual validation and cleanup

- [x] T020 Run manual verification steps in `specs/004-result-restart-validation/quickstart.md` using two browser instances

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
  - Proceed sequentially: US1 (Results transition, word reveal, scoreboard) ➔ US2 (Restart, lobby redirects)
- **Polish (Phase 5)**: Depends on all user stories being complete

### Parallel Opportunities

- Foundational tasks can be completed sequentially as they are in the same file `schemas.ts` and `game.ts`.
- Service tests `T003`, Zod schema tests `T004`, and frontend API tests `T005` can be written in parallel.
- Restart tests `T011`, schema tests `T012`, and store tests `T013` can be written in parallel.
