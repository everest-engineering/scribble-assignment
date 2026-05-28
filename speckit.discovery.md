# Spec Kit Discovery Notes: Room Setup & Lobby

## 1. Gaps (Incomplete Behaviors)

*   **No Host Identification:** The starter codebase's `Room` and `RoomSnapshot` data models do not track which participant is the host. When a room is created, the first participant should be marked as the host, and this role needs to be visible or determinable by both frontend and backend.
*   **No Automatic Polling in Lobby:** The `LobbyPage` only refreshes its list of participants when the user manually clicks "Refresh Room". Polling needs to be implemented (approx. every 2 seconds) to keep the participant list in sync automatically.
*   **Lack of Start Game Restrictions:** Currently, any participant in the lobby can click "Start Game" and navigate to `/game` regardless of whether they are the host or if the minimum player count (2 players) is met. We need to disable or hide this action for non-hosts and restrict it until at least 2 players are present.
*   **Room Code Validation Gaps:** The backend routes and schemas do not strictly validate room codes. Empty codes or codes of invalid formats should be rejected with clear feedback (e.g. 4-character uppercase alphanumeric strings).

## 2. Assumptions

*   **Host Assignment:** The creator of the room is defined as the host. If the host leaves the lobby (though host migration/leaving is out of scope for now), the backend memory retains the host ID as the first participant ID.
*   **State Persistence:** All room states are stored purely in memory using a Node `Map` (`rooms`). Restarting the server clears all rooms and active states.

## 3. Relevant Files

*   **Backend Model:** [game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts) (needs `hostId` in `Room` and `RoomSnapshot`).
*   **Backend Services:** [roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) (needs to set `hostId` on room creation and return it in snapshots).
*   **Backend Schemas:** [schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts) (needs Zod format validations for room code).
*   **Backend Routes:** [rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) (needs to catch validation errors and return appropriate error codes).
*   **Frontend State:** [roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/state/roomStore.ts) (needs to support checking if the current player is the host, and trigger polling).
*   **Frontend Pages:** [LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) (needs to set up polling using `useEffect`, and conditionally render/enable the "Start Game" button).
*   **Frontend Pages:** [JoinRoomPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx) (needs inputs validation before submitting).
