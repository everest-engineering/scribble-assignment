# Scenario 1 Specification: Room Setup & Lobby

## Overview
This specification defines the requirements, acceptance criteria, and edge cases for the Room Setup and Lobby feature of the Scribble multiplayer drawing game.

## Requirements

### 1. Input Validation
- **Player Names**: All player names must be trimmed using `.trim()` before room creation or room joining. Any empty or whitespace-only name must be rejected with a clear, user-facing error message (e.g., "Player name cannot be empty").
- **Room Codes**: All room codes must be trimmed using `.trim()` before joining. Any empty or whitespace-only room code must be rejected with a clear, user-facing error message (e.g., "Room code cannot be empty").

### 2. Host Tracking
- The participant who creates the room via `POST /rooms` must be marked and tracked on the backend as the host.
- The player representation in the room state must include an `isHost` boolean flag (set to `true` for the creator and `false` for others), or the room must track the host via a `hostId` field matching the creator's ID.

### 3. Lobby Gating
- On the frontend Lobby view:
  - The "Start Game" button must be visible **only** to the room's Host.
  - The "Start Game" button must remain **disabled** until there are **at least 2 players** present in the room (the Host and at least 1 other player).

### 4. Lobby Polling Sync
- The frontend must implement an automated background HTTP polling cycle.
- The polling must fetch the latest room state from `GET /rooms/:code` every `2000ms` (2 seconds).
- When updates to the participant list are fetched, the frontend state must be updated reactively, updating the UI list of players without requiring a manual page refresh.

### 5. Out of Scope Enforcement
The following behaviors are strictly **out of scope** and must not be implemented:
- **WebSockets**: All syncing/updates must be done via HTTP polling. No WebSockets or Socket.io.
- **Databases**: All data must be stored in-memory on the backend. No persistent databases (SQL, NoSQL, SQLite, etc.).
- **Authentication**: No authentication sessions, tokens (JWT), cookies, or OAuth.
- **Multiple Rounds**: This specification and game support only a single round of drawing/guessing.

---

## Acceptance Criteria

### Room Creation & Host Tracking
1. **Given** a player is on the Start screen,
   **When** they enter a valid name and click "Create Room",
   **Then** a new room is created on the backend, and that player is designated as the Host (`isHost: true` or `hostId` matches their ID).
   **And** they are redirected to the Lobby screen.
2. **Given** a player attempts to create a room,
   **When** the player name is empty or only whitespace,
   **Then** the client rejects the submission and displays a clear validation error message.

### Room Joining & Input Validation
1. **Given** a player wants to join an existing room,
   **When** they enter the room code and their name,
   **Then** both inputs are trimmed.
   **And** if either input is empty or only whitespace, the join request is rejected locally with a clear error message.
2. **Given** a player enters a valid name and valid room code,
   **When** they click "Join Room",
   **Then** they are added to the room on the backend (with `isHost: false`) and redirected to the Lobby.

### Lobby View & Host Gating
1. **Given** a Host is in the Lobby,
   **When** they are the only player in the room,
   **Then** they see the "Start Game" button, but it is disabled.
2. **Given** a Host is in the Lobby,
   **When** a second player joins the room,
   **Then** the "Start Game" button becomes active (enabled) for the Host.
3. **Given** a non-host player is in the Lobby,
   **Then** they **must not** see the "Start Game" button at all (it is hidden or omitted from the UI).

### Lobby Polling Sync
1. **Given** a player is in the Lobby,
   **When** other players join or leave the room,
   **Then** the player list updates automatically within 2 seconds via background HTTP polling without needing a manual page refresh or manual click of the refresh button.
