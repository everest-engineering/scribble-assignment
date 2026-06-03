### 1. What did the starter app already have?

The starter app provided a solid foundation tailored to the "Scribble Constitution", prioritizing strict TypeScript and in-memory persistence:
- **Project Structure**: A monorepo setup containing a Vite-powered React frontend and a Node/Express backend.
- **Core Architecture**: The decision to rely entirely on HTTP polling rather than WebSockets, along with an in-memory data store structure in the backend instead of a dedicated database.
- **Data Models & Schemas**: Basic interface definitions for entities like `Participant`, `Room`, `Guess`, and `DrawingAction`. It also included Zod schemas for robust API payload validation.
- **Frontend Boilerplate**: Pre-configured React Router setup (`LobbyPage`, `GamePage`, etc.), a `RoomStore` context for state management, and foundational UI components (like `Card`, `AppShell`, and basic CSS styling).

### 2. What did you add?

Over a series of iterative specifications, I built out the core game loop and interactive features:
- **Game Lobby & Connection Management**: Implemented room creation and joining logic. Added an inactivity timeout mechanism in the backend that actively purges disconnected players and stale rooms to maintain a minimal memory footprint.
- **Game Start Flow & Role Assignment**: Created the `startGame` sequence, establishing Host privileges. Upon starting, the system automatically assigns a "drawer" role, selects a random secret word, transitions the state from `lobby` to `playing`, and routes all polling clients seamlessly to the game board.
- **Gameplay Interaction Mechanics**: Built out the `Canvas` component to capture and render freehand drawing coordinates. Developed the `GuessForm` and `GuessHistory` components for a live chat experience. Created backend services (`drawingService` and `guessService`) to broadcast drawing actions and validate guesses in real-time, incrementing the player's score upon a correct guess.
- **Game Result & Restart Capabilities**: Introduced a `result` state triggered at the end of a round. Built a `ResultScreen` to display the secret word, the full chat log, and a dynamic leaderboard. Implemented a host-controlled `restartGame` flow that resets the round-specific variables (clearing the canvas and scores) and routes everyone back to the lobby, keeping the room intact for the next game.

### 3. Reflection: Decisions, AI Usage, and Tradeoffs

**Technical Decisions & Tradeoffs**
- **HTTP Polling vs WebSockets**: The most significant tradeoff in this project was adhering to the strict "No WebSockets" constraint in the Scribble Constitution. To simulate real-time gameplay (drawing strokes, chat messages, lobby synchronization), we utilized aggressive HTTP polling (e.g., polling every 1-2 seconds). While this allowed us to strictly follow the constitution and remain entirely stateless on the connection side, it introduces higher latency, greater server load, and slightly less smooth stroke rendering than a WebSocket solution.
- **In-Memory Datastore**: Adhering to the "No Databases" rule, we used a centralized `Map` in `roomStore.ts`. This vastly simplified the setup and development speed but means the application cannot be horizontally scaled (without introducing sticky sessions or a pub/sub mechanism), and all data is lost upon a server restart. To mitigate memory bloat, we introduced an active garbage collection `setInterval` to purge inactive rooms and players.
- **Frontend State Management**: We utilized `useSyncExternalStore` combined with our custom `RoomStore` to manage polling responses efficiently. This kept our React components purely presentational and decoupled the polling logic from the UI lifecycle.

**AI Usage**
- The AI Agent (`Antigravity`) was heavily utilized to systematically design, validate, and implement the features using the `speckit` methodology.
- **Spec-Driven Development**: AI was used to map abstract user requests into concrete user stories and functional requirements (`speckit-specify`), resolve edge cases interactively (`speckit-clarify`), and translate requirements into robust technical architecture (`speckit-plan`).
- **Automated Implementation**: The AI was highly effective in executing the well-defined tasks in `tasks.md` sequentially. By breaking down the features into Setup, Backend, and Frontend phases, the AI could methodically update the codebase and ensure all TypeScript types were sound and boundaries respected.