# Reflection: Scribble Drawing Game

**Author**: Vickey (vigneshwaran.natarajan@everest.engineering)
**Role**: Fullstack Engineer

---

## What the Starter Had

- Express backend with in-memory room store (create/join/get)
- React frontend with 4 pages (Start, Create, Join, Lobby) and a stubbed Game page
- Shared type definitions for `Participant`, `Room`, `RoomSnapshot`
- Placeholder `DrawingCanvas`, `GuessForm`, `Scoreboard`, `ResultPanel` components
- Vitest test suites (2 backend + 2 frontend tests)
- A critical bug: frontend `API_BASE_URL` pointed to `http://localhost:3001/bug`

---

## What Was Added

### Backend
- **Model expansion**: `RoomStatus` extended to `"lobby" | "playing" | "result"`; `Guess` type added; `Room`/`RoomSnapshot` extended with `hostId`, `drawer`, `secretWord`, `canvasData`, `guesses`, `scores`
- **Schema tightening**: `playerName` changed from optional to `z.string().trim().min(1)` in both create/join schemas; added `startGameSchema`, `canvasUpdateSchema`, `submitGuessSchema`, `gameActionSchema`
- **Service functions**: `startGame` (host guard, player count guard, drawer assignment, word selection), `updateCanvas` (drawer-only), `submitGuess` (drawer blocked, no double-score, 100pts correct), `endGame`, `restartGame` (preserves participants/hostId, clears round state)
- **API routes**: `POST /:code/start`, `POST /:code/canvas`, `POST /:code/guess`, `POST /:code/end`, `POST /:code/restart`
- **secretWord visibility**: only drawer or result-state viewers see the word in `toRoomSnapshot`
- **Test coverage**: 29 tests covering all service functions, edge cases, and schema validation

### Frontend
- **Type alignment**: `RoomSnapshot` updated to match backend; `Guess` interface added; all new API methods added
- **State store**: `startGame`, `submitGuess`, `updateCanvas`, `endGame`, `restartGame` actions added
- **LobbyPage**: auto-poll every 2s, host-only Start button (disabled < 2 players), auto-navigate on status=playing
- **CreateRoomPage / JoinRoomPage**: client-side name guard before API call
- **DrawingCanvas**: canvas element with mouse-event drawing, `canDraw` gate, `onStrokeEnd` callback, Clear button, image-load for guesser view
- **GuessForm**: `onSubmit` prop, empty-guess guard, input clear on success, disabled when drawer
- **Scoreboard**: live participant scores from `room.scores`
- **ResultPanel**: result-state panel showing secret word, per-player scores, ordered guess history with correct/incorrect indicator
- **GamePage**: role-aware kicker + secret word display, polling while playing, host End Round/Play Again controls, auto-navigate to lobby on restart

---

## Tradeoffs

| Decision | Tradeoff |
|----------|----------|
| In-memory store (Map) | Zero setup, but state lost on server restart; acceptable for assignment scope |
| Polling at 2s intervals | Simple and reliable; WebSockets would cut latency but add significant complexity |
| Single drawer = participants[0] | Deterministic and testable; random selection would be more fair in a real game |
| Per-player independent scoring | Two guessers can each score 100; more fair, aligns with spec FR-013 |

---

## AI Usage

Used Claude Code (speckit workflow) to:
- Generate spec, plan, data model, and API contracts from a natural language description
- Generate the tasks.md implementation plan
- Execute implementation across all 4 user stories

All generated code was reviewed for correctness before committing. Test-first approach used for all service functions.

---

## Deviations from Spec

- **No WebSocket support**: spec mentions polling as acceptable; 2s polling implemented
- **`toRoomSnapshot` includes `availableWords` and `roles`**: retained from starter; spec does not require removal
- **`restartGame` resets scores to `{}`**: spec says "zero state" which is interpreted as empty map (not zeros for each participant, since they can re-join)
