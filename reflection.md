# Reflection Report — Round Results & Play Again

## What did the starter app already have?

The starter app (up to commit `f02bb3ef`) provided the full project skeleton with:

- **Backend**: Express server with TypeScript, Zod validation schemas, basic Room model (`game.ts`), starter data seed, and a `roomStore` service with `createRoom`, `joinRoom`, and `leaveRoom` functions. Tests were set up with Vitest.
- **Frontend**: React 18 + Vite + TypeScript, React Router v6 routing, a `RoomStore` class-based state management system with `useSyncExternalStore`, an API client module, and page shells (`CreateRoomPage`, `JoinRoomPage`, `LobbyPage`, `GamePage`, `StartPage`). UI components like `Card`, `AppShell`, `PageHeader`, `RoomCodeBadge`, `Scoreboard`, `GuessForm`, and `ResultPanel` existed as empty or minimal shells.
- **Testing**: Both backend and frontend had test infrastructure in place (Vitest, basic test examples).

The app was a non-functional skeleton — the pages were stubs, the game logic was missing, and there was no interactive gameplay.

## What did we add?

Over 4 feature increments (commits `6f64c1c` → `402d1e4`), we built the complete multiplayer drawing game:

### 1. Room Setup & Lobby (commit `6f64c1c`)
- **Backend**: Implemented full room creation with unique 4-character codes, join validation (duplicate names, length limits, empty names), leave handling with host reassignment and drawer reassignment.
- **Frontend**: Built `CreateRoomPage`, `JoinRoomPage`, and `LobbyPage` with proper form validation. Added `ParticipantList` component. Implemented HTTP polling (2-second interval) for room state sync. Added `leaveGame` flow back to start page.
- **Tests**: Wrote tests for create/join/leave flows, edge cases (duplicate names, empty names, full rooms, host migration).

### 2. Game Start & Drawer Assignment (commit `ecbeae3`)
- **Backend**: Added `startGame()` with guards (host-only, minimum 2 players), deterministic drawer selection (earliest-joined), and secret word selection via hashed participant IDs. Added `revealWord()` for the drawer to manually end the round.
- **Frontend**: Wired the "Start Game" button on the lobby, navigation redirects from lobby to game page on start, polling-based state transitions. Added `GamePage` layout with role badge display.
- **Tests**: Wrote tests for start game validation, drawer assignment, word selection, and reveal word guards.

### 3. Gameplay Interaction (commit `1b66a8a`)
- **Backend**: Added `submitStrokes()`, `clearCanvas()`, `getStrokes()`, and `submitGuess()` with Zod validation. Implemented scoring (1 point per correct guess), auto-round-end when all guessers guess correctly, and `toRoomSnapshot()` for role-aware response shaping (secret word hidden from guessers during play).
- **Frontend**: Built the `DrawingCanvas` component (freehand drawing with color/width controls, clear button). Built the `GuessForm` component with feedback display. Added `Scoreboard` and `ResultPanel` to the game page sidebar. Implemented stroke polling and real-time canvas updates.
- **Tests**: Wrote tests for stroke submission, canvas clearing, guess correctness, auto round-end, stroke rejection after round ends.

### 4. Round Results & Play Again (commit `402d1e4`)
- **Backend**: Renamed status `"round_ended"` → `"results"` across all types and logic. Added `playAgain()` function that resets round state (strokes, guesses, scores, drawer, word) while preserving the player roster. Idempotent — safe to call multiple times.
- **Frontend**: Updated `GamePage` to show results view (secret word revealed to all, canvas replaced with word display, status label "Results"). Added "Play Again" button visible to all players, wired to the new `playAgain` API endpoint.
- **Routes/API**: Added `POST /:code/play-again` endpoint with Zod validation. Added `playAgain()` to frontend API client and store.
- **Tests**: 7 new tests covering reset, player preservation, idempotency, non-participant rejection, and new-game-after-restart.

## Key architectural decisions

- **No WebSockets**: All state sync uses HTTP polling (2-second intervals), keeping the architecture simple.
- **In-memory storage**: No database — all room state lives in a `Map` in `roomStore.ts`.
- **Role-aware responses**: `toRoomSnapshot()` conditionally includes `secretWord` based on viewer role and room status.
- **Centralized validation**: All request bodies validated with Zod schemas before reaching business logic.
- **Class-based store on frontend**: `RoomStore` uses the observer pattern with `useSyncExternalStore` for React integration, avoiding external state management libraries.
