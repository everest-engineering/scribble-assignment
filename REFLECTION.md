# REFLECTION — Scribble Assignment

## What the starter app already had

The starter app was a scaffold-only drawing game with minimal functionality:

**Backend:**
- Express + TypeScript + Zod setup with a `GET /health` endpoint
- `POST /rooms` — Create a room (playerName optional, defaults to "Player")
- `POST /rooms/:code/join` — Join a room by code (no name validation)
- `GET /rooms/:code` — Fetch room snapshot
- In-memory `Map<string, Room>` storage with code generation (4 chars)
- `Room` model: only `code`, `status: "lobby"`, `participants`, `createdAt`, `updatedAt`
- Starter seed data: 5 words, 2 roles
- **No** host concept, drawer selection, secret word, scores, guess history, canvas, or cleanup

**Frontend:**
- React 18 + Vite + TypeScript + React Router v6
- `AppShell` with branding, `StartPage` with Create/Join buttons
- `CreateRoomPage` / `JoinRoomPage` — basic forms with no loading states
- `LobbyPage` — manual "Refresh Room" button (no polling)
- `GamePage` — complete placeholder: canvas div, non-functional `GuessForm` ("Placeholder Submit"), static `Scoreboard` / `ResultPanel` with placeholder text
- `RoomStore` — only `createRoom`, `joinRoom`, `fetchRoom`
- Routes: `/`, `/create-room`, `/join-room`, `/lobby`, `/game` (no `/results`)

## What was added (3 feature increments)

### 1. Room Setup & Lobby

**Backend:** Added `hostId`, `"playing"` status, `startGame()` (host guard, 2-player minimum, status transition), `joinRoomById()` for reconnection, duplicate-name rejection (409), cleanup service (60s interval, 5min idle timeout), `POST /:code/start` endpoint.

**Frontend:** Added `startGame()` to store/api, 2s polling on `LobbyPage`, host badge, start button gating (host-only, 2+ players), loading states on forms, client-side room code validation (4 chars, uppercase), user-friendly error messages.

### 2. Game Start & Drawer Flow

**Backend:** Added `drawerId` and `secretWord` to `Room`, `djb2Hash()` for deterministic word selection from room code, `selectSecretWord()`, drawer-only secret word visibility in snapshots, `playerNameSchema` (1–15 chars, alphanumeric + limited punctuation).

**Frontend:** `GamePage` shows drawer indicator, secret word (drawer only), drawer name (guessers); 2s polling for status changes.

### 3. Gameplay Interaction

**Backend:** Added `CanvasAction` (stroke | clear), `GuessEntry`, `scores` map, `roundOver` flag. Endpoints: `POST /:code/canvas` (drawer-only), `POST /:code/guess` (case-insensitive match). Scoring: 100 correct / 0 incorrect, duplicate rejection. `startGame()` initializes scores.

**Frontend:** `DrawingCanvas` component with native HTML5 Canvas API (drawer draws, guessers replay), wired `GuessForm` with correct/incorrect feedback, live `Scoreboard`, `ResultPanel` activity feed, round-over banner, 2s polling.

### 4. Round Result & Restart

**Backend:** Added `"results"` status, auto-transition when all guessers score 100, `restartGame()` (host-only, clears round data, preserves participants), `POST /:code/restart` endpoint, secret word revealed to all in results phase.

**Frontend:** `ResultsPage` with word reveal, ranked scores, guess history; host "Restart Game" button; non-host "Waiting for host" message; 2s polling detects restart (→ lobby) or new game (→ game). `LobbyPage` shows "Round in results" status. `GamePage` navigates to `/results` on status change. `/results` route added.

## How Speckit helped

The **spec → clarify → plan → tasks → analyse → implement** workflow was the backbone of every feature increment. Here's how each phase added value:

- **Spec**: Writing a formal spec forced me to articulate what the feature should do before writing any code. The spec template's structured sections (user stories, acceptance scenarios, edge cases, functional requirements) ensured nothing was glossed over.
- **Clarify**: The Q&A sessions within each spec surfaced assumptions I hadn't considered — like how mid-round joiners should appear on results (0 score, empty guess history), whether a new round auto-starts after restart (no, host must manually start), or how restart request failures should be handled (inline error, no auto-retry). Catching these before implementation saved significant rework.
- **Plan**: The plan.md translated the spec into a concrete implementation strategy. It identified which files to touch, what new types were needed, and the order of changes (backend-first, then frontend). This made execution straightforward rather than exploratory.
- **Tasks**: Breaking the plan into granular, ordered tasks made progress visible and predictable. Each task was small enough to implement and test in one sitting, and the checklist format made it easy to track what was done vs pending.
- **Analyse/Research**: The research phase in early specs validated technology choices (e.g., confirming that `useSyncExternalStore` was the right React pattern, exploring how to structure the canvas action types). The analysis in later specs was lighter since patterns were already established.
- **Implement → Validate**: Having clear acceptance criteria meant I knew exactly when a feature was done. The constitution's principle of incremental validation prevented scope creep and caught regressions early.

Beyond the workflow, Speckit's **constitution** was invaluable. It codified hard constraints (no WebSockets, no databases, no auth) that I'd otherwise have to remember or rediscover. Every time I was tempted to reach for a real-time push or a database, the constitution was a clear "no" that kept the project aligned with lab requirements.

The artifact trail — specs, plans, data models, contracts — also served as living documentation. When coming back to a feature after a gap (e.g., returning to the project for gameplay after the lobby was done), reading the data-model.md and contracts was faster than re-reading all the code.

## Other notable aspects

- **State management:** Custom `RoomStore` class via Context + `useSyncExternalStore` — no external state libraries.
- **Testing:** Vitest with real Express servers on random ports (integration), store unit tests, schema validation tests — ~1000 lines of tests across backend and frontend.
- **Deterministic word selection:** DJB2 hash of room code pick words idempotently.
- **Spec artifacts:** Each feature has a corresponding `specs/00X-*/` directory tracking the full workflow (spec, plan, tasks, research, data-model, contracts, checklists).
- **No real-time / no database / no authentication:** All sync is HTTP polling (2s), all data is in-memory, no auth — as strictly mandated.
