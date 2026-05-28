# Spec Kit Discovery Notes: Room Setup, Game Start, Gameplay & Results

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

### Scenario 3 - Gameplay Interaction
*   **No Round Interaction State:** The backend `Room` model currently has no place to store drawing data, submitted guesses, or participant scores. Polling can only sync room status and participants.
*   **No Drawing API or Permission Check:** There is no endpoint for the drawer to save drawing strokes/canvas state, and no backend rule preventing guessers from changing the drawing.
*   **No Clear Canvas Action:** The UI has only a static canvas placeholder and no backend operation to reset the current drawing for all players.
*   **Guess Form Does Not Submit:** `GuessForm` prevents default form submission but never calls an API or updates state, so guesses cannot be validated, stored, scored, or synced.
*   **No Guess History or Scoreboard Data:** `ResultPanel` and `Scoreboard` are placeholders; the frontend cannot render synced guesses or scores because neither exists in room snapshots.
*   **No Correct-Guess Scoring:** The backend does not compare guesses against the secret word, does not handle case-insensitive matches, and does not award 100 points for correct guesses.

### Scenario 4 - Result, Restart & Final Validation
*   **No Result Transition:** `RoomStatus` includes `"results"`, but there is no service function or endpoint to end the active round and move a room from `"game"` to `"results"`.
*   **Secret Word Still Masked for Guessers:** `toRoomSnapshot()` only exposes `secretWord` to the drawer. In result state, all participants must see the correct word.
*   **No Result Screen State:** `GamePage` always renders active gameplay controls. It does not switch into a read-only result view showing correct word, final scores, and full guess history.
*   **No Restart Endpoint:** There is no host-only operation to restart after results and return all players to the lobby.
*   **No Round-State Reset on Restart:** Drawing, guesses, scores, drawer assignment, and secret word need to be cleared while preserving room code, host, and participants.
*   **No Polling Redirect Back to Lobby on Restart:** Existing game polling can fetch room state, but the frontend needs to handle `"results"` and return everyone to `/lobby` when the host restarts.

## 2. Assumptions

*   **Host Assignment:** The creator of the room is defined as the host. If the host leaves the lobby (though host migration/leaving is out of scope for now), the backend memory retains the host ID as the first participant ID.
*   **State Persistence:** All room states are stored purely in memory using a Node `Map` (`rooms`). Restarting the server clears all rooms and active states.
*   **Deterministic Word Selection:** We will select the secret word deterministically using the room code's character sum modulo the word list length.
*   **Single-Round Scope:** In accordance with the out-of-scope rules, we will only handle starting a single round with one drawer and the selected secret word.
*   **Drawing Representation:** For scenario 3, drawing can be stored as lightweight canvas path data in memory rather than binary images. The drawer's own screen must show the drawing immediately; guessers may receive it via the existing polling cadence unless the implementation can share the same snapshot flow more directly.
*   **Scoring Rule:** Each correct guess awards 100 points. Incorrect guesses are still recorded with 0 points. If a player submits multiple correct guesses, only the first correct guess should award points to avoid repeated scoring from the same participant.
*   **Round Completion:** Scenario 3 does not require automatically ending the round; result state and restart are reserved for Scenario 4.
*   **Ending the Round:** Scenario 4 will use a host-only end-round action. This avoids adding timers or automatic round completion rules, which are outside the README scope.
*   **Result Word Visibility:** The correct word is visible to everyone only after `status === "results"`.
*   **Restart Reset:** Restart preserves participants, host ID, and room code, but clears active round state and sets `status` back to `"lobby"`.

## 3. Relevant Files

*   **Backend Model:** [game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts) (needs `status` options, `drawerId`, and `secretWord` fields).
*   **Backend Services:** [roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) (needs to set `drawerId` and `secretWord`, and secure them in snapshots).
*   **Backend Schemas:** [schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts) (needs validation for the start game request).
*   **Backend Routes:** [rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) (needs `POST /rooms/:code/start`).
*   **Frontend State:** [roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/state/roomStore.ts) and [api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts) (needs to define start game API call).
*   **Frontend Pages:** [LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) (needs to route players to `/game` when status updates).
*   **Frontend Pages:** [GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) (needs polling, drawer checks, and secret word display).
*   **Frontend Components:** [GuessForm.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/components/GuessForm.tsx), [Scoreboard.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/components/Scoreboard.tsx), and [ResultPanel.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/components/ResultPanel.tsx) (need real submit handling and room-derived display).
*   **Frontend Styling:** [app.css](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/styles/app.css) (may need canvas, toolbar, guess history, and scoreboard styles).
*   **Scenario 4 Backend:** [roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts), [schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts), and [rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) need end-round and restart operations.
*   **Scenario 4 Frontend:** [api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts), [roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/state/roomStore.ts), [GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx), and [LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) need result/restart flow support.
