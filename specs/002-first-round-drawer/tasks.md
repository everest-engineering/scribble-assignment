# Tasks: First Round Drawer and Secret Word

**Input**: Design documents from `/specs/002-first-round-drawer/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/game-start-api.md, quickstart.md  
**Depends on**: `001-host-join-rooms` (host-only `POST /start`, `hostParticipantId`, lobby → `drawing` transition)

**Tests**: Included per constitution Principle V (test-first for `wordSelection` and `startGame`).

**Organization**: Tasks grouped by user story for independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify dependency on 001 and shared starter data.

- [ ] T001 Confirm `001-host-join-rooms` start path exists (`POST /rooms/:code/start`, `hostParticipantId`) or implement 001 Phase 5 tasks first in `backend/src/api/rooms.ts` and `backend/src/services/roomStore.ts`
- [ ] T002 [P] Verify `STARTER_WORDS` in `backend/src/seed/starterData.ts` matches spec (rocket, pizza, castle, guitar, sunflower)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Round model, deterministic word helper, and viewer-scoped snapshot shape.

**⚠️ CRITICAL**: No user story work until this phase is complete.

- [ ] T003 Extend `RoomStatus`, `Participant` (`role`), and `Room` (`roundNumber`, `drawerParticipantId`, `secretWord`, `hostParticipantId`) in `backend/src/models/game.ts` per `data-model.md`
- [ ] T004 [P] Implement pure `selectRoundWord(roomCode, roundNumber)` in `backend/src/services/wordSelection.ts` using deterministic index into `STARTER_WORDS`
- [ ] T005 [P] Add Zod schemas for start response / viewer fields (`role`, optional `secretWord`) in `backend/src/api/schemas.ts`
- [ ] T006 [P] Extend frontend snapshot types (`drawerParticipantId`, `viewer.role`, `viewer.secretWord?`) in `frontend/src/services/api.ts`

**Checkpoint**: Models and word selection ready.

---

## Phase 3: User Story 1 - Valid Player Names Before Play (Priority: P1) 🎯 MVP

**Goal**: Trim all participant names on start; block start if any name is empty after trim.

**Independent Test**: Lobby with valid names starts; whitespace-only name blocks start with clear message (quickstart step 1, 6).

### Tests for User Story 1

- [ ] T007 [P] [US1] Add failing tests for trim-all-names and reject start when any participant name empty after trim in `backend/src/services/roomStore.test.ts`
- [ ] T008 [P] [US1] Add failing contract test for `POST /rooms/:code/start` 400 on invalid roster names in `backend/src/api/rooms.test.ts`

### Implementation for User Story 1

- [ ] T009 [US1] Add `trimParticipantNames(room)` helper and invoke at start of `startGame` in `backend/src/services/roomStore.ts`
- [ ] T010 [US1] Return 400 with clear message when any participant name invalid after trim in `backend/src/api/rooms.ts`
- [ ] T011 [P] [US1] Ensure lobby displays trimmed names after poll in `frontend/src/pages/LobbyPage.tsx` (if names updated server-side)

**Checkpoint**: Start blocked until every participant has valid trimmed name.

---

## Phase 4: User Story 2 - First-Round Drawer Is Clear to Everyone (Priority: P1)

**Goal**: On start, assign exactly one drawer (host preferred); all clients see who is drawing.

**Independent Test**: Two browsers after start—both show host as drawer, guest as guesser (quickstart step 2).

### Tests for User Story 2

- [ ] T012 [P] [US2] Add failing tests: host is drawer when present; earliest joiner if no host; exactly one drawer in `backend/src/services/roomStore.test.ts`
- [ ] T013 [P] [US2] Add failing contract test that snapshot includes `drawerParticipantId` and per-participant `role` for all viewers in `backend/src/api/rooms.test.ts`

### Implementation for User Story 2

- [ ] T014 [US2] Implement `assignRoundOneRoles(room)` setting `drawerParticipantId` and participant `role` fields in `backend/src/services/roomStore.ts`
- [ ] T015 [US2] Include `drawerParticipantId` and participant roles in `toRoomSnapshot` in `backend/src/services/roomStore.ts`
- [ ] T016 [US2] Show drawer vs guesser labels on `frontend/src/pages/GamePage.tsx` using `drawerParticipantId` and `viewer.role`
- [ ] T017 [P] [US2] Highlight current viewer role (“You are drawing” / “You are guessing”) in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Drawer identity obvious to all participants.

---

## Phase 5: User Story 3 - Secret Word for the Drawer Only (Priority: P1)

**Goal**: Deterministic word from starter list; visible only to drawer in API and UI.

**Independent Test**: Drawer sees word, guesser does not; same word on repeated start with same room code (quickstart steps 3–5).

### Tests for User Story 3

- [ ] T018 [P] [US3] Add failing unit tests for `selectRoundWord` determinism and starter-list bounds in `backend/src/services/wordSelection.test.ts`
- [ ] T019 [P] [US3] Add failing tests: guesser snapshot omits `secretWord`; drawer snapshot includes it in `backend/src/services/roomStore.test.ts`
- [ ] T020 [P] [US3] Add failing contract test: two `participantId` values get different `viewer.secretWord` presence in `backend/src/api/rooms.test.ts`

### Implementation for User Story 3

- [ ] T021 [US3] Set `room.secretWord` via `selectRoundWord(room.code, 1)` inside `startGame` in `backend/src/services/roomStore.ts`
- [ ] T022 [US3] Add `viewer.secretWord` only when `viewer.role === "drawer"` in `toRoomSnapshot` in `backend/src/services/roomStore.ts`
- [ ] T023 [US3] Complete `startGame`: set `status` to `drawing`, `roundNumber` to 1, assign roles and word in `backend/src/services/roomStore.ts`
- [ ] T024 [US3] Wire host-only `POST /rooms/:code/start` response per `contracts/game-start-api.md` in `backend/src/api/rooms.ts`
- [ ] T025 [US3] Navigate host and guests to game route after successful start from `frontend/src/pages/LobbyPage.tsx`
- [ ] T026 [US3] Show secret word panel for drawer only; guesser sees non-revealing prompt per FR-012 in `frontend/src/pages/GamePage.tsx`
- [ ] T027 [P] [US3] Remove or gate any UI that lists `availableWords` to guessers on `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Word hidden from guessers; deterministic selection verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and manual validation.

- [ ] T028 [P] Run `npm run build` and `npm test` in `backend/` and fix failures
- [ ] T029 [P] Run `npm run build` in `frontend/` and fix type errors
- [ ] T030 Execute two-browser checklist in `specs/002-first-round-drawer/quickstart.md`
- [ ] T031 [P] Document deterministic word function inputs in `specs/002-first-round-drawer/research.md` if implementation detail differs from planned hash

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **User Stories (3–5)** → **Phase 6**
- **Requires 001**: Host start endpoint and `hostParticipantId` before US2/US3

### User Story Dependencies

| Story | Depends on | Can test alone after |
|-------|------------|----------------------|
| US1 | Phase 2 | Phase 3 checkpoint |
| US2 | US1 (valid start path) | Phase 4 checkpoint |
| US3 | US2 (roles assigned) | Phase 5 checkpoint |

### Within Each User Story

1. Tests written and failing  
2. `roomStore` / `wordSelection`  
3. API routes  
4. `GamePage` / `LobbyPage`  

### Parallel Opportunities

- T002, T004, T005, T006 in parallel  
- Test pairs per story: T007+T008, T012+T013, T018+T019+T020  
- T011, T017, T027 parallel on frontend after core backend done  
- T028 and T029 in parallel  

---

## Parallel Example: User Story 3

```bash
T018: backend/src/services/wordSelection.test.ts
T019: backend/src/services/roomStore.test.ts
T020: backend/src/api/rooms.test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 + minimal start)

1. Phase 1 + 2  
2. Phase 3 (name validation at start)  
3. Partial Phase 5 T023–T024 (transition to drawing without UI polish)  

### Incremental Delivery

1. US1 → names safe at start  
2. US2 → drawer visible  
3. US3 → word + guesser privacy  
4. Phase 6 → validated  

---

## Notes

- **Total tasks**: 31 (T001–T031)  
- **Per story**: Setup 2 | Foundational 4 | US1 5 | US2 6 | US3 9 | Polish 4  
- **No** random word selection; **no** WebSockets/DB/auth  
- **FR mapping**: US1 → FR-001–003; US2 → FR-004–008; US3 → FR-009–012  
- Join during `result` and round gameplay → features 003/004
