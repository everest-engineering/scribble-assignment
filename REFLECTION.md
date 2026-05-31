# Reflection Report — Scribble Lab

## What did the starter app already have?

The starter was a runnable **brownfield scaffold**, not a finished game. It gave a solid foundation to build on:

- **Stack**: Vite + React + TypeScript frontend, Node.js + Express + TypeScript backend, all in-memory (no database, WebSockets, or auth).
- **App shell**: Routing across Start, Create Room, Join Room, Lobby, and Game screens, plus shared UI components (cards, headers, badges) and light styling.
- **Basic room API**: `POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code` with an in-memory `roomStore`.
- **Partial flows**: Create and join room worked enough to land in the lobby; a manual “Refresh Room” button could fetch the latest snapshot.
- **Seed data**: A fixed word list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and role labels (`drawer`, `guesser`).
- **Placeholders only**: The game screen showed static areas for canvas, guess input, scoreboard, and results — none were wired to real behavior.

Importantly, the starter did **not** implement host permissions, polling, starting a game, drawer assignment, secret-word rules, drawing, guessing, scoring, result state, or restart.

## What did you add?

Work proceeded in four Spec Kit scenarios, each with spec → plan → tasks → implement → validate artifacts under `specs/`.

### Scenario 1 — Room Setup & Lobby

- **Host tracking** on room creation (`hostId` on the room model).
- **Join validation** with trimmed names, room-code format checks, and clear error messages for invalid codes or games already in progress.
- **Automatic lobby polling** (~2 s) so all tabs stay in sync without relying on manual refresh.
- **Host-only start game** with a two-player minimum; non-hosts see a waiting message.
- **Route guards** so clients auto-navigate to the game screen when polling detects `playing` status.

### Scenario 2 — Game Start & Drawer Flow

- **`POST /rooms/:code/start`** endpoint and Zod validation for player names.
- **Extended room model**: `drawerId`, `secretWord`, `scores`, and `RoomStatus` (`lobby` | `playing`).
- **Deterministic word selection** from the starter list via `wordSelection.ts`.
- **Drawer-only secret word visibility** in `toRoomSnapshot()`; guessers never receive the word during play.
- **Game UI** showing drawer identity and the secret word only to the drawer.

### Scenario 3 — Gameplay Interaction

- **Drawing API**: `POST /rooms/:code/drawing/strokes` and `POST /rooms/:code/drawing/clear` (drawer-only).
- **Guess API**: `POST /rooms/:code/guess` with trim, empty rejection, and case-insensitive comparison via `guessService.ts`.
- **Interactive `DrawingCanvas`**, synced strokes, `GuessForm`, `GuessHistory`, and a live `Scoreboard`.
- **Game polling** (~2 s) so guess history, scores, and canvas state stay aligned across tabs.
- **Scoring**: +100 for a correct guess, 0 for incorrect.

### Scenario 4 — Result, Restart & Final Validation

- **`result` room status** set on the first correct guess; draw and guess mutations blocked afterward.
- **Shared result snapshot**: all players see the secret word, final scores, guess history, and strokes.
- **`ResultPage`** at `/result` with polling and route guards from game/lobby.
- **`POST /rooms/:code/restart`** (host-only): clears round state, preserves participants, returns everyone to the lobby.

### Cross-cutting additions

- **Spec Kit artifacts**: constitution, four feature specs, plans, task lists, API contracts, data models, quickstart checklists, and discovery notes.
- **Tests**: Vitest coverage for `roomStore`, schemas, guess evaluation, and word selection (18 backend + 2 frontend tests at completion).
- **Git workflow**: Feature branches per scenario (`001-` through `004-`), merged incrementally into `scribble-lab`.

## Workflow reflections

**Spec Kit as the driver.** Treating the game as the vehicle and the spec as the source of truth kept scope bounded. Clarification steps (e.g., join-after-start rejection, host labeling, auto-navigation on poll) prevented rework later.

**Brownfield discipline.** Extending `roomStore.ts`, existing pages, and the API router was faster and safer than rewriting. Conflicts when merging parallel scenario branches were resolved by keeping the most complete implementation layer (Scenarios 3–4) while preserving useful starter utilities (e.g., richer room-code validation).

**HTTP polling tradeoff.** Polling at ~2 s is simple and matches lab constraints, but navigation and state updates are eventually consistent. Route guards on each page (`LobbyPage`, `GamePage`, `ResultPage`) compensate by redirecting when polled status changes.

**AI-assisted development.** AI was most useful for boilerplate aligned to the plan (Zod schemas, test cases, component wiring) and for maintaining consistency across backend/frontend types. Human review mattered most at merge boundaries, acceptance-criteria validation, and edge cases (e.g., drawer rejection during `playing` vs. `not_playing` after round end).

## Outcome

The lab delivers a full single-round flow: two browser tabs can create/join a room, start a game, draw and guess with synced state, see a shared result, and restart to a clean lobby — all via REST and in-memory storage, with behavior traceable to written acceptance criteria.
