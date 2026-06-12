# Reflection: Scribble Project

## What the Starter App Already Had

The scaffold provided project structure, tooling, and UI shell — **zero functional game logic**:

- **Backend**: Express + TypeScript + ES Modules server with route stubs, Zod schemas, model types (`game.ts`), empty `roomStore.ts`, and seed word data
- **Frontend**: React 18 + Vite shell with `AppShell`, `Card`, `PageHeader` components, `ResultPanel` placeholder, empty `roomStore.ts` (class-based pattern), empty `api.ts` (request helper), and page stubs (`StartPage`, `CreateRoomPage`, `JoinRoomPage`, `LobbyPage`, `GamePage`)
- **Testing**: Vitest setup
- **CI/CD**: GitHub Actions workflows for build & test

No room creation, joining, game logic, canvas, guessing, scoring, or results existed.

## What Each Scenario Added

### Scenario 1 — Room Setup & Lobby

The multiplayer foundation. Players host or join a room via a unique 4-character code. The creator becomes host. Lobbies poll at ~2s. Host can start with 2+ players.

**Added**: `createRoom`, `joinRoom`, `toRoomSnapshot` in backend; `CreateRoomPage`, `JoinRoomPage`, `LobbyPage`, `StartPage`, `RoomCodeBadge` in frontend; full room lifecycle CRUD with validation.

### Scenario 2 — Game Start & Drawer Flow

Host becomes drawer. A secret word is deterministically selected from the starter list. Player names are trimmed; empty names rejected. Secret word visible only to the drawer.

**Added**: `startGame`, `pickDeterministicWord`, `normalizePlayerName` in backend; drawer identification, secret word display in `GamePage`; host-only start gate.

### Scenario 3 — Gameplay Interaction

Active round mechanics. Drawer draws/clears canvas (data URL). Guessers submit guesses (trimmed, case-insensitive, empty rejected). Correct guess = 100 points. History synced via polling.

**Added**: `submitGuess`, `updateCanvasState` in backend; `Canvas`, `GuessForm`, `Scoreboard` components; full game layout with canvas/image display, guess list, scoreboard in `GamePage`; `Guess` model type.

### Scenario 4 — Result, Restart & Final Validation

Round closure. All players see correct word, sorted final scores, and full guess history when a round ends (via `"finished"` room status). Host-only restart clears round state while preserving participants, returning everyone to lobby.

**Added**: `"finished"` room status, `endedAt` field; `restartRoom` in backend; `ResultScreen` component with host-only restart button; restart wiring through store and API; backend + frontend tests; `canvasState` type fix (`object` → `string`).

## Complete API Surface

| Method | Endpoint | Purpose | Scenario |
|--------|----------|---------|----------|
| POST | `/rooms` | Create room | S1 |
| POST | `/rooms/:code/join` | Join room | S1 |
| GET | `/rooms/:code?participantId=` | Fetch room state (polling) | S1 |
| POST | `/rooms/:code/start?participantId=` | Start game | S2 |
| POST | `/rooms/:code/guess?participantId=` | Submit a guess | S3 |
| POST | `/rooms/:code/canvas?participantId=` | Update canvas state | S3 |
| POST | `/rooms/:code/restart` | Restart game (host-only) | S4 |
