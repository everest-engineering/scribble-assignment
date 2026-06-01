# Feature: Room Setup & Lobby

## Overview
This feature covers the room lifecycle from creation through lobby state. Players create or join rooms via a 4-character alphanumeric code. The room creator is designated as the host. The lobby auto-polls to show live participant lists. The host can start the game once enough players have joined.

## Acceptance Criteria
1. When a player creates a room, they are automatically designated as the host and their participant ID is stored as `hostId` on the room.
2. Player names submitted during create or join are trimmed of leading/trailing whitespace before storage or validation.
3. Empty or whitespace-only player names are rejected by both the backend API (400 status) and frontend form (inline error message). The backend is the authoritative validator.
4. Joining a room requires a valid 4-character room code. The code is case-insensitive during lookup — "abcd" matches "ABCD". Codes are stored in uppercase internally.
5. Joining a non-existent room code returns a 404 HTTP response with a clear JSON error message (e.g., "Room not found").
6. Rooms are fully isolated in memory. Operations on one room (create, join, start, poll) never affect the data or state of any other room. Each room has its own participant list, host, and state.
7. The lobby page automatically polls `GET /rooms/:code?participantId=X` every approximately 2 seconds to refresh the participant list. No manual refresh button is required after auto-polling is implemented.
8. Only the host player can see the "Start Game" button on the lobby page. Non-host players see a waiting message instead.
9. The "Start Game" button is rendered but visually disabled (greyed out, non-clickable) when fewer than 2 participants are in the room.
10. A descriptive message is shown below the disabled button, e.g., "Waiting for more players... (2+ players required)".
11. When at least 2 players are present, the host's "Start Game" button becomes enabled and clickable.

## Edge Cases
- Creating a room with an empty or missing `playerName` defaults the name to "Player" on the backend. The frontend should also validate non-empty before sending.
- Creating or joining with a name that is only whitespace after trimming is treated as empty and rejected or defaulted.
- Room codes with fewer than 4 characters or with special characters are rejected at the API level with a 400 status and descriptive message.
- If a player re-joins a room they are already in (same participant ID), they are not duplicated in the participant list — the backend silently returns the existing snapshot.
- Polling must continue across page re-renders within the lobby and stop when the user navigates away (cleanup on unmount).
- Multiple simultaneous create-room requests from different browsers produce unique, non-conflicting codes due to the collision-check in `generateUniqueCode()`.
