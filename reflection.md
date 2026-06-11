# Reflection Report

## What did the starter app already have?

The starter app provided:
- A working Vite + React + TypeScript frontend with routing (Start, Create Room, Join Room, Lobby, Game pages)
- An Express + TypeScript backend with in-memory room storage
- Room CRUD endpoints (create, join, fetch)
- Basic UI components (Card, PageHeader, AppShell, RoomCodeBadge)
- Placeholder components for GuessForm, Scoreboard, ResultPanel
- A canvas placeholder div
- Starter word list (rocket, pizza, castle, guitar, sunflower)
- Zod schemas for request validation
- Vitest test setup with a few passing tests
- CSS styling system with custom properties

## What did you add?

### Group 1 — Room Setup & Lobby
- **Host tracking**: Added `hostId` field to the Room model; `createRoom` assigns the creator's participant ID as host
- **Host-only start**: Backend `startGame` validates the requester is the host; frontend shows "Start Game" only to host
- **2-player minimum**: Backend rejects start with < 2 players; frontend shows "At least 2 players required" message
- **Auto-polling**: Added `startPolling`/`stopPolling` to RoomStore with 2-second interval; LobbyPage uses `usePolling` hook
- **Join validation**: Backend returns 404 "Room not found" for invalid codes; frontend displays error
- **Name validation**: Player names are trimmed; empty/whitespace-only names default to "Player"

### Group 2 — Game Start & Drawer Flow
- **Drawer assignment**: When game starts, the first participant (host) becomes the drawer
- **Secret word selection**: Deterministic word selection based on participant count (`(count-1) % words.length`)
- **Word visibility**: `toRoomSnapshot` only includes `secretWord` if viewer is the drawer or status is "result"
- **Drawer identification**: Game page shows "Drawer: Name" and "Your word: secret" banner for drawer

### Group 3 — Gameplay Interaction
- **DrawingCanvas component**: HTML5 canvas with mouse and touch support; strokes stored and serialized to data URL
- **Clear canvas**: Button to clear all strokes, syncs to server
- **Drawing sync**: Canvas data URL sent to server via POST /draw; all players receive it via polling
- **Guess submission**: GuessForm wired to API with client-side and server-side validation
- **Case-insensitive comparison**: `toLowerCase()` comparison on trimmed input
- **Empty guess rejection**: Zod schema `.trim().min(1)` + client check
- **Guess history**: Stored in room state, synced to all players via polling snapshot
- **Scoring**: Correct guess scores 100 points; incorrect adds 0
- **Round end on correct guess**: Room status transitions to "result" on correct guess
- **End Round button**: Drawer can manually end the round

### Group 4 — Result, Restart & Final Validation
- **Result view**: All players see the secret word, final scores, guess history when status = "result"
- **Final drawing display**: Canvas data URL rendered as image in result view
- **Host-only restart**: Backend validates host; frontend shows restart button only for host
- **Clean restart**: All round state cleared (drawing, guesses, scores, secretWord, drawerId); participants and host preserved; status returns to "lobby"
- **Auto-navigation**: Lobby auto-navigates to game when status changes to "playing"; game auto-navigates to lobby on restart

### Backend API Endpoints Added
- `POST /rooms/:code/start` — Start game (host-only, min 2 players)
- `POST /rooms/:code/guess` — Submit a guess
- `POST /rooms/:code/draw` — Save drawing data
- `POST /rooms/:code/clear` — Clear canvas
- `POST /rooms/:code/end-round` — End the current round
- `POST /rooms/:code/restart` — Restart game (host-only)

### Spec Kit Artifacts
- `discovery-notes.md` — 8 incomplete behaviors, 4 assumptions, 20 relevant files
- `speckit.constitution` — Engineering principles, AI rules, review discipline
- `speckit.specify` — 4 feature groups with acceptance criteria and edge cases
- `speckit.plan` — State model, data flow diagram, file-level plan
- `speckit.tasks` — Ordered task list with dependencies across 10 phases

## Key Decisions & Tradeoffs
- Used base64 data URL for drawing sync over HTTP polling (simplest approach; ~2s delay acceptable)
- Single round per game (out of scope for multiple rounds)
- Round ends on correct guess OR drawer-initiated "End Round" button
- No drawer rotation — host is always drawer (out of scope)
- Strokes stored client-side in ref array; only data URL sent to server
- No database — all in-memory as required
