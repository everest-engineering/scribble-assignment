# Technical Plan: Room Setup, Game Start, Gameplay Interaction, & Results

> Feature-specific plan artifacts are also available under `spec/scenario-1-room-setup`, `spec/scenario-2-game-start`, `spec/scenario-3-gameplay`, and `spec/scenario-4-results`.

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-28

**Status**: Draft

## State Model Changes

### Backend Changes

1.  **Room Model (`Room` in [game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)):**
    - Update `status: "lobby" | "game" | "results"`.
    - Add `drawerId: string | null` (designates who is drawing).
    - Add `secretWord: string | null` (designates secret word for the round).
2.  **Room Snapshot (`RoomSnapshot` in [game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)):**
    - Update `status: "lobby" | "game" | "results"`.
    - Add `drawerId: string | null`.
    - Add optional/nullable `secretWord: string | null` (exposed ONLY to the drawer).
    - Add active-round gameplay fields for drawing state, guess history, and scores.
3.  **Drawing State:**
    - Use serializable path data rather than image blobs. Proposed shape:
      - `DrawingPoint`: `{ x: number; y: number }`
      - `DrawingStroke`: `{ id: string; points: DrawingPoint[]; color: string; size: number }`
      - Room field: `drawing: DrawingStroke[]`
4.  **Guess State:**
    - Proposed `GuessEntry`: `{ id; participantId; participantName; text; submittedAt; isCorrect; pointsAwarded }`.
    - Room field: `guesses: GuessEntry[]`.
5.  **Score State:**
    - Store scores as `Record<string, number>` keyed by participant ID.
    - Initialize all current players to `0` when the game starts.
    - Include scores in snapshots for scoreboard rendering.
6.  **Result State:**
    - Reuse `status: "results"` to mark a completed round.
    - Keep `secretWord`, `guesses`, and `scores` available in result state.
    - Update snapshot masking so `secretWord` is visible when `room.status === "results"`.
7.  **Restart Reset State:**
    - Preserve `code`, `participants`, `hostId`, `createdAt`.
    - Reset `status: "lobby"`, `drawerId: null`, `secretWord: null`, `drawing: []`, `guesses: []`, and `scores` back to participant IDs with 0 points.

### Frontend Changes

- `RoomSnapshot` in `api.ts` updated to match backend definition.
- Add frontend types for drawing strokes, guess entries, and scores.
- Add room store actions for updating drawing, clearing drawing, and submitting guesses.
- Replace placeholder canvas/score/activity UI with components driven by room snapshot state.
- Add room store/API actions for ending the round and restarting from result state.
- Render result mode in `GamePage` using the same score and guess-history components in read-only form.
- Ensure polling redirects all players back to `/lobby` when restart returns the room to lobby status.

---

## API Design & Data Flow

### 1. Start Game (`POST /rooms/:code/start`)
- Request body: `{ participantId: string }`
- Backend checks:
  - Caller must exist and be the room's host (`participantId === room.hostId`).
  - Room must have at least 2 participants.
- Action:
  - Transitions `status` to `"game"`.
  - Sets `drawerId` to the host's ID.
  - Deterministically selects secret word: `STARTER_WORDS[character_sum(code) % STARTER_WORDS.length]`.
- Response: returns room snapshot.

### 2. Fetch Room Snapshot (`GET /rooms/:code?participantId=...`)
- Backend `toRoomSnapshot` masks `secretWord` unless `participantId === room.drawerId`.

### 3. Update Drawing (`PUT /rooms/:code/drawing`)
- Request body: `{ participantId: string; drawing: DrawingStroke[] }`
- Backend checks:
  - Room exists and status is `"game"`.
  - Caller exists and `participantId === room.drawerId`.
  - Drawing payload is bounded and validated with Zod.
- Action:
  - Replaces the room's current drawing state.
- Response:
  - Returns room snapshot for the drawer.

### 4. Clear Drawing (`POST /rooms/:code/drawing/clear`)
- Request body: `{ participantId: string }`
- Backend checks:
  - Room exists and status is `"game"`.
  - Caller is the drawer.
- Action:
  - Sets drawing state to an empty array.
- Response:
  - Returns room snapshot for the drawer.

### 5. Submit Guess (`POST /rooms/:code/guesses`)
- Request body: `{ participantId: string; text: string }`
- Backend checks:
  - Room exists and status is `"game"`.
  - Caller is a room participant and is not the drawer.
  - Guess text trims to at least one character.
- Action:
  - Compares `trimmedGuess.toLowerCase()` with `secretWord.toLowerCase()`.
  - Appends a `GuessEntry`.
  - Awards `100` points for the participant's first correct guess in the round; otherwise awards `0`.
- Response:
  - Returns room snapshot for the guesser.

### 6. End Round (`POST /rooms/:code/end`)
- Request body: `{ participantId: string }`
- Backend checks:
  - Room exists and status is `"game"`.
  - Caller is the host.
- Action:
  - Transitions `status` to `"results"`.
  - Keeps `secretWord`, final scores, and full guess history.
- Response:
  - Returns room snapshot with `secretWord` visible to the caller and all future result viewers.

### 7. Restart Room (`POST /rooms/:code/restart`)
- Request body: `{ participantId: string }`
- Backend checks:
  - Room exists and status is `"results"`.
  - Caller is the host.
- Action:
  - Transitions `status` to `"lobby"`.
  - Preserves participants, host ID, and room code.
  - Clears `drawerId`, `secretWord`, drawing, guesses, and scores.
- Response:
  - Returns lobby snapshot.

---

## File-by-File Changes

### Backend

#### 1. [models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)
- Update `RoomStatus` to `"lobby" | "game" | "results"`.
- Update `Room` and `RoomSnapshot` interfaces to include `drawerId: string | null` and `secretWord: string | null`.
- Add `DrawingPoint`, `DrawingStroke`, `GuessEntry`, and score-related fields to `Room` and `RoomSnapshot`.

#### 2. [services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts)
- Update `createRoom()` to initialize `drawerId: null` and `secretWord: null`.
- Update `toRoomSnapshot()` to hide `secretWord` if the requesting `viewerParticipantId !== room.drawerId`.
- Initialize `drawing`, `guesses`, and `scores` when a game starts.
- Add service functions for `updateDrawing`, `clearDrawing`, and `submitGuess`.
- Keep room isolation by mutating only the matching room code in the in-memory map.
- Add `endRound()` host-only service function to transition `"game"` to `"results"`.
- Add `restartRoom()` host-only service function to transition `"results"` to `"lobby"` and clear round state.
- Update `toRoomSnapshot()` to reveal `secretWord` to all viewers when status is `"results"`.

#### 3. [api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts)
- Add `startGameSchema` validating `{ participantId: z.string() }`.
- Add schemas for drawing points/strokes, drawing update, clear drawing, and guess submission.
- Add schemas for end-round and restart payloads requiring `participantId`.

#### 4. [api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts)
- Add `POST /rooms/:code/start` route handler.
- Add drawing update, clear drawing, and guess submission route handlers.
- Map service failure reasons to clear HTTP responses (`403` for permission failures, `400` for invalid state or validation failures, `404` for unknown room).
- Add `POST /rooms/:code/end` and `POST /rooms/:code/restart` route handlers.

### Frontend

#### 1. [services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts)
- Update `RoomSnapshot` interface.
- Add `api.startGame()` method.
- Add `api.updateDrawing()`, `api.clearDrawing()`, and `api.submitGuess()` methods.
- Add `api.endRound()` and `api.restartRoom()` methods.

#### 2. [state/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/state/roomStore.ts)
- Add `startGame` action.
- Add store actions for drawing updates, canvas clear, and guess submission.
- Add store actions for ending the round and restarting the room.

#### 3. [pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- Call `roomStore.startGame()` on Start button click.
- Add redirect `useEffect` navigating to `/game` if `room.status === "game"`.

#### 4. [pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx)
- Add 2s polling hook calling `roomStore.fetchRoom()`.
- Add redirect `useEffect` navigating to `/lobby` if `room.status === "lobby"`.
- Identify drawer and display secret word for drawer; show guesser view otherwise.
- Render an interactive canvas for the drawer and a read-only drawing view for guessers.
- Pass snapshot scores and guesses into scoreboard/activity components.
- Add host-only "End Round" control during active game state.
- Add result-mode branch that hides drawing and guess input, shows correct word, final scores, and full guess history.
- Add host-only "Restart" control in result mode; non-hosts see waiting messaging.
- Preserve existing polling and redirect to `/lobby` when restarted status is observed.

#### 5. [components/GuessForm.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/components/GuessForm.tsx)
- Accept an `onSubmit` callback, trim input, display validation errors, and clear the field after a successful submission.

#### 6. [components/Scoreboard.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/components/Scoreboard.tsx)
- Render participant names and scores from snapshot state.

#### 7. [components/ResultPanel.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/components/ResultPanel.tsx)
- Render guess history entries with participant name, text, and correct/incorrect status.

#### 8. [styles/app.css](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/styles/app.css)
- Add focused styles for canvas controls, read-only canvas state, guess validation, guess history, and score rows.
- Add result summary and restart action styles if existing card/detail styles are not sufficient.

---

## Verification & Testing Plan

### Automated Tests
- Run `npm run test` in backend.
- Add a test in `roomStore.test.ts` to verify that `toRoomSnapshot` masks `secretWord` for guessers and reveals it to the drawer.
- Add backend service tests for drawer-only drawing updates, clear canvas, empty guess rejection, case-insensitive correct guesses, and single-award scoring.
- Add schema tests for drawing and guess payload validation.
- Add frontend service tests for new API methods.
- Add backend service tests for host-only end round, result word visibility, host-only restart, participant preservation, and round-state clearing.
- Add schema tests for end/restart payload validation.
- Add frontend service tests for end/restart API calls.

### Manual Verification
- Open two tabs.
- Let Host Alice start the game. Verify Bob is redirected automatically.
- Verify role assignments and word visibility match their status.
- As drawer, draw and clear the canvas; confirm guesser polling sees the stored state.
- As guesser, submit empty, incorrect, and correct guesses; confirm history and scoreboard sync to both tabs.
- As host, end the round; verify all players see result state with correct word, final scores, and full guess history.
- As host, restart; verify all players return to lobby, participants are preserved, and round state is cleared.
