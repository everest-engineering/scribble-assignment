# Specification: Scenario 1 — Room Setup & Lobby

## Story
Given a player wants to host or join a drawing game,
When they create or join a room via a unique code,
Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present.

---

## Acceptance Criteria

### AC1.1: Host Assignment on Room Creation
- **Given** a player creates a new room,
- **When** the room is created,
- **Then** the creator is stored as the `hostId` on the room.
- **And** the host is identifiable in the lobby UI (e.g., a "Host" badge).

### AC1.2: Join Validation — Unknown Room Code
- **Given** a player enters a room code,
- **When** the code does not match any existing room,
- **Then** the API returns a 404 status with message `"Room not found"`.
- **And** the frontend displays a clear error: `"Room not found. Check the code and try again."`.

### AC1.3: Join Validation — Empty Room Code
- **Given** a player tries to join a room,
- **When** the room code input is empty or whitespace-only,
- **Then** the form should not submit and should display `"Please enter a room code"`.

### AC1.4: Room Isolation
- **Given** two separate rooms exist (Room A and Room B),
- **When** a player joins Room A,
- **Then** they only see participants from Room A.
- **And** Room B's participant list is unaffected and invisible to Room A's players.

### AC1.5: Lobby Auto-Polling
- **Given** a player is in the lobby,
- **When** another player joins,
- **Then** the lobby participant list updates automatically within ~2 seconds via polling.
- **And** no manual refresh is needed to see new players.

### AC1.6: Start Game — Host Only
- **Given** the lobby has 2+ participants,
- **When** a non-host player clicks "Start Game",
- **Then** the button is disabled or the action is rejected.
- **And** only the host's "Start Game" button is active.

### AC1.7: Start Game — Minimum Players
- **Given** the lobby has fewer than 2 participants,
- **When** the host views the lobby,
- **Then** the "Start Game" button is disabled.
- **And** a message is shown: `"Waiting for at least 2 players to start."`.

### AC1.8: Start Game — API Guard
- **Given** a room has fewer than 2 participants,
- **When** a `POST /rooms/:code/start` request is received,
- **Then** the API returns 400 with message `"Need at least 2 players to start"`.
- **And** when a non-host sends the request, the API returns 403 with message `"Only the host can start the game"`.

---

## Edge Cases

| Edge Case | Expected Behaviour |
|-----------|-------------------|
| Room code casing | Codes are case-insensitive; "abcd" matches "ABCD" |
| Multiple rapid creates | Unique codes generated with collision retry (already implemented) |
| Browser refresh on lobby | Redirect to start page if no room state exists |
| Polling on unmount | `clearInterval` on component unmount (no stale fetches) |
| Network error during poll | Poll continues; error shown silently in status card, not a blocking modal |
