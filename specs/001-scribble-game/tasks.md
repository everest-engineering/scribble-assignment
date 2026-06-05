---

description: "Task list for Scribble Guessing Game implementation"
---

# Tasks: Scribble Guessing Game

**Input**: Design documents from `/specs/001-scribble-game/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/rooms-api.md](./contracts/rooms-api.md), [research.md](./research.md)

**Tests**: Test tasks are included because the starter ships a Vitest setup
(`roomStore.test.ts`, `schemas.test.ts`, `api.test.ts`) and the contract defines a test checklist.
They remain optional per story — implement them to lock behavior, skip if validating manually only.

**Organization**: Tasks are grouped by user story (matching the README's four business scenarios)
to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in each description

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing starter runs before enhancing it (brownfield — no scaffolding).

- [ ] T001 Verify both apps install and run: `cd backend && npm install && npm run dev` and `cd frontend && npm install && npm run dev`; confirm `http://localhost:3001/health` returns `{ "ok": true }` and the Start screen loads.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared in-memory state model that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Extend the state model in `backend/src/models/game.ts`: widen `RoomStatus` to `"lobby" | "active" | "result"`; add `score: number` to `Participant`; add `hostId: string` and `round: Round | null` to `Room`.
- [X] T003 Add `Round` and `Guess` interfaces and extend `RoomSnapshot` (add `hostId`, `drawerId`, `word: string | null`, `hasWord: boolean`, `guesses: Guess[]`) in `backend/src/models/game.ts`, per [data-model.md](./data-model.md).
- [X] T004 [P] Mirror the extended types (`Participant.score`, `RoomStatus` union, `Round`, `Guess`, extended `RoomSnapshot`) in `frontend/src/services/api.ts`.
- [X] T005 Set `hostId` to the creator's participant id in `createRoom` and reset/initialize `score: 0` and `round: null` in `backend/src/services/roomStore.ts`.

**Checkpoint**: Shared model extended — user stories can now begin.

---

## Phase 3: User Story 1 - Room Setup & Lobby (Priority: P1) 🎯 MVP

**Goal**: Create/join isolated rooms with a host, validated joins, an auto-refreshing lobby, and host-only start when ≥2 players are present.

**Independent Test**: In two tabs, create a room in one and join by code in the other; both converge on the same roster within ~2s, invalid code/empty name are rejected, and only the host sees an enabled Start once a second player joins.

### Tests for User Story 1 (optional)

- [X] T006 [P] [US1] Add roomStore tests for host designation on create and room isolation (mutating one room never affects another) in `backend/src/services/roomStore.test.ts`.
- [X] T007 [P] [US1] Add schema tests for empty/whitespace `playerName` rejection and unknown room code in `backend/src/api/schemas.test.ts`.

### Implementation for User Story 1

- [X] T008 [US1] Strengthen `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` to trim `playerName` and reject empty/whitespace-only names (FR-008).
- [X] T009 [US1] Return `400` with a clear message for empty names and keep `404` for unknown/invalid codes in `backend/src/api/rooms.ts` (FR-004).
- [X] T010 [US1] Ensure `toRoomSnapshot` serializes `hostId`, per-participant `score`, `status`, `drawerId: null`, `word: null`, `hasWord: false`, and `guesses: []` for lobby state in `backend/src/services/roomStore.ts`.
- [X] T011 [P] [US1] Add ~2s polling to `RoomStore` in `frontend/src/state/roomStore.ts`: start/stop a timer that calls `fetchRoom`, and expose a derived `isHost` (`participantId === room.hostId`).
- [X] T012 [US1] Update `frontend/src/pages/LobbyPage.tsx` to render the live roster, start polling on mount/stop on unmount, and show an enabled Start control only for the host when `participants.length >= 2` (FR-007).

**Checkpoint**: Two tabs can create/join an isolated room and see a self-refreshing lobby (MVP).

---

## Phase 4: User Story 2 - Game Start & Drawer Flow (Priority: P2)

**Goal**: Host starts a round; one drawer is identified; a deterministic secret word is visible only to the drawer.

**Independent Test**: Start a game from a 2-player lobby; exactly one player is the drawer, the drawer's tab shows the word, the guesser's tab does not, and repeating start yields the same word.

### Tests for User Story 2 (optional)

- [X] T013 [P] [US2] Add roomStore tests for start guards (non-host → blocked, <2 players → blocked), deterministic word selection, and drawer assignment in `backend/src/services/roomStore.test.ts`.

### Implementation for User Story 2

- [X] T014 [US2] Add `startRound(code, participantId)` to `backend/src/services/roomStore.ts`: require host and ≥2 players, set `status: "active"`, assign `drawerId` (the host), and select the word deterministically by index into `STARTER_WORDS` from `backend/src/seed/starterData.ts` (FR-009, FR-010, R2).
- [X] T015 [US2] Implement viewer-dependent word visibility in `toRoomSnapshot` (`backend/src/services/roomStore.ts`): include `word` only when `viewerParticipantId === drawerId`; otherwise `null` with `hasWord: true` (FR-011, R4).
- [X] T016 [US2] Add `startGameSchema` (`participantId`) in `backend/src/api/schemas.ts` and a `POST /:code/start` route with host (`403`) and min-players (`400`) guards in `backend/src/api/rooms.ts`.
- [X] T017 [P] [US2] Add `startGame(code, participantId)` to `frontend/src/services/api.ts` and a `startGame` action to `frontend/src/state/roomStore.ts`.
- [X] T018 [US2] Update `frontend/src/pages/GamePage.tsx` to identify the drawer and show the secret word only to the drawer (hidden for guessers), navigating from lobby on `status: "active"`.

**Checkpoint**: A started round shows one drawer and drawer-only word visibility.

---

## Phase 5: User Story 3 - Gameplay Interaction (Priority: P3)

**Goal**: Drawer draws/clears the canvas; guessers submit validated guesses; shared guess history syncs; correct guesses score 100.

**Independent Test**: With a drawer and guesser, draw and clear strokes, submit empty/wrong/correct guesses; the correct (case/whitespace-insensitive) guess scores 100 and history matches in both tabs within ~2s.

### Tests for User Story 3 (optional)

- [X] T019 [P] [US3] Add roomStore tests for guess validation (empty/whitespace rejected), case/whitespace-insensitive matching, and 100/0 scoring in `backend/src/services/roomStore.test.ts`.

### Implementation for User Story 3

- [X] T020 [US3] Add `submitGuess(code, participantId, text)` to `backend/src/services/roomStore.ts`: trim text, compare `text.toLowerCase() === word.toLowerCase()`, append a `Guess` to history, award +100 on correct / +0 otherwise (FR-014, FR-015, FR-016, FR-017).
- [X] T021 [US3] Add `guessSchema` (trim + non-empty `text`, `participantId`) in `backend/src/api/schemas.ts` and a `POST /:code/guess` route returning `400` for empty guesses in `backend/src/api/rooms.ts`.
- [X] T022 [P] [US3] Add `submitGuess(code, participantId, text)` to `frontend/src/services/api.ts` and a `submitGuess` action to `frontend/src/state/roomStore.ts`.
- [X] T023 [US3] Wire guess submission and inline validation in `frontend/src/components/GuessForm.tsx` (reject empty/whitespace before sending).
- [X] T024 [P] [US3] Render the synced guess history and per-player scores via `frontend/src/components/Scoreboard.tsx` (and the guess list in `frontend/src/pages/GamePage.tsx`).
- [X] T025 [US3] Add a native `<canvas>` drawing surface with pointer-event strokes and a Clear action for the drawer in `frontend/src/pages/GamePage.tsx` (no drawing library — R7).

**Checkpoint**: Full play loop works — draw/clear, validated guesses, synced history, scoring.

---

## Phase 6: User Story 4 - Result, Restart & Final Validation (Priority: P4)

**Goal**: All players see a shared result (word, final scores, full history); host restart returns everyone to the lobby with roster preserved and round state cleared.

**Independent Test**: End a round; both tabs show the same correct word, final scores, and history; host restarts and both tabs return to the lobby with the same players and a cleared round.

### Tests for User Story 4 (optional)

- [X] T026 [P] [US4] Add roomStore tests for the `active → result` transition on a correct guess and for restart (host-only, scores reset to 0, roster preserved, round cleared) in `backend/src/services/roomStore.test.ts`.

### Implementation for User Story 4

- [X] T027 [US4] Transition `status` to `"result"` on a correct guess in `submitGuess` within `backend/src/services/roomStore.ts` (FR-018).
- [X] T028 [US4] Add `restartGame(code, participantId)` to `backend/src/services/roomStore.ts`: require host, set `status: "lobby"`, clear `round`, reset every `participant.score` to 0, preserve the roster (FR-019, FR-020).
- [X] T029 [US4] Add `restartSchema` (`participantId`) in `backend/src/api/schemas.ts` and a `POST /:code/restart` route with a host guard (`403`) in `backend/src/api/rooms.ts`.
- [X] T030 [P] [US4] Add `restartGame(code, participantId)` to `frontend/src/services/api.ts` and a `restartGame` action to `frontend/src/state/roomStore.ts`.
- [X] T031 [US4] Render the result state (correct word, final scores, full guess history) in `frontend/src/components/ResultPanel.tsx` and show a host-only Restart control in `frontend/src/pages/GamePage.tsx`.

**Checkpoint**: One full session — lobby → round → result → restart — works end to end.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, build gates, and reflection (Principle V).

- [ ] T032 [P] Run `cd backend && npm test` and `cd frontend && npm test`; fix any failures.
- [ ] T033 Run the build gate: `cd backend && npm run build` and `cd frontend && npm run build`; both MUST pass.
- [ ] T034 Execute the two-tab manual validation in [quickstart.md](./quickstart.md), covering SC-001…SC-007 (including multi-room isolation and case-insensitive guessing).
- [ ] T035 [P] Write the reflection report (`reflection.md` at repo root): what the starter had, what was added, key decisions, AI usage, and tradeoffs (README "Reflection Report").

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phases 3–6)**: All depend on Foundational. Designed in priority order; US2 builds
  on the round/drawer model, US3 on the active round, US4 on a completed round, so for this single
  shared room model they are best implemented sequentially P1 → P2 → P3 → P4.
- **Polish (Phase 7)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Independent — the MVP slice.
- **US2 (P2)**: Builds on US1's room/host model (start requires a populated lobby).
- **US3 (P3)**: Builds on US2's active round and drawer/word.
- **US4 (P4)**: Builds on US3's guesses/scores to produce the result and restart.

### Within Each User Story

- Tests (if used) before implementation.
- Backend model/service before routes; backend before the frontend that consumes it.
- Story complete and validated before moving to the next priority.

### Parallel Opportunities

- `[P]` tasks touch different files with no incomplete dependency and can run together.
- Examples: T004 (frontend types) alongside T002/T003 (backend model) once interfaces are agreed;
  within a story, the frontend `api.ts` action (e.g. T017, T022, T030) parallel to backend tests.

---

## Parallel Example: User Story 1

```bash
# After Foundational completes, these US1 tasks can run in parallel:
Task: "T006 [US1] roomStore tests for host + isolation in backend/src/services/roomStore.test.ts"
Task: "T007 [US1] schema tests for name/code validation in backend/src/api/schemas.test.ts"
Task: "T011 [US1] ~2s polling + isHost in frontend/src/state/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup → 2. Phase 2: Foundational → 3. Phase 3: US1 → **STOP & VALIDATE** two-tab
   create/join/lobby. This is a demoable MVP.

### Incremental Delivery

1. Setup + Foundational → model ready.
2. US1 → validate → commit (MVP).
3. US2 → validate → commit.
4. US3 → validate → commit.
5. US4 → validate → commit.
6. Polish → builds pass, quickstart validated, reflection written.

---

## Notes

- `[P]` = different files, no dependencies.
- `[Story]` label maps each task to a README scenario (US1–US4) for traceability.
- Commit after each task or logical group (Principle IV — granular, traceable commits).
- Validate each story with two browser tabs before advancing (Principle V).
- Avoid out-of-scope work (WebSockets, DB, auth, timers, multiple rounds — see spec Assumptions).
