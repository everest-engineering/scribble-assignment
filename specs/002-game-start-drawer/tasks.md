# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/rooms-api.md ✅

**Tests**: Backend test tasks included (per request) at the **service level** (`backend/src/services/roomStore.test.ts`),
matching the Group 1 pattern — no new test deps. Frontend behavior validated via [quickstart.md](./quickstart.md).

**Organization**: grouped by user story (US1–US4). Builds on Group 1 (committed: host identity, polling,
host-only start, auto-advance).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: different file, no dependency on an incomplete task
- **[Story]**: US1–US4 traceability

---

## Phase 1: Setup

- [ ] T001 Verify baseline: on branch `scribble-assignment`, `npm test` green in both `backend/` and `frontend/`, and the Group 1 app runs (create/join/start work).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data-shape additions every Group 2 story depends on.

- [X] T002 [P] In `backend/src/models/game.ts`: add `drawerId?: string` and `secretWord?: string` to `Room`; add `drawerId?: string`, `role?: "drawer" | "guesser"`, and `word?: string` to `RoomSnapshot`.
- [X] T003 [P] In `frontend/src/services/api.ts`: extend the `RoomSnapshot` type with `drawerId?: string`, `role?: "drawer" | "guesser"`, and `word?: string`.

**Checkpoint**: model + snapshot can carry drawer, role, and word.

---

## Phase 3: User Story 1 — Player name validation (Priority: P1)

**Goal**: Trim names; reject empty/whitespace on create and join with a clear message; no "Player" fallback (FR-001…003).

**Independent Test**: Submit a blank name on create and on join → rejected with a message; submit "  Alice  " → stored as "Alice".

### Tests for User Story 1

- [X] T004 [P] [US1] In `backend/src/services/roomStore.test.ts`: assert `createRoom("   ")` throws a 400-class error, and `createRoom("  Alice  ")` stores `participants[0].name === "Alice"`; same trim/reject for `joinRoom`.

### Implementation for User Story 1

- [X] T005 [US1] In `backend/src/services/roomStore.ts`: trim the player name in `createRoom`/`joinRoom`; if empty after trim, throw `HttpError(400, "Enter a player name.")`; store the trimmed name; remove the `"Player"` fallback in `displayName`.
- [X] T006 [P] [US1] In `frontend/src/pages/CreateRoomPage.tsx`: trim the name on submit; if empty, show `"Enter a player name."` and do NOT call the API or navigate.
- [X] T007 [P] [US1] In `frontend/src/pages/JoinRoomPage.tsx`: trim the name on submit; if empty, show `"Enter a player name."` and do NOT call the API (in addition to the existing Group 1 empty-code guard).

**Checkpoint**: blank names rejected everywhere; names stored trimmed (quickstart V1–V2).

---

## Phase 4: User Story 2 — Drawer assignment & identification (Priority: P1)

**Goal**: On start, exactly one drawer = host; drawer identity visible to all; non-drawers identified as guessers (FR-004…006).

**Independent Test**: Start with 2 players → both tabs show the host as drawer; host sees role "drawer", other sees "guesser".

### Tests for User Story 2

- [X] T008 [P] [US2] In `backend/src/services/roomStore.test.ts`: after `startGame`, assert `room.drawerId === room.hostId`; assert `toRoomSnapshot(room, hostId).role === "drawer"` and `toRoomSnapshot(room, otherId).role === "guesser"`, and both include `drawerId`.

### Implementation for User Story 2

- [X] T009 [US2] In `backend/src/services/roomStore.ts`: in `startGame`, set `room.drawerId = room.hostId` (depends on T002; extends Group 1 `startGame`).
- [X] T010 [US2] In `backend/src/services/roomStore.ts`: make `toRoomSnapshot(room, viewerParticipantId)` return `drawerId` (always, once set) and `role` = `viewerParticipantId === room.drawerId ? "drawer" : "guesser"`.
- [X] T011 [US2] In `frontend/src/pages/GamePage.tsx`: show the drawer's name to all viewers, and label the current viewer as Drawer or Guesser (from `room.role`).

**Checkpoint**: drawer assigned and clearly shown to everyone (quickstart V3).

---

## Phase 5: User Story 3 — Deterministic secret word (Priority: P2)

**Goal**: On start, select one starter word via a stable room-code-derived rule (FR-007, FR-008).

**Independent Test**: Start a game; the word is one of the five starter words and never changes across polling.

### Tests for User Story 3

- [X] T012 [P] [US3] In `backend/src/services/roomStore.test.ts`: assert `selectWord(code)` is pure (same code → same word, value ∈ STARTER_WORDS) and that after `startGame`, `room.secretWord` is one of the starter words.

### Implementation for User Story 3

- [X] T013 [US3] In `backend/src/services/roomStore.ts`: add `selectWord(code)` = `STARTER_WORDS[(sum of code char codes) % STARTER_WORDS.length]`; in `startGame`, set `room.secretWord = selectWord(room.code)`.

**Checkpoint**: a stable secret word exists for the round (quickstart V5).

---

## Phase 6: User Story 4 — Drawer-only word visibility (Priority: P2)

**Goal**: Word appears only in the drawer's view; absent (incl. length) from guesser views (FR-009, FR-010).

**Independent Test**: Drawer's screen/payload shows the word; guesser's screen/payload has no `word`.

### Tests for User Story 4

- [X] T014 [P] [US4] In `backend/src/services/roomStore.test.ts`: after `startGame`, assert `toRoomSnapshot(room, hostId).word === room.secretWord` and `toRoomSnapshot(room, guesserId).word === undefined` (key absent).

### Implementation for User Story 4

- [X] T015 [US4] In `backend/src/services/roomStore.ts`: in `toRoomSnapshot`, include `word: room.secretWord` ONLY when `viewerParticipantId === room.drawerId`; otherwise omit the field entirely.
- [X] T016 [US4] In `frontend/src/pages/GamePage.tsx`: if the viewer is the drawer, display `room.word`; guessers see no word (placeholder/role text only).

**Checkpoint**: full Scenario 2 works end-to-end (quickstart V4).

---

## Phase 7: Polish & Cross-Cutting

- [ ] T017 Run [quickstart.md](./quickstart.md) V1–V6 with two browsers (V7 optional curl — verify guesser payload has no `word`); record pass/fail.
- [ ] T018 [P] Confirm `npm test` passes in both `backend/` and `frontend/`.
- [ ] T019 Record any spec/implementation deviation in spec.md or plan.md (Principle VII). Note: name validation is enforced in `roomStore` (service) rather than `schemas.ts`, to return the specific `"Enter a player name."` message — confirm this reconciles with the plan during `/speckit.analyze`.

---

## Dependencies & Execution Order

### Phase order
Setup → Foundational (blocks all) → US1 → US2 → US3 → US4 → Polish.

### Story dependencies
- **US1**: needs Foundational; otherwise independent (name validation). Good MVP gate.
- **US2**: needs Foundational; extends Group 1 `startGame`.
- **US3**: needs Foundational; extends `startGame` (do after/with US2 since both edit `startGame`).
- **US4**: needs US2 (snapshot `role`/`drawerId`) **and** US3 (a `secretWord` exists) — do last.

### Within-file ordering (NOT parallel — same file)
- `backend/src/services/roomStore.ts`: **T005 → T009 → T010 → T013 → T015** (do in this order).
- `backend/src/services/roomStore.test.ts`: **T004 → T008 → T012 → T014** (serialize; or merge into grouped edits).
- `frontend/src/pages/GamePage.tsx`: **T011 → T016**.

### Parallel opportunities
- T002 [P] ∥ T003 [P] (backend model vs frontend type).
- T006 [P] ∥ T007 [P] (CreateRoomPage vs JoinRoomPage — different files).

---

## Implementation Strategy

- **MVP**: US1 (name validation) → US2 (drawer assigned & visible). Demoable: clean names + a clearly
  identified drawer on start.
- **Then** US3 (word) → US4 (drawer-only visibility) completes Scenario 2.
- One commit per task or tight group, scoped `feat(group2):`.

## Notes

- Backend tests live at the service layer (`roomStore.ts`), where name validation, drawer assignment, word
  selection, and the viewer-aware snapshot all reside — fully unit-testable without HTTP.
- Verify each new test fails before implementing the behavior it covers.
- `/speckit.analyze` runs before implementation this group — reconcile the T019 note (validation placement) there.
