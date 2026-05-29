---
description: "Task list for Feature Group 2 — Game Start & Drawer Flow"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md ✅ spec.md ✅

---

## Phase 1: Type Extensions

- [ ] T001 Add `drawerId?: string` and `secretWord?: string` to `Room` interface in `backend/src/models/game.ts`
- [ ] T002 Add `drawerId: string` and `secretWord?: string` to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T003 Add `drawerId: string` and `secretWord?: string` to `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: TypeScript builds clean in both backend and frontend.

---

## Phase 2: Backend Logic

- [ ] T004 Update `startGame()` in `backend/src/services/roomStore.ts` — set `room.drawerId = room.hostId` and `room.secretWord = STARTER_WORDS[0]` before saving
- [ ] T005 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — accept `viewerParticipantId?: string`; include `secretWord` only when `viewerParticipantId === room.drawerId`
- [ ] T006 Update all `toRoomSnapshot()` call sites in `backend/src/api/rooms.ts` — pass `participantId` from request body/query to each call
- [ ] T007 Extend `backend/src/services/roomStore.test.ts` — add: `startGame` sets `drawerId === hostId`; `startGame` sets `secretWord === "rocket"`; `toRoomSnapshot` includes `secretWord` for drawer; `toRoomSnapshot` omits `secretWord` for guesser

**Checkpoint**: All backend tests pass.

---

## Phase 3: Frontend Game Screen

- [ ] T008 [US1] Update `frontend/src/pages/GamePage.tsx` — derive `isDrawer = participantId === room.drawerId`; update Player Info card to show role as "Drawer" or "Guesser"
- [ ] T009 [US3] Update `frontend/src/pages/GamePage.tsx` — add secret word display for drawer: show `room.secretWord` when `isDrawer && room.secretWord`; show nothing for guessers

**Checkpoint**: Drawer sees "rocket" and role "Drawer"; guesser sees role "Guesser" and no word.

---

## Phase 4: Build Validation

- [ ] T010 [P] Run `npm run build` in `backend/` — zero TypeScript errors
- [ ] T011 [P] Run `npm run build` in `frontend/` — zero TypeScript errors

---

## Dependencies

- Phase 1 first (types needed by backend + frontend)
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 1 (frontend types)
- T010/T011 run in parallel after all phases complete
