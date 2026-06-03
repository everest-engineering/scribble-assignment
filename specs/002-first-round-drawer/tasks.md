---
description: "Task list for First Round — Drawer Assignment and Secret Word"
---

# Tasks: First Round — Drawer Assignment and Secret Word

**Input**: Design documents from `specs/002-first-round-drawer/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/api.md ✅ | research.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US2)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Confirm the project runs cleanly before making changes.

- [x] T001 Start backend (`cd backend && npm run dev`) and confirm `GET /health` returns `{ "ok": true }`
- [x] T002 Start frontend (`cd frontend && npm run dev`) and confirm the app loads at `http://localhost:5173`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend model and service changes that BOTH user stories depend on.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Add `drawerId: string | null` and `currentWord: string | null` to both `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [x] T004 In `createRoom`, initialize `drawerId: null` and `currentWord: null` on the new Room; in `toRoomSnapshot(room, viewerParticipantId?)`, include `drawerId: room.drawerId` and `currentWord: viewerParticipantId === room.drawerId ? room.currentWord : null` in `backend/src/services/roomStore.ts`
- [x] T005 In the `startRoom` handler, after setting `room.status = "active"`, set `room.drawerId = room.hostId` and `room.currentWord = STARTER_WORDS[0]` (import `STARTER_WORDS` from `"../seed/starterData.js"`) in `backend/src/api/rooms.ts`
- [x] T006 [P] Add `drawerId: string | null` and `currentWord: string | null` to the `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Run `npm run build` in `backend/` — TypeScript must compile with zero errors before proceeding. Verify `POST /rooms/:code/start` response includes `"drawerId"` equal to `hostId` and `"currentWord": "rocket"`.

---

## Phase 3: User Story 1 — Drawer Is Identified on the Game Screen (Priority: P1) 🎯 MVP

**Goal**: All players on the game screen can see who the drawer is. The host is labelled as the drawer; all other players are labelled as guessers.

**Independent Test**: With 2 players in a started game, both tabs navigate to the game screen. Tab A (host/drawer) shows a label identifying Alice as drawing and their own role as "drawing". Tab B (guesser) sees the same drawer label for Alice and their own role as "guessing". No word visibility check needed for this story alone.

### Implementation for User Story 1

- [x] T007 [US1] Add session restore to `frontend/src/pages/GamePage.tsx`: add `useRef(false)` guard `sessionRestoreAttempted`; in a `useEffect` with `[room, navigate, roomStore]` dependency, if `room` is null — attempt `roomStore.restoreSession()` once; if restore fails or the restored `room.status !== "active"`, `navigate("/", { replace: true })`
- [x] T008 [US1] Derive `isDrawer = participantId !== null && room.drawerId === participantId` and find the drawer participant with `room.participants.find(p => p.id === room.drawerId)`; display the drawer's name clearly to all participants (e.g., in the Player Info card: "Alice is drawing"); display the viewer's own role label ("You are drawing" if `isDrawer`, "You are guessing" otherwise) in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Both tabs show drawer identity immediately on game screen load. Tab A shows own role as drawer. Tab B shows own role as guesser. Refreshing Tab A restores the game screen correctly.

---

## Phase 4: User Story 2 — Secret Word Visible Exclusively to the Drawer (Priority: P1)

**Goal**: The drawer's game screen displays the secret word in full. All other players see only a non-revealing indicator that a word has been chosen.

**Independent Test**: With 2 players in a started game — Tab A (drawer) shows the text "rocket" on screen; Tab B (guesser) shows a placeholder such as "A word has been chosen" with no word text. In DevTools → Network, the API response for Tab B shows `"currentWord": null`.

### Implementation for User Story 2

- [x] T009 [US2] In `frontend/src/pages/GamePage.tsx`, display `room.currentWord` prominently when `isDrawer` (e.g., "Your word: **rocket**"); display a non-revealing placeholder when `!isDrawer` (e.g., "A word has been chosen — start guessing!"); the placeholder must not reveal the word text

**Checkpoint**: Drawer sees "rocket" on Tab A. Guesser sees only the placeholder on Tab B. DevTools confirms `currentWord: null` in the guesser's API response. Refreshing Tab B restores the guesser view with the word still hidden.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build validation and end-to-end acceptance check.

- [x] T010 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors
- [x] T011 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors
- [x] T012 Complete the full validation flow in `specs/002-first-round-drawer/quickstart.md` using two browser tabs and confirm all 9 checks in the validation table pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks both user stories**
- **US1 (Phase 3)** and **US2 (Phase 4)**: Both depend on Foundational; US2 depends on US1 (both are in GamePage.tsx, US2 builds on `isDrawer` derived in US1)
- **Polish (Phase 5)**: Depends on both user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2
- **US2 (P1)**: Depends on US1 (reuses `isDrawer` from T008); implement T009 after T008 in the same file

### Within Each User Story

- Backend foundational changes (T003–T005) before frontend type changes (T006)
- Backend changes before GamePage changes (T007–T009)
- Session restore (T007) before drawer display (T008) — room must be loaded first
- Drawer display (T008) before word display (T009) — `isDrawer` derived in T008 is used in T009

### Parallel Opportunities

- T006 (frontend types) can run in parallel with T003–T005 (backend changes — different directories)
- T010 and T011 in Polish can run in parallel

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — CRITICAL
3. Complete Phase 3: US1 (Drawer Identity)
4. **STOP and VALIDATE**: Both tabs show drawer label correctly
5. Proceed to US2

### Incremental Delivery

1. Setup + Foundational → backend ready, both new fields in API
2. US1 → drawer identity visible on game screen ✅
3. US2 → secret word private to drawer ✅
4. Polish → builds clean, quickstart passes ✅

---

## Notes

- `[P]` tasks touch different files and have no incomplete-task dependencies — safe to run in parallel
- `[US?]` label maps each task to its user story for traceability back to spec.md
- T004 note: the `toRoomSnapshot` function already accepts `viewerParticipantId?` — extend it, do not rewrite
- T005 note: `STARTER_WORDS` is already imported in `roomStore.ts`; use the same import path `"../seed/starterData.js"` in `rooms.ts`
- T009 note: `isDrawer` must be derived before rendering — ensure T008 changes are in place first
