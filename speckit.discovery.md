# Spec Kit Discovery Notes: Room Setup & Lobby & Game Start

## 1. Gaps (Incomplete Behaviors)

### Scenario 1 - Room Setup & Lobby
*   **No Host Identification:** The starter codebase's `Room` and `RoomSnapshot` data models do not track which participant is the host. When a room is created, the first participant should be marked as the host, and this role needs to be visible or determinable by both frontend and backend.
*   **No Automatic Polling in Lobby:** The `LobbyPage` only refreshes its list of participants when the user manually clicks "Refresh Room". Polling needs to be implemented (approx. every 2 seconds) to keep the participant list in sync automatically.
*   **Lack of Start Game Restrictions:** Currently, any participant in the lobby can click "Start Game" and navigate to `/game` regardless of whether they are the host or if the minimum player count (2 players) is met. We need to disable or hide this action for non-hosts and restrict it until at least 2 players are present.
*   **Room Code Validation Gaps:** The backend routes and schemas do not strictly validate room codes. Empty codes or codes of invalid formats should be rejected with clear feedback (e.g. 4-character uppercase alphanumeric strings).

### Scenario 2 - Game Start & Drawer Flow
*   **No Game Start Endpoint:** The backend lacks a route to transition a room's status from `"lobby"` to `"game"`.
*   **No Drawer Assignment:** When the game starts, there is no logic to assign a participant as the drawer (the host/first player should be the drawer).
*   **No Secret Word Logic:** The backend does not select a secret word deterministically from `STARTER_WORDS`.
*   **No Secret Word Masking:** A guesser could inspect network snapshots to see the secret word. The backend `toRoomSnapshot` method must filter/nullify the secret word for all players except the designated drawer.

## 2. Assumptions

*   **Host Assignment:** The creator of the room is defined as the host. If the host leaves the lobby (though host migration/leaving is out of scope for now), the backend memory retains the host ID as the first participant ID.
*   **State Persistence:** All room states are stored purely in memory using a Node `Map` (`rooms`). Restarting the server clears all rooms and active states.
*   **Deterministic Word Selection:** We will select the secret word deterministically using the room code's character sum modulo the word list length.
*   **Single-Round Scope:** In accordance with the out-of-scope rules, we will only handle starting a single round with one drawer and the selected secret word.

## 3. Relevant Files

*   **Backend Model:** [game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts) (needs `status` options, `drawerId`, and `secretWord` fields).
*   **Backend Services:** [roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) (needs to set `drawerId` and `secretWord`, and secure them in snapshots).
*   **Backend Schemas:** [schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts) (needs validation for the start game request).
*   **Backend Routes:** [rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) (needs `POST /rooms/:code/start`).
*   **Frontend State:** [roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/state/roomStore.ts) and [api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts) (needs to define start game API call).
*   **Frontend Pages:** [LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) (needs to route players to `/game` when status updates).
*   **Frontend Pages:** [GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) (needs polling, drawer checks, and secret word display).

