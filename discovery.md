# Discovery Report: Scribble Multiplayer Drawing Game

This document outlines the findings from the initial codebase review, highlighting incomplete behaviors, core assumptions, and the relevant files in the project.

## Incomplete Behaviors

1. **Incorrect API Base URL in Frontend (`frontend/src/services/api.ts`):**
   The API client configures the base URL as `http://localhost:3001/bug` by default, whereas the Express backend router mounts routes directly on `/rooms` (relative to `/`). This causes API requests (like `/rooms` and `/rooms/:code/join`) to fail with a `404 Route not found` error unless the fallback is explicitly overridden by setting `VITE_API_URL`.

2. **Lobby Refresh & Polling Sync (`frontend/src/pages/LobbyPage.tsx`):**
   There is no background polling implemented in the Lobby page to check for new participants joining or if the host has started the game. The client relies on the player manually clicking the "Refresh Room" button to call `roomStore.fetchRoom()`.

3. **Start Game Backend Transition & Game Statuses (`backend/src/models/game.ts` and `frontend/src/pages/LobbyPage.tsx`):**
   The "Start Game" button in `LobbyPage.tsx` merely executes a client-side navigation (`navigate("/game")`) to the `/game` route. There is no corresponding backend endpoint or model transition to shift a room's state from `"lobby"` to a playing status. The `RoomStatus` type is currently hardcoded only to the literal `"lobby"`.

4. **Empty Guess Submission Logic (`frontend/src/components/GuessForm.tsx`):**
   The `handleSubmit` function in the `GuessForm` component only prevents the default form submission behavior (`event.preventDefault()`) but does not submit the guess to the backend, trigger updates, or log any activity.

5. **Static UI Placeholders (`frontend/src/pages/GamePage.tsx`, `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`):**
   The canvas area is a static `div` displaying "Waiting for drawer...". The scoreboard and result panel are static placeholder shells with mock data and text, rather than dynamically reflecting room participants, live scores, or real-time game logs.

---

## Assumptions

1. **In-Memory Storage Lifetime:**
   The backend stores all game data in-memory via a `Map<string, Room>` in `backend/src/services/roomStore.ts`. It is assumed that data persistence across server restarts is not required, and room state is completely ephemeral.

2. **No User Authentication/Authorization:**
   The application assumes that participants are identified simply by a client-side random UUID (`participantId`) and their self-provided name. There is no secure authentication (JWT, sessions, etc.), and the current design assumes anyone in the room can start the game or execute changes.

3. **HTTP Polling for Real-Time Sync:**
   Per the project constraints (`AGENTS.md`), no WebSockets or real-time push protocols are used. Real-time gameplay updates and canvas syncing must be designed entirely around HTTP polling.

---

## Relevant Files

### Backend
- **[game.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/backend/src/models/game.ts)**: Declares key TypeScript interfaces like `Room`, `RoomSnapshot`, `Participant`, and `RoomStatus`.
- **[roomStore.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/backend/src/services/roomStore.ts)**: Handles the creation, retrieval, and updating of room instances inside an in-memory `Map`.
- **[rooms.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/backend/src/api/rooms.ts)**: Defines room-related HTTP endpoints for creating, joining, and fetching rooms.
- **[router.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/backend/src/api/router.ts)**: Main router combining endpoints, route-not-found handling, and centralized validation error formatting.

### Frontend
- **[api.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/services/api.ts)**: Contains the fetch client wrappers and defines the base URL containing the `/bug` suffix.
- **[roomStore.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/state/roomStore.ts)**: Manages room session states (like current room details and participant ID) and orchestrates API queries.
- **[LobbyPage.tsx](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/pages/LobbyPage.tsx)**: Displays the room lobby view and lets players view joined participants.
- **[GamePage.tsx](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/pages/GamePage.tsx)**: The main layout containing the game interface, including scoreboard, drawing canvas, and guess input.
- **[GuessForm.tsx](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/components/GuessForm.tsx)**: The UI input form for guessing words.
- **[Scoreboard.tsx](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/components/Scoreboard.tsx)**: Display interface for listing player scores.
- **[ResultPanel.tsx](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/components/ResultPanel.tsx)**: Displays recent activities and guess events.
