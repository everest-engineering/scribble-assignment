---

description: "Task list for Game Start & Drawer Flow feature"

---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Polling Model

SC-006's "2 seconds" refers to the LobbyPage poll interval (Scenario 1). The
GamePage does NOT poll — it performs a single fetch on mount for page-refresh
recovery only. Drawer sees identity immediately via the `startGame` POST
response; guessers see it when the LobbyPage poll detects `status === "playing"`
and auto-navigates to `/game`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks required — the starter project is already initialized with all
necessary dependencies (Express, Zod, React, React Router, Vite, Vitest).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model extensions that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Add `currentRound: number`, `drawerId: string`, and `secretWord: string` fields to the `Room` interface in `backend/src/models/game.ts`
- [X] T002 [P] Add `currentRound`, `drawerId`, and `secretWord?` (optional) fields to the `RoomSnapshot` interface in `backend/src/models/game.ts`
- [X] T003 [P] Add `currentRound`, `drawerId`, and `secretWord?` (optional) fields to the `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Drawer Assignment (Priority: P1) 🎯 MVP

**Goal**: When the host starts the game, the room transitions to "playing" status, the first round begins, the host is assigned as the drawer, and all participants can see who the drawer is. Page refresh during a game restores the correct view. The drawer sees identity immediately via the `startGame` response; guessers see it when the LobbyPage poll detects the status change.

**Independent Test**: Create a room, join with a second player in another tab, start the game from the host tab. Verify the host's drawer identity appears immediately in the host tab and within 2s in the guesser tab (when the LobbyPage poll detects `"playing"`). Refresh either tab — verify the drawer identity is still shown correctly.

### Implementation for User Story 1

- [X] T004 [P] [US1] Update `startGame()` in `backend/src/services/roomStore.ts` to set `currentRound = 1`, `drawerId = room.hostId`, and `secretWord = STARTER_WORDS[currentRound - 1]` when room transitions to "playing"
- [X] T005 [P] [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `currentRound` and `drawerId` in the snapshot when status is "playing"
- [X] T006 [US1] Pass `playerId` as `viewerParticipantId` to `toRoomSnapshot()` in the `POST /rooms/:code/start` handler in `backend/src/api/rooms.ts` so the drawer receives their snapshot with the correct viewer context
- [X] T007 [US1] Add sessionStorage persistence in `frontend/src/state/roomStore.ts` — write `scribble_roomCode` and `scribble_participantId` on successful `createRoom` and `joinRoom`; clear them when navigating to "/" or "/lobby" (e.g., Exit Game button)
- [X] T008 [US1] Update `frontend/src/pages/GamePage.tsx` — on mount, read `scribble_roomCode` and `scribble_participantId` from sessionStorage and re-fetch room state if the store is empty (single fetch, no polling — handles page refresh); display the drawer's name/identity in the UI so all participants know who the drawer is

**Checkpoint**: US1 complete — game starts, drawer is assigned and visible to all, page refresh restores correct view.

---

## Phase 4: User Story 2 — Secret Word Visible Only to Drawer (Priority: P2)

**Goal**: The secret word for the round is selected deterministically from `STARTER_WORDS` and displayed only to the drawer. Non-drawer players never see the word in the UI or API responses.

**Independent Test**: Start a game with 2+ players. In the drawer's tab, verify the secret word "rocket" is displayed. In the guesser's tab, verify the word is not visible anywhere in the UI or API response.

### Implementation for User Story 2

- [X] T009 [P] [US2] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to conditionally include `secretWord` — include only when `viewerParticipantId === room.drawerId`; omit entirely for all other viewers (not `null`, not empty string)
- [X] T010 [P] [US2] Create `CanvasPlaceholder` component in `frontend/src/components/CanvasPlaceholder.tsx` — renders a non-interactive canvas area with role-appropriate messaging; guessers see "Waiting for [drawer name] to draw...", drawer sees "Draw your word here"
- [X] T011 [US2] Update `frontend/src/pages/GamePage.tsx` — show "You are the drawer!" with the secret word for the drawer participant; show "Waiting for [drawer name] to draw..." without the word for guessers; integrate `CanvasPlaceholder` into the canvas area

**Checkpoint**: US2 complete — drawer sees their word, guessers never do, verified at both API and UI levels.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Tests and build validation

- [X] T012 [P] Write tests for drawer assignment in `backend/src/services/roomStore.test.ts` — verify `startGame()` sets `drawerId` to host, `currentRound` to 1, `secretWord` to `STARTER_WORDS[currentRound - 1]`; verify `toRoomSnapshot()` returns `drawerId` and `currentRound` when status is "playing"
- [X] T013 [P] Write tests for secret word visibility in `backend/src/services/roomStore.test.ts` — verify `toRoomSnapshot()` includes `secretWord` when viewer is drawer, omits it for other viewers; verify null/undefined handling for non-drawer requests
- [X] T014 [P] Run `npm run build` in `backend/` — fix any type/build errors
- [X] T015 [P] Run `npm run build` in `frontend/` — fix any type/build errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete
- **Foundational (Phase 2)**: Blocks all user stories
- **User Stories (Phase 3-4)**:
  - **US1 (Phase 3)**: Can start after Phase 2 — no dependency on other stories
  - **US2 (Phase 4)**: Depends on US1 (needs game to be started and drawer assigned to test word visibility)
- **Polish (Phase 5)**: Depends on all user stories being complete

### Within Each User Story

- Backend model updates before service logic
- Services before API routes
- Backend changes before frontend integration
- Core implementation before UI rendering

### Parallel Opportunities

- All Phase 2 [P] tasks can run in parallel
- All [P] tasks within a user story can run in parallel
- T004 and T005 (backend service) can run in parallel
- Polish phase T012-T015 all run in parallel

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (Drawer Assignment)
3. **STOP and VALIDATE**: Game starts, drawer is visible, page refresh works

### Incremental Delivery

1. Add US1 → Test with two tabs → Commit (MVP)
2. Add US2 → Test word visibility → Commit
3. Polish: tests + build validation → Commit
