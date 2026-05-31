# Reflections: Starter Code vs. Implemented Changes

This document reflects on the architecture and components that were originally provided in the starter template compared to the features we implemented for the Scribble drawing/guessing game.

---

## 1. What was already in the Starter Code

The starter project provided the structural foundation, basic routing, and initial room setup functionality:

### Backend Architecture
* **Express & Middleware**: Baseline server configuration with JSON parsing, CORS, and request log handlers.
* **Basic Room Storage**: An in-memory `Map` inside `roomStore.ts` containing simple room create/join methods.
* **Lobby Support**: Backend models and routes for generating room codes, registering participants, and returning a simple list of lobby participants.
* **Zod Schemas**: Minimal schemas for validating room creation, joining, and room snapshots.

### Frontend Architecture
* **React Setup**: A standard Vite + React + TypeScript configuration.
* **Routing**: Pre-configured React Router v6 routing:
  * `/` (Start Page)
  * `/lobby/:code` (Lobby Page)
  * `/game/:code` (Game Page)
* **Zustand Room Store**: A client-side store maintaining room snapshots and handling the initial 2-second HTTP polling loop.
* **Lobby UI**: Basic screen listing joined participants.

---

## 2. Changes We Made

We extended the starter to implement the core game flow (`lobby -> in-game -> result -> lobby`), canvas interaction, scoring logic, results handling, and game restart mechanics:

### Gameplay & Canvas Interaction
* **Interactive Canvas**: Implemented local drawing and clearing behaviors alongside mouse and touch event listeners on the drawer's screen in `GamePage.tsx`.
* **Guess Form & Validation**: Added the guess input form, enforcing client-side and server-side trimming/empty-string rejection.
* **Guess History & Scoreboard**: Implemented chronological guess logs and sorted scoreboards, which extended the existing 2-second HTTP polling mechanism for real-time updates.

### Result, Restart & Final Validation (Feature Group 4)
* **Authoritative Backend Guards**: Emphasized the backend as the single source of truth and authoritative state manager for game logic. The first correct guess transitions the room status (`lobby -> in-game -> result -> lobby`) and records the `correctGuesserId`. Subsequent guesses trigger an explicit backend rejection when game has ended.
* **Exposing the Secret Word**: Modified the snapshot mapping so the secret word is revealed unmasked to all participants once in the `"result"` state.
* **Dynamic Results Dashboard**: Configured the results view to show the winner banner, revealed word, final scores, and complete guess history.
* **Host Restart Control**: Restricted restart capabilities to the room host. The backend service `restartRoom()` atomically:
  * Resets status back to `"lobby"`.
  * Resets player scores to `0`.
  * Clears `roundState`, `guessHistory`, and `correctGuesserId`.
* **Sync & Lobby Return**: The frontend reacts to backend snapshot via polling, so guessers detect the `"lobby"` transition and automatically redirect back to the lobby page.

### Quality and Validation
* **Robust Type Safety**: Fully typed all new entities and data contracts.
* **Comprehensive Testing**: Wrote automated unit and schema tests in both the backend and frontend, providing comprehensive unit and schema tests covering core logic paths.
