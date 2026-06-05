---
description: "Task list for Scenario 2 — Game Start & Drawer Flow"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md); builds on Scenario 1.

**Tests**: Included — Vitest unit tests for store + schemas.

## Format: `[ID] [P?] [Story] Description`

- **[Story]**: US1 (name validation), US2 (start/drawer), US3 (deterministic word
  + drawer-only visibility)

---

## Phase 1: Foundational (Model + Store)

- [ ] T001 [US2] Extend `RoomStatus` to `"lobby" | "playing"`; add `wordIndex:
      number` and `drawerId?: string` to `Room`; add `drawerId?: string` and
      `word?: string` to `RoomSnapshot` in `backend/src/models/game.ts`.
- [ ] T002 [US3] In `backend/src/services/roomStore.ts`, add a module-level
      creation counter and set `room.wordIndex = (count - 1) %
      STARTER_WORDS.length` in `createRoom`.
- [ ] T003 [US2] In `roomStore.ts`, add `startGame(code, requesterId)` that
      verifies the requester is the host and there are ≥2 participants, sets
      `status="playing"` and `drawerId=hostId`, and is a no-op re-pick if already
      playing.
- [ ] T004 [US3] In `roomStore.ts`, update `toRoomSnapshot(room, viewerId)` to
      include `drawerId` and to include `word = STARTER_WORDS[wordIndex]` ONLY when
      `status==="playing"` and `viewerId === drawerId`.

**Checkpoint**: Store can start a game and hide the word from guessers.

---

## Phase 2: User Story 1 — Validated player names (P1)

- [ ] T005 [US1] In `backend/src/api/schemas.ts`, make `playerName` trim and
      reject empty/whitespace (Zod), used by create and join.
- [ ] T006 [US1] In `frontend/src/pages/CreateRoomPage.tsx`, trim the name and
      block empty/whitespace with "Name is required".
- [ ] T007 [US1] In `frontend/src/pages/JoinRoomPage.tsx`, add the same name
      check alongside the existing code checks.

**Checkpoint**: Blank names rejected client + backend; names stored trimmed.

---

## Phase 3: User Story 2 — Host starts, becomes drawer (P1)

- [ ] T008 [US2] In `backend/src/api/rooms.ts`, add `POST /:code/start` that reads
      `participantId`, calls `startGame`, returns the snapshot, and maps host/
      count failures to clear 4xx errors.
- [ ] T009 [US2] In `frontend/src/services/api.ts`, extend the `RoomSnapshot` type
      (`status` union, `drawerId?`, `word?`) and add `startGame(code,
      participantId)`.
- [ ] T010 [US2] In `frontend/src/state/roomStore.ts`, add `startGame()` that
      calls the API and stores the returned snapshot.
- [ ] T011 [US2] In `frontend/src/pages/LobbyPage.tsx`, change the host Start
      button to call `roomStore.startGame()`, and auto-navigate to `/game` when a
      poll reports `status === "playing"`.

**Checkpoint**: Host start moves both tabs to the game within ~2s.

---

## Phase 4: User Story 3 — Drawer-only secret word (P1)

- [ ] T012 [US3] In `frontend/src/pages/GamePage.tsx`, derive `isDrawer =
      room.drawerId === participantId`; show the secret `word` and a "You are the
      drawer" label to the drawer, and a "You are guessing" label (no word) to
      others; poll for sync.
- [ ] T013 [US3] In `backend/src/services/roomStore.test.ts`, add tests:
      deterministic word order across consecutive `createRoom`s; `toRoomSnapshot`
      returns `word` for the drawer and `undefined` for a guesser; `startGame`
      rejects a non-host and a <2-player room.

**Checkpoint**: Drawer sees the word; guesser snapshot never contains it.

---

## Phase 5: Validation

- [ ] T014 `cd backend && npm run build && npm test` — zero errors.
- [ ] T015 `cd frontend && npm run build && npm test` — zero errors.
- [ ] T016 Two-tab manual check of SC-001…SC-005.

---

## Dependencies & Execution Order

- Phase 1 (T001–T004) blocks all stories.
- US1 (T005–T007) is independent of US2/US3 and can land first.
- US2 (T008–T011) precedes US3's game-screen work (T012 needs `drawerId`/`word`).
- T013 tests depend on T002–T004; validation (Phase 5) is last.

## Notes

- Commit in logical groups: (a) model+store+start, (b) name validation,
  (c) start endpoint + frontend wiring, (d) game screen + tests. Short messages,
  no co-author line, only after user approval.
- Assert relative word order in tests (counter is module-global), not absolute
  index, to avoid cross-test coupling.
