# Reflection Report - Scribble Lab

## What did the starter app already have?
- **Backend**: A basic Express server with in-memory room storage, health check, and starter routes for creating, joining, and fetching rooms.
- **Frontend**: A Vite + React application with routing (Start, Create, Join, Lobby, Game pages), an App Shell, and basic UI components.
- **Data**: Starter word list and role definitions.
- **Styling**: Initial CSS for branding and layout.

## What did I add?
### Scenario 1: Room Setup & Lobby
- Added `hostId` to the `Room` model to track the room creator.
- Implemented 2-second HTTP polling in the `LobbyPage` to keep the participant list in sync.
- Restricted "Start Game" visibility to the host and enforced a minimum of 2 players.
- Improved error handling for room joining with specific feedback (e.g., alphanumeric validation).

### Scenario 2: Game Start & Drawer Flow
- Implemented `status` transition from `lobby` to `playing`.
- Added drawer assignment (host is the first drawer) and deterministic secret word selection.
- Ensured word visibility rules: only the drawer receives the secret word in the room snapshot.
- Automated redirection to the Game screen for all players via polling.

### Scenario 3: Gameplay Interaction
- Extended the `Room` model to include `canvasData`, `guesses`, and `scores`.
- Implemented a coordinate-sync drawing mechanism with an HTML5 canvas.
- Added guess submission with case-insensitive validation and scoring logic (+100 points for correct guesses).
- Implemented real-time sync of drawing status, guess history, and scores via polling.

### Scenario 4: Result, Restart & Final Validation
- Added `result` status and an "End Round" action for the host.
- Implemented the `ResultPanel` to display the final word, scores, and guess history.
- Added "Restart Game" functionality to reset the room state while preserving participants.
- Verified all flows with comprehensive backend unit tests for each scenario.

### Scenario 5: Multi-Round Enhancements
- Implemented player turn rotation: the drawer role now rotates among all participants in subsequent rounds.
- Added random word selection: secret words are picked randomly from the starter list for each round.
- Added a "Next Round" flow that allows the game to continue while preserving scores.
- Implemented a "Back to Lobby" option from the result screen for a full game reset.

## AI Usage & Workflow
- Used a **Research -> Strategy -> Execution** workflow.
- Leveraged `speckit` artifacts (constitution, specify, plan, tasks) to maintain alignment and traceability.
- Iterative implementation with constant validation via tests and builds ensured high quality and minimal regressions.
- The use of surgical `replace` calls and targeted `read_file` ensured context efficiency.

## Challenges & Tradeoffs
- **Polling Latency**: Using HTTP polling (2s) introduces a slight delay in state sync compared to WebSockets, but it simplifies the architecture significantly for this scope.
- **State Management**: Using a custom `RoomStore` (via `useSyncExternalStore`) provided a clean way to manage global state without introducing heavy external libraries like Redux.
- **Coordinate Sync**: Drawing coordinates were scaled to internal resolution to ensure accuracy across different screen sizes.
