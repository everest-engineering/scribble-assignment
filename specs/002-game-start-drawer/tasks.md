---
description: "Task list for Game Start & Drawer Flow (Scenario 2)"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md

**Tests**: Unit tests ARE included — required by Constitution Principle VI and plan.md Testing
Strategy (deterministic start, drawer, word selection, drawer-only visibility, name validation).

**Organization**: Tasks grouped by user story. Priorities from spec.md — P1: US1, US2, US3;
P2: US4.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US4 maps to spec.md user stories

## Path Conventions

Web app monorepo: `backend/src/`, `frontend/src/` (per plan.md Structure Decision).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a clean, runnable baseline before changing behavior.

- [X] T001 [P] Confirm backend baseline is green: `cd backend && npm test && npm run build`
- [X] T002 [P] Confirm frontend baseline is green: `cd frontend && npm test && npm run build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared round/role/word data model that the user stories read. No story work can begin
until this is complete.

**⚠️ CRITICAL**: Blocks all user stories.

- [X] T003 [P] Extend `RoomStatus` to `"lobby" | "playing"`; add `drawerId: string | null` and `secretWord: string | null` to `Room`; add `drawerId`/`isDrawer`/`secretWord` to `RoomSnapshot` in `backend/src/models/game.ts`
- [X] T004 [P] Mirror the `status` union and add `drawerId`/`isDrawer`/`secretWord` on the `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Types support an active round; snapshot can carry drawer + word.

---

## Phase 3: User Story 1 - Start the round and bring everyone into the game (Priority: P1) 🎯 MVP

**Goal**: The host starts; the room enters an active round and every player (host + guessers)
lands in the game view automatically via polling.

**Independent Test**: With two players in a lobby, the host starts; both screens show the game
view within ~2s with no manual navigation by the guesser.

### Tests for User Story 1

- [X] T005 [US1] Unit test in `backend/src/services/roomStore.test.ts`: `startRound(code, hostId)` sets `status:"playing"` and `drawerId === hostId`; returns an error/failure for a non-host requester and for a room with fewer than 2 participants

### Implementation for User Story 1

- [X] T006 [US1] Add `startRoomSchema` (`{ participantId: z.string().min(1) }`) in `backend/src/api/schemas.ts`
- [X] T007 [US1] Add `startRound(code, participantId)` to `backend/src/services/roomStore.ts`: validate requester is host and `participants.length >= 2`, set `drawerId = hostId`, select `secretWord` via a deterministic `selectWord(code)` helper, set `status = "playing"`; signal not-host / too-few-players distinctly (depends on T003)
- [X] T008 [US1] Add `POST /rooms/:code/start` in `backend/src/api/rooms.ts`: parse body, call `startRound`, map outcomes to `200` / `403 "Only the host can start the game"` / `404 "Room not found"` / `409 "At least 2 players are required to start"` (depends on T006, T007)
- [X] T009 [US1] Add `api.startRoom(code, participantId)` (POST `/rooms/:code/start`) in `frontend/src/services/api.ts` (depends on T004 — same file)
- [X] T010 [US1] Add `startRoom(participantId)` to the store (calls `api.startRoom`, stores returned snapshot) in `frontend/src/state/roomStore.ts`
- [X] T011 [US1] In `frontend/src/pages/LobbyPage.tsx`, make the host's Start button call `startRoom`, and navigate every player to `/game` when a poll reports `status === "playing"`
- [X] T012 [US1] In `frontend/src/pages/GamePage.tsx`, start/stop polling on mount/unmount and redirect to `/lobby` if `status === "lobby"` (and to `/` if no room)

**Checkpoint**: Host can start; both players reach the game view automatically (MVP).

---

## Phase 4: User Story 2 - Drawer assignment and clear identification (Priority: P1)

**Goal**: Exactly one drawer (the host) is assigned and clearly identified to everyone; each
player can tell their own role.

**Independent Test**: Start a round with a host and a guesser; the host is shown as drawer to
both, the guesser as guesser, and each player's own role is clear.

### Tests for User Story 2

- [X] T013 [US2] Unit test in `backend/src/services/roomStore.test.ts`: after start, the host's snapshot has `isDrawer: true` and the guesser's has `isDrawer: false`; `drawerId` equals `hostId`; exactly one participant matches `drawerId` (depends on T005 — same file)

### Implementation for User Story 2

- [X] T014 [US2] Extend `toRoomSnapshot` to include `drawerId` and `isDrawer = viewerParticipantId === room.drawerId` in `backend/src/services/roomStore.ts` (depends on T007 — same file)
- [X] T015 [US2] In `frontend/src/pages/GamePage.tsx`, show the drawer's name to all players and indicate the viewer's own role (drawer vs guesser), replacing the placeholder status (depends on T012 — same file)

**Checkpoint**: Roles are assigned and visible; single-drawer invariant holds.

---

## Phase 5: User Story 3 - Deterministic secret word, visible only to the drawer (Priority: P1)

**Goal**: A deterministic word from the starter list is chosen at start, fixed for the round,
shown to the drawer and never sent to guessers.

**Independent Test**: Start a round; the drawer sees a starter word, the guesser's data never
contains it, and the word is unchanged across refreshes.

### Tests for User Story 3

- [X] T016 [US3] Unit test in `backend/src/services/roomStore.test.ts`: `selectWord` returns a starter word and is deterministic (same code → same word); the drawer's snapshot has `secretWord` set, the guesser's snapshot has `secretWord === null` (depends on T013 — same file)

### Implementation for User Story 3

- [X] T017 [US3] In `toRoomSnapshot` (`backend/src/services/roomStore.ts`), set `secretWord = isDrawer ? room.secretWord : null` so the word is stripped for non-drawers (depends on T014 — same file)
- [X] T018 [US3] In `frontend/src/pages/GamePage.tsx`, display the secret word only when `isDrawer` (guessers see a hidden/"guess the word" state) (depends on T015 — same file)

**Checkpoint**: Drawer sees the word; guessers never receive it; word is stable.

---

## Phase 6: User Story 4 - Player name validation (Priority: P2)

**Goal**: Names are trimmed; empty/whitespace-only names are rejected with a clear message at
create and join.

**Independent Test**: Create/join with blank, whitespace-only, and padded names; blanks are
rejected with a message, padded names succeed trimmed.

### Tests for User Story 4

- [X] T019 [US4] Unit test in `backend/src/api/schemas.test.ts`: `createRoomSchema` and `joinRoomSchema` reject empty and whitespace-only `playerName` and trim a valid padded name

### Implementation for User Story 4

- [X] T020 [US4] Change `playerName` to `z.string().trim().min(1)` in both `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` (depends on T006 — same file)
- [X] T021 [US4] Remove the blank-name "Player" default so trimmed validated names are stored as-is in `backend/src/services/roomStore.ts` (depends on T017 — same file)
- [X] T022 [US4] Block empty/whitespace-only name submissions with a clear "name required" message in `frontend/src/pages/CreateRoomPage.tsx`
- [X] T023 [US4] Block empty/whitespace-only name submissions with a clear "name required" message in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: All invalid-name paths give clear feedback; valid names are trimmed.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and traceability across all stories.

- [~] T024 [P] Run the full quickstart two-tab walkthrough in `specs/002-game-start-drawer/quickstart.md` and confirm every row passes — backend API paths verified via smoke test (start/drawer/word/guesser-stripped/name-validation/403/409); **browser two-tab UI pass still to be done by a human**
- [X] T025 [P] Run both builds and full test suites (`cd backend && npm run build && npm test`, `cd frontend && npm run build && npm test`); confirm green
- [X] T026 [P] Update `REFLECTION.md` "What I added" with the Scenario 2 changes (start action, drawer assignment, deterministic word, drawer-only visibility, name validation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories. T003 ‖ T004 (different files).
- **User Stories (Phases 3–6)**: All depend on Foundational. Ordered by priority (P1: US1, US2, US3; then P2: US4).
- **Polish (Phase 7)**: Depends on all desired stories.

### Cross-file sequencing (same-file = not parallel)

- `backend/src/services/roomStore.ts`: T007 → T014 → T017 → T021
- `backend/src/services/roomStore.test.ts`: T005 → T013 → T016
- `backend/src/api/schemas.ts`: T006 → T020
- `frontend/src/services/api.ts`: T004 → T009
- `frontend/src/pages/GamePage.tsx`: T012 → T015 → T018

### User Story Dependencies

- **US1 (P1)**: After Foundational. MVP — delivers the start transition.
- **US2 (P1)**: After US1 (reads `drawerId` set by `startRound`; extends `toRoomSnapshot` and GamePage).
- **US3 (P1)**: After US2 (extends the same `toRoomSnapshot` and GamePage with word visibility).
- **US4 (P2)**: After Foundational; touches schemas/store/forms — independent of the round flow.

### Parallel Opportunities

- T001 ‖ T002.
- T003 ‖ T004.
- T022 ‖ T023 (different page files); both independent of the backend name tasks except via behavior.
- T024 ‖ T025 ‖ T026.

---

## Parallel Example: Foundational Phase

```bash
# T003 and T004 touch different files and can run together:
Task: "Extend RoomStatus + Room/snapshot types in backend/src/models/game.ts"
Task: "Mirror status union + snapshot fields in frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & validate**: host starts,
   both players land in the game view automatically within ~2s.

### Incremental Delivery

Foundation → US1 (start + transition) → US2 (drawer identity) → US3 (deterministic, drawer-only
word) → US4 (name validation) → Polish. Each story is independently testable per its Independent
Test.

### Notes

- Commit after each task or logical group (Constitution Principle V).
- Verify each new unit test fails before implementing, then passes after.
- The secret word MUST be stripped server-side for guessers (T017) — verify via the guesser
  snapshot in T016, not only in the UI.
- Run the two-tab walkthrough (quickstart.md) before declaring Scenario 2 done.
