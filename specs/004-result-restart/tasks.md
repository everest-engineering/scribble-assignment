---
description: "Task list for Feature Group 4 — Result, Restart & Final Validation"
---

# Tasks: Result, Restart & Final Validation

---

## Phase 1: Backend

- [ ] T001 Add `endGame()` to `backend/src/services/roomStore.ts` — validate host (403) + playing status (400); set status="result"; return cloned room
- [ ] T002 Add `restartGame()` to `backend/src/services/roomStore.ts` — validate host (403) + result status (400); reset status="lobby", guesses=[], scores={}, drawerId=undefined, secretWord=undefined; participants unchanged
- [ ] T003 Add `POST /:code/end` route to `backend/src/api/rooms.ts` — parse startRoomSchema (participantId), call endGame(), return snapshot
- [ ] T004 Add `POST /:code/restart` route to `backend/src/api/rooms.ts` — parse startRoomSchema, call restartGame(), return snapshot
- [ ] T005 Extend `backend/src/services/roomStore.test.ts` — endGame sets status "result"; endGame 403 for non-host; endGame 400 for non-playing; restartGame clears round state; restartGame preserves participants; restartGame 403 for non-host

**Checkpoint**: All backend tests pass.

---

## Phase 2: Frontend Services

- [ ] T006 [P] Add `endRoom()` to `frontend/src/services/api.ts` — POST /rooms/:code/end with { participantId }
- [ ] T007 [P] Add `restartRoom()` to `frontend/src/services/api.ts` — POST /rooms/:code/restart with { participantId }
- [ ] T008 Add `endRoom()` and `restartRoom()` actions to `frontend/src/state/roomStore.ts`

---

## Phase 3: Result Page & Routing

- [ ] T009 Create `frontend/src/pages/ResultPage.tsx` — show correct word (room.secretWord from snapshot — visible to all in result state), scoreboard, full guess history; host-only Restart button; poll every 2s; auto-navigate to /lobby on status="lobby"
- [ ] T010 Add `/result` route to `frontend/src/routes/index.tsx`

---

## Phase 4: Game Screen Updates

- [ ] T011 Update `GamePage.tsx` polling — auto-navigate to `/result` when `room.status === "result"`
- [ ] T012 Add End Round button to `frontend/src/pages/GamePage.tsx` — host-only; calls `roomStore.endRoom()`; navigates to `/result` on success

---

## Phase 5: Result Screen Secret Word Visibility

- [ ] T013 Update `backend/src/services/roomStore.ts` `toRoomSnapshot()` — when status is "result", include `secretWord` for ALL viewers (round is over, word is revealed)

---

## Phase 6: Build Validation

- [ ] T014 [P] Run `npm run build` in `backend/` — zero TypeScript errors
- [ ] T015 [P] Run `npm run build` in `frontend/` — zero TypeScript errors

---

## Dependencies

- Phase 1 first (backend must exist before frontend calls it)
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 2
- Phase 4 depends on Phase 2
- Phase 5 is a standalone backend tweak, can run with Phase 1
- Phase 6 last
