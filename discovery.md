# Scribble Game Discovery Notes

This document contains the discovery notes and code analysis for the multiplayer Scribble drawing game scaffold.

---

## 1. Incomplete Behaviors (Starter Gaps)

During the inspection of the codebase, we identified the following major functional gaps:

1. **Lobby Polling & Automatic Synchronization**
   - *Current Behavior*: When a player creates a room or joins, they are directed to the Lobby. However, the player list is static. There is only a manual "Refresh Room" button that makes a one-off call to `fetchRoom()`.
   - *Missing Behavior*: Automated polling (every ~2 seconds) on the client is missing. When other players join, the lobby doesn't update unless manually refreshed.
   - *Relevant Files*: [LobbyPage.tsx](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/pages/LobbyPage.tsx), [roomStore.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/state/roomStore.ts).

2. **Host Designation & Start Authorization**
   - *Current Behavior*: The first player creating the room is not explicitly tracked as the host. The "Start Game" button in the Lobby simply redirects the client to the `/game` route locally. Any player (including non-creators/guests) can click it, and it can be clicked even if there is only 1 player in the lobby.
   - *Missing Behavior*: Storing `hostId` on the server, enforcing a minimum of 2 players to start, disabling or hiding the button for non-hosts, and restricting the `/rooms/:code/start` action via backend authorization.
   - *Relevant Files*: [game.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/models/game.ts), [roomStore.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/services/roomStore.ts), [rooms.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/api/rooms.ts).

3. **Game State Lifecycle & Drawer Assignment**
   - *Current Behavior*: The room has a status of `"lobby"`. There is no state transition to `"active"`, `"game"`, or `"results"`.
   - *Missing Behavior*: Choosing a drawer (e.g. the first player or host), picking a secret word deterministically from the starter data (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`), and hiding the secret word from guessers while displaying it only to the drawer.
   - *Relevant Files*: [GamePage.tsx](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/pages/GamePage.tsx), [game.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/models/game.ts), [roomStore.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/services/roomStore.ts).

4. **Canvas Drawing & Real-time Canvas Rendering**
   - *Current Behavior*: The canvas on the game page is a static HTML5 `<canvas>` placeholder. It is not interactive, and no drawing data is captured.
   - *Missing Behavior*: Mouse/touch event listeners to draw lines on the drawer's screen, an endpoint/state to store current drawing paths, and client polling to periodically fetch and render drawing paths on the guessers' canvases.
   - *Relevant Files*: [GamePage.tsx](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/pages/GamePage.tsx).

5. **Guess Submission, Scoring, and Guess History**
   - *Current Behavior*: The guess input is present but functional only as a local text box. Guess submission is not wired up.
   - *Missing Behavior*: A `POST /rooms/:code/guess` route, input trimming and case-insensitive check against the secret word, adding guesses to a synced history array, allocating `+100` points to correct guessers, and transitioning the room status to a result state once guessed correctly or finished.
   - *Relevant Files*: [GamePage.tsx](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/pages/GamePage.tsx), [rooms.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/api/rooms.ts).

---

## 2. Key Engineering Assumptions

1. **State Persistence & Lifetime**
   - *Assumption*: All room state lives purely in-memory inside the Node.js Express process (a global `rooms` Map). Restarting the backend server resets all room sessions. No database or persistent store is needed.

2. **HTTP Polling Cadence**
   - *Assumption*: A polling interval of `2000ms` (2 seconds) is sufficient for checking lobby participants, guess history, canvas path updates, and state transitions (e.g. from lobby to game). This interval balances user-experience responsiveness and backend request load.

3. **Multi-Tab Isolation**
   - *Assumption*: The player session is tracked on the client side using unique participant IDs returned during the create/join APIs. Storing this `participantId` in `sessionStorage` allows players to refresh the tab without losing their player session.

4. **Synchronous Node Concurrency**
   - *Assumption*: Because Node.js handles requests on a single-threaded event loop, state modifications to the in-memory room map are safe from race conditions, simplifying concurrent join requests.

---

## 3. Relevant Codebase Files Map

### Backend
- **[models/game.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/models/game.ts)**: Declares core types like `Room`, `RoomSnapshot`, and `Participant`.
- **[services/roomStore.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/services/roomStore.ts)**: Handles memory read/writes for room maps.
- **[api/rooms.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/api/rooms.ts)**: Configures API endpoints for rooms.
- **[api/schemas.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/api/schemas.ts)**: Validates input bodies/parameters using Zod schemas.

### Frontend
- **[services/api.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/services/api.ts)**: Handles HTTP requests to the backend.
- **[state/roomStore.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/state/roomStore.ts)**: External React store to hold room status.
- **[pages/LobbyPage.tsx](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/pages/LobbyPage.tsx)**: UI showing the lobby and participants.
- **[pages/GamePage.tsx](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/pages/GamePage.tsx)**: UI containing canvas, history, and scoring.
