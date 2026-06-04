# Discovery Notes

## Incomplete Behaviors

1. **No host tracking**: The `Room` model has no `hostId` field. The creator (`createRoom`) returns a `participantId` but it is not stored as the host. `toRoomSnapshot` ignores the `viewerParticipantId` parameter entirely, meaning no participant-specific views exist.

2. **No game lifecycle**: `RoomStatus` only has `"lobby"`. There is no mechanism to start a game (assign drawer, pick word), play a round (submit guesses, track scores), or finish a round (reveal answers). `GuessForm.handleSubmit` is an empty function. `Scoreboard` and `ResultPanel` show only placeholder text.

3. **No canvas drawing**: There is no drawing canvas component. The `GamePage` shows a `<div className="canvas-placeholder">` with text "Waiting for drawer...". No drawing data flows between clients.

4. **No auto-polling**: `LobbyPage` has a manual "Refresh Room" button but no automatic polling. The requirement specifies ~2 second polling for lobby updates.

5. **No name validation**: Player names are not trimmed. `displayName` defaults to `"Player"` when empty, but whitespace-only names or names with leading/trailing spaces are accepted as-is.

## Assumptions

1. **Frontend `API_BASE_URL` has a typo**: The default value is `"http://localhost:3001/bug"`. The `/bug` suffix appears unintentional since no route exists at that path. Assumed intended value is `"http://localhost:3001"`.

2. **Game lifecycle is single-round**: The starter data provides only one set of words and roles. The requirements mention rounds but only one round per game is described. No drawer rotation or multi-round logic is specified, so each game consists of exactly one round.

3. **Drawing is stored and polled via HTTP**: Since WebSockets are forbidden, drawing data (strokes) must be stored on the server and fetched by clients through the same polling mechanism used for room state.

4. **Canvas uses native HTML Canvas API**: No external canvas/drawing library is available in the dependencies. The implementation must use the native `CanvasRenderingContext2D` API.

## Relevant Files

### Backend
- `backend/src/models/game.ts` — Data types (Room, Participant, etc.)
- `backend/src/api/schemas.ts` — Zod request validation schemas
- `backend/src/api/rooms.ts` — Route handlers
- `backend/src/api/router.ts` — Express router setup, error handling
- `backend/src/services/roomStore.ts` — Business logic, in-memory room storage
- `backend/src/seed/starterData.ts` — Word list, role definitions
- `backend/src/api/schemas.test.ts` — Schema tests
- `backend/src/services/roomStore.test.ts` — Room store tests

### Frontend
- `frontend/src/services/api.ts` — API client, type definitions
- `frontend/src/services/api.test.ts` — API client tests
- `frontend/src/state/roomStore.ts` — State management (class-based store + React Context)
- `frontend/src/pages/LobbyPage.tsx` — Lobby page component
- `frontend/src/pages/GamePage.tsx` — Game page component
- `frontend/src/components/GuessForm.tsx` — Guess input form
- `frontend/src/components/Scoreboard.tsx` — Score display
- `frontend/src/components/ResultPanel.tsx` — Activity/guess history display
- `frontend/src/styles/app.css` — Application styles
