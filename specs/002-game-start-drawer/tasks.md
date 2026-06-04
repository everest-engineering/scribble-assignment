# Tasks: Game Start & Drawer Flow (US2)

## Phase 1: Backend

- [X] T001 Add `startGame` service — host guard (403), player count guard (400), set `status="playing"`, `drawer=participants[0].id`, `secretWord=STARTER_WORDS[n%5]`, init scores in `backend/src/services/roomStore.ts`
- [X] T002 Activate secretWord visibility in `toRoomSnapshot` — `drawer === viewerParticipantId || status === "result"` in `backend/src/services/roomStore.ts`
- [X] T003 Add `startGameSchema` — `z.object({ participantId: z.string().min(1) })` in `backend/src/api/schemas.ts`
- [X] T004 Add `POST /:code/start` route in `backend/src/api/rooms.ts`
- [X] T005 Add backend tests for `startGame` (5 cases) in `backend/src/services/roomStore.test.ts`
- [X] T006 Run `cd backend && npm test` — expect green

## Phase 2: Frontend

- [X] T007 Add `api.startGame` method in `frontend/src/services/api.ts`
- [X] T008 Add `roomStore.startGame` action in `frontend/src/state/roomStore.ts`
- [X] T009 Add `api.startGame` frontend test in `frontend/src/services/api.test.ts`
- [X] T010 Wire `handleStart` in `LobbyPage.tsx`; add `useEffect` for `status === "playing"` → navigate
- [X] T011 Add `isDrawer` in `GamePage.tsx`; show role label; show `secretWord` when drawer
- [X] T012 Run `cd frontend && npm test` — expect green

## Validation

- [X] T013 Manual: Start triggers navigation for both tabs; drawer sees word; guesser does not
