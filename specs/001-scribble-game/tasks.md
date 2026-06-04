# Tasks: Scribble Drawing Game

**Input**: `specs/001-scribble-game/` — plan.md, spec.md, data-model.md, contracts/api.md, research.md

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Format**: `- [ ] [TaskID] [P?] [Story?] Description — file path`
- `[P]` = parallelizable (independent files, no open dependencies)
- `[US1]`–`[US4]` = user story from spec.md

---

## Phase 1: Setup

> Fix the critical API URL bug and establish a green baseline before any feature work.

- [X] T001 Verify starter is runnable — `cd backend && npm install && npm run dev` + `cd frontend && npm install && npm run dev`; confirm `GET /health` returns `{ "ok": true }` and start screen loads at `http://localhost:5173`
- [X] T002 Establish green test baseline — `cd backend && npm test` (expect 2 pass) then `cd frontend && npm test` (expect 2 pass); document counts
- [X] T003 Fix API base URL — change `http://localhost:3001/bug` → `http://localhost:3001` in `frontend/src/services/api.ts:22`; rerun frontend tests; confirm still 2 pass
- [X] T004 Commit bug fix — `git add frontend/src/services/api.ts && git commit -m "fix: remove /bug suffix from API base URL"`

---

## Phase 2: Foundational

> Backend model expansion and schema tightening. All user stories depend on these.

- [X] T005 Expand `RoomStatus` union — change `"lobby"` literal to `"lobby" | "playing" | "result"` in `backend/src/models/game.ts`
- [X] T006 Add `Guess` type to backend models — add `id, participantId, playerName, text, correct, timestamp` fields in `backend/src/models/game.ts`
- [X] T007 Add game fields to `Room` interface — add `hostId, drawer?, secretWord?, canvasData?, guesses: Guess[], scores: Record<string, number>` in `backend/src/models/game.ts`
- [X] T008 Add game fields to `RoomSnapshot` interface — mirror `hostId, drawer?, secretWord?, canvasData?, guesses, scores` in `backend/src/models/game.ts`
- [X] T009 Tighten Zod schemas — change `playerName: z.string().optional()` → `z.string().trim().min(1, "Name cannot be empty")` in both `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts`
- [X] T010 [P] Expand frontend `RoomSnapshot` type — add `status: "lobby" | "playing" | "result"`, `hostId`, `drawer?`, `secretWord?`, `canvasData?`, `guesses: Guess[]`, `scores: Record<string, number>` and add `Guess` interface in `frontend/src/services/api.ts`
- [X] T011 Commit foundational model changes — `git add backend/src/models/game.ts backend/src/api/schemas.ts frontend/src/services/api.ts && git commit -m "feat: expand Room model with game state fields and tighten schemas"`

---

## Phase 3: User Story 1 — Room Setup & Lobby (P1)

**Story goal**: Host creates room; second player joins; lobby auto-refreshes; host-only Start button.

**Independent test**: Two tabs — Tab 1 creates room, Tab 2 joins. Tab 1 sees Tab 2 appear within ~2s without Refresh. Start button visible only on Tab 1; disabled with 1 player, enabled with 2+. Empty name blocked on both sides.

- [X] T012 [US1] Remove `displayName()` fallback — delete the `displayName` helper and change `createParticipant` to use `name: name` directly (Zod already trims) in `backend/src/services/roomStore.ts`
- [X] T013 [US1] Add `hostId` to `createRoom` — set `hostId: participant.id` in the Room initialiser; add `guesses: [], scores: {}` in `backend/src/services/roomStore.ts`
- [X] T014 [US1] Update `toRoomSnapshot` — add `hostId: room.hostId` to returned snapshot; replace `void viewerParticipantId` comment with the secretWord visibility logic (keep undefined for now since `secretWord` is not set yet) in `backend/src/services/roomStore.ts`
- [X] T015 [US1] Add `createRoom hostId` test — add test "createRoom sets hostId to creator's participantId" in `backend/src/services/roomStore.test.ts`; run `cd backend && npm test` — expect 3 pass
- [X] T016 [US1] Add schema validation tests — add tests "rejects empty playerName", "rejects whitespace-only playerName", "trims playerName" for both schemas in `backend/src/api/schemas.test.ts` (if file exists) or `roomStore.test.ts`; run `cd backend && npm test`
- [X] T017 [P] [US1] Add client-side name guard in `CreateRoomPage` — before the API call, check `if (!playerName.trim()) { setError("Name cannot be empty"); return; }` in `frontend/src/pages/CreateRoomPage.tsx`
- [X] T018 [P] [US1] Add client-side name guard in `JoinRoomPage` — same pattern as T017 in `frontend/src/pages/JoinRoomPage.tsx`
- [X] T019 [US1] Add lobby auto-polling — add `useEffect` with `setInterval(fetchRoom, 2000)` and `clearInterval` cleanup in `frontend/src/pages/LobbyPage.tsx`
- [X] T020 [US1] Add host-only Start button — derive `isHost = room.hostId === participantId`; render button only when `isHost`; disable when `room.participants.length < 2`; stub `handleStart` (wired in T031) in `frontend/src/pages/LobbyPage.tsx`
- [X] T021 [US1] Commit Scenario 1 — `git add backend/src/services/roomStore.ts backend/src/api/schemas.ts frontend/src/pages/CreateRoomPage.tsx frontend/src/pages/JoinRoomPage.tsx frontend/src/pages/LobbyPage.tsx && git commit -m "feat(scenario1): host tracking, name validation, lobby polling, host-only start button"`
- [X] T022 [US1] Validate Scenario 1 — manually verify: two tabs; auto-poll works; empty name rejected; Start visible only to host; disabled with 1 player

---

## Phase 4: User Story 2 — Game Start & Drawer Flow (P2)

**Story goal**: Host starts game; drawer assigned; word selected; all players navigate to game screen; drawer sees word.

**Independent test**: Two tabs in lobby. Host clicks Start. Tab 1 (host/drawer) sees secret word + "You are Drawing". Tab 2 auto-navigates + sees "You are Guessing" with no word visible.

- [X] T023 [US2] Add `startGame` service function — host guard (403), player count guard (400), set `status="playing"`, `drawer=participants[0].id`, `secretWord=STARTER_WORDS[participants.length % STARTER_WORDS.length]`, init `scores` map to 0 for all participants in `backend/src/services/roomStore.ts`
- [X] T024 [US2] Add `startGameSchema` — `z.object({ participantId: z.string().min(1) })` in `backend/src/api/schemas.ts`
- [X] T025 [US2] Add `POST /:code/start` route — parse params + body; call `startGame`; return `toRoomSnapshot(result, participantId)` in `backend/src/api/rooms.ts`
- [X] T026 [US2] Activate secretWord visibility in `toRoomSnapshot` — `secretWord: (viewerParticipantId === room.drawer || room.status === "result") ? room.secretWord : undefined` in `backend/src/services/roomStore.ts`
- [X] T027 [US2] Add `startGame` backend tests — "sets status to playing", "assigns drawer as participants[0]", "word is STARTER_WORDS[count % 5]", "throws 403 for non-host", "throws 400 with <2 players" in `backend/src/services/roomStore.test.ts`; run `cd backend && npm test`
- [X] T028 [US2] Add `api.startGame` method — `POST /rooms/:code/start` with body `{ participantId }` returning `{ room: RoomSnapshot }` in `frontend/src/services/api.ts`
- [X] T029 [US2] Add `roomStore.startGame` action — call `api.startGame`, call `setRoomSnapshot` on success in `frontend/src/state/roomStore.ts`
- [X] T030 [US2] Add `api.startGame` test — verify POST to correct URL with correct body in `frontend/src/services/api.test.ts`; run `cd frontend && npm test`
- [X] T031 [US2] Wire `handleStart` in `LobbyPage` — call `roomStore.startGame()`; catch and display errors; remove the stub from T020 in `frontend/src/pages/LobbyPage.tsx`
- [X] T032 [US2] Add lobby auto-navigate — `useEffect` watching `room?.status === "playing"` → `navigate("/game")` in `frontend/src/pages/LobbyPage.tsx`
- [X] T033 [US2] Add drawer role display in `GamePage` — derive `isDrawer = room.drawer === participantId`; show "You are Drawing" / "You are Guessing" kicker; show `room.secretWord` prominently when `isDrawer` in `frontend/src/pages/GamePage.tsx`
- [X] T034 [US2] Commit Scenario 2 — `git add backend/src/api/schemas.ts backend/src/services/roomStore.ts backend/src/api/rooms.ts frontend/src/services/api.ts frontend/src/state/roomStore.ts frontend/src/pages/LobbyPage.tsx frontend/src/pages/GamePage.tsx && git commit -m "feat(scenario2): game start, drawer assignment, role-aware snapshot, auto-navigate"`
- [X] T035 [US2] Validate Scenario 2 — manually verify: Start triggers navigation for both tabs; drawer sees word; guesser does not; non-host has no Start button

---

## Phase 5: User Story 3 — Gameplay Interaction (P3)

**Story goal**: Drawer draws on canvas; guessers see updates; guessers submit guesses; correct guess scores 100; no double-scoring; guess history synced.

**Independent test**: Two tabs in "playing" state. Drawer draws + clears; guesser sees within ~2s. Guesser submits "CASTLE" → score 100. Submits again → score stays 100. Empty guess → client error.

- [X] T036 [US3] Add `updateCanvas` service function — drawer guard (403); set `room.canvasData = canvasData`; save in `backend/src/services/roomStore.ts`
- [X] T037 [US3] Add `submitGuess` service function — drawer guard (403); empty-text guard (400); build `Guess` object; check prior correct guess for no-double-score; push to `room.guesses`; update `room.scores` in `backend/src/services/roomStore.ts`
- [X] T038 [US3] Add `canvasUpdateSchema` and `submitGuessSchema` — `participantId + canvasData` and `participantId + text` in `backend/src/api/schemas.ts`
- [X] T039 [US3] Add `POST /:code/canvas` route — call `updateCanvas`; return `{ ok: true }` in `backend/src/api/rooms.ts`
- [X] T040 [US3] Add `POST /:code/guess` route — call `submitGuess`; return `toRoomSnapshot(result, participantId)` in `backend/src/api/rooms.ts`
- [X] T041 [US3] Add `submitGuess` and `updateCanvas` backend tests — correct guess +100; incorrect +0; double correct stays 100; drawer blocked (403); empty text (400); non-drawer canvas blocked (403) in `backend/src/services/roomStore.test.ts`; run `cd backend && npm test`
- [X] T042 [P] [US3] Add `api.submitGuess` method — `POST /rooms/:code/guess` with `{ participantId, text }` in `frontend/src/services/api.ts`
- [X] T043 [P] [US3] Add `api.updateCanvas` method — `POST /rooms/:code/canvas` with `{ participantId, canvasData }` returning `{ ok: boolean }` in `frontend/src/services/api.ts`
- [X] T044 [US3] Add `roomStore.submitGuess` and `roomStore.updateCanvas` actions — follow `withLoading` + `setRoomSnapshot` pattern in `frontend/src/state/roomStore.ts`
- [X] T045 [US3] Add `api.submitGuess` and `api.updateCanvas` frontend tests in `frontend/src/services/api.test.ts`; run `cd frontend && npm test`
- [X] T046 [US3] Create `DrawingCanvas` component — `<canvas>` element with `mousedown/mousemove/mouseup/mouseLeave` handlers; `canDraw` prop gates interaction; `onStrokeEnd(dataUrl)` callback on mouseup; Clear button when `canDraw`; loads `canvasData` prop via `Image` when not drawer in `frontend/src/components/DrawingCanvas.tsx`
- [X] T047 [US3] Wire `DrawingCanvas` in `GamePage` — replace canvas placeholder; pass `canDraw={isDrawer}`, `canvasData={room.canvasData}`, `onStrokeEnd={dataUrl => roomStore.updateCanvas(dataUrl)}` in `frontend/src/pages/GamePage.tsx`
- [X] T048 [US3] Add game screen polling — `useEffect` with `setInterval(fetchRoom, 2000)` + cleanup; only when `room.status === "playing"` in `frontend/src/pages/GamePage.tsx`
- [X] T049 [US3] Wire `GuessForm` — add `onSubmit` prop; validate non-empty on submit; call `onSubmit(trimmed)`; clear input on success; disable form when `isDrawer` in `frontend/src/components/GuessForm.tsx`
- [X] T050 [US3] Connect `GuessForm` in `GamePage` — pass `disabled={isDrawer}` and `onSubmit={text => roomStore.submitGuess(text)}` in `frontend/src/pages/GamePage.tsx`
- [X] T051 [US3] Wire `Scoreboard` — render `room.participants` with `room.scores[p.id] ?? 0` pts each in `frontend/src/components/Scoreboard.tsx`
- [X] T052 [US3] Commit Scenario 3 — `git add backend/src/api/schemas.ts backend/src/services/roomStore.ts backend/src/api/rooms.ts frontend/src/services/api.ts frontend/src/state/roomStore.ts frontend/src/components/DrawingCanvas.tsx frontend/src/components/GuessForm.tsx frontend/src/components/Scoreboard.tsx frontend/src/pages/GamePage.tsx && git commit -m "feat(scenario3): canvas drawing, guess submission, scoring, game polling"`
- [X] T053 [US3] Validate Scenario 3 — manually verify: draw syncs in ~2s; correct guess → 100pts; double → stays 100; empty → client error; drawer form disabled

---

## Phase 6: User Story 4 — Result, Restart & Final Validation (P4)

**Story goal**: Host ends round; all see result screen with word + scores + history; host restarts; lobby resets cleanly; second round starts.

**Independent test**: Full round-trip in two tabs. Host clicks End Round → result screen shows word, scores, history. Host clicks Play Again → lobby with same players, zero state. Start again → new round works.

- [X] T054 [US4] Add `endGame` service function — host guard (403); set `status="result"`; save room in `backend/src/services/roomStore.ts`
- [X] T055 [US4] Add `restartGame` service function — host guard (403); set `status="lobby"`; clear `drawer, secretWord, canvasData, guesses=[], scores={}`; keep `participants` and `hostId` in `backend/src/services/roomStore.ts`
- [X] T056 [US4] Add `gameActionSchema` — `z.object({ participantId: z.string().min(1) })` (reusable for end + restart) in `backend/src/api/schemas.ts`
- [X] T057 [US4] Add `POST /:code/end` route — host guard via `endGame`; return `toRoomSnapshot(result, participantId)` in `backend/src/api/rooms.ts`
- [X] T058 [US4] Add `POST /:code/restart` route — host guard via `restartGame`; return `toRoomSnapshot(result, participantId)` in `backend/src/api/rooms.ts`
- [X] T059 [US4] Add `endGame` and `restartGame` backend tests — "endGame sets status=result"; "endGame 403 for non-host"; "restartGame sets status=lobby, clears round state, keeps participants+hostId"; "restartGame 403 for non-host" in `backend/src/services/roomStore.test.ts`; run `cd backend && npm test`
- [X] T060 [P] [US4] Add `api.endGame` method — `POST /rooms/:code/end` with `{ participantId }` in `frontend/src/services/api.ts`
- [X] T061 [P] [US4] Add `api.restartGame` method — `POST /rooms/:code/restart` with `{ participantId }` in `frontend/src/services/api.ts`
- [X] T062 [US4] Add `roomStore.endGame` and `roomStore.restartGame` actions in `frontend/src/state/roomStore.ts`
- [X] T063 [US4] Add `api.endGame` and `api.restartGame` frontend tests in `frontend/src/services/api.test.ts`; run `cd frontend && npm test`
- [X] T064 [US4] Wire `ResultPanel` — show when `room.status === "result"`; display `room.secretWord`, per-player score list (`room.participants` × `room.scores`), full `room.guesses` with correct/incorrect indicator in `frontend/src/components/ResultPanel.tsx`
- [X] T065 [US4] Add host controls to `GamePage` — "End Round" button when `isHost && room.status === "playing"`; "Play Again" button when `isHost && room.status === "result"`; call `roomStore.endGame()` / `roomStore.restartGame()` in `frontend/src/pages/GamePage.tsx`
- [X] T066 [US4] Add `GamePage` auto-navigate to lobby — `useEffect` watching `room?.status === "lobby"` → `navigate("/lobby")` in `frontend/src/pages/GamePage.tsx`
- [X] T067 [US4] Commit Scenario 4 — `git add backend/src/api/schemas.ts backend/src/services/roomStore.ts backend/src/api/rooms.ts frontend/src/services/api.ts frontend/src/state/roomStore.ts frontend/src/components/ResultPanel.tsx frontend/src/pages/GamePage.tsx && git commit -m "feat(scenario4): end round, result screen, restart, auto-navigate to lobby"`
- [X] T068 [US4] Validate Scenario 4 — manually verify full round-trip: end → result shows word+scores+history; restart → lobby with same players; second round starts clean

---

## Phase 7: Polish & Final Gate

- [X] T069 Add reflection report — create `REFLECTION.md` covering: what starter had, what was added, tradeoffs, AI usage, deviations from spec in repo root
- [X] T070 Run full test suite — `cd backend && npm test` (≥18 pass) then `cd frontend && npm test` (≥7 pass); fix any failures before build check
- [X] T071 Run full build check — `cd backend && npm run build` then `cd frontend && npm run build`; resolve any TypeScript errors
- [X] T072 Commit final state — `git add REFLECTION.md && git commit -m "docs: add reflection report"` then final build-fix commit if needed
- [X] T073 Open PR — push branch; open PR against `main` on fork; include email (`vigneshwaran.natarajan@everest.engineering`), role, and summary per PR template

---

## Dependencies

```
Phase 1 (T001–T004)
  └── Phase 2 (T005–T011)
        ├── Phase 3 US1 (T012–T022)
        │     └── Phase 4 US2 (T023–T035)
        │           └── Phase 5 US3 (T036–T053)
        │                 └── Phase 6 US4 (T054–T068)
        │                       └── Phase 7 (T069–T073)
        └── T010 (frontend types) — can run in parallel with T005–T009
```

Each scenario phase MUST be fully validated before the next begins (constitution §V).

## Parallel Opportunities Per Story

| Story | Parallelisable tasks |
|-------|---------------------|
| US1 | T017 (CreateRoomPage guard) ‖ T018 (JoinRoomPage guard) |
| US2 | T028 (api method) ‖ T029 (store action) after T027 backend passes |
| US3 | T042 (api.submitGuess) ‖ T043 (api.updateCanvas) |
| US4 | T060 (api.endGame) ‖ T061 (api.restartGame) |

## Implementation Strategy

**MVP scope (Phase 1–3, US1 only)**: Room creation with host tracking, validated names, and auto-polling lobby. Demonstrates the core loop without game logic.

**Increment 2 (US2)**: Add game start + drawer/word assignment. Completes the pre-game flow.

**Increment 3 (US3)**: Add drawing, guessing, and scoring. Core gameplay working end-to-end.

**Increment 4 (US4)**: Add result screen and restart. Full game loop complete.

Run `npm test` in both directories before every commit. Never commit red tests.
