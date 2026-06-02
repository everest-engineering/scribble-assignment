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

*(To be completed after implementation)*
