# Tasks: Result, Restart & Final Validation (US4)

## Phase 1: Backend

- [X] T001 Add `endGame` service — host guard (403); set `status="result"` in `backend/src/services/roomStore.ts`
- [X] T002 Add `restartGame` service — host guard (403); set `status="lobby"`; clear `drawer`, `secretWord`, `canvasData`, `guesses=[]`, `scores={}`; keep `participants` + `hostId` in `backend/src/services/roomStore.ts`
- [X] T003 Add `gameActionSchema` — `z.object({ participantId: z.string().min(1) })` in `backend/src/api/schemas.ts`
- [X] T004 Add `POST /:code/end` route in `backend/src/api/rooms.ts`
- [X] T005 Add `POST /:code/restart` route in `backend/src/api/rooms.ts`
- [X] T006 Add backend tests (4 cases) in `backend/src/services/roomStore.test.ts`
- [X] T007 Run `cd backend && npm test` — expect green

## Phase 2: Frontend

- [X] T008 Add `api.endGame` and `api.restartGame` in `frontend/src/services/api.ts`
- [X] T009 Add `roomStore.endGame` and `roomStore.restartGame` actions in `frontend/src/state/roomStore.ts`
- [X] T010 Add frontend unit tests for both API methods in `frontend/src/services/api.test.ts`
- [X] T011 Update `ResultPanel` — show when `status === "result"`: secret word, scores, guess history with correct/incorrect indicators in `frontend/src/components/ResultPanel.tsx`
- [X] T012 Add host controls to `GamePage` — "End Round" when `isHost && status === "playing"`; "Play Again" when `isHost && status === "result"` in `frontend/src/pages/GamePage.tsx`
- [X] T013 Add `GamePage` auto-navigate — `useEffect` watching `status === "lobby"` → `navigate("/lobby")` in `frontend/src/pages/GamePage.tsx`
- [X] T014 Run `cd frontend && npm test` — expect green

## Validation

- [X] T015 Manual full round-trip: End → result shows word+scores+history; Play Again → lobby with same players; second round starts clean
