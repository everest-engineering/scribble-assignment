# Scenario 1 — Room Setup & Lobby

**Given** a player wants to host or join a drawing game,
**When** they create or join a room via a unique code,
**Then** the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present.

## Acceptance Criteria
1. Room creator is stored as `hostId` on the room and returned in snapshots.
2. Player names are trimmed on submission; empty or whitespace-only names are rejected with a clear error message.
3. Joining a non-existent room code returns a 404 error with "Room not found" message.
4. Rooms are isolated — participants in one room cannot see data from another room.
5. The lobby page auto-polls `GET /rooms/:code` every 2 seconds.
6. The "Start Game" button is only enabled for the host and only when ≥2 players are present.
7. Clicking "Start Game" calls `POST /rooms/:code/start` and navigates to the game screen on success.

## Edge Cases
- Double-submit protection on create/join forms.
- Polling stops when the user navigates away from the lobby.
- Host leaves (edge documented but out of scope for this scenario).
