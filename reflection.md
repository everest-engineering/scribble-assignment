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

---

### Feature 003 — Gameplay Interaction

- **Interactive drawing canvas**: The drawer can draw freehand strokes on an HTML5 canvas using pointer events. Each stroke (a series of points with color and line width) is submitted to the backend on pointer-up and stored in `room.strokes`. The drawer can also clear the canvas at any time, which resets `room.strokes` to an empty array.
- **Live canvas sync for guessers**: Guesser screens display a read-only canvas that redraws all stored strokes on every poll cycle (~2 seconds). The full stroke list is replayed on each update to avoid accumulation artifacts — the canvas is cleared and redrawn from scratch each time.
- **Polling on the game screen**: The game screen now polls `GET /rooms/:code` every ~2 seconds (via `setInterval`) to keep canvas state, guess history, and scores in sync across all players. The interval is cleaned up on unmount.
- **Guess submission**: Guessers can submit text guesses via an inline form. The backend trims and case-insensitively compares the guess against the current word. Empty or whitespace-only submissions are rejected with a 400. Correct guesses award 100 points; incorrect guesses award 0.
- **Drawer excluded from guessing**: The drawer cannot submit guesses. The backend enforces this with a 403, and the client hides the guess form entirely when the player is the drawer.
- **Block after correct guess**: Once a player has guessed correctly, the backend rejects any further attempts from that player with a 403. On the client, the guess form is replaced with a "You already guessed correctly!" message. This state is also derived from `room.guesses` on session restore — refreshing the page does not reset the block.
- **Guess history panel**: All players see a continuously updated list of every guess submitted in the current round, showing the submitter's name, the guess text, and whether it was correct or incorrect.
- **Scoreboard**: All players see a live scoreboard sorted by score descending, showing each participant's name and current point total. Scores start at 0 when a game begins and update after each correct guess.

---

### Feature 004 — Result, Restart & Final Validation

- **New room status — "ended"**: The room lifecycle was extended from `"lobby" | "active"` to `"lobby" | "active" | "ended"`. No other state fields changed; the status union is the only model addition.
- **Host-only End Round**: An "End Round" button appears on the active game screen, visible only to the host. Clicking it calls `POST /rooms/:code/end`, which validates that the caller is the host and the room is active before transitioning status to `"ended"`.
- **Word reveal on end**: When a room transitions to `"ended"`, `toRoomSnapshot` reveals `currentWord` to all players — not just the drawer. This is enforced at the API level: the backend sends the actual word to everyone once the round is over.
- **Result screen for all players**: When `room.status === "ended"`, the game screen conditionally renders a result view in place of the active game UI. The result view shows the revealed word as a prominent heading, the final scoreboard, and the full guess history. All players see this automatically within ~2 seconds via the existing polling loop.
- **Host-only Restart**: A "Restart" button appears on the result screen, visible only to the host. Clicking it calls `POST /rooms/:code/restart`, which resets the room to `"lobby"` and clears all round state — `currentWord`, `drawerId`, `strokes`, `guesses`, and `scores` — while preserving the participant list.
- **Auto-redirect to lobby on restart**: After the host restarts, all players' polling detects `room.status === "lobby"`. The navigation guard in GamePage fires and redirects everyone to `/lobby` automatically — no manual action required from any player.
- **Session restore on result screen**: Refreshing the browser while on the result screen correctly restores the session and lands the player back on the result view. The existing session restore + navigation guard combination handles this: the guard keeps players on the game page for both `"active"` and `"ended"` status.
