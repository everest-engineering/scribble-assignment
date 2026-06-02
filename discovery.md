# Discovery Notes

## What Works (Happy Path Only)
- App shell with routing (StartPage, CreateRoomPage, JoinRoomPage, LobbyPage, GamePage)
- Create Room — `POST /rooms` generates unique 4-char code, adds participant, returns `participantId`
- Join Room — `POST /rooms/:code/join` adds participant to existing room
- Room snapshot — `GET /rooms/:code` returns participants, availableWords, roles
- Lobby display — shows room code, participant list, manual refresh button
- Seed data — 5 words (rocket, pizza, castle, guitar, sunflower), 2 roles (drawer, guesser)

## Incomplete/Missing Behaviors (≥3 gaps)

### Gap 1: No host tracking
The `Room` model has no `hostId` field. The creator is indistinguishable from other participants. Anyone can click "Start Game" on the lobby. The `toRoomSnapshot` function accepts a `viewerParticipantId` parameter but never uses it.

### Gap 2: No player name validation
The `displayName()` helper maps empty/falsy names to `"Player"` silently. No trimming is applied. Whitespace-only names are accepted and become `"Player"`. The Create/Join pages send names directly without client-side validation.

### Gap 3: No auto-polling or game lifecycle
The lobby has only a manual "Refresh Room" button. "Start Game" navigates directly to `/game` without any API call. No endpoint exists to transition a room out of `"lobby"` status. The `RoomStatus` type only has one value: `"lobby"`.

### Gap 4: No gameplay implementation
Canvas, guess form, scoreboard, and result panel are all placeholders. No draw, guess, scoring, or restart logic exists on either frontend or backend.

## Assumptions (≥2)

### Assumption 1: Deliberate URL bug
The frontend API base URL defaults to `http://localhost:3001/bug` (with literal `/bug` suffix). This appears intentionally broken for learners to discover and fix.

### Assumption 2: Unused viewer parameter
`toRoomSnapshot` receives `viewerParticipantId` but ignores it entirely. This strongly suggests viewer-specific filtering (e.g., hiding the secret word from guessers) was planned but not implemented.

### Assumption 3: RoomStatus extensibility
The `RoomStatus` type is `"lobby"` only, but `availableWords` and `roles` are already present in the snapshot — indicating the scaffolding expected `"playing"` and `"finished"` states.

## Bug Found
- `frontend/src/services/api.ts:22` — `API_BASE_URL` default is `"http://localhost:3001/bug"`, should be `"http://localhost:3001"`.

## Relevant Files

| Area | File | Purpose |
|---|---|---|
| Backend models | `backend/src/models/game.ts` | Room, Participant, RoomSnapshot types |
| Backend services | `backend/src/services/roomStore.ts` | Room CRUD, snapshot generation |
| Backend services test | `backend/src/services/roomStore.test.ts` | Unit tests for room store |
| Backend API routes | `backend/src/api/rooms.ts` | REST endpoint handlers |
| Backend API schemas | `backend/src/api/schemas.ts` | Zod validation schemas |
| Backend API router | `backend/src/api/router.ts` | Express router, error handlers |
| Backend seed data | `backend/src/seed/starterData.ts` | Words and roles |
| Backend app | `backend/src/app.ts` | Express app setup |
| Frontend API service | `frontend/src/services/api.ts` | HTTP client methods |
| Frontend API test | `frontend/src/services/api.test.ts` | API unit tests |
| Frontend state | `frontend/src/state/roomStore.ts` | Client-side room state management |
| Frontend lobby | `frontend/src/pages/LobbyPage.tsx` | Lobby screen with refresh |
| Frontend game | `frontend/src/pages/GamePage.tsx` | Game screen with placeholders |
| Frontend guess form | `frontend/src/components/GuessForm.tsx` | Guess input (non-functional) |
| Frontend scoreboard | `frontend/src/components/Scoreboard.tsx` | Score display (placeholder) |
| Frontend result panel | `frontend/src/components/ResultPanel.tsx` | Activity display (placeholder) |
| Frontend styles | `frontend/src/styles/app.css` | All UI styling |
