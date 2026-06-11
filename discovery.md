# Discovery Notes — Scribble

## Incomplete Behaviors

### 1. Game lifecycle & round management

The backend has no concept of a game being in progress. `Room.status` only supports
`"lobby"` — there is no `"playing"`, `"round_end"`, or `"finished"` state. No API
endpoints exist to start a game, transition rounds, or end a round. The frontend's
"Start Game" button in the lobby simply navigates to `/game` with zero backend
interaction. The GamePage hardcodes `"Round 1"` and has no round-tracking logic.

*Relevant gaps:*
- No `POST /rooms/:code/start` endpoint
- No `Round` model (current drawer, current word, round number, round phase)
- `RoomSnapshot.status` type in frontend only permits `"lobby"`
- `saveRoom()` in `roomStore.ts` is dead code — never called by any route handler

### 2. Canvas drawing & guess submission

The GamePage renders a static `<div>` placeholder reading `"Waiting for drawer..."`
instead of an interactive `<canvas>` element. The `GuessForm` component renders an
input and submit button but `handleSubmit` is an empty function — no API call, no
store dispatch, no validation.

*Relevant gaps:*
- No drawing canvas (HTML5 `<canvas>` with mouse/touch handlers)
- No `POST /rooms/:code/draw` or drawing data endpoint
- No `POST /rooms/:code/guess` endpoint on the backend
- No guess validation (trimming, empty rejection, case-insensitive comparison)
- No guess history sync via polling
- `toRoomSnapshot()` ignores the `viewerParticipantId` parameter — the secret word
  is visible to all players, not just the drawer

### 3. Scoring & result state

The `Scoreboard` renders `0` statically. The `ResultPanel` shows placeholder text
`"Game activity and guesses will appear here."` No score model exists on the
backend. No endpoint exposes per-player scores or final round results. The lobby's
"Restart" flow (preserving players, clearing round state) is entirely absent.

*Relevant gaps:*
- No `Score` or `score` field on `Room` or `RoomSnapshot`
- No deterministic scoring logic (100 points for correct guess)
- No result state shared to all players
- No restart endpoint (`POST /rooms/:code/restart`)
- No cleanup mechanism for stale rooms — the `rooms` Map grows unbounded

### 4. Lobby polling & host-only permissions

The lobby and game screens rely on a manual `"Refresh Room"` button. There is no
automatic `setInterval`-based polling. The backend has no host-tracking field —
room creators are not distinguished from joiners, so host-only actions (start game,
restart) cannot be enforced.

*Relevant gaps:*
- No `isHost` or `hostId` field on `Room`/`RoomSnapshot`
- No automatic polling interval (~2s) on LobbyPage or GamePage
- No backend enforcement of host-only operations

## Assumptions

### A. All real-time sync uses HTTP polling, not WebSockets

Per the strict boundaries in AGENTS.md and the README's out-of-scope list,
WebSockets and any push protocol are forbidden. The frontend will poll
`GET /rooms/:code?participantId=...` on a ~2-second interval to receive game
state updates (drawer changes, new guesses, score updates, round transitions).
The backend snapshot must carry all state needed to render each view.

### B. The `participantId` is the sole identity token

There is no authentication, sessions, or JWT. Each client's identity is the
`participantId` returned from `POST /rooms` or `POST /rooms/:code/join`. The
frontend stores it in the `RoomStore` (in-memory) with `useSyncExternalStore`.
Page refresh loses it — `sessionStorage` persistence is an optional enhancement
if needed for the lab flow.

### C. The starter word list is fixed and sufficient

The five words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) are the
exclusive word pool. Word selection for each round will be deterministic (e.g.,
index = round number % word count). No custom word packs, random word APIs, or
user-submitted words are in scope.

## Relevant Files

### Backend
- `backend/src/models/game.ts` — Core data types (`Room`, `Participant`, `RoomSnapshot`, `RoomStatus`)
- `backend/src/api/rooms.ts` — Route handlers (create, join, get room)
- `backend/src/api/schemas.ts` — Zod validation schemas + `HttpError`
- `backend/src/api/router.ts` — Router assembly, 404, error handler
- `backend/src/services/roomStore.ts` — In-memory room store (CRUD + snapshot)
- `backend/src/seed/starterData.ts` — `STARTER_WORDS` and `STARTER_ROLES`
- `backend/src/app.ts` — Express app (middleware, routes)
- `backend/src/server.ts` — Entry point

### Frontend
- `frontend/src/services/api.ts` — API client (createRoom, joinRoom, fetchRoom)
- `frontend/src/state/roomStore.ts` — Room state store (Context + `useSyncExternalStore`)
- `frontend/src/pages/LobbyPage.tsx` — Lobby UI (participants, refresh, start game)
- `frontend/src/pages/GamePage.tsx` — Game UI (canvas placeholder, guess form, scoreboard, result)
- `frontend/src/components/GuessForm.tsx` — Guess input (submit handler is empty)
- `frontend/src/components/Scoreboard.tsx` — Score display (static)
- `frontend/src/components/ResultPanel.tsx` — Results display (static)
- `frontend/src/routes/index.tsx` — Route definitions
