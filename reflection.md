# Reflection Report — Scribble Lab

## What did the starter app already have?

The starter provided a runnable but intentionally incomplete scaffold for a Scribble-style drawing and guessing game.

**Backend (Node.js + Express + TypeScript):**
- Express app with CORS and JSON middleware configured
- Three working REST endpoints: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`, and `GET /health`
- In-memory room store backed by a `Map<string, Room>`, with UUID-based participant IDs and 4-character alphanumeric room code generation (confusable characters excluded)
- Zod schemas for request body validation on create and join
- Seed data: 5 starter words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and a static roles array (`["drawer", "guesser"]`)
- A `toRoomSnapshot()` method on the room store to produce a client-facing view of room state

**Frontend (Vite + React + TypeScript):**
- Full SPA shell with React Router wiring for Start, Create Room, Join Room, Lobby, and Game screens
- Start page with "Create Room" and "Join Room" navigation
- Create Room page that posts to the backend and navigates to the lobby on success
- Join Room page that posts to the backend with a room code and player name, then navigates to the lobby
- Lobby page showing the current participant list with a manual "Refresh" button
- Game page with placeholder areas for the canvas, guess input, scoreboard, and result panel
- Frontend room state managed via `useSyncExternalStore`
- HTTP API client (`api.ts`) wrapping all backend calls with typed responses

**What was missing (gaps identified in discovery):**
- No host tracking on the Room model
- No lobby polling (refresh was manual only)
- No start-game endpoint or game state beyond `"lobby"`
- Drawing canvas was a static placeholder div
- Guess submission was a no-op handler
- Scoreboard and result panel had no data binding

---

## What did we add?

### Feature 001 — Room Setup & Lobby

- **Host tracking**: The player who creates a room is automatically assigned as the host. Host identity is stored on the room and surfaced to all players through the lobby.
- **Input validation**: Player names that are empty or whitespace-only are rejected with a clear inline error. Room codes containing non-alphanumeric characters are also rejected before hitting the backend.
- **Lobby polling**: The manual Refresh button was replaced with automatic polling every ~2 seconds, so the participant list updates in real time without any user action.
- **Host-gated Start Game**: A "Start Game" button appears in the lobby, but only the host can see it enabled — and only once at least 2 players have joined. Other players see a waiting message.
- **Session persistence**: Refreshing the browser no longer drops a player back to the home screen. Their session is restored from `sessionStorage` and they land back in the lobby.
- **Start game endpoint**: The backend gained a `POST /rooms/:code/start` endpoint that enforces the host-only and 2-player-minimum rules before transitioning the room to active status.

---

### Feature 002 — Game Start & Drawer Flow

- **Drawer assignment**: When the host starts the game, the host is automatically assigned as the drawer for the first round. Their name is shown clearly to all players on the game screen.
- **Secret word selection**: A word is deterministically selected from the starter list ("rocket" is always the first word). No randomness is involved — the same game always starts with the same word, consistent with the project's constitution.
- **Word privacy**: The drawer sees the secret word on their screen. Every other player sees only a neutral placeholder ("A word has been chosen — start guessing!"). This privacy is enforced at the API level — the backend sends `currentWord: null` to anyone who is not the drawer, not just hidden in the UI.
- **Role display**: Each player's game screen shows their own role — "Drawing" or "Guessing" — so there is no ambiguity about who does what.
- **Session restore on game screen**: Refreshing the browser while on the game screen correctly restores the session. The drawer still sees their word; guessers still see the placeholder.
