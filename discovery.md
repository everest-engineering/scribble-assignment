# Discovery Notes — Scribble Starter

## Incomplete Behaviors (≥3)

### 1. No Host Tracking
The `Room` model has no `hostId`. The creator is added as a regular participant with no special status. Any participant could theoretically trigger start-game actions, but there is no start-game endpoint to trigger. The "Start Game" button in `LobbyPage.tsx` simply navigates to `/game` with no backend interaction.

**Relevant files:** `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx`

### 2. No Game State Machine
`RoomStatus` is a single literal: `"lobby"`. There are no states for `"playing"`, `"round_end"`, or `"finished"`. The `RoomSnapshot` interface on both frontend and backend only types `status: "lobby"`. This means the entire game lifecycle (drawer assignment, round progression, result state) has no representation in the data model.

**Relevant files:** `backend/src/models/game.ts`, `frontend/src/services/api.ts`

### 3. No Auto-Polling
The lobby relies on a manual "Refresh Room" button calling `roomStore.fetchRoom()`. There is no `setInterval` or `useEffect`-based polling timer. The game page does not poll at all — it reads the initial room snapshot from the store and never refreshes.

**Relevant files:** `frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/GamePage.tsx`, `frontend/src/state/roomStore.ts`

### 4. Placeholder Drawing Surface
The "Canvas" area in `GamePage.tsx` is a `<div className="canvas-placeholder">` with hardcoded text "Waiting for drawer...". No `<canvas>` element exists. No drawing interaction (mouse events, brush strokes) is implemented.

**Relevant files:** `frontend/src/pages/GamePage.tsx`

### 5. Empty Guess Submission
`GuessForm.handleSubmit()` calls only `event.preventDefault()` with no API call. The `GuessForm` component accepts a `disabled` prop but nothing ever submits the guess text. There is no backend endpoint for guess submission.

**Relevant files:** `frontend/src/components/GuessForm.tsx`, `backend/src/api/rooms.ts`

### 6. No Scoring or Result State
Participants have no `score` field. There is no tracking of guesses (correct/incorrect). The `Scoreboard` and `ResultPanel` components render hardcoded placeholder text. No endpoint exists to retrieve round results.

**Relevant files:** `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`, `backend/src/models/game.ts`

### 7. No Restart Flow
There is no mechanism to restart a game. The only navigation option from the game page is "Exit Game" which navigates to `/lobby` but does not reset any round state.

**Relevant files:** `frontend/src/pages/GamePage.tsx`

## Assumptions (≥2)

### 1. Viewer-Specific Filtering is Expected
`toRoomSnapshot()` in `roomStore.ts` accepts `viewerParticipantId` but immediately voids it (`void viewerParticipantId`). This suggests the starter was designed with the expectation that future filtering (e.g., hiding secret words from non-drawers) would use this parameter. The parameter is plumbed through from the API routes and query string schema.

### 2. Backend is Mounted Under a Subpath
The frontend API client defaults to `http://localhost:3001/bug` (the `/bug` suffix). This implies the original design anticipated the backend being mounted under a sub-path. The current backend does not use `/bug` — routes are at root level (`/rooms`, `/health`). This could be a remnant or intentional future-proofing.

### 3. Player Names Default to "Player"
`displayName()` in `roomStore.ts` defaults to `"Player"` when no name is provided. The frontend create/join forms send whatever the user types, including empty strings, which become `"Player"` silently. This suggests validation was intentionally deferred.

## Full File Map

| Layer | File | Purpose |
|-------|------|---------|
| Backend | `src/models/game.ts` | Data types: Participant, Room, RoomSnapshot, RoomSessionResponse |
| Backend | `src/services/roomStore.ts` | In-memory store: CRUD operations on rooms, snapshot builder |
| Backend | `src/api/rooms.ts` | Route handlers: POST /rooms, POST /rooms/:code/join, GET /rooms/:code |
| Backend | `src/api/schemas.ts` | Zod validation schemas for requests |
| Backend | `src/api/router.ts` | Router composition, error handlers |
| Backend | `src/seed/starterData.ts` | Static word list and roles |
| Frontend | `src/services/api.ts` | Typed fetch wrapper for all backend endpoints |
| Frontend | `src/state/roomStore.ts` | Class-based state store with React Context |
| Frontend | `src/pages/LobbyPage.tsx` | Lobby view with participant list, refresh, start button |
| Frontend | `src/pages/GamePage.tsx` | Game view with placeholder canvas, guess form, scoreboard |
| Frontend | `src/components/GuessForm.tsx` | Guess input form (non-functional) |
| Frontend | `src/components/Scoreboard.tsx` | Scoreboard (placeholder) |
| Frontend | `src/components/ResultPanel.tsx` | Activity/results (placeholder) |
| Frontend | `src/pages/CreateRoomPage.tsx` | Room creation form |
| Frontend | `src/pages/JoinRoomPage.tsx` | Room join form |
