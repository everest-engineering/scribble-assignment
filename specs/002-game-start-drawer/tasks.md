---
description: "Task list for Game Start & Drawer Flow"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US3)

---

## Phase 1: Foundational

**Purpose**: Extend the Room model and snapshot logic — all user stories depend on this.

- [x] T001 Add `drawerId: string | null` and `secretWord: string | null` to `Room` interface in `backend/src/models/game.ts`
- [x] T002 Add `drawerId: string | null` and `secretWord: string | null` to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T003 [P] Update `RoomSnapshot` type in `frontend/src/services/api.ts` to add `drawerId: string | null` and `secretWord: string | null`
- [x] T004 Initialize `drawerId: null` and `secretWord: null` in `createRoom()` in `backend/src/services/roomStore.ts`
- [x] T005 Set `drawerId = room.hostId` and `secretWord = STARTER_WORDS[0]` in the `startGame()` function in `backend/src/services/roomStore.ts`
- [x] T006 Activate viewer-specific logic in `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — include `drawerId` always; include `secretWord` only when `viewerParticipantId === room.drawerId`, otherwise `null`
- [x] T007 [P] Add unit tests for drawer assignment, word selection, and viewer-specific snapshot in `backend/src/services/roomStore.test.ts`

**Checkpoint**: `npm test` in backend passes. `POST /api/rooms/:code/start` returns `drawerId` and `secretWord`. `GET /api/rooms/:code?participantId=<drawerId>` returns secret word; same request with a guesser's id returns `secretWord: null`.

---

## Phase 2: User Story 1 — Host Starts the Game (Priority: P1)

**Goal**: Game start assigns drawer role and secret word; all players reach the game screen.

**Independent Test**: Host creates room, guest joins, host starts. Verify `drawerId === hostId` and `secretWord === "rocket"` in the API response.

- [x] T008 [US1] Confirm `startGame()` in `backend/src/services/roomStore.ts` is already called by the existing `POST /:code/start` handler — no route change needed; verify the handler passes return value through correctly in `backend/src/api/rooms.ts`

**Checkpoint**: Start API response includes `drawerId: <hostUUID>` and `secretWord: "rocket"`.

---

## Phase 3: User Story 2 — Deterministic Word Selection (Priority: P1)

**Goal**: First word is always `STARTER_WORDS[0]` ("rocket") — no randomness.

**Independent Test**: Start two independent games; both receive `secretWord: "rocket"` in the drawer's snapshot.

- [x] T009 [US2] [P] Verify `STARTER_WORDS` import is used (not a local copy) in `backend/src/services/roomStore.ts` — confirm `startGame` sets `secretWord = listWords()[0]` (using the existing `listWords()` helper) so the source of truth is single

**Checkpoint**: `listWords()[0]` always returns `"rocket"`. Two separate game starts produce the same word.

---

## Phase 4: User Story 3 — Role Identity on Game Screen (Priority: P2)

**Goal**: Game screen shows role badge (Drawer / Guesser) and secret word to the drawer only.

**Independent Test**: Two browser tabs — drawer sees "Drawer" badge + "rocket"; guesser sees "Guesser" badge + no word shown.

- [x] T010 [US3] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` — derive `isDrawer = participantId === room.drawerId` from room state
- [x] T011 [US3] Display role badge in `frontend/src/pages/GamePage.tsx` — show "Drawer" if `isDrawer`, "Guesser" otherwise, in the Player Info card
- [x] T012 [US3] Show secret word prominently to the drawer in `frontend/src/pages/GamePage.tsx` — display `room.secretWord` when `isDrawer && room.secretWord`; show nothing (no label, no hint) to guessers
- [x] T013 [US3] Mark the drawer in the scoreboard/participant area in `frontend/src/pages/GamePage.tsx` — add a "Drawing" label next to the participant whose `id === room.drawerId`
- [x] T014 [US3] [P] Update `GamePage.tsx` to start polling every 2s on mount (same pattern as LobbyPage) in `frontend/src/pages/GamePage.tsx` — call `roomStore.startPolling(2000)` on mount, `stopPolling()` on unmount so role/state stays fresh

**Checkpoint**: Drawer tab shows "Drawer" + "rocket"; guesser tab shows "Guesser" with no word. "Drawing" label visible on both tabs next to the drawer's name.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T015 [P] Run `npm test` in both `backend/` and `frontend/` — confirm all tests pass
- [x] T016 [P] Verify role badges use text (not colour-only) for WCAG 2.1 AA compliance in `frontend/src/pages/GamePage.tsx`
- [x] T017 Run quickstart Scenario A and B from `specs/002-game-start-drawer/quickstart.md` manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: Start immediately — blocks all user stories
- **US1 (Phase 2)**: Depends on Phase 1 (T001–T007)
- **US2 (Phase 3)**: Depends on Phase 1 — can run in parallel with US1 (different concern)
- **US3 (Phase 4)**: Depends on Phase 1; best started after US1 + US2 are confirmed working
- **Polish (Phase 5)**: Depends on all user stories complete

### Parallel Opportunities

- T001+T002 (backend model), T003 (frontend type), T007 (tests) — all different files
- T009 (word source verification) — read-only, safe to run alongside T008
- T010–T014 (all within GamePage) — sequential within GamePage but independent from backend
- T015 and T016 — different concerns, parallelizable

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1: Foundational model changes
2. Complete Phase 2: Confirm start API wires through correctly
3. Complete Phase 3: Confirm word is always "rocket"
4. **Stop and validate**: API returns correct drawer + word

### Incremental Delivery

1. Foundation → verified API
2. Add Phase 4 (game screen UI) → roles visible to players

---

## Notes

- T008 is a verification task — the `POST /:code/start` route exists; this task confirms it already passes `drawerId` and `secretWord` through after Phase 1 changes
- T009 uses `listWords()[0]` (the existing helper) rather than importing `STARTER_WORDS` directly, keeping the word list managed in one place
- Polling on GamePage (T014) ensures the drawer's secret word and role state update if the room is fetched fresh — important for when the game page loads via polling-based navigation
