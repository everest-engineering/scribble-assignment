# Reflection Report: Scribble Multiplayer Drawing Game

This report reflects on the development, architecture, and implementation details of the Scribble multiplayer drawing game.

---

## 1. What did the starter app already have?

The starter codebase provided a basic skeleton of the React frontend and Express backend:
- **Express Backend Skeleton**: Main routing structure (`router.ts`, `rooms.ts`), model types (`game.ts`), and an in-memory repository (`roomStore.ts`) to save active rooms in a JS `Map`.
- **Frontend Pages & Routing**: Route configuration (`routes/index.tsx`) and skeleton files for pages like `CreateRoomPage`, `JoinRoomPage`, `LobbyPage`, and `GamePage`.
- **Static Components**: Placeholder UI shells for `GuessForm`, `Scoreboard`, and `ResultPanel`.
- **Shared Validation & Client API**: Basic API client wrappers (`api.ts`) and Zod schemas for room creation.
- **Bugs/Incomplete Flows**: 
  - The API base URL was broken by default (`/bug` suffix) leading to `404` errors.
  - The Lobby page had no mechanism to refresh participant lists dynamically.
  - Clicking "Start Game" was just client-side navigation with no backend model updates.
  - The drawing canvas, guess form, scoreboard, and game lifecycle transitions were entirely stubbed out or non-functional.

---

## 2. What did you add?

Over four implementation scenarios, we successfully built out the full game flow:
- **Lobby Sync & Polling (Scenario 1)**: Corrected the API client pathing and added automatic HTTP polling (`3-second interval`) to the lobby so users see new players joining in real-time.
- **Game Initiation & Drawer Selection (Scenario 2)**: Added backend logic to transition a room's state from `"lobby"` to `"playing"`. Implemented random initial drawer assignment, random secret word selection, and game start state propagation.
- **Canvas Drawing & Real-Time Guessing (Scenario 3)**:
  - Created a fully interactive `<canvas>` element for drawing (with canvas coordinate tracking).
  - Built HTTP polling sync for drawing strokes so guessers see drawings live.
  - Created backend validation for guesses (case-insensitive, whitespace-trimmed) and a scoring system.
  - Integrated dynamic scoreboard updates and guess history logging.
- **Game Over & Restart Flow (Scenario 4)**:
  - Added transition logic when the turn or game concludes (status changed to `"finished"`).
  - Built a dedicated `ResultsPage` displaying ranking and final scores.
  - Developed the "Play Again" loop, returning all connected clients to the Lobby room state automatically with scores reset.

---

## 3. What were the key technical decisions & trade-offs made?

- **Stateless HTTP Polling over WebSockets**: Following the constraints strictly, we used HTTP short-polling. While WebSockets are standard for multiplayer drawing games, polling was optimized using lightweight GET snapshots of the room state and canvas strokes. This reduced backend state complexity but increased overall HTTP request volume.
- **Drawing Stroke Serialization**: To sync drawings over HTTP, we serialized the canvas coordinates to a simple array of lines/points. The client polls the canvas endpoint and renders missing coordinates incrementally, preventing heavy payload sizes.
- **Separation of Concerns in State**: State updates are managed cleanly via the frontend Zustand `roomStore.ts` and the backend `roomStore.ts` service layer. This keeps React components logic-free and focused purely on rendering.

---

## 4. What were the biggest challenges faced and how were they resolved?

- **Real-Time Client Coordination**: Without WebSockets, ensuring all players transitions to the game page or the results page simultaneously was tricky. This was resolved by checking the polled `room.status` in a layout-level `useEffect` loop. If the status transitions to `"playing"` or `"finished"`, clients automatically navigate to the correct routes.
- **Canvas Redrawing Sync**: Preventing flickering or clearing the screen unnecessarily when multiple stroke packets arrived. We handled this by drawing new lines incrementally on top of the existing canvas buffer instead of full screen refreshes where possible.

---

## 5. What could be improved or extended in a future iteration?

- **Custom Drawing Options**: Adding choices for line width, color palettes, and an eraser tool for the drawer.
- **Round Configuration**: Allowing the host to choose the number of rounds, select custom word lists, and set different round durations.
- **Transition to WebSockets**: Migrating the communication layer to Socket.io or WebSockets to minimize HTTP overhead and deliver sub-100ms drawing replication latency.
- **Session Recovery**: Storing the user's current room code and `participantId` in `sessionStorage` or `localStorage` to allow seamless reconnection if the page is accidentally reloaded.
