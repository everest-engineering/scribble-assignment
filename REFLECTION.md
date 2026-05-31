# Reflection Report

## What did the starter app already have?

The starter provided a working app shell with routing between all screens (Start, Create Room, Join Room, Lobby, Game), a branded landing page, room creation and join flows with unique 4-character room codes, an in-memory room store on the backend with three API endpoints (`POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`), lobby participant display, seed data (5 words, 2 roles), and placeholder components for the game screen (canvas, guess input, scoreboard, result panel). Vitest test setups existed in both backend and frontend with 4 seed tests.

## What did you add?

### Spec Kit Artifacts
8 artifacts totalling ~870 lines: discovery notes (5 gaps, 4 assumptions, full file index), constitution (engineering principles, AI rules, review discipline), 4 specification files per scenario (35 acceptance criteria + edge cases), plan (state model, data flow, file-level plan), and tasks (40+ ordered items mapped to acceptance criteria).

### Scenario 1 — Room Setup & Lobby
- `hostId` tracking on Room model, set on creation
- Zod-based player name validation (trimmed, rejects empty/whitespace-only)
- Clear error messages ("Room not found") for invalid room codes
- `POST /rooms/:code/start` with host-only guard + 2-player minimum
- Frontend lobby auto-polling (2s interval), host badge in participant list, Start Game button gated
- Client-side name/code trimming and validation on Create/Join forms

### Scenario 2 — Game Start & Drawer Flow
- `Guess`, `Stroke` types and game-round fields on Room (`drawerId`, `secretWord`, `guesses`, `scores`, `strokes`)
- Deterministic word selection (charCode hash of room code)
- Drawer = host assignment with scores initialised to 0
- Viewer-based `toRoomSnapshot` filtering — secret word visible only to drawer (or when finished)
- Frontend role badge and conditional word/guess form rendering

### Scenario 3 — Gameplay Interaction
- `submitGuess()` with trim, case-insensitive comparison, 100-point scoring, history recording
- `saveStrokes()` for canvas data sync via polling
- `POST /rooms/:code/guess` and `POST /rooms/:code/strokes` endpoints
- Guards: drawer cannot guess, duplicate correct scores 0, empty rejected, finished-round rejection
- HTML5 Canvas component with mouse drawing + Clear Canvas button
- Wire GuessForm, Scoreboard, and ResultPanel to live API data

### Scenario 4 — Result, Restart & Final Validation
- `restartGame()` — resets all round state (`drawerId`, `secretWord`, `guesses`, `scores`, `strokes`), preserves participants, host-only
- `POST /rooms/:code/restart` endpoint
- GamePage detects `"finished"` status, shows final word/scores/history
- Restart button for host, auto-navigation to lobby via polling
- GuessForm disabled when round is over

## Key Decisions

- **Drawer = host**: Simplest deterministic assignment that avoids drawer-rotation (out of scope)
- **2s polling interval**: Matches spec guidance, simple `setInterval` with cleanup on unmount
- **Word selection by room code hash**: Deterministic across clients without extra endpoint
- **Canvas strokes via REST**: Entire stroke array sent on `mouseup` rather than per-point; keeps request count low
- **All guessers correct → finish**: Automatic round-end detection; no timer or manual end needed
- **HttpError in models**: Moved from schemas to models to avoid circular import

## AI Usage & Tradeoffs

- AI assisted with drafting spec artifacts, generating test cases, and implementing boilerplate (routes, schemas, store methods)
- Every AI-suggested change was reviewed for correctness against acceptance criteria
- **Tradeoff — Canvas implementation**: AI-generated Canvas component uses imperative Canvas 2D API rather than a library like Fabric.js or Konva. This keeps the bundle small and avoids extra dependencies but makes features like undo/redo or shape tools harder to add later.
- **Tradeoff — Polling vs WebSockets**: HTTP polling at 2s intervals was chosen over WebSockets (explicitly forbidden). This simplifies the stack and deployment but introduces ~2s latency between draw actions and guessers seeing them. For a drawing game, this means the drawer's strokes appear on guessers' screens with a noticeable delay.
- **Tradeoff — In-memory storage**: All room state lives in a `Map` in the server process. This avoids database setup and makes the code easy to reason about, but means all game state is lost on server restart and rooms cannot survive across server instances.
- **Tradeoff — Stroke sync strategy**: Strokes are sent as a complete array on `mouseup` rather than streaming individual points. This reduces HTTP request volume significantly but means partial strokes are not visible to guessers until the drawer lifts the mouse.
- **Tradeoff — Single round with host-restart**: The game supports one round per game session, with the host manually restarting to play again. This is simpler than implementing full multi-round support with drawer rotation but means players must explicitly restart after each round.

## What Would I Do Differently

- Add a `hasGuessedCorrectly` per-participant flag on the room to simplify duplicate-guess detection
- Use a debounced stroke save (every ~500ms while drawing) rather than per-stroke-end to give guessers more real-time feedback
- Write more comprehensive frontend component tests (beyond API service tests) — e.g., test that DrawingCanvas renders strokes or GuessForm rejects empty input
- Add a loading spinner during game start transition to improve UX
- Use a more robust polling strategy with back-off on error rather than a fixed 2s interval

## Test Results (Final)

- Backend: 48 tests passing, build clean
- Frontend: 6 tests passing, build clean
- Manual E2E verified with 2 browser tabs across all 4 scenarios
