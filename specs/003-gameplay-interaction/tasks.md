---
description: "Task list for Feature Group 3 — Gameplay Interaction"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

---

## Phase 1: Type Extensions

- [ ] T001 Add `Guess` interface to `backend/src/models/game.ts` — fields: participantId, text, correct, submittedAt
- [ ] T002 Add `guesses: Guess[]` and `scores: Record<string, number>` to `Room` in `backend/src/models/game.ts`
- [ ] T003 Add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot` in `backend/src/models/game.ts`
- [ ] T004 Add `Guess` interface and extend `RoomSnapshot` with `guesses` + `scores` in `frontend/src/services/api.ts`

**Checkpoint**: Both builds compile clean.

---

## Phase 2: Backend Logic

- [ ] T005 Update `startGame()` in `backend/src/services/roomStore.ts` — initialise `room.guesses = []` and `room.scores` as `Record<participantId, 0>` for all participants
- [ ] T006 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — include `guesses` and `scores` in returned snapshot
- [ ] T007 Add `guessSchema` to `backend/src/api/schemas.ts` — `z.object({ participantId: z.string().min(1), text: z.string() })`
- [ ] T008 Add `submitGuess()` to `backend/src/services/roomStore.ts` — trim text, throw 400 if empty, compare case-insensitively to `secretWord`, push to `guesses[]`, update `scores`
- [ ] T009 Add `POST /:code/guess` route to `backend/src/api/rooms.ts` — parse `guessSchema`, call `submitGuess()`, return updated snapshot
- [ ] T010 Extend `backend/src/services/roomStore.test.ts` — add: guess stored with correct fields; correct guess adds 100; incorrect adds 0; empty text throws 400

**Checkpoint**: All backend tests pass.

---

## Phase 3: Frontend Services

- [ ] T011 Add `submitGuess()` to `frontend/src/services/api.ts` — POST /rooms/:code/guess with { participantId, text }
- [ ] T012 Add `submitGuess()` action to `frontend/src/state/roomStore.ts` — calls api.submitGuess, setRoomSnapshot on success

---

## Phase 4: Frontend Components

- [ ] T013 Create `frontend/src/components/DrawingCanvas.tsx` — interactive HTML5 canvas with mousedown/mousemove/mouseup handlers for freehand drawing; Clear button calls ctx.clearRect
- [ ] T014 Update `frontend/src/components/GuessForm.tsx` — accept `onSubmit` prop; trim + empty check ("Guess cannot be empty"); call prop on valid submit; clear input after submission
- [ ] T015 Update `frontend/src/components/Scoreboard.tsx` — accept `scores: Record<string, number>` and `participants` props; render each participant name + score
- [ ] T016 Update `frontend/src/components/ResultPanel.tsx` — accept `guesses: Guess[]` and `participants` props; render each guess with guesser name, text, correct/incorrect badge

---

## Phase 5: GamePage Wiring

- [ ] T017 Add polling to `frontend/src/pages/GamePage.tsx` — `useEffect` with `setInterval(fetchRoom, 2000)`; `clearInterval` on cleanup
- [ ] T018 Wire `DrawingCanvas` into `frontend/src/pages/GamePage.tsx` — render only when `isDrawer`; replace canvas placeholder
- [ ] T019 Wire `GuessForm` in `frontend/src/pages/GamePage.tsx` — pass `onSubmit` that calls `roomStore.submitGuess(text)`; only shown to guessers (already gated from Group 2)
- [ ] T020 Wire `Scoreboard` and `ResultPanel` (guess history) in `frontend/src/pages/GamePage.tsx` — pass `room.scores`, `room.guesses`, `room.participants`

---

## Phase 6: Build Validation

- [ ] T021 [P] Run `npm run build` in `backend/` — zero TypeScript errors
- [ ] T022 [P] Run `npm run build` in `frontend/` — zero TypeScript errors

---

## Dependencies

- Phase 1 first (types needed everywhere)
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 1 + 2
- Phase 4 depends on Phase 1 (types for props)
- Phase 5 depends on Phase 3 + 4
- Phase 6 after all phases
