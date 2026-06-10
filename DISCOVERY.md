# Discovery Notes

Sources: README.md, codebase exploration of backend/ and frontend/

## What Already Works

From README "Current Implementation" and code inspection:
- `GET /health`, `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` endpoints
- In-memory room storage (Map), room code generation, participant create/join
- Frontend routing: Start, CreateRoom, JoinRoom, Lobby, Game pages
- RoomStore (Context + useSyncExternalStore) for state management
- Create/join room flows navigate to Lobby; Lobby displays participant list
- Manual "Refresh Room" button fetches latest room snapshot
- Game screen layout with placeholder canvas, guess form, scoreboard, result panel
- Basic UI styling (app.css) with Card, PageHeader, RoomCodeBadge components
- Seed data: 5 words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and 2 roles (`drawer`, `guesser`)
- Minimal test coverage: 2 backend tests (roomStore, schemas) + 2 frontend tests (api service)

## Incomplete Behaviours (Gaps)

### 1. No host tracking or host-only permissions (Scenario 1)
- `Room` model has no `hostId` or `isHost` flag on participants.
- LobbyPage "Start Game" button is visible to all participants, not just the host.
- No backend endpoint or validation for host-only actions.
- README: "the creator is automatically the host" — not implemented.
- **Relevant files**: `backend/src/models/game.ts:10-16`, `backend/src/services/roomStore.ts:52-68`, `frontend/src/pages/LobbyPage.tsx:72-74`

### 2. No automatic lobby polling (Scenario 1)
- LobbyPage has a manual "Refresh Room" button but no `setInterval`-based polling.
- README specifies "the lobby refreshes via polling (~2s)" — only manual refresh exists.
- Participants must manually click refresh to see new joiners.
- README tech model notes: "manual room refresh in the starter; polling added by learners".
- **Relevant files**: `frontend/src/pages/LobbyPage.tsx:20-27`, `frontend/src/state/roomStore.ts:92-100`

### 3. No start-game flow (Scenarios 1 & 2)
- "Start Game" button navigates directly to `/game` with no backend interaction.
- No `POST /rooms/:code/start` endpoint exists.
- No minimum 2-player check before starting (README: "only the host can start the game once at least 2 players are present").
- `RoomStatus` type only has `"lobby"` — no `"playing"` or `"finished"` states.
- **Relevant files**: `backend/src/models/game.ts:2`, `backend/src/api/rooms.ts`, `frontend/src/pages/LobbyPage.tsx:72-74`

### 4. No drawer assignment or secret word visibility (Scenario 2)
- `toRoomSnapshot` ignores `viewerParticipantId` (`void viewerParticipantId` at line 100), so there is no drawer-only word filtering.
- No backend logic to select a secret word from `STARTER_WORDS`.
- README: "the secret word (deterministically selected from the starter list) is visible only to the drawer".
- No drawer assignment — no participant is ever assigned the `"drawer"` role.
- README: "the host (or first player) becomes the clearly-identified drawer".
- **Relevant files**: `backend/src/services/roomStore.ts:99-108`, `backend/src/seed/starterData.ts`

### 5. No drawing interaction (Scenario 3)
- GamePage canvas is a placeholder div: "Waiting for drawer...".
- No drawing canvas, no clear canvas action, no drawing data model.
- README: "the drawer draws/clears the canvas" — no drawing endpoint or canvas implementation.
- `GuessForm` submit handler only calls `event.preventDefault()` — no backend submission.
- **Relevant files**: `frontend/src/pages/GamePage.tsx:43-47`, `frontend/src/components/GuessForm.tsx:10-12`

### 6. No guess submission, history, or scoring (Scenario 3)
- No `POST /rooms/:code/guess` endpoint on the backend.
- `Scoreboard` and `ResultPanel` are placeholder components with hardcoded copy.
- No guess history model on the backend.
- No scoring logic (README: "correct guesses score 100 (incorrect add 0)").
- README: "guesses are trimmed, case-insensitively compared, and empty ones rejected".
- **Relevant files**: `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`, `frontend/src/components/GuessForm.tsx`, `backend/src/api/rooms.ts`

### 7. No result state or restart (Scenario 4)
- No `"finished"` room status. No result screen.
- README: "all players see the correct word, final scores, and full guess history".
- No restart mechanism to return players to lobby with round state cleared.
- README: "on restart, everyone returns to the lobby with players preserved and all round state cleared".
- **Relevant files**: `backend/src/models/game.ts:2`, `frontend/src/pages/GamePage.tsx`

## Existing API Endpoints

From README "API Included In The Starter" and code inspection:
| Method | Path | Purpose | Implemented? |
|--------|------|---------|-------------|
| `GET` | `/health` | Health check | Yes |
| `POST` | `/rooms` | Create room | Yes |
| `POST` | `/rooms/:code/join` | Join room | Yes |
| `GET` | `/rooms/:code` | Fetch room snapshot | Yes |
| `POST` | `/rooms/:code/start` | Start game | No |
| `POST` | `/rooms/:code/draw` | Submit drawing state | No |
| `DELETE` | `/rooms/:code/draw` | Clear canvas | No |
| `POST` | `/rooms/:code/guess` | Submit guess | No |
| `POST` | `/rooms/:code/restart` | Restart room after result | No |

## Assumptions

1. **`VITE_API_URL` default has a typo/bug**: `frontend/src/services/api.ts:22` defaults to `http://localhost:3001/bug` — the `/bug` suffix is likely unintentional. README says "If needed, point the frontend at a different backend with `VITE_API_URL`" and runs backend on port 3001. The correct default should be `http://localhost:3001`. Without this fix, all frontend API calls 404 when `VITE_API_URL` is not explicitly set.

2. **Empty player names are accepted without rejection**: `createRoom` and `joinRoom` accept `playerName` as optional with a fallback to `"Player"`. README Scenario 2 says "player names are trimmed (empty/whitespace-only rejected with a message)" — this validation is missing on both frontend (no trim/check before submit) and backend (no validation in Zod schema).

3. **Room codes are not validated for format**: The `roomCodeParamsSchema` accepts any string. README Scenario 1 says "invalid/empty codes are rejected with clear feedback". There is no client-side validation of room code format/emptiness before submitting the join request.

4. **Polling will replace manual refresh**: The lobby currently relies on a manual "Refresh Room" button but the README's tech model table explicitly says "manual room refresh in the starter; polling added by learners". The assumption is that `setInterval`-based polling will replace the manual button with ~2s cadence.

5. **Single round only, no timers**: The README "Explicitly Out Of Scope" section confirms "multiple rounds, drawer rotation, timers, countdowns, speed bonuses, or drawer bonuses" are not to be built. All game logic should assume one round per room session.

6. **Start-page copy is presentational**: README Quick Verification step 7 says "Treat any start-page marketing copy as presentational only; use this README for actual supported scope."

## Explicitly Out Of Scope

From README — must not appear in spec, plan, or tasks:
- WebSockets or real-time sync
- Databases or persistent storage
- Authentication, accounts, or sessions
- Deployment, hosting, CI, or Docker
- New state-management or routing libraries beyond starter
- Multiple rounds, drawer rotation, timers, countdowns, bonuses
- Custom or random word packs
- Spectator mode
- Moderation features (kick, mute)
- Room passwords or invite links
- Rewriting the starter from scratch
- Unjustified top-level dependencies
- Unrelated refactors
