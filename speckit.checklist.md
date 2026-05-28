# Implementation Checklist: Room Setup, Game Start, & Gameplay Interaction

**Purpose**: Verify and track implementation details for Scenarios 1, 2, and 3, ensuring all requirements, edge cases, and success criteria are met.
**Created**: 2026-05-28
**Feature**: [speckit.specify.md](file:///Users/manojprabhakarm/projects/work/scribble-assignment/speckit.specify.md)

## 1. Scenario 1 — Room Setup & Lobby (Completed)

- [x] CHK001 Enforce `hostId` field in `Room` and `RoomSnapshot` TypeScript interfaces.
- [x] CHK002 Ensure `createRoom` automatically sets the creator's ID as the `hostId` in `roomStore.ts`.
- [x] CHK003 Verify `toRoomSnapshot` correctly serializes `hostId` so it's sent to the client.
- [x] CHK004 Implement 4-character uppercase alphanumeric Zod validation for room code parameter in `schemas.ts`.
- [x] CHK005 Update the join endpoint (`/rooms/:code/join`) to sanitize room code inputs and handle bad formatting with 400 Bad Request.
- [x] CHK006 Add `hostId` to `RoomSnapshot` interface in the frontend API client.
- [x] CHK007 Enforce client-side validation on room code in `JoinRoomPage.tsx`.
- [x] CHK008 Set up automatic polling interval (2000ms) in `LobbyPage.tsx` using React hooks.
- [x] CHK009 Update state logic to determine if the local user is the host.
- [x] CHK010 Conditionally disable the "Start Game" button in `LobbyPage.tsx` if the player count is less than 2.
- [x] CHK011 Show a clear "Waiting for host to start..." instruction to non-host participants.
- [x] CHK012 Verify that the backend test suite builds and executes successfully.
- [x] CHK013 Add unit tests in `schemas.test.ts` to verify Zod validations on room codes.
- [x] CHK014 Perform manual multiplayer test using two separate browser windows.

## 2. Scenario 2 — Game Start & Drawer Flow

- [ ] CHK015 Extend `RoomStatus` type to include `"game" | "results"` and add `drawerId: string | null` and `secretWord: string | null` to `Room` and `RoomSnapshot` interfaces ([backend/src/models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)).
- [ ] CHK016 Initialize `drawerId` and `secretWord` to `null` during room creation in `roomStore.ts`.
- [ ] CHK017 Mask/nullify `secretWord` in `toRoomSnapshot()` if the `viewerParticipantId` is not equal to `room.drawerId`.
- [ ] CHK018 Create `startGameSchema` in `schemas.ts` requiring `{ participantId: z.string() }` payload.
- [ ] CHK019 Register route `POST /rooms/:code/start` in `rooms.ts` verifying host credentials, minimum player count (>= 2), status transition, drawer assignment, and deterministic word selection.
- [ ] CHK020 Add `drawerId` and `secretWord` to frontend `RoomSnapshot` interface and implement `api.startGame()` method in `api.ts`.
- [ ] CHK021 Implement `startGame()` action in frontend `roomStore.ts`.
- [ ] CHK022 Update `LobbyPage.tsx` to call `roomStore.startGame()` when starting the game and automatically redirect players to `/game` when the room status becomes `"game"`.
- [ ] CHK023 Add 2-second polling in `GamePage.tsx` and automatically redirect back to `/lobby` if the room status transitions back to lobby.
- [ ] CHK024 Display role information ("Drawer" or "Guesser") on the game screen and show the secret word only to the drawer.
- [ ] CHK025 Write unit tests in `roomStore.test.ts` to verify that `toRoomSnapshot` masks `secretWord` for guessers and reveals it to the drawer.
- [ ] CHK026 Manually verify game start transition and role-based visibility using multiple browser tabs.

## 3. Scenario 3 — Gameplay Interaction

### Backend State & Contracts

- [x] CHK027 Add typed drawing state to backend room models using bounded serializable stroke/path data.
- [x] CHK028 Add typed guess history entries with participant ID, participant name, guess text, submitted timestamp, correctness, and awarded points.
- [x] CHK029 Add score state keyed by participant ID and include scores in room snapshots.
- [x] CHK030 Initialize drawing, guesses, and all participant scores when the game starts.
- [x] CHK031 Ensure `toRoomSnapshot()` always returns drawing, guesses, and scores in a frontend-safe shape.

### Backend Gameplay Rules

- [x] CHK032 Implement drawer-only drawing update behavior and reject non-drawer updates.
- [x] CHK033 Implement drawer-only clear canvas behavior and reject non-drawer clear attempts.
- [x] CHK034 Implement guess submission for non-drawer participants only.
- [x] CHK035 Trim guesses and reject empty or whitespace-only submissions before storing history.
- [x] CHK036 Compare guesses against the secret word case-insensitively.
- [x] CHK037 Award 100 points for a participant's first correct guess and 0 points for incorrect or repeated correct guesses.
- [x] CHK038 Preserve room isolation so drawing, guesses, and scores never leak across room codes.

### API & Validation

- [x] CHK039 Add Zod schemas for drawing strokes/points with payload bounds.
- [x] CHK040 Add Zod schema for clear canvas payload requiring `participantId`.
- [x] CHK041 Add Zod schema for guess submissions requiring `participantId` and trimmed non-empty `text`.
- [x] CHK042 Add HTTP endpoints for drawing update, clear canvas, and guess submission with clear 400/403/404 errors.

### Frontend Gameplay UI

- [x] CHK043 Update frontend API and store types/actions for drawing, guesses, and scores.
- [x] CHK044 Replace the static canvas placeholder with an interactive drawer canvas and read-only guesser view.
- [x] CHK045 Provide a drawer-only "Clear Canvas" control.
- [x] CHK046 Update `GuessForm` to trim, validate, submit, show errors, and clear after successful submission.
- [x] CHK047 Update `Scoreboard` to render room participants with current scores.
- [x] CHK048 Update `ResultPanel` or activity panel to render synced guess history for all players.

### Verification

- [x] CHK049 Add backend tests for drawer-only drawing update and clear canvas.
- [x] CHK050 Add backend tests for empty guess rejection, incorrect guesses, case-insensitive correct scoring, and repeated correct guess scoring.
- [x] CHK051 Add schema tests for drawing and guess payload validation.
- [x] CHK052 Add frontend API tests for drawing update, clear canvas, and guess submission calls.
- [x] CHK053 Run backend and frontend tests and builds after implementation.
- [ ] CHK054 Manually verify two-tab Scenario 3 flow: drawer draws/clears, guesser submits guesses, history and scores sync through polling.
