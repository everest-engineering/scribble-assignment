# Discovery Notes

## Incomplete Behaviors (≥3)

1. **Host tracking & host-only actions**: The starter has no concept of a "host" — `createRoom` returns a participant but does not mark them as host. There is no mechanism to restrict game-starting to the host. Relevant files: `backend/src/services/roomStore.ts`, `backend/src/models/game.ts`, `frontend/src/pages/LobbyPage.tsx`.

2. **Game state transitions**: The starter only supports `lobby` status. There is no `playing` or `result` status, no drawer assignment, no secret word selection, no guess/scoring logic, and no restart flow. The entire gameplay lifecycle is missing. Relevant files: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `frontend/src/pages/GamePage.tsx`.

3. **Name validation & error feedback**: Player names are accepted as-is with no trimming or empty-string rejection. Join codes are uppercased but not validated for emptiness or existence with clear user-facing messages. Relevant files: `backend/src/api/schemas.ts`, `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`.

4. **Drawing & canvas interaction**: The canvas is a placeholder div with no drawing functionality. There is no mechanism to store or sync drawing data to other players via HTTP polling. Relevant files: `frontend/src/pages/GamePage.tsx`, `backend/src/services/roomStore.ts`.

5. **Guess submission & history**: The `GuessForm` component exists but does not submit guesses to the backend. There is no guess history stored or synced to players. Relevant files: `frontend/src/components/GuessForm.tsx`, `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`.

6. **Lobby polling**: The lobby page has a manual "Refresh Room" button but no automatic polling. Players must click the button to see updated participant lists. Relevant files: `frontend/src/pages/LobbyPage.tsx`.

7. **Scoring**: Scores are not tracked per participant. The `Scoreboard` component shows a hardcoded placeholder. Relevant files: `frontend/src/components/Scoreboard.tsx`, `backend/src/models/game.ts`.

8. **Result state & restart**: The `ResultPanel` shows a placeholder. There is no result state where all players see the correct word, final scores, and guess history. There is no restart mechanism to return to lobby with players preserved. Relevant files: `frontend/src/components/ResultPanel.tsx`, `frontend/src/pages/GamePage.tsx`, `backend/src/services/roomStore.ts`.

## Assumptions (≥2)

1. **Drawing sync via polling**: Since WebSockets are out of scope, drawing data will be serialized (e.g., as a base64 data URL or stroke array) and stored in the room state on the server. Guessers will poll this data via `GET /rooms/:code` every ~2s. This means drawing updates may have up to 2s latency for other players.

2. **Round ends on correct guess**: With no timer mechanism (out of scope), the round ends when a guesser submits the correct word. All players then see the result state showing the word, scores, and guess history. The host can then restart from the result screen.

3. **Single round per game session**: Since "multiple rounds" and "drawer rotation" are explicitly out of scope, each game consists of exactly one round. After restart, players return to the lobby and the host can start a new single round.

4. **First player (host) is the drawer**: The drawer is the first player in the participants array (which is the room creator/host). This avoids any round-robin or rotation logic.

## Relevant Files

### Backend
- `backend/src/models/game.ts` — Data type definitions
- `backend/src/services/roomStore.ts` — In-memory store & game logic
- `backend/src/services/roomStore.test.ts` — Store tests
- `backend/src/api/rooms.ts` — API route handlers
- `backend/src/api/schemas.ts` — Zod validation schemas
- `backend/src/api/schemas.test.ts` — Schema tests
- `backend/src/seed/starterData.ts` — Seed word list & roles

### Frontend
- `frontend/src/services/api.ts` — API client
- `frontend/src/services/api.test.ts` — API client tests
- `frontend/src/state/roomStore.ts` — Client-side state store
- `frontend/src/pages/LobbyPage.tsx` — Lobby UI
- `frontend/src/pages/GamePage.tsx` — Game UI
- `frontend/src/pages/CreateRoomPage.tsx` — Create room UI
- `frontend/src/pages/JoinRoomPage.tsx` — Join room UI
- `frontend/src/components/GuessForm.tsx` — Guess input component
- `frontend/src/components/Scoreboard.tsx` — Score display component
- `frontend/src/components/ResultPanel.tsx` — Result display component
- `frontend/src/styles/app.css` — Styles
