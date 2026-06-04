# Reflection Report

## What did the starter app already have?

The starter provided a functional but minimal scaffolding:

- **App shell** with React Router v6 — routes for Start, Create Room, Join Room, Lobby, and Game pages
- **Create/Join room flow** — `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` endpoints with in-memory storage
- **Lobby** — displayed room code and participant list, with a manual refresh button
- **Game screen placeholders** — styled `<div>` for canvas, non-functional guess form, empty scoreboard and result panel
- **Seed data** — 5 words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and 2 roles (`drawer`, `guesser`)
- **Basic UI styling** — Scribble branding, card components, page headers
- **Zod schemas** — minimal validation (playerName was optional)
- **Frontend state management** — a reactive store class with `useSyncExternalStore`

## What did you add?

I implemented all four required scenarios incrementally:

### Scenario 1 — Room Setup & Lobby
- **Host tracking**: `hostId` on Room, set on creation
- **Name validation**: frontend trim check before submit, backend Zod `min(1)` + trim transform
- **Room code validation**: empty code rejected with message
- **Auto-polling**: `setInterval(fetchRoom, 2000)` in LobbyPage, cleaned up on unmount
- **Host-only start**: Start button only visible to host, disabled with message when <2 players
- **Start endpoint**: `POST /rooms/:code/start` with host and player-count gates

### Scenario 2 — Game Start & Drawer Flow
- **Drawer assignment**: host becomes drawer (`drawerId = hostId`)
- **Secret word**: deterministic from `STARTER_WORDS[0]` ("rocket")
- **Word visibility**: `toRoomSnapshot` gates `secretWord` — only visible to drawer
- **Role indicator**: GamePage shows "Drawer" or "Guesser" role badge

### Scenario 3 — Gameplay Interaction
- **Interactive canvas**: `Canvas.tsx` component with mouse drawing, stroke array storage
- **Draw/clear endpoints**: `POST /rooms/:code/draw`, `POST /rooms/:code/clear` with drawer-only authorization
- **Guess submission**: `POST /rooms/:code/guess` with trim validation, case-insensitive comparison
- **Scoring**: 100 points for correct guess, 0 for incorrect
- **Guess history**: synced via polling, displayed in ResultPanel with correct/incorrect markers
- **Scoreboard**: live scores from `RoomSnapshot.scores`

### Scenario 4 — Result, Restart & Final Validation
- **Result state**: on correct guess, status="result", word revealed to all players
- **Restart endpoint**: `POST /rooms/:code/restart` resets round state (strokes, guesses, scores, secretWord) but preserves participants
- **Play Again button**: host-only, navigates all players back to lobby via polling

## Spec Kit Discipline

The Spec Kit workflow (constitution → specify → plan → tasks → implement → validate) forced me to think before coding. Writing acceptance criteria first caught edge cases I would have missed (e.g., case-insensitive guess comparison, host-only restart). The constitution's "no WebSockets, databases, or auth" rule kept the implementation focused and prevented scope creep.

## AI Usage

I used the AI assistant to:
- Generate initial spec/plan/task files from templates
- Scaffold backend store methods (addStroke, clearStrokes, submitGuess)
- Create the Canvas component with mouse event handling
- Wire frontend components to the store

Each AI-generated output was reviewed before committing. The largest deviation was the Canvas component — the AI initially produced a non-functional version that I corrected by adjusting the mouse coordinate calculation and stroke rendering.

## Trade-offs

- **Single round only**: No drawer rotation or multiple rounds (per spec). This simplifies the state model significantly.
- **Host is always drawer**: Deterministic but not balanced. Works for a single-round learning exercise.
- **Polling at 2s interval**: Good enough for a lab, but real-time games would need WebSockets (explicitly out of scope).
- **In-memory only**: Room state vanishes on server restart. Acceptable since databases are out of scope.
- **No host migration**: If the host leaves during a result state, the game is stuck. Out of scope per spec.
- **Stroke sync via polling**: Drawing appears with ~2s latency. Sufficient for the lab's educational purpose.

## What I'd Do Differently

- Add a loading state to the "Play Again" button to prevent double-clicks
- Debounce stroke submissions to reduce network traffic during rapid drawing
- Add the `ParticipantRole` type to differentiate drawer/guesser more explicitly in the snapshot (currently inferred from `drawerId` comparison)
