---
description: "Task list for Game Start & Drawer Flow — Scenario 2"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/ ✅ | research.md ✅ | quickstart.md ✅

**Tests**: Not explicitly requested — validation via quickstart.md manual procedure.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Each task includes an exact file path

---

## Phase 1: Setup

**Purpose**: Confirm baseline builds clean before any changes.

- [ ] T001 Verify baseline — run `npm run build` in `backend/` and `frontend/`; confirm zero errors before starting

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type-level additions that all three user stories depend on. MUST be complete before user story work begins.

**⚠️ CRITICAL**: No user story implementation can start until T002–T004 pass.

- [ ] T002 Add `drawerId?: string` and `secretWord?: string` to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [ ] T003 Add `drawerId?: string` and `secretWord?: string` to `RoomSnapshot` interface in `frontend/src/services/api.ts`
- [ ] T004 Verify TypeScript builds pass in both `backend/` and `frontend/` after T002–T003 (`npm run build` in each directory)

**Checkpoint**: Both builds pass with new optional fields — user story work can begin.

---

## Phase 3: User Story 1 — Drawer Is Assigned on Game Start (Priority: P1) 🎯 MVP

**Goal**: The host is recorded as the drawer at game start. All players can see who the drawer is on the game screen.

**Independent Test**: Two tabs — Alice (host) and Bob. Alice starts the game. Both tabs navigate to the game screen. Both tabs show Alice with a "Drawer" label in the player info area.

### Implementation for User Story 1

- [ ] T005 [US1] Set `room.drawerId = room.hostId` inside `startRoom()` in `backend/src/services/roomStore.ts` and include `drawerId: room.drawerId` in the `toRoomSnapshot()` return value (depends on T002)
- [ ] T006 [P] [US1] Derive `isDrawer = room.drawerId === participantId` in `frontend/src/pages/GamePage.tsx` and add a "Drawer" label next to the participant whose `id === room.drawerId` in the player info section (depends on T003)

**Checkpoint**: `POST /rooms/:code/start` response includes `drawerId`. Both tabs show Alice's "Drawer" label on the game screen.

---

## Phase 4: User Story 2 — Secret Word Visible Only to the Drawer (Priority: P1)

**Goal**: The secret word "rocket" is shown exclusively to the drawer as a banner above the canvas. It is absent from the guesser's view and network response.

**Independent Test**: Alice sees "Your word: rocket" banner. Bob sees no word. Bob's network response for `GET /rooms/:code` has no `secretWord` field.

### Implementation for User Story 2

- [ ] T007 [US2] Set `room.secretWord = STARTER_WORDS[0]` inside `startRoom()` in `backend/src/services/roomStore.ts` (depends on T005)
- [ ] T008 [US2] Implement `viewerParticipantId` filtering in `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — include `secretWord` in the snapshot only when `viewerParticipantId === room.drawerId`; remove the `void viewerParticipantId` placeholder (depends on T007)
- [ ] T009 [US2] Add word banner in `frontend/src/pages/GamePage.tsx` — above the canvas, render `"Your word: ${room.secretWord}"` only when `isDrawer && room.secretWord` (depends on T006)

**Checkpoint**: Drawer sees "Your word: rocket" banner. Guesser's network response has no `secretWord` field. Same word appears on every game start (deterministic).

---

## Phase 5: User Story 3 — Game Screen Reflects Correct Role Per Player (Priority: P2)

**Goal**: The canvas placeholder and guess form adapt to the player's role. Drawer sees a drawing-labelled canvas and has the guess form disabled. Guesser sees a passive canvas and can type guesses.

**Independent Test**: Alice's tab — canvas labelled for drawing, guess input absent/disabled. Bob's tab — canvas says "Waiting for drawer…", guess input enabled.

### Implementation for User Story 3

- [ ] T010 [US3] Update canvas placeholder text in `frontend/src/pages/GamePage.tsx` — drawer sees "Draw here — drawing enabled in next step", guesser sees "Waiting for drawer…" (depends on T006)
- [ ] T011 [US3] Pass `disabled={isDrawer}` to `<GuessForm />` in `frontend/src/pages/GamePage.tsx` so the drawer cannot submit guesses (depends on T010)

**Checkpoint**: Role-differentiated canvas and guess form on both tabs. Drawer's guess input is disabled; guesser's is active.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks across all user stories.

- [ ] T012 [P] Run `npm run build` in `backend/` and `frontend/` to confirm zero TypeScript errors post-implementation
- [ ] T013 [P] Review all changed files against the AI self-review checklist (constitution Section 3): type safety, scope, spec alignment, polling hygiene, error handling
- [ ] T014 [P] Run full quickstart.md validation — all 5 tests with two browser tabs open simultaneously

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on US1 (T005 sets drawerId which is the filtering key for secretWord)
- **US3 (Phase 5)**: Depends on US1 (T006 derives `isDrawer` used by T010/T011)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational
- **US2 (P1)**: Depends on US1 — `drawerId` must be set before word filtering is meaningful
- **US3 (P2)**: Depends on US1 — `isDrawer` (from T006) is used by T010/T011; can overlap with US2 since they touch different concerns in the same file

### Within Each User Story

- Backend changes (T005, T007, T008) before relying on the new data in frontend
- T006 (isDrawer derivation) establishes the core condition used by T009, T010, T011
- T010 before T011 (both in GamePage.tsx, sequential)

### Parallel Opportunities

- T002 and T003 are in different codebases — parallel across backend/frontend tracks
- T005 (backend roomStore) and T006 (frontend GamePage) are in different files — parallel
- T007/T008 (backend) and T009 (frontend) are in different files — parallel across tracks
- T012, T013, T014 (polish) are independent — fully parallel

---

## Parallel Example: Phase 4 (US2)

```
Backend track:              Frontend track (after T006):
T007 set secretWord    →    T009 word banner in GamePage.tsx [P with T007/T008]
T008 filter snapshot
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T004)
3. Complete Phase 3: US1 (T005–T006)
4. **STOP and VALIDATE**: Both tabs show Alice's Drawer label on game screen
5. Continue to US2

### Incremental Delivery

1. Setup + Foundational → types ready
2. US1 → drawer identity flows through to all screens
3. US2 → secret word visible to drawer only
4. US3 → role-differentiated canvas and guess form
5. Polish → builds clean, quickstart passes

---

## Notes

- [P] tasks = different files, no blocking dependencies between them
- [USn] label maps to user story in spec.md
- Constitution Principle VI: validate each story manually before moving to the next
- T005 and T007 both modify `startRoom()` — do them sequentially to avoid merge conflicts
- `void viewerParticipantId` in roomStore.ts is the placeholder from S1 — T008 removes it
