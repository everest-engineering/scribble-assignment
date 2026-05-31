# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/rooms.md, research.md

**Tests**: No test tasks generated — spec requests manual two-tab acceptance testing only (existing 4 unit tests confirm no regressions).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: No new project structure or dependencies needed — pure brownfield extension.
All 4 changed files already exist. No npm installs required.

- [x] T001 Verify existing TypeScript build passes before any changes: `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared data model in `backend/src/models/game.ts`.
Both US1 and US2 depend on these type additions — neither can be implemented without them.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `drawerId: string | null` to `Room` interface in `backend/src/models/game.ts`
- [x] T003 Add `secretWord: string | null` to `Room` interface in `backend/src/models/game.ts`
- [x] T004 Add `drawerId: string | null` to `RoomSnapshot` interface in `backend/src/models/game.ts` (always present, not secret)
- [x] T005 Add `secretWord?: string` to `RoomSnapshot` interface in `backend/src/models/game.ts` (optional — present only for drawer)

**Checkpoint**: Data model updated — backend service and frontend types can now be extended.

---

## Phase 3: User Story 1 — Drawer Assignment on Game Start (Priority: P1) 🎯 MVP

**Goal**: When the game starts, the host is designated as the drawer (`drawerId = hostId`).
All players see the drawer's name on the Game screen. Each player sees their own role (drawing / guessing).

**Independent Test**: Start a game with two tabs. Confirm both tabs show the drawer's name.
Confirm each tab shows the correct role badge ("You are drawing" / "You are guessing").
No secret word display needed yet for this story.

### Implementation for User Story 1

- [x] T006 [US1] In `backend/src/services/roomStore.ts` — `createRoom()`: initialise `drawerId: null` on the new room object
- [x] T007 [US1] In `backend/src/services/roomStore.ts` — `startRoom()`: set `drawerId: room.hostId` alongside `status: "game"`
- [x] T008 [US1] In `backend/src/services/roomStore.ts` — `toRoomSnapshot()`: include `drawerId: room.drawerId` in the returned snapshot (always, not conditional)
- [x] T009 [P] [US1] In `frontend/src/services/api.ts`: add `drawerId: string | null` to the `RoomSnapshot` interface
- [x] T010 [US1] In `frontend/src/pages/GamePage.tsx`: derive `isDrawer = room.drawerId === participantId` and `drawer = room.participants.find(p => p.id === room.drawerId)`
- [x] T011 [US1] In `frontend/src/pages/GamePage.tsx`: display drawer's name with an "is drawing" label — visible to all participants
- [x] T012 [US1] In `frontend/src/pages/GamePage.tsx`: display role badge — "You are drawing" when `isDrawer`, "You are guessing" otherwise

**Checkpoint**: US1 independently verifiable. Both tabs show drawer identity and personal role badge. No secret word yet.

---

## Phase 4: User Story 2 — Secret Word Visibility (Priority: P1)

**Goal**: The secret word (`"rocket"`) is shown only to the drawer. Guessers see no word and no hint.
Backend omits `secretWord` key entirely from guesser responses (not `null` — absent).

**Independent Test**: Start a game. Confirm drawer's tab shows "Your word: rocket".
Confirm guesser's tab shows no word. Inspect network tab on guesser's browser to confirm
`secretWord` key is absent from the GET /rooms/:code response JSON.

### Implementation for User Story 2

- [x] T013 [US2] In `backend/src/services/roomStore.ts` — `createRoom()`: initialise `secretWord: null` on the new room object (alongside `drawerId: null` from T006)
- [x] T014 [US2] In `backend/src/services/roomStore.ts` — `startRoom()`: set `secretWord: STARTER_WORDS[0]` alongside `drawerId` and `status: "game"`
- [x] T015 [US2] In `backend/src/services/roomStore.ts` — `toRoomSnapshot()`: remove the `void viewerParticipantId` no-op; compute `isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId`; use conditional spread `...(isDrawer && room.secretWord ? { secretWord: room.secretWord } : {})` to include `secretWord` only for the drawer
- [x] T016 [P] [US2] In `frontend/src/services/api.ts`: add `secretWord?: string` to the `RoomSnapshot` interface (optional — present only when viewer is drawer)
- [x] T017 [US2] In `frontend/src/pages/GamePage.tsx`: display "Your word: [word]" section only when `isDrawer && room.secretWord` — must not render for guessers

**Checkpoint**: US2 independently verifiable. Drawer sees word; guesser sees nothing; network response confirms absence of `secretWord` key for guessers.

---

## Phase 5: User Story 3 — Player Name Validation (Priority: P1)

**Goal**: Confirm existing validation is working — empty/whitespace names are rejected on client and server.
No new code required; this story is already complete from Scenario 1.

**Independent Test**: On Create Room and Join Room screens, submit an empty or whitespace-only name.
Confirm inline error appears with no API call made. Also confirm backend returns 400 for blank names.

### Implementation for User Story 3

- [x] T018 [US3] Verify client-side trim + empty guard exists in `frontend/src/pages/CreateRoomPage.tsx` (already implemented in Scenario 1 — read and confirm)
- [x] T019 [US3] Verify client-side trim + empty guard exists in `frontend/src/pages/JoinRoomPage.tsx` (already implemented in Scenario 1 — read and confirm)
- [x] T020 [US3] Verify `playerName: z.string().trim().min(1)` validation in `backend/src/api/schemas.ts` covers both `createRoomSchema` and `joinRoomSchema` (already implemented — read and confirm)

**Checkpoint**: US3 confirmed working. No code changes expected.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: TypeScript correctness verification and manual acceptance gate.

- [x] T021 Run TypeScript build check: `cd backend && npx tsc --noEmit` — must pass with zero errors
- [x] T022 [P] Run TypeScript build check: `cd frontend && npx tsc --noEmit` — must pass with zero errors
- [x] T023 Run existing unit tests: `cd backend && npm test` — all 4 tests must pass (no regressions)
- [x] T024 Manual two-tab acceptance: open two browser tabs, create room + join, start game, confirm drawer tab shows word, guesser tab does not, both tabs show drawer's name
- [x] T025 DevTools network verification: inspect GET /rooms/:code response on guesser tab — confirm `secretWord` key is absent from JSON (not null, not empty — absent)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 (T002–T005 must be complete)
- **US2 (Phase 4)**: Depends on Phase 3 completion (uses `isDrawer` logic established in US1)
- **US3 (Phase 5)**: Independent — can run anytime after Phase 2
- **Polish (Phase 6)**: Depends on all user story phases complete

### Within Each User Story

- Backend model (T002–T005) before backend service (T006–T008, T013–T015)
- Backend service before frontend type update (T009, T016)
- Frontend type update before GamePage rendering (T010–T012, T017)
- US1 complete before US2 (US2 builds on `isDrawer` derived in US1)

### Parallel Opportunities

- T009 (`api.ts` drawerId) and T006–T008 (backend service) can run in parallel — different files
- T016 (`api.ts` secretWord) and T013–T015 (backend service) can run in parallel — different files
- T021 and T022 (TypeScript build checks) can run in parallel — independent processes
- T018, T019, T020 (US3 verifications) can run in parallel — independent reads

---

## Parallel Example: User Story 1

```bash
# Backend service + frontend type update can run in parallel:
Task T006–T008: "Extend roomStore.ts for drawerId"
Task T009:      "Add drawerId to api.ts RoomSnapshot"

# Then sequentially (depends on both):
Task T010–T012: "Extend GamePage.tsx with drawer display"
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2, this Scenario)

1. Complete Phase 1: Verify build baseline
2. Complete Phase 2: Extend data model in `game.ts` ← CRITICAL gate
3. Complete Phase 3: US1 — drawer assignment and display
4. **STOP and VALIDATE**: Confirm drawer name visible on both tabs
5. Complete Phase 4: US2 — secret word visibility
6. **STOP and VALIDATE**: Confirm word shown to drawer only; absent from guesser response
7. Complete Phase 5: US3 — confirm name validation still works
8. Complete Phase 6: Polish + build checks + manual acceptance

### Incremental Delivery

- After Phase 3: Drawer identity fully functional (word not yet visible)
- After Phase 4: Word secrecy fully functional (core game mechanic complete)
- After Phase 5: All Scenario 2 acceptance criteria met

---

## Notes

- No new npm dependencies — extend existing files only (per constitution Principle V)
- TypeScript throughout — no plain JS (per constitution Principle I)
- `secretWord` must be **absent** (not `null`) from guesser responses — verify in DevTools
- `STARTER_WORDS[0]` = `"rocket"` — deterministic, never random (per constitution Principle II)
- Game screen does NOT add polling in Scenario 2 — snapshot with `drawerId` already in React state at navigation time (per constitution Principle III)
- Commit granularly: one commit per phase or logical group, traceable to task IDs
