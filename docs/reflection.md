# Reflection Report - Scribble

## 1. What did the starter app already have?
The starter application provided a foundational structure for a multiplayer drawing and guessing game, including:
*   **Backend**: A Node.js + Express service in TypeScript with in-memory room management.
*   **Frontend**: A React (v18) + Vite client with React Router (v6).
*   **Basic Scaffolding**: 
    *   Routes and screens for Start, Create Room, Join Room, Lobby, and Game pages.
    *   `RoomStore` for frontend state management.
    *   Starter REST endpoints for room creation, joining, and fetching snapshots.
    *   Basic seed data for game words and roles.
    *   Placeholder components for the Canvas, Guess Form, Scoreboard, and Results Panel.
    *   Basic UI styling.

## 2. What did you add?
The implementation completed the full gameplay lifecycle across four major feature specifications:
*   **Room Setup & Lobby**: Implemented host identification, room isolation, participant list synchronization via polling, capacity management, and start-game restrictions.
*   **Game Start & Drawer Flow**: Added player name validation, deterministic secret word selection, role-based visibility (word hidden from guessers), and late-join restrictions.
*   **Gameplay Interaction**: Implemented canvas drawing/clearing with 'latest-wins' strategy, case-insensitive/whitespace-trimmed guess validation, scoring logic (100 points for correct), activity history syncing, and role-based UI adaptation (canvas view-only for guessers).
*   **Round End & Game Restart**: Added automatic/manual round termination, results display (word reveal, scoreboard, history), host-only restart logic, and state reset (canvas, word, scores) while preserving lobby participants.

## 3. Key Decisions
*   **Polling-based Synchronization**: Chose HTTP polling (~2s interval) over WebSockets for real-time state synchronization to adhere to the project's scope (simple architectural overhead).
*   **In-Memory Persistence**: Maintained in-memory storage to prioritize development speed over data persistence across server restarts, aligning with the project's lab-based scope.
*   **Role-Based UI Rendering**: Used client-side conditional rendering based on a `isDrawer` flag to enforce game mechanics (e.g., hiding secret word/guess form from the drawer) and ensure a clean user experience.
*   **Deterministic Word Selection**: Used `roomId.length` to select words from the seed list to ensure consistent gameplay behavior across distributed clients without needing a central pseudo-random generator state that requires complex synchronization.

## 4. AI Usage
*   **GitHub Speckit**: Used the Speckit framework extensively to structure the feature implementation process. It ensured that all requirements, user scenarios, and edge cases were defined before writing code, providing a clear roadmap for each sprint.
*   **Gemini**: Used Gemini as a collaborative senior engineer to:
    *   Analyze specifications for implementation gaps.
    *   Guide the architectural approach for state management between frontend polling and backend room state.
    *   Refine API contracts for game round transitions.
    *   Provide idiomatic TypeScript implementation guidance while strictly adhering to project conventions.

## 5. Tradeoffs
*   **Bare Minimum UI**: Minimal styling and components were used to adhere to the lab's requirements. There are a few UI issues like scoreboard is not formatted properly.
*   **Player Joining Rules**: Players cannot join after the game has started.
*   **Round Ending Rules**: As there are no timers for each round, the host has to manually end the round or all guessers have to guess the word correctly to end the round.

