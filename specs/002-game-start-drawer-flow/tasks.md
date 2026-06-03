---
description: "Task list for Game Start & Drawer Flow"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api.md ✅ · quickstart.md ✅

**Tests**: Included — backend unit tests added for all new behaviour.

**Organization**: Tasks are grouped by user story. Each phase produces a complete, independently testable increment.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every task description

---

## Phase 1: Setup

**Purpose**: Establish a clean TypeScript baseline before any changes are made.

- [x] T001 Verify TypeScript compiles with zero errors in both packages: run `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`; resolve any pre-existing errors before proceeding

**Checkpoint**: Zero TS errors across both packages → safe to begin Phase 2

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared `RoomSnapshot` / `Room` type definitions so that all user-story phases have valid types to work with. MUST complete before any user story implementation begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add `currentDrawerId?: string`, `currentWord?: string | null`, and `roundNumber?: number` to the `Room` interface, and `currentDrawerId?: string` and `currentWord?: string | null` to the `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T003 [P] Add `currentDrawerId?: string` and `currentWord?: string | null` to the `RoomSnapshot` interface in `frontend/src/services/api.ts`

T002 and T003 can run in parallel (different packages, different files).

**Checkpoint**: Both packages compile with zero errors with the new optional fields present

---

## Phase 3: User Story 1 — Drawer Is Assigned When a Round Begins (Priority: P1) 🎯 MVP

**Goal**: When the host starts the game, `room.currentDrawerId` is set to `room.hostId` and every participant on the game screen is labelled "Drawer" or "Guesser".

**Independent Test**: Start a game with two players. On the game screen, verify exactly one participant shows the "Drawer" label and all others show "Guesser". No word display required at this stage.

- [x] T004 [US1] Extend `startRoom()` in `backend/src/services/roomStore.ts` to set `room.currentDrawerId = room.hostId` and `room.roundNumber = 1` before calling `toRoomSnapshot` (keep `currentWord` unset for now — US2 adds it)
- [x] T005 [P] [US1] Add 3 unit tests to `backend/src/services/roomStore.test.ts`: (1) `startRoom` sets `currentDrawerId` equal to `hostId`; (2) `startRoom` sets `roundNumber` to `1`; (3) the returned snapshot includes `currentDrawerId`
- [x] T006 [P] [US1] Replace the body of `GamePage` in `frontend/src/pages/GamePage.tsx` with: a polling loop (`setInterval` 2 000 ms, `clearInterval` on unmount) that calls `roomStore.fetchRoom(room.code, participantId)` and navigates to `/` on error; a participant list that labels the participant whose `id === room.currentDrawerId` as **"Drawer"** and all others as **"Guesser"**; retain the room-code badge and Exit Game button

T005 and T006 can run in parallel (different packages, different files). Both depend on T004 (and T002/T003) being complete.

**Checkpoint**: US1 independently testable — role labels visible on game screen for all participants

---

## Phase 4: User Story 2 — Secret Word Is Visible Only to the Drawer (Priority: P1)

**Goal**: `toRoomSnapshot` includes `currentWord` only when the requesting participant is the drawer; all other callers receive `null`. The game screen renders the word to the drawer and "Waiting for the drawer…" to guessers.

**Independent Test**: Open two browser tabs (host and guest). Start the game. Host tab shows the secret word; guest tab shows "Waiting for the drawer…".

- [x] T007 [US2] Extend `startRoom()` in `backend/src/services/roomStore.ts` to set `room.currentWord = STARTER_WORDS[(room.roundNumber - 1) % STARTER_WORDS.length]` immediately after setting `roundNumber` (depends on T004)
- [x] T008 [US2] Activate the `viewerParticipantId` parameter in `toRoomSnapshot` in `backend/src/services/roomStore.ts`: include `currentWord: room.currentWord` in the snapshot when `viewerParticipantId === room.currentDrawerId`; set `currentWord: null` for all other callers; also always include `currentDrawerId` when `room.status === "playing"` (depends on T007)
- [x] T009 [US2] Add 3 unit tests to `backend/src/services/roomStore.test.ts`: (1) snapshot for drawer (`participantId === currentDrawerId`) includes `currentWord` equal to `"rocket"`; (2) snapshot for guesser (`participantId !== currentDrawerId`) has `currentWord === null`; (3) snapshot with no `participantId` has `currentWord === null` (depends on T008)
- [x] T010 [US2] Add conditional word block to `GamePage` in `frontend/src/pages/GamePage.tsx`: when `participantId === room.currentDrawerId` AND `room.currentWord` is a non-empty, non-null string, render the secret word in a clearly-labelled block; in all other cases (guesser, drawer before word is loaded, or `currentWord` null/undefined) render `"Waiting for the drawer…"` placeholder text; no word-length hints or blank tiles (depends on T006 and T008)

T009 and T010 cannot be parallelised — T009 depends on T008 being implemented; T010 depends on T006 (same file).

**Checkpoint**: US2 independently testable — API returns word only to drawer; game screen hides word from guessers

---

## Phase 5: User Story 3 — Word Is Drawn From the Pre-Defined Starter List (Priority: P2)

**Goal**: Verify that the assigned secret word is always a member of `STARTER_WORDS` and that the selection is deterministic.

**Independent Test**: Start two separate games. Confirm the word shown to the drawer in each is present in the `STARTER_WORDS` constant in `backend/src/seed/starterData.ts`.

- [x] T011 [P] [US3] Add 2 unit tests to `backend/src/services/roomStore.test.ts`: (1) `startRoom` assigns `currentWord` that is a member of `STARTER_WORDS`; (2) calling `startRoom` on identical room state always produces the same `currentWord` (determinism) (depends on T008)
- [x] T012 [P] [US3] Add 1 unit test to `frontend/src/services/api.test.ts` asserting that the `RoomSnapshot` type includes `currentDrawerId` and `currentWord` fields (type-level check via TypeScript compilation of the test file)

T011 and T012 can run in parallel (different packages, different files).

**Checkpoint**: US3 independently verifiable via test output — word is always from the list and always deterministic

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm TypeScript integrity across both packages and remove any dead code.

- [x] T013 Run `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`; resolve all type errors; remove the `void viewerParticipantId` no-op line from `toRoomSnapshot` if it remains after T008

---

## Dependencies

```
T001
 └── T002 [P] ─┐
 └── T003 [P] ─┤
               └── T004 [US1]
                    ├── T005 [P] [US1]
                    ├── T006 [P] [US1]
                    └── T007 [US2]
                         └── T008 [US2]
                              ├── T009 [US2]
                              ├── T010 [US2] (also depends on T006)
                              └── T011 [P] [US3]
                                   └── (T012 [P] [US3] independent)
                                        └── T013
```

## Parallel Execution Examples

**Phase 2** (after T001):

```
Worker A: T002 — backend/src/models/game.ts
Worker B: T003 — frontend/src/services/api.ts
```

**Phase 3** (after T004):

```
Worker A: T005 — backend/src/services/roomStore.test.ts
Worker B: T006 — frontend/src/pages/GamePage.tsx
```

**Phase 5** (after T008):

```
Worker A: T011 — backend/src/services/roomStore.test.ts
Worker B: T012 — frontend/src/services/api.test.ts
```

## Implementation Strategy

**MVP (deliver first)**: Phase 1 + Phase 2 + Phase 3 (T001–T006)

- Provides a fully working game screen with role labels (Drawer/Guesser)
- Unblocks end-to-end manual verification of the two-tab flow
- No secret word yet — `currentWord` is `undefined` at this stage (acceptable interim state)

**Full delivery**: Complete all 13 tasks through Phase 6

- Adds word secrecy (US2) and word-list verification (US3)
- All acceptance scenarios from spec.md are met
- Zero TypeScript errors, all tests green
