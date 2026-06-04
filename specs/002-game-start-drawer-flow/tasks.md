# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/rooms-api.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Paths use `backend/src/` and `frontend/src/` conventions

---

## Phase 1: Foundational — Backend Model & Store

**Purpose**: Extend `Room` and `RoomSnapshot` with `drawerId` and `currentWord`. All user
stories depend on this data being present.

**⚠️ CRITICAL**: All phases depend on this phase being complete first.

- [ ] T001 Add `drawerId: string | null` field to `Room` interface in `backend/src/models/game.ts`
- [ ] T002 Add `currentWord: string | null` field to `Room` interface in `backend/src/models/game.ts`
- [ ] T003 Add `drawerId: string | null` field to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T004 Add `currentWord: string | null` field to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T005 Initialise `drawerId: null` and `currentWord: null` in `createRoom()` in `backend/src/services/roomStore.ts`
- [ ] T006 Add `selectWord(code: string): string` helper to `backend/src/services/roomStore.ts`: `STARTER_WORDS[Array.from(code).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % STARTER_WORDS.length]` — `STARTER_WORDS` is already imported
- [ ] T007 Replace `void viewerParticipantId` in `toRoomSnapshot()` in `backend/src/services/roomStore.ts` with viewer-gated `currentWord` (actual word when `viewerParticipantId === room.drawerId && viewerParticipantId !== undefined`, else `null`) and always-forwarded `drawerId: room.drawerId`

---

## Phase 2: US1 — Drawer Assignment on Game Start

**Story goal**: When the host starts the game, `drawerId` and `currentWord` are set atomically;
the start-game response exposes the actual word to the drawer and `null` to all others.

**Independent Test**: Call `POST /rooms/:code/start` as the host; confirm the response has
`drawerId === hostId` and `currentWord` is one of the 5 starter words. Then call
`GET /rooms/:code?participantId=<joinerId>`; confirm `currentWord` is `null`. Call again with
the same code + no `participantId`; confirm `currentWord` is `null`.

- [ ] T008 [US1] Extend `POST /:code/start` handler in `backend/src/api/rooms.ts` to set `room.drawerId = room.hostId` and `room.currentWord = selectWord(room.code)` before the `saveRoom()` call — import `selectWord` from `roomStore.js`
- [ ] T009 [P] [US1] Add `drawerId: string | null` and `currentWord: string | null` to `RoomSnapshot` interface in `frontend/src/services/api.ts` so TypeScript validates usage throughout `GamePage`

---

## Phase 3: US2 — Drawer Sees the Secret Word

**Story goal**: On the game screen the drawer sees the actual secret word; all non-drawer
participants see "Guess the word!". The word is never transmitted over the wire to non-drawers.

**Independent Test**: Start a game (2 tabs). In the drawer tab, confirm the word panel shows
the actual word. In the non-drawer tab, confirm the word panel shows "Guess the word!". Inspect
network traffic on the non-drawer tab — confirm `currentWord: null` in all GET responses.

- [ ] T010 [US2] In `frontend/src/pages/GamePage.tsx`, add redirect guard: if `!room`, call `navigate("/", { replace: true })` (already partially exists — verify it uses `replace: true` per FR-010)
- [ ] T011 [US2] In `frontend/src/pages/GamePage.tsx`, add loading guard: if `room.drawerId === null`, render `<p>Loading game...</p>` and return early (FR-011)
- [ ] T012 [US2] In `frontend/src/pages/GamePage.tsx`, add word reveal panel: replace the hardcoded `"Guess the Word!"` h1 title with a computed display — when `room.currentWord !== null` render the actual word (drawer view); otherwise render `"Guess the word!"` (non-drawer view) per FR-005

---

## Phase 4: US3 — Drawer Identity Visible to All Players

**Story goal**: All players see who the current drawer is by name. The drawer is labelled
"You are the drawer"; all others see "Drawing: [name]".

**Independent Test**: Open two tabs on the game screen. Confirm both tabs show the same drawer
name. Confirm the drawer tab shows "You are the drawer" and the non-drawer tab shows
"Drawing: [name]".

- [ ] T013 [US3] In `frontend/src/pages/GamePage.tsx`, compute `drawerName`: resolve `room.participants.find(p => p.id === room.drawerId)?.name ?? "Unknown drawer"` (FR-012)
- [ ] T014 [US3] In `frontend/src/pages/GamePage.tsx`, compute `isDrawer = room.drawerId === participantId`
- [ ] T015 [US3] In `frontend/src/pages/GamePage.tsx`, add drawer identity card (inside an existing or new `<Card>` area): when `isDrawer` show label `"You are the drawer"` (FR-007); when not `isDrawer` show `"Drawing: [drawerName]"` (FR-006)

---

## Phase 5: US4 — Game Screen Polls for Consistent State

**Story goal**: `GamePage` polls every ~2s on mount, stops on unmount, and shows inline poll
errors below the drawer/word panel without stopping the interval.

**Independent Test**: Open two tabs on the game screen. Confirm both update within ~2s without
manual action. Navigate away from one tab; confirm no further network requests for that tab.
Simulate a network failure (DevTools offline); confirm the inline error message appears and
polling resumes when connectivity is restored.

- [ ] T016 [US4] In `frontend/src/pages/GamePage.tsx`, import `useRoomStore` alongside the existing `useRoomState` import from `../state/roomStore`
- [ ] T017 [US4] In `frontend/src/pages/GamePage.tsx`, add polling `useEffect`: call `roomStore.startPolling(2000)` on mount; return cleanup calling `roomStore.stopPolling()`; key the effect on `room?.code` so it restarts if the room changes (FR-008)
- [ ] T018 [US4] In `frontend/src/pages/GamePage.tsx`, destructure `pollError` from `useRoomState()` and render it inline below the drawer/word panel when non-null, using the same visual pattern as `LobbyPage` Status card (FR-013); polling MUST continue on error (already guaranteed by `RoomStore.startPolling` implementation)

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Type safety verification, build validation, and manual acceptance test.

- [ ] T019 [P] Verify no `any` types introduced across all modified files: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`, `frontend/src/services/api.ts`, `frontend/src/pages/GamePage.tsx`
- [ ] T020 [P] Verify `room.drawerId` and `room.currentWord` are never mutated after `POST /:code/start` completes — confirm `joinRoom()`, `saveRoom()`, `toRoomSnapshot()` do not overwrite these fields
- [ ] T021 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors
- [ ] T022 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors
- [ ] T023 Manual two-tab acceptance test per plan.md Testing Strategy: create room (Tab A), join (Tab B), host clicks Start Game, verify Tab A shows actual word + "You are the drawer", verify Tab B shows "Guess the word!" + "Drawing: [name]", inspect Tab B network to confirm `currentWord: null`, navigate away from both tabs and confirm no further requests

---

## Dependencies

```
T001 → T002 → T003 → T004   (model chain — sequential)
T005 → T006 → T007           (store mutations — depend on T001–T004)
T008                         (API handler — depends on T006, T007)
T009                         (frontend type — depends on T003–T004; parallel with T008)
T010 → T011 → T012           (GamePage word reveal — depends on T009)
T013 → T014 → T015           (GamePage drawer identity — depends on T012)
T016 → T017 → T018           (GamePage polling — depends on T013–T015)
T019–T022                    (polish — depends on T018; parallel with each other)
T023                         (manual test — depends on T022)
```

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 complete
- **Phase 3 (US2)**: Depends on Phase 2 complete
- **Phase 4 (US3)**: Depends on Phase 3 complete
- **Phase 5 (US4)**: Depends on Phase 4 complete
- **Phase 6 (Polish)**: Depends on Phase 5 complete

### Parallel Opportunities

- T001–T007: sequential within Phase 1 (same file chain)
- T008 and T009: parallel (different files — `rooms.ts` vs `api.ts`)
- T010, T011, T012: sequential within `GamePage.tsx` (same file)
- T013, T014: parallel within same file after T012
- T019, T020, T021, T022: all parallel (read-only verification + separate build commands)

---

## Implementation Strategy

### MVP (US1 + US2 only — Phase 1–3)

1. Complete Phase 1 (T001–T007) — backend model + store
2. Complete Phase 2 (T008–T009) — start handler + frontend types
3. Complete Phase 3 (T010–T012) — word reveal panel
4. **Validate**: drawer tab shows word; non-drawer tab shows "Guess the word!"; wire inspection confirms `currentWord: null`

### Full delivery (all phases)

5. Complete Phase 4 (T013–T015) — drawer identity display
6. Complete Phase 5 (T016–T018) — polling
7. Complete Phase 6 (T019–T023) — polish + builds + manual test
