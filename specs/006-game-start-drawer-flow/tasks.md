---

description: "Task list for game start and drawer flow feature"
---

# Tasks: Game Start and Drawer Flow

**Input**: Design documents from `specs/006-game-start-drawer-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No new tests required per spec — existing tests must continue to pass.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- Paths reflect the actual web app structure from plan.md

## Phase 1: Setup (Brownfield Discovery)

**Purpose**: Read existing code patterns to understand what to extend

- [X] T001 Read existing Zod schemas in `backend/src/api/schemas.ts` to understand current playerName validation
- [X] T002 Read existing room types in `backend/src/models/game.ts` and `backend/src/services/roomStore.ts` to understand Room/RoomSnapshot shape and toRoomSnapshot
- [X] T003 Read frontend types in `frontend/src/services/api.ts` and store in `frontend/src/state/roomStore.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type system updates that ALL user stories depend on

- [X] T004 Add `"drawing"` to `RoomStatus` union type in `backend/src/models/game.ts`
- [X] T005 [P] Add `currentRound: number`, `currentDrawerId: string`, and `secretWord: string | null` to `RoomSnapshot` in `backend/src/models/game.ts`
- [X] T006 [P] Update frontend `RoomSnapshot` in `frontend/src/services/api.ts` — add `currentRound`, `currentDrawerId`, `secretWord` and include `"drawing"` in status union

**Checkpoint**: Types updated — backend and frontend RoomSnapshot types match. Build fails until implemented.

---

## Phase 3: User Story 1 - Player Name Validation (Priority: P1) 🎯 MVP

**Goal**: Empty or whitespace-only player names are rejected with inline errors on both Create Room and Join Room pages.

**Independent Test**: Submit empty or whitespace-only names on Create Room and Join Room forms. Each shows an inline error and prevents submission.

### Implementation for User Story 1

- [X] T007 [US1] Update `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` — change `playerName` from `z.string().optional()` to `z.string().trim().min(1, "Player name is required")`
- [X] T008 [US1] Update `createRoom` and `joinRoom` in `backend/src/services/roomStore.ts` — remove `displayName()` fallback for empty names (name will already be validated as non-empty by Zod)
- [X] T009 [US1] Add empty-name validation before submit in `frontend/src/pages/CreateRoomPage.tsx` — trim name, reject if empty, show inline error
- [X] T010 [US1] Add empty-name validation before submit in `frontend/src/pages/JoinRoomPage.tsx` — trim name, reject if empty, show inline error

**Checkpoint**: Player name validation works on both pages. Backend rejects empty names with 400.

---

## Phase 4: User Story 2 - Host Becomes First-Round Drawer (Priority: P1)

**Goal**: When the host starts the game, the room transitions to drawing status and the host is assigned as round-1 drawer, clearly identified on all screens.

**Independent Test**: Open two browser tabs. Tab 1 creates room (host). Tab 2 joins. Host starts game. Both tabs show the host labelled as "Drawer" for round 1.

### Implementation for User Story 2

- [X] T011 [US2] Add `currentRound: number` and `currentDrawerId: string` fields to `Room` interface in `backend/src/models/game.ts` (initial values: 0 and empty string for lobby)
- [X] T012 [US2] Create `startGame()` service function in `backend/src/services/roomStore.ts` — validate room exists, status is "lobby", requester is host, 2+ participants; set status to "drawing", currentRound to 1, currentDrawerId to hostId; return updated room
- [X] T013 [US2] Create `POST /:code/start` endpoint in `backend/src/api/rooms.ts` — parse room code param, call `startGame()`, return updated room snapshot; handle errors (400 for invalid state, 404 for missing room)
- [X] T014 [US2] Add `startGame()` method to `RoomStore` class in `frontend/src/state/roomStore.ts` — call `api.startGame(room.code)`, update store with response
- [X] T015 [US2] Update LobbyPage "Start Game" button in `frontend/src/pages/LobbyPage.tsx` — call `roomStore.startGame()` instead of just `navigate("/game")`; navigate to `/game` on success
- [X] T016 [US2] Update GamePage in `frontend/src/pages/GamePage.tsx` — show round number, show "Drawer" label next to the current drawer's name (compare `participantId` with `room.currentDrawerId`)

**Checkpoint**: Host starts game → room transitions to drawing → all participants see round 1 and who the drawer is.

---

## Phase 5: User Story 3 - Deterministic Secret Word Visible Only to Drawer (Priority: P1)

**Goal**: A secret word is deterministically selected for round 1, visible only to the drawer participant.

**Independent Test**: Open two browser tabs. Tab 1 is the host/drawer. Tab 2 is a guesser. When the game starts, Tab 1 shows the secret word and Tab 2 does not. Starting the same room again yields the same word.

### Implementation for User Story 3

- [X] T017 [US3] Add deterministic word selection logic in `backend/src/services/roomStore.ts` — function `selectWord(round: number, words: string[]): string` returns `words[(round - 1) % words.length]`
- [X] T018 [US3] Integrate word selection into `startGame()` in `backend/src/services/roomStore.ts` — store the selected word on the Room (add `secretWord: string` field to `Room` interface in `backend/src/models/game.ts`)
- [X] T019 [US3] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — use `viewerParticipantId` to determine word visibility: set `secretWord` to the room's secret word when `viewerParticipantId === currentDrawerId`, otherwise `null`
- [X] T020 [US3] Show secret word to drawer in `frontend/src/pages/GamePage.tsx` — display `room.secretWord` prominently when it is non-null (i.e., current user is the drawer); hide word section when `null`
- [X] T021 [US3] Hide secret word from guessers in `frontend/src/pages/GamePage.tsx` — ensure no part of the UI leaks the word when `room.secretWord` is null; verify by inspecting the API response in a non-drawer tab

**Checkpoint**: Drawer sees the word; guessers do not. Word is deterministic (same room + same round = same word). Word persists across polls for the round.

---

## Phase 6: Build & Validation

**Purpose**: Verify both projects compile and all acceptance criteria pass

- [X] T022 Run `cd backend && npm run build` to verify backend compiles without errors
- [X] T023 Run `cd frontend && npm run build` to verify frontend compiles without errors
- [X] T024 Run `cd backend && npm test` and `cd frontend && npm test` to verify all existing tests still pass
- [X] T025 Run two-browser validation per `specs/006-game-start-drawer-flow/quickstart.md` to verify all acceptance scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — review only, can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 (needs updated types)
- **User Story 2 (Phase 4)**: Depends on Phase 2 (needs updated types) — adds start endpoint and frontend game flow
- **User Story 3 (Phase 5)**: Depends on Phase 2 + Phase 4 (needs startGame endpoint + toRoomSnapshot changes)
- **Build & Validation (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Fully independent — validates existing forms, no dependency on game start
- **User Story 2 (P1)**: Independent of US1 — new backend endpoint + frontend game flow
- **User Story 3 (P1)**: Builds on US2 — word selection integrated into startGame, word visibility uses toRoomSnapshot

### Within Each User Story

- Setup before implementation (Phase 1 before Phase 2+)
- Types before services
- Services before endpoints
- Backend before frontend (expose API first, then consume it)
- Implementation before build validation

### Parallel Opportunities

- T001, T002, T003 are independent file reviews — can run in parallel
- T005, T006 are independent type updates — can run in parallel
- T009, T010 are independent frontend page edits — can run in parallel
- T016 and all US3 tasks are independent — can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (name validation)
4. **STOP and VALIDATE**: Test name validation on both pages
5. Add US2 (Phase 4) for game start and drawer assignment
6. Add US3 (Phase 5) for word selection and visibility
7. Run Phase 6 for final build validation

### Incremental Delivery

1. Phase 1-2 → Type system ready
2. Phase 3 (US1) → Name validation → deployable
3. Phase 4 (US2) → Game start + drawer flow → playable (no word yet)
4. Phase 5 (US3) → Secret word → fully functional
5. Phase 6 → Build + validation

### Parallel Team Strategy

With multiple developers:
1. Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (name validation)
   - Developer B: US2 (game start + drawer)
   - Developer C: US3 (word selection) — can start after US2 backend is ready
3. Stories complete and integrate independently

---

## Notes

- No new dependencies required — extends existing Zod, Express, and React patterns
- Word selection uses deterministic formula: `(round - 1) % words.length`
- Word visibility uses the existing `viewerParticipantId` parameter in `toRoomSnapshot()`
- The "Start Game" button already exists on LobbyPage (Feature 005) — only needs its onClick handler updated to call the API
- GamePage already has `participantId` from `useRoomState()` — usable for drawer identification
- Commit after each meaningful slice: Foundation commit, US1 commit, US2 commit, US3 commit
