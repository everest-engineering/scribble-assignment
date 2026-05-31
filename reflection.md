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

## 4. AI Assistance and Corrections
Throughout the development, AI was used for several boilerplate and design tasks, which were carefully reviewed, tested, and corrected where necessary:
* **Boilerplate Routes & Zod Validation**: AI was used to generate initial Express API endpoints, Zod verification schemas (e.g. for game start and guesses), and basic TypeScript interfaces. This saved time on routine wiring.
* **Drawing Canvas Event normalizers**: AI assisted in drafting the canvas Mouse/Touch event coordinate normalizers (converting viewport coordinates to relative `[0..1]` fractions), preventing scaling/distortions.
* **Polling Hooks and Cleanup Corrections**: 
  * *Correction*: The AI initially drafted polling hooks in the React components without proper cleanup return statements or loading indicators. We corrected this to ensure intervals are always cleared on component unmount to prevent leaks.
  * *Correction*: The backend API routes initially lacked checks to verify if a requester was the room host before starting or restarting a game. We added explicit validation filters on the backend to enforce host-only authority.
  * *Correction*: When a user left or disconnected, the AI failed to implement host promotion. We refactored the room leave handler on the backend to ensure a new host is immediately designated if the previous host leaves.

