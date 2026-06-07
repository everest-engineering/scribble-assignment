# Discovery Notes — Scribble Lab

## Incomplete Behaviors (≥3)

### 1. No Game Start Flow
- Backend `RoomStatus` is only `"lobby"` — no `"playing"`, `"roundEnd"`, or `"gameOver"`.
- No `POST /rooms/:code/start` endpoint exists.
- Frontend "Start Game" button in `LobbyPage` navigates to `/game` without any API call.
- No drawer assignment or word selection logic exists.
- No host tracking — any participant could theoretically start the game.

### 2. No Drawing Interaction
- Canvas on `GamePage` is a placeholder `<div>` with text `"Waiting for drawer..."` — no actual `<canvas>` element.
- No drawing tools, brush strokes, color selection, or clear canvas functionality.
- No backend endpoint to submit or retrieve drawing data.
- No mechanism to sync the canvas from drawer to guessers.

### 3. No Guess Submission or Validation
- `GuessForm.handleSubmit` calls `event.preventDefault()` and does nothing else — no API call.
- No `POST /rooms/:code/guess` backend endpoint exists.
- No guess history stored on the room model or synced to players.
- No case-insensitive comparison logic against the secret word.

### 4. No Scoring or Results
- `Participant` has no `score` field in the data model.
- `Scoreboard` component displays hardcoded `"Waiting for players..."` — not connected to any data.
- `ResultPanel` shows static text `"Game activity and guesses will appear here."`
- No result/end-of-round state displayed when a round concludes.
- No restart functionality to play again.

## Assumptions (≥2)

### 1. Polling-Based Sync
Per AGENTS.md (`"No WebSockets: All sync must use HTTP polling"`), the game must use periodic HTTP polling (~2s interval) to sync state between players. The `fetchRoom` method in `LobbyPage` (manual refresh button) demonstrates the pattern but is not yet automated.

### 2. Deterministic Single-Round Model
The starter has one drawer and one guesser role (`STARTER_ROLES = ["drawer", "guesser"]`) and 5 fixed words. This suggests a simple single-round game: one player draws, the other guesses. The README scenarios confirm this: "play one round, see synced result, restart."

## Relevant Files

### Backend
| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Type definitions (Participant, Room, RoomSnapshot, RoomStatus) |
| `backend/src/services/roomStore.ts` | In-memory room CRUD, snapshot generation |
| `backend/src/api/rooms.ts` | Route handlers for room operations |
| `backend/src/api/schemas.ts` | Zod validation schemas, HttpError class |
| `backend/src/seed/starterData.ts` | Starter words and role definitions |
| `backend/src/api/router.ts` | API router, error/not-found handlers |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/services/api.ts` | API client and response types |
| `frontend/src/state/roomStore.ts` | React Context + useSyncExternalStore state |
| `frontend/src/pages/LobbyPage.tsx` | Lobby with participant list, refresh, start button |
| `frontend/src/pages/GamePage.tsx` | Game screen with canvas, scoreboard, guess form, results |
| `frontend/src/components/GuessForm.tsx` | Guess input form (empty handler) |
| `frontend/src/components/Scoreboard.tsx` | Score display (static placeholder) |
| `frontend/src/components/ResultPanel.tsx` | Activity/results panel (static placeholder) |
