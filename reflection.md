# Reflection Report: Scribble Enhancement Lab

This report reflects on the process, decisions, design tradeoffs, and AI-assisted workflow involved in building the features for the Scribble drawing game.

## 1. What the Starter App Already Had
The starter scaffold was a brownfield codebase that provided:
* A basic client-server structure: Vite + React (v18) frontend and Node.js + Express backend using TypeScript.
* A basic room api in-memory storage (`rooms` directory/module) on the backend.
* Functional endpoints for room creation (`POST /rooms`), room joining (`POST /rooms/:code/join`), and fetching room snapshot (`GET /rooms/:code`).
* Simple frontend landing, room creation, and room join routes.
* A presentational lobby and game layout showing placeholders for the drawing canvas, guess input field, and scorecards.

## 2. What We Added
To complete the game requirements across all 4 scenarios, we implemented:
* **Scenario 1: Room Setup & Lobby**:
  * Tracked the `hostId` assigned to the creator of each room.
  * Added username validation checks (trimming, rejecting empty or whitespace-only inputs) using `Zod` schemas.
  * Implemented an automated polling utility (~2-second interval) using React hooks inside `LobbyPage.tsx` to keep player lists synchronized.
  * Created host-only permissions to show the "Start Game" button only for hosts when there are $\ge 2$ players.
* **Scenario 2: Game Start & Drawer Flow**:
  * Added `POST /rooms/:code/start` endpoint to start the game, assign the host as the drawer, select a secret word, and change room status to `"game"`.
  * Implemented data-filtering in `toRoomSnapshot` to restrict secret word visibility solely to the active drawer.
* **Scenario 3: Gameplay Interaction**:
  * Hooked up mouse listeners to serialize drawing coordinates on the drawer canvas and post them to `POST /rooms/:code/drawing`.
  * Coded drawing synchronization polling on guesser canvases.
  * Implemented guess submission routes with case-insensitive validation and point-scoring logic (+100 points for correct guesses, transitions room to `"result"`).
* **Scenario 4: Result, Restart & Final Validation**:
  * Designed the results view to show final scores, guess logs, and the secret word.
  * Added `POST /rooms/:code/restart` to clear scores, drawings, guesses, reset statuses, and preserve the players in the lobby.
  * Added host promotion logic so if a host leaves, a new one is selected to ensure the room never gets stuck.

## 3. Workflow and AI Constraints Compliance
* **No WebSockets**: We strictly adhered to HTTP polling (~2 seconds cadence) for all synchronization. This worked smoothly for syncing player lists, drawings, guesses, and status transitions without complex socket connections.
* **No Databases**: All state is stored in-memory using JavaScript data structures.
* **No Authentication**: Reused simple transient usernames submitted at room entry.
* **TypeScript Integrity**: Kept all files 100% type-safe without using the `any` keyword.
