# Feature Group 1: Room Setup & Lobby

**Scenario:** Room Setup & Lobby

## Acceptance Criteria

### AC1: Host Tracking
- When a player creates a room, they are recorded as the host.
- The room snapshot exposes the `hostId` of the host participant.
- The lobby page displays a "Host" badge next to the host's name.

### AC2: Invalid/Empty Code Rejection
- Creating a room without a player name shows "Player name is required".
- Joining a room with an empty room code shows "Room code is required".
- The backend Zod schema rejects empty strings with a 400 status.
- Error messages are surfaced in the UI as clear inline feedback.

### AC3: Room Isolation
- Operations on one room never affect another room's data.
- Each room has a unique 4-character alphanumeric code.
- A room can only be accessed via its exact code.

### AC4: Lobby Auto-Polling
- The lobby page polls `GET /rooms/:code` every ~2 seconds.
- The participant list updates automatically without manual refresh.
- Polling stops when the user navigates away from the lobby page.

### AC5: Host-Only Start Game
- Only the host can see and click the "Start Game" button.
- The button is disabled when fewer than 2 players are present.
- The backend returns 403 if a non-host attempts to start.
- The backend returns 400 if fewer than 2 players attempt to start.
- On successful start, the host is navigated to the game page.
- Room status changes from "lobby" to "playing".

## Edge Cases
- Room code not found on join → 404 "Unable to join room"
- Room not found on poll → 404 "Unable to load room"
- Navigating directly to `/lobby` without room state → redirect to `/`
