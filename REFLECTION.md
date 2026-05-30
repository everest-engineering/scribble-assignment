# Reflection Report — Scribble Assignment

## 1. What Did the Starter App Already Have?

The starter (`main` branch) provided a working but intentionally incomplete scaffold:

- **Frontend**: Vite + React + TypeScript client with page routing (Start, Create Room, Join Room, Lobby, Game), branded landing page, placeholder UI components (Canvas, GuessForm, Scoreboard, ResultPanel as empty shells), and a room store with basic state management.
- **Backend**: Node.js + Express + TypeScript service with in-memory room storage (`Map<string, Room>`), three endpoints (`POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`), Zod schemas for validation, seed data (5 words, 2 roles), and a `RoomSnapshot` projection.
- **Room model**: `Room` with `code`, `status: "lobby"`, `participants[]` (no `isHost` flag), `createdAt`, `updatedAt`. No round/gameplay state.
- **Notably broken**: The frontend API base URL had a typo — `http://localhost:3001/bug` instead of `http://localhost:3001` — which broke all API calls.

## 2. What Did You Add?

Across 8 commits on the `assignment` branch, the following was built incrementally using a Spec Kit-driven workflow (constitution → spec → plan → tasks → implementation):

### Feature 1: Fix Room Lobby Flow (commit `5e2beb0`)
- Fixed the API base URL typo so frontend could reach the backend.
- Added inline form validation on Create Room and Join Room pages (empty/whitespace rejection).
- Wired `fetchRoom()` with the existing `withLoading()` helper for proper loading states.
- Added error display for lobby refresh failures.

### Feature 2: Room Setup & Lobby (commit `65f21d1`)
- Added `isHost: boolean` to `Participant` — creator is automatically host.
- Duplicate name discrimination (appends `(2)`, `(3)`, etc.).
- Rate limiting: 5 creates/min and 10 joins/min with proper error feedback.
- Auto-polling lobby refresh at ~2s interval via `setInterval` in `RoomStore`.
- Host-only "Start Game" button, disabled until 2+ players present.
- Host badge display in participant list.

### Feature 3: Game Start & Drawer Flow (commit `16ecc43`)
- Name validation on game start — empty/whitespace names trigger `"awaiting_rename"` state with inline correction UI.
- Host is assigned as the first drawer; drawer indicator component shows who is drawing.
- Deterministic word selection (`STARTER_WORDS[0] = "rocket"`).
- Server-side word filtering — only the drawer sees the secret word via `toRoomSnapshot`.
- Added `POST /rooms/:code/start`, `POST /rooms/:code/rename`, `POST /rooms/:code/disband` endpoints.

### Feature 4: Gameplay Interaction (commit `21235f7`)
- Interactive HTML Canvas drawing component for the drawer (mouse events, stroke rendering).
- Clear Canvas button for the drawer.
- Guess submission with trimming, case-insensitive comparison, empty rejection.
- Scoring: 100 points for a correct guess, 0 for incorrect; one-time scoring per guesser.
- Auto round-end: when all non-drawer guessers have scored correctly, room transitions to `"result"`.
- Guess history synced to all players via polling (`GuessHistory` component).
- Added `POST /rooms/:code/guess`, `POST /rooms/:code/canvas`, `POST /rooms/:code/canvas/clear`, `POST /rooms/:code/round/end` endpoints.

### Feature 5: Result, Restart & Final Validation (commit `f1132b4`)
- Result page showing the secret word, ranked final scores, and full guess history to all players.
- Host-only restart button that clears round state, resets scores, returns everyone to lobby, and preserves player list.
- Auto-navigation: game page → result page → lobby on restart.
- Added `POST /rooms/:code/restart` endpoint.
- Added `GET /health` endpoint, `ResultPage` frontend route, and full polling lifecycle management.

### Spec Kit Artifacts
- **Constitution**: Established TypeScript-first, brownfield enhancement, deterministic game logic, HTTP polling, and validation rigor principles.
- **5 Specifications** (`specs/001` through `specs/005`): Each with user stories, acceptance scenarios, edge cases, functional requirements, and measurable success criteria.
- **5 Plans**: Technical context, constitution gate checks, file-level change lists, complexity tracking.
- **5 Task lists**: Ordered, dependency-aware decomposition of work.
- **Clarification sessions**: Resolved ambiguity around duplicate names, room expiration, rate limits, rename flow, and host transfer on disconnect.
- **Checklists**: Specification quality checklists for each feature.
- **API contracts**: Detailed request/response schemas for all endpoints.

### Key Architectural Decisions
- **HTTP polling** (not WebSockets) for all real-time sync — enforced by the spec and constitution.
- **In-memory only** — no database, no persistence beyond server lifetime.
- **Server-authoritative game logic** — word visibility, scoring, and state transitions all happen server-side.
- **`awaiting_rename` intermediate state** — handles the case where players have empty/whitespace names at game start time.
- **Rate limiting** via per-session sliding window counters to prevent abuse.

### Model Changes
- `RoomStatus` grew from `"lobby"` to `"lobby" | "awaiting_rename" | "playing" | "result"`.
- `Participant` gained `isHost: boolean`.
- `Room` gained `currentRound: Round | null` with `Round` containing `drawerId`, `word`, `strokes`, `guesses`, and `scores`.
- `RoomSnapshot` extended with `drawerId`, `currentWord` (drawer-only during play), `strokes`, `guesses`, `scores`, `roundNumber`, and `invalidParticipantIds`.
