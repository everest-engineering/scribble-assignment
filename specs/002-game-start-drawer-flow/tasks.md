# Tasks: Game Start and Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- **Tests**: co-located with source files as `*.test.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Small foundational utilities and data needed by all user stories.

- [ ] T001 [P] Expand word pool from 5 to 20+ words in `backend/src/seed/starterData.ts`
- [ ] T002 [P] Add `hashCode` utility function in `backend/src/services/roomStore.ts` for deterministic word selection

**Checkpoint**: Word pool and hash utility ready.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type definitions and validation schemas that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 [P] Update `Room` interface in `backend/src/models/game.ts` — add `drawerId: string | null` and `secretWord: string | null` fields
- [ ] T004 [P] Update `RoomSnapshot` interface in `backend/src/models/game.ts` — add `drawerId`, `yourRole: "drawer" | "guesser"`, and optional `secretWord` field
- [ ] T005 [P] Update frontend `RoomSnapshot` type in `frontend/src/services/api.ts` — widen `status` to `"lobby" | "playing"`, add `drawerId`, `yourRole`, optional `secretWord`
- [ ] T006 [P] Update Zod schemas in `backend/src/api/schemas.ts` — add `.max(20, ...)` to `playerName` fields in `createRoomSchema` and `joinRoomSchema`

**Checkpoint**: Foundation ready — all types and validation schemas updated.

---

## Phase 3: User Story 1 — Join a Game Room with a Valid Name (Priority: P1) 🎯 MVP

**Goal**: Players can join rooms with validated names (trimmed, non-empty, max 20 chars, case-sensitive unique).

**Independent Test**: A player joins a room with "  Alice  ", sees name trimmed to "Alice" in player list. Empty, whitespace-only, >20-char, and duplicate names all show clear error messages.

### Tests for User Story 1

- [ ] T007 [P] [US1] Test name validation in `backend/src/services/roomStore.test.ts` — verify trim, empty rejection, max 20 rejection, duplicate rejection (case-sensitive), case-sensitive distinct acceptance

### Implementation for User Story 1

- [ ] T008 [US1] Add duplicate name check in `roomStore.joinRoom()` in `backend/src/services/roomStore.ts` — reject if any existing participant has the same trimmed name (case-sensitive comparison)
- [ ] T009 [P] [US1] Add client-side name validation (trim, min length, max 20) in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: Name validation complete — US1 independently testable.

---

## Phase 4: User Story 2 — Start the Game and Assign a Drawer (Priority: P1)

**Goal**: Host can start the game; drawer is deterministically assigned (first joined) and role-aware snapshots are served via HTTP polling.

**Independent Test**: With 2+ players in lobby, host clicks Start → game navigates to /game, drawer sees "You are the drawer", guessers see "You are a guesser". Non-host cannot start. Single-player room has Start disabled.

### Tests for User Story 2

- [ ] T010 [P] [US2] Test drawer assignment in `backend/src/services/roomStore.test.ts` — verify first-joined is drawer, deterministic across sessions, host-before-guest ordering, non-host cannot start, <2 player rejection

### Implementation for User Story 2

- [ ] T011 [US2] Implement drawer assignment logic in `roomStore.startGame()` in `backend/src/services/roomStore.ts` — set `drawerId` to participant with earliest `joinedAt`, validate host-only and min 2 players (already validated but enhance)
- [ ] T012 [US2] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — compute `yourRole` per viewer, set `drawerId` on snapshot
- [ ] T013 [US2] Implement `leaveRoom()` in `backend/src/services/roomStore.ts` — remove participant, reassign drawer if drawer leaves, reassign host if host leaves, remove room if last participant
- [ ] T014 [P] [US2] Add `POST /rooms/:code/leave` endpoint in `backend/src/api/rooms.ts` — accept `participantId`, call `leaveRoom`, return updated snapshot
- [ ] T015 [P] [US2] Update `roomStore.ts` in `frontend/src/state/roomStore.ts` — add `yourRole` and `drawerId` tracking, update `startGame()` to handle role response
- [ ] T016 [P] [US2] Update `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx` — navigate to `/game` after successful start
- [ ] T017 [US2] Build role-based game UI in `frontend/src/pages/GamePage.tsx` — drawer sees role indicator, guesser sees different role indicator; pass role to child components
- [ ] T018 [P] [US2] Update `GuessForm.tsx` in `frontend/src/components/GuessForm.tsx` — disable for drawer (drawers don't guess), enable for guessers

**Checkpoint**: Game start and drawer assignment complete — US2 independently testable.

---

## Phase 5: User Story 3 — Secret Word Selection and Drawer-Only Visibility (Priority: P1)

**Goal**: Secret word is deterministically selected and visible only to the drawer.

**Independent Test**: After game starts, drawer sees the secret word on screen. Guesser sees "Word selected" placeholder. Same room state always produces same word.

### Tests for User Story 3

- [ ] T019 [P] [US3] Test word selection in `backend/src/services/roomStore.test.ts` — verify deterministic selection (same state = same word), different rooms may differ, word comes from pool, word reselects on drawer reassignment

### Implementation for User Story 3

- [ ] T020 [US3] Implement word selection in `roomStore.startGame()` in `backend/src/services/roomStore.ts` — compute deterministic index from `hashCode(roomCode + participantIds sorted) % wordPool.length`, store in `room.secretWord`
- [ ] T021 [US3] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — conditionally include `secretWord` only when viewer is the drawer
- [ ] T022 [US3] Update word reselection in `leaveRoom()` in `backend/src/services/roomStore.ts` — pick new word when drawer is reassigned
- [ ] T023 [US3] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` — show secret word to drawer in prominent UI area, show "Word has been selected" placeholder to guessers
- [ ] T024 [P] [US3] Update `roomStore.ts` in `frontend/src/state/roomStore.ts` — poll room state on `/game` page to receive updated snapshots with word visibility

**Checkpoint**: Word selection and role-based visibility complete — US3 independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup across all stories.

- [ ] T025 Run all backend and frontend tests — `cd backend && npx vitest run` and `cd frontend && npx vitest run`
- [ ] T026 Manual two-browser validation per `specs/002-game-start-drawer-flow/quickstart.md`
- [ ] T027 [P] Add CSS styling for word display area in `frontend/src/styles/app.css` (drawer word, guesser placeholder)
- [ ] T028 Fix any lint or type errors — `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`

**Checkpoint**: All stories implemented and validated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3/4/5)**: All depend on Foundational completion
  - US2 (drawer) and US3 (word) also depend on US1 (player names must work first to have players)
  - US3 depends on US2 (word selection happens on game start, drawer must be assigned first)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P1)**: Depends on US1 (needs `joinRoom` working for players to join) — but `joinRoom` already exists; US2 adds duplicate check which is independent. US2's core (drawer assignment, GamePage) can proceed in parallel with US1's validation additions.
- **US3 (P1)**: Depends on US2 (needs `startGame` working with drawer assignment before word selection matters)

### Within Each User Story

- Tests FIRST (fail before implementation)
- Backend services before frontend integration
- Core logic before UI

### Parallel Opportunities

- All Phase 1 tasks marked [P] can run in parallel
- All Phase 2 tasks marked [P] can run in parallel
- US1 validation tasks and US2 drawer tasks can partially overlap (different files)
- Frontend GamePage (T016, T017) and backend leave endpoint (T014) can run in parallel
- Tests [P] within a story can run in parallel (they test different functions)

---

## Parallel Example: User Story 2

```bash
# Launch tasks marked [P] together (different files, no dependencies):
Task: "T014 [P] [US2] Add POST /rooms/:code/leave endpoint in rooms.ts"
Task: "T015 [P] [US2] Update frontend roomStore.ts with role tracking"
Task: "T016 [P] [US2] Update LobbyPage.tsx navigation"
```

---

## Implementation Strategy

### MVP First (All three stories are P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Name Validation)
4. **STOP and VALIDATE**: Test name validation independently
5. Complete Phase 4: US2 (Drawer Assignment)
6. **STOP and VALIDATE**: Test game start flow independently
7. Complete Phase 5: US3 (Word Selection)
8. **STOP and VALIDATE**: Full game flow test
9. Complete Phase 6: Polish

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Deploy/Demo (name validation working)
3. Add US2 → Deploy/Demo (game starts, drawer assigned)
4. Add US3 → Deploy/Demo (full game with secret word)

---

## Notes

- [P] tasks = different files, no dependencies
- All three user stories are P1 priority — all required for MVP
- Tests use existing Vitest patterns (co-located, no HTTP)
- Backend service tests verify deterministic behavior without server
- Quickstart.md provides manual two-browser test scenarios
