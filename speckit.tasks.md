# Spec Kit Tasks: Room Setup, Game Start, Gameplay Interaction, & Results

## 1. Discovery & Analysis
- [x] TSK001 Inspect current backend routes (`rooms.ts`), services (`roomStore.ts`), and models (`game.ts`).
- [x] TSK002 Inspect current frontend routing, room state (`roomStore.ts`), and page screens (`LobbyPage.tsx` and `JoinRoomPage.tsx`).
- [x] TSK003 Document gaps and assumptions in `speckit.discovery.md`.
- [x] TSK029 Inspect Scenario 3 gameplay placeholders (`GamePage.tsx`, `GuessForm.tsx`, `Scoreboard.tsx`, `ResultPanel.tsx`) and backend room state gaps.
- [x] TSK030 Document Scenario 3 drawing, guess, score, and sync gaps and assumptions in `speckit.discovery.md`.
- [x] TSK055 Inspect Scenario 4 result/restart gaps in backend room state, routes, Game page, Lobby page, and room store.
- [x] TSK056 Document Scenario 4 result visibility, restart reset, and polling redirect gaps and assumptions in `speckit.discovery.md`.

## 2. Specification & Design
- [x] TSK004 Create `speckit.specify.md` with prioritized user stories, acceptance criteria, and edge cases.
- [x] TSK005 Create `speckit.plan.md` outlining state model changes, API routes, and file updates.
- [x] TSK031 Update `speckit.specify.md` with Scenario 3 user stories, acceptance criteria, edge cases, functional requirements, and success criteria.
- [x] TSK032 Update `speckit.plan.md` with Scenario 3 state model, API data flow, file-level plan, and verification strategy.
- [x] TSK033 Update `speckit.tasks.md` with ordered Scenario 3 implementation and verification tasks.
- [x] TSK057 Update `speckit.specify.md` with Scenario 4 result and restart user stories, acceptance criteria, edge cases, functional requirements, and success criteria.
- [x] TSK058 Update `speckit.plan.md` with Scenario 4 state transitions, API data flow, file-level plan, and verification strategy.
- [x] TSK059 Update `speckit.tasks.md`, `speckit.analysis.md`, and `speckit.checklist.md` with Scenario 4 implementation and verification work.

## 3. Backend Implementation
### Scenario 1 — Room Setup & Lobby
- [x] TSK006 Update the backend `Room` and `RoomSnapshot` interfaces in [backend/src/models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts) to include `hostId`.
- [x] TSK007 Update [backend/src/services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) to set `hostId` when creating a room, and include it in `toRoomSnapshot()`.
- [x] TSK008 Update [backend/src/api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts) to validate that room codes match a 4-character uppercase alphanumeric regex, and trim/reject empty values.
- [x] TSK009 Update [backend/src/api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) to trim and uppercase code parameters, and handle schema validation errors gracefully.

### Scenario 2 — Game Start & Drawer Flow
- [x] TSK017 Update `RoomStatus` enum options and add `drawerId` & `secretWord` properties in [backend/src/models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts).
- [x] TSK018 Update [backend/src/services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) to initialize `drawerId` and `secretWord` as `null` on room creation.
- [x] TSK019 Update `toRoomSnapshot()` in [backend/src/services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) to hide/nullify `secretWord` unless the viewer is the drawer.
- [x] TSK020 Define Zod validation schemas for starting a game in [backend/src/api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts).
- [x] TSK021 Create route handler for `POST /rooms/:code/start` in [backend/src/api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts). Ensure it verifies host permissions, checks player counts, updates status to `"game"`, sets `drawerId` to host, and deterministically chooses a secret word.

### Scenario 3 — Gameplay Interaction
- [x] TSK034 Add `DrawingPoint`, `DrawingStroke`, `GuessEntry`, and score fields to [backend/src/models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts).
- [x] TSK035 Update [backend/src/services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) to initialize `drawing`, `guesses`, and `scores` when a game starts.
- [x] TSK036 Add backend service functions for drawer-only drawing updates and clear canvas behavior.
- [x] TSK037 Add backend service function for guess submission with trim validation, case-insensitive comparison, guess history storage, and 100-point first-correct scoring.
- [x] TSK038 Add Zod schemas in [backend/src/api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts) for drawing updates, clear canvas, and guess submissions.
- [x] TSK039 Add route handlers in [backend/src/api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) for drawing update, clear canvas, and guess submission endpoints with permission checks.

### Scenario 4 — Result, Restart & Final Validation
- [x] TSK060 Update [backend/src/services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) to expose `secretWord` to all viewers when `room.status === "results"`.
- [x] TSK061 Add host-only `endRound()` service behavior that transitions an active game to `"results"` while preserving correct word, final scores, drawing, and full guess history.
- [x] TSK062 Add host-only `restartRoom()` service behavior that transitions results to `"lobby"`, preserves participants/host/code, and clears drawer, secret word, drawing, guesses, and scores.
- [x] TSK063 Add Zod schemas in [backend/src/api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts) for end-round and restart payloads.
- [x] TSK064 Add route handlers in [backend/src/api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) for `POST /rooms/:code/end` and `POST /rooms/:code/restart` with host permission checks.

## 4. Frontend Implementation
### Scenario 1 — Room Setup & Lobby
- [x] TSK010 Add `hostId` to the frontend `RoomSnapshot` interface in [frontend/src/services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts).
- [x] TSK011 Implement Client-side validation in [frontend/src/pages/JoinRoomPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx) to trim and reject empty or invalid room code patterns, displaying clear error feedback before sending a request.
- [x] TSK012 Implement polling (2000ms interval) in [frontend/src/pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) to fetch the latest room status from the backend periodically.
- [x] TSK013 Restrict "Start Game" button in [frontend/src/pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx):
  - Only show/enable if the user's `participantId` matches `room.hostId`.
  - Disable it if the player count is less than 2.
  - Show a message to non-hosts: "Waiting for host to start the game."

### Scenario 2 — Game Start & Drawer Flow
- [x] TSK022 Add `drawerId` and `secretWord` to `RoomSnapshot` interface in [frontend/src/services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts) and add `api.startGame()` POST action.
- [x] TSK023 Implement `startGame` method in `roomStore.ts` to trigger starting the game via API.
- [x] TSK024 Update [frontend/src/pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) to:
  - Invoke `roomStore.startGame()` when host clicks the start button.
  - Redirect all participants to `/game` using an active `useEffect` when `room.status === "game"`.
- [x] TSK025 Implement 2-second polling in [frontend/src/pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) to get updates on the active game, and redirect back to `/lobby` if status transitions back to lobby.
- [x] TSK026 Update [frontend/src/pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) to visually indicate the current drawer, show the drawer the secret word, and show guessers that they are a guesser with the secret word hidden.

### Scenario 3 — Gameplay Interaction
- [x] TSK040 Update `RoomSnapshot` types in [frontend/src/services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts) to include drawing strokes, guess history, and scores.
- [x] TSK041 Add `api.updateDrawing()`, `api.clearDrawing()`, and `api.submitGuess()` methods in [frontend/src/services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts).
- [x] TSK042 Add room store actions for drawing updates, clear canvas, and guess submission in [frontend/src/state/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/state/roomStore.ts).
- [x] TSK043 Replace the canvas placeholder in [frontend/src/pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) with an interactive drawer canvas and read-only guesser view.
- [x] TSK044 Wire "Clear Canvas" as a drawer-only action in [frontend/src/pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx).
- [x] TSK045 Update [frontend/src/components/GuessForm.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/components/GuessForm.tsx) to trim, validate, submit guesses, surface errors, and clear after success.
- [x] TSK046 Update [frontend/src/components/Scoreboard.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/components/Scoreboard.tsx) to render participant scores from room snapshot state.
- [x] TSK047 Update [frontend/src/components/ResultPanel.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/components/ResultPanel.tsx) to render synced guess history.
- [x] TSK048 Add or update styles in [frontend/src/styles/app.css](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/styles/app.css) for canvas controls, score rows, validation messages, and guess history.

### Scenario 4 — Result, Restart & Final Validation
- [x] TSK065 Add `api.endRound()` and `api.restartRoom()` methods in [frontend/src/services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts).
- [x] TSK066 Add room store actions for ending the round and restarting the room in [frontend/src/state/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/state/roomStore.ts).
- [x] TSK067 Update [frontend/src/pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) with a host-only End Round action during active gameplay.
- [x] TSK068 Update [frontend/src/pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) to render result mode with correct word, final scores, and full guess history for all participants.
- [x] TSK069 Update [frontend/src/pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) with host-only Restart action in result mode and waiting messaging for non-hosts.
- [x] TSK070 Ensure game polling redirects all participants to `/lobby` after restart and that [frontend/src/pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) handles restarted lobby snapshots cleanly.
- [x] TSK071 Add or update styles in [frontend/src/styles/app.css](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/styles/app.css) for result summary and restart controls.

## 5. Verification & Testing
- [x] TSK014 Verify backend tests pass via `npm run test` in the `backend/` directory.
- [x] TSK015 Add unit tests in [backend/src/api/schemas.test.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.test.ts) for the new room code Zod validation.
- [x] TSK016 Manually test the full flow in a browser with two separate windows/tabs to verify automatic lobby polling and host-only Start Game controls.
- [x] TSK027 Add unit test in `roomStore.test.ts` to verify that `toRoomSnapshot()` masks `secretWord` for guessers and returns it for the drawer.
- [ ] TSK028 Manually verify game start transition and role visibility using multiple tabs.
- [x] TSK049 Add backend tests for drawer-only drawing update and clear canvas behavior.
- [x] TSK050 Add backend tests for empty guess rejection, incorrect guess history, case-insensitive correct guess scoring, and no repeated correct-score award.
- [x] TSK051 Add schema tests for drawing and guess payload validation.
- [x] TSK052 Add frontend API tests for drawing update, clear canvas, and guess submission requests.
- [x] TSK053 Run `npm run test` and `npm run build` in both backend and frontend after Scenario 3 implementation.
- [ ] TSK054 Manually verify Scenario 3 with two tabs: drawer draws/clears, guesser submits guesses, history and scores sync by polling.
- [x] TSK072 Add backend tests for host-only end round, result status transition, and correct word visibility to guessers in result state.
- [x] TSK073 Add backend tests for host-only restart, participant preservation, and round-state clearing.
- [x] TSK074 Add schema tests for end-round and restart payload validation.
- [x] TSK075 Add frontend API tests for end-round and restart requests.
- [x] TSK076 Run `npm run test` and `npm run build` in both backend and frontend after Scenario 4 implementation.
- [ ] TSK077 Manually verify Scenario 4 with two tabs: host ends round, all players see results, host restarts, all players return to lobby with players preserved and round state cleared.
