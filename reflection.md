# Reflection Report

## What did the starter app already have?

The scaffold (commit `4568311`) provided a bare multiplayer game skeleton:

**Backend** (`backend/src/`):
- Express + TypeScript server with routing setup
- In-memory room store (`roomStore.ts`) — `createRoom()`, room lookup, but no game logic
- Room model with `status: "lobby"`, participants list, no round state
- Starter word list and role definitions in `starterData.ts`
- Zod validation schemas boilerplate

**Frontend** (`frontend/src/`):
- Vite + React 18 + React Router v6 SPA
- Pages: Start, CreateRoom, JoinRoom, Lobby, GamePage (empty shell)
- Components: AppShell, GuessForm (empty), ResultPanel (empty), Scoreboard (empty)
- `roomStore.ts` with Context API + `useSyncExternalStore` for state management
- `api.ts` with generic `request<T>()` helper
- Routing with `react-router-dom` v6

**What was missing**: No game loop. Rooms were stuck in "lobby" — no start game, no roles, no rounds, no drawing, no guessing, no scoring.

---

## What did we add?

### Feature 001 — Room Setup & Lobby *(pre-existing, not in scope)*
- Room code generation and join validation
- `LobbyPage` with participant list rendering + join flow

### Feature 002 — Start Game & Roles *(pre-existing, not in scope)*
- `RoomStatus: "in-progress" | "finished"`
- `startGame()` service: random drawer assignment, word picking
- `selectWord()`: drawer picks from 3 options, phase transitions to drawing
- `RoundState` model with `drawerId`, `guesserIds`, `secretWord`, `phase`
- `POST /rooms/:code/start` and `POST /rooms/:code/select-word` routes
- `DrawerWordSelect` page component

### Feature 003 — Drawing & Guessing (our work)
**Types & Models**:
- `Point`, `Stroke`, `Guess` interfaces in `game.ts` + `api.ts`
- Extended `RoundState` with `strokes: Stroke[]`, `guesses: Guess[]`
- Extended `RoomSnapshot` with strokes and guesses arrays
- `RoundPhase: "word-selection" | "drawing"`

**Backend Services**:
- `addStroke()`: validates drawer + drawing phase, appends strokes to round state
- `submitGuess()`: validates guesser, case-insensitive comparison against secret word, rejects already-correct guessers, returns `{ correct: boolean }`
- `clearStrokes()`: empties stroke array (for accidental drawings)
- `toRoomSnapshot()` visibility filtering: drawer sees `isCorrect = null` for guesses, guessers see only their own correctness

**Backend Routes**:
- `POST /:code/strokes` — stroke submission with validation
- `POST /:code/guess` — guess submission with validation
- `POST /:code/clear-strokes` — clear canvas (403 for non-drawer)

**Frontend Components**:
- `DrawingCanvas.tsx` — Pointer event handling (down/move/up), normalized coordinates (0-1), local rendering, read-only mode for guessers, "Clear Canvas" button for drawer
- `GuessForm.tsx` — Enhanced with submission callback and feedback display
- `GamePage.tsx` — Phase-based rendering (word selection → drawing → result), 500ms polling during drawing, canvas for drawer (editable) + guessers (read-only), guess form + guess list


### Feature 004 — Post Game Experience (our work)
**Types & Models**:
- `RoundPhase: "word-selection" | "drawing" | "finished"` (added `"finished"`)

**Backend Services**:
- `submitGuess()` now transitions phase to `"finished"` on correct guess
- Phase checks in `addStroke()` + `submitGuess()` reject submissions when finished
- `toRoomSnapshot()` reveals `secretWord` and all `isCorrect` values when `phase === "finished"`
- `restartGame()`: validates host + finished phase, resets to lobby, retains participants

**Backend Routes**:
- `POST /:code/restart` — host-only restart (403 for non-host)
- Finished-phase error handling for strokes/guess routes

**Frontend**:
- Result screen on `phase === "finished"`: secret word visible to all, player standings (correct/incorrect/no guess), complete guess log with correctness indicators, final drawing canvas, "Play Again" button for host only
- `useEffect` navigates to `/lobby` when room status transitions to `"lobby"` (post-restart)
- `api.restartGame()`, `store.restartGame()`

---

## Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Sync mechanism | HTTP short-polling (500ms-2s) | Constitution constraint; no WebSockets |
| Canvas coordinates | Normalized 0-1 | Resolution-independent rendering |
| Guess visibility | Per-viewer filtering | Drawer must not see correctness of guesses |
| State management | In-memory `Map` + Context API | No databases per constitution |
| Round-end trigger | First correct guess transitions phase | MVP for this feature set; scoring/scoped out |
| Restart | Host-only, resets round but retains participants | Enables continuous play without room re-creation |
