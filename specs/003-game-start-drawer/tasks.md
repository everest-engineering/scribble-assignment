# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/003-game-start-drawer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Data model and seed data changes that all user stories depend on

- [X] T001 Extend `RoomStatus` with `"awaiting_rename"` and add `Round` interface (`roundNumber`, `drawerId`, `word`) in `backend/src/models/game.ts`
- [X] T002 [P] Expand `STARTER_WORDS` from 5 to at least 10 words in `backend/src/seed/starterData.ts`

**Checkpoint**: Types ready — foundational backend logic can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend service changes that MUST be complete before any user story

**⚠️ CRITICAL**: All user stories depend on these service-layer changes

- [X] T003 Extend `startGame` in `backend/src/services/roomStore.ts` with:
  - Name validation (trim all names, detect empty/whitespace-only)
  - Transition to `"awaiting_rename"` state when names are invalid
  - Drawer assignment (host = drawer for round 1)
  - Deterministic word selection (`STARTER_WORDS[0]`)
  - Transition to `"playing"` with `currentRound` set when all names valid
- [X] T004 [P] Add `renameParticipant(roomCode, participantId, newName)` method in `backend/src/services/roomStore.ts` that:
  - Validates new name is non-empty after trimming
  - Updates the participant's name in-place
  - Checks if all names are now valid and auto-transitions to `"playing"` if so
  - Returns the new room status
- [X] T005 [P] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to:
  - Include `roundNumber` and `drawerId` in all snapshots when status is `"playing"`
  - Conditionally include `currentWord` only when `viewerParticipantId === drawerId`
  - Include `invalidParticipantIds` when status is `"awaiting_rename"`
  - Remove `availableWords` from snapshots (word list leakage prevention)
- [X] T006 [P] Add `disbandRoom(roomCode, participantId)` method in `backend/src/services/roomStore.ts` that allows host to remove a stuck room

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Game starts with validated player names (Priority: P1) 🎯 MVP

**Goal**: Host can start the game from the lobby; invalid player names trigger an "awaiting rename" state where the affected player can correct their name inline

**Independent Test**: Create a room with 2 players where one player's name is whitespace-only. Click "Start Game" — the game must NOT start, and the player with the invalid name must see an inline text input. After entering a valid name, the game must transition to round 1 automatically.

### Backend

- [X] T007 Add `startGameRequestSchema` and `renameRequestSchema` (Zod) in `backend/src/api/schemas.ts`
- [X] T008 Extend `POST /rooms/:code/start` in `backend/src/api/rooms.ts` to:
  - Call updated `startGame` (which now validates names)
  - Return `{ status: "playing", room }` on success
  - Return `{ status: "awaiting_rename", invalidParticipantIds, room }` when names are invalid
- [X] T009 Add `POST /rooms/:code/rename` endpoint in `backend/src/api/rooms.ts` — validates with Zod, calls `renameParticipant`, returns updated room state
- [X] T010 Add `POST /rooms/:code/disband` endpoint in `backend/src/api/rooms.ts` — host-only, calls `disbandRoom`

### Frontend

- [X] T011 [P] Update `api.ts` in `frontend/src/services/api.ts` — add `rename(code, participantId, name)` and `disband(code, participantId)` methods; update `startGame` and `fetchRoom` response types
- [X] T012 Update `roomStore` in `frontend/src/state/roomStore.ts`:
  - Add `renamePlayer(name)` method
  - Add `disbandRoom()` method
  - Handle `awaiting_rename` status in polling (show rename prompt for invalid players)
  - Auto-navigate to game view when status transitions to `"playing"`
- [X] T013 Update `LobbyPage` in `frontend/src/pages/LobbyPage.tsx`:
  - Show inline rename input for current player when `status === "awaiting_rename"` and they are in `invalidParticipantIds`
  - Show "Waiting for players..." indicator for host during rename state
  - Hide start button for non-host players (FR-008)

**Checkpoint**: Name validation and rename flow fully functional. MVP scope achieved.

---

## Phase 4: User Story 2 - Drawer is clearly identified to all players (Priority: P1)

**Goal**: When round 1 begins, every player sees a clear visual indicator identifying who the drawer is

**Independent Test**: Start a game with 3 players. Verify every player's screen shows the same player designated as drawer (via badge or label), and the drawer sees they are the drawer.

### Backend

- [X] T014 Ensure `POST /rooms/:code/start` and `GET /rooms/:code` responses include `drawerId` (already covered by T003/T005)
 
### Frontend

- [X] T015 [P] Create `DrawerIndicator` component in `frontend/src/components/DrawerIndicator.tsx` — shows "Drawer: [name]" badge for non-drawers and "You are the drawer!" for the drawer
- [X] T016 Update `roomStore` in `frontend/src/state/roomStore.ts` — expose `drawerId` from polling state (already done via RoomSnapshot)
- [X] T017 Update `GamePage` in `frontend/src/pages/GamePage.tsx`:
  - Show `DrawerIndicator` component at the top of the game view
  - Non-drawer players see "Drawer: [name]" — prepare to guess
  - Drawer sees "You are the drawer!" — start drawing

**Checkpoint**: Drawer identification visible to all players. Game view has role distinction.

---

## Phase 5: User Story 3 - Secret word visible only to the drawer (Priority: P1)

**Goal**: The drawer sees the secret word prominently; non-drawer players see NO part of the word (server-enforced filtering)

**Independent Test**: Start a game with 2+ players. Verify the drawer sees the word (e.g., "rocket") on screen, and non-drawer players cannot see the word in the UI or in network responses.

### Backend

- [X] T018 Verify `toRoomSnapshot` filters `currentWord` per viewer (covered by T005 — `GET /rooms/:code?participantId=X` never leaks word to non-drawer)
- [X] T019 Verify `POST /rooms/:code/start` response includes `currentWord` for the host/drawer (covered by T003/T008)

### Frontend

- [X] T020 Update `roomStore` in `frontend/src/state/roomStore.ts` — expose `currentWord` from polling state (already done via RoomSnapshot)
- [X] T021 Update `GamePage` in `frontend/src/pages/GamePage.tsx`:
  - Drawer: display the word prominently (large text, centered, above canvas area)
  - Non-drawers: show a "The drawer is drawing..." placeholder
  - Show drawing canvas area placeholder for both roles
- [X] T022 Add `DrawerIndicator` styles and word display styles in `frontend/src/styles/app.css`

**Checkpoint**: Full round 1 flow working — name validation, drawer identification, word visibility.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, late-join spectator mode, and validation

- [X] T023 Handle late-join spectator mode — allow joining a `"playing"` room; `toRoomSnapshot` already filters `currentWord` per viewer
- [X] T024 Handle edge case: host tries to start with only 1 player — return 400 "At least 2 players required" (already handled by `startGame`)
- [X] T025 Handle edge case: rename attempt when room is not in `"awaiting_rename"` state — return 400 "Room is not in awaiting_rename state" (already handled by `renameParticipant`)
- [X] T026 Run quickstart.md manual validation tests via API (all 7 scenarios pass)

**Checkpoint**: All edge cases handled. Feature ready for demo.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — 🎯 MVP scope
- **US2 (Phase 4)**: Depends on Foundational + US1 (needs game to start)
- **US3 (Phase 5)**: Depends on Foundational + US1 + US2 (needs drawer assigned)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P1)**: Depends on US1 being complete (game must be able to start for drawer to be shown)
- **US3 (P1)**: Depends on US2 (drawer must be identified before word can be shown to them)

### Within Each User Story

- Backend endpoints before frontend integration
- Service methods before API routes
- Frontend state before UI components
- Story complete before moving to next

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T004, T005, T006 can run in parallel (different methods in same file but independent logic)
- T011 (api.ts types) and T007 (schemas) can run in parallel
- T015 (DrawerIndicator component) can be developed independently

---

## Parallel Example: User Story 1

```bash
# Backend schemas + API routes:
Task: "Add rename request schemas in backend/src/api/schemas.ts"
Task: "Extend POST /:code/start + add POST /:code/rename + POST /:code/disband in backend/src/api/rooms.ts"

# Frontend API + store (after backend types are known):
Task: "Update api.ts with rename + disband methods + new response types"
Task: "Update roomStore with rename action + awaiting_rename handling"

# Frontend UI (after store):
Task: "Update LobbyPage with rename prompt UI"
```

---

## Implementation Strategy

### MVP First (Phase 3 Only)

1. Complete Phase 1: Setup (types + seed data)
2. Complete Phase 2: Foundational (service methods)
3. Complete Phase 3: US1 — Name validation at game start
4. **STOP and VALIDATE**: Test US1 independently — create room, use whitespace name, verify rename flow, verify game starts after correction

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. **Phase 3** (US1) → Name validation + rename flow → Deploy/Demo (**MVP!**)
3. **Phase 4** (US2) → Drawer indicator on GamePage → Deploy/Demo
4. **Phase 5** (US3) → Word display for drawer, hidden from guessers → Deploy/Demo
5. **Phase 6** → Edge cases + late-join → Final polish

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 1 + Phase 2 + Phase 3 (MVP — name validation)
2. Developer B: Phase 4 (DrawerIndicator component + GamePage update) after Phase 2
3. Developer A+B: Phase 5 (word display) after Phase 3+4
4. Either: Phase 6 (edge cases)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
