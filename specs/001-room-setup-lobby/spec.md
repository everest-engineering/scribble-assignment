# Feature 001: Room Setup & Lobby

## Discovery

See [.specify/discovery-notes.md](../../.specify/discovery-notes.md) for full discovery notes.

**Gaps addressed in this feature:**
- No host tracking on room creation
- No automatic lobby polling
- Missing room code format validation
- Frontend API URL bug (`/bug` suffix)

## User Story

As a player, I want to create or join a room via a unique code so that I can wait in a lobby with other players until the host starts the game.

## Acceptance Criteria

### AC-1: Host Assignment
- **Given** a player creates a room via `POST /rooms`
- **When** the room is created
- **Then** the creator's `participantId` is stored as `hostId` on the room
- **And** the lobby UI shows a "Host" badge next to the host participant

### AC-2: Join Validation
- **Given** a player enters a room code to join
- **When** the code is empty or not 4 alphanumeric characters
- **Then** the API returns 400 with message "Invalid room code format"
- **When** the code format is valid but room does not exist
- **Then** the API returns 404 with message "Unable to join room"

### AC-3: Room Isolation
- **Given** two rooms exist with different codes
- **When** players join each room
- **Then** participant lists are independent and do not overlap

### AC-4: Lobby Polling
- **Given** a player is on the lobby page
- **When** the page is mounted
- **Then** the room snapshot is fetched automatically every ~2 seconds
- **And** new participants appear without manual refresh

### AC-5: Host-Only Start
- **Given** a player is in the lobby
- **When** they are not the host
- **Then** the "Start Game" button is hidden or disabled
- **When** the host has fewer than 2 participants
- **Then** the "Start Game" button is disabled with message "Need at least 2 players"
- **When** the host has 2+ participants and clicks Start
- **Then** `POST /rooms/:code/start` is called (Phase 2 wires full game start)

### AC-6: API URL Fix
- **Given** a fresh clone with no `VITE_API_URL` set
- **When** the frontend makes API calls
- **Then** requests go to `http://localhost:3001` (not `/bug`)

## Edge Cases

- Joining a room that is already in `playing` or `result` state should return 409
- Room code comparison is case-insensitive (uppercased server-side)
- Polling stops when the component unmounts (navigate away from lobby)

## Out of Scope

- Player name trim/validation (Feature 002)
- Actual game start logic (Feature 002)
- WebSockets, databases, authentication
