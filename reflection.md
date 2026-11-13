# Reflection Report — Branded Scribble Implementation

## What the Starter App Already Had

When we began, the starter codebase had several scaffolded components and structures but lacked functional gameplay logic:
*   **Routing & UI Shells**: Basic routes (`/`, `/create-room`, `/join-room`, `/lobby`, `/game`) were configured using React Router.
*   **Static Placeholders**: The Game Page laid out structural components (drawing canvas, guess form, scoreboard, results panel), but they rendered hardcoded placeholder text and had no interaction logic.
*   **Minimal API Client**: An API helper was present but non-functional due to a `/bug` suffix appended to the base server URL.
*   **Stubbed Store**: A basic in-memory room store existed in the backend (`roomStore.ts`), which supported creating and joining rooms but lacked game round models, host designation, or scoring structures.

---

## What We Added

We systematically implemented all four feature groups defined in the Discovery Document to build a fully functional multiplayer game loop:

### 1. Room Setup & Lobby (Group 1)
*   **Host Tracking**: Identified the room creator as the host.
*   **Lobby Auto-Polling**: Replaced manual refresh buttons with an automated `~2s` API polling interval to automatically sync participant lists.
*   **Host-Only Start Gate**: Configured the "Start Game" button to render only for the host and stay disabled until at least 2 players are in the lobby.

### 2. Game Start & Drawer Flow (Group 2)
*   **Name Validation**: Added robust Zod validation on the backend to enforce player name trimming and reject empty inputs.
*   **Role & Word Assignment**: Configured the game initialization to assign the `drawer` role to the host, `guesser` roles to others, and selected the first secret word (`"rocket"`) deterministically.
*   **Drawer-Only Visibility**: Modified the API snapshot generator to strictly mask the secret word, exposing it only to the drawing player.

### 3. Gameplay Interaction (Group 3)
*   **Interactive Drawing Canvas**: Developed a freehand drawing surface on the client, syncing drawing operations as base64 images via `mouseup` / `touchend` events.
*   **Canvas Clearing**: Added a host/drawer control to clear the active board.
*   **Guess Normalization & Scoring**: Processed guesses case-insensitively, automatically awarding `100` points on the first correct match while strictly preventing double-scoring.
*   **Activity Log**: Integrated a chronological log rendering correct guesses highlighted in green.

### 4. Result & Restart Flow (Group 4)
*   **Manual & Auto-Endings**: Allowed the host to end the round manually, or terminated the round automatically once all active guessers found the secret word.
*   **Results Dashboard**: Replaced the canvas/guess forms with a premium results board revealing the secret word to all players, maintaining final scores and guess history.
*   **Lobby Redirect & Reset**: Created a restart action that wipes round data, resets scores/roles, transitions status back to `"lobby"`, and automatically redirects all clients back to the lobby screen.

---

## Gaps and Assumptions Resolved

During initial discovery, several critical codebase gaps and assumptions were identified and resolved:
*   **The `/bug` API Suffix (Gaps G1–G3, Assumption A1)**: The starter's `frontend/src/services/api.ts` contained a `/bug` suffix in its server URL fallback, causing 404 network connection errors. Fixing this base URL fallback immediately restored room creation, joining, and client-server connectivity.
*   **Lobby Auto-Polling (Gap G4, Assumption A2)**: The lobby page did not sync new participants automatically, requiring manual page refreshes. Implementing a `~2s` auto-polling loop resolved the gap, enabling real-time player list updates.
*   **Player Name Bug (Gap G5)**: Player names were defaulting to `"Player"` due to an incorrect fallback check in `displayName`. Correcting this logic ensured custom player names are accurately recorded, styled, and displayed across the scoreboard and logs.

---

## Technical Decisions & Tradeoffs

*   **HTTP Polling vs. WebSockets**: To align with project rules, we utilized HTTP polling. This required careful synchronization logic to ensure no race conditions occurred (e.g., preventing a player from submitting a guess after a round ended, or redirecting to the lobby smoothly).
*   **Robust Test Suite**: Maintained and expanded 28 backend unit tests and 8 frontend tests to guarantee that state transitions and score allocations behave deterministically.
