# Feature Specification: Room Setup & Lobby

## Overview
The "Room Setup & Lobby" feature is the entry point for the Scribble game. It allows players to either create a new game room or join an existing one using a unique code. This stage of the game is crucial for establishing the multiplayer session and ensuring that the host has control over when the game begins.

## User Story
**As a player**, I want to be able to host or join a drawing game,
**So that** I can play with my friends in a private and isolated environment.

**Given** a player wants to host or join a drawing game,
**When** they create a room, they are assigned as the host and receive a unique code.
**When** they join a room via a unique code, they are added to the participant list.
**Then** invalid or empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling every 2 seconds; and only the host can start the game once at least 2 players are present.

## Acceptance Criteria

### 1. Host Tracking & Identification
- The creator of a room must be stored and identified as the 'host'.
- The host is the only participant with administrative privileges in the lobby.
- In the UI, the host must be clearly labeled (e.g., "Host" next to their name) so all participants know who is in control.

### 2. Join Validation & Error Handling
- Joining a room requires a valid 4-character alphanumeric code.
- If the code is missing, too short, or contains invalid characters, the system must return a specific and helpful error message (e.g., "Room code must be exactly 4 characters").
- If a player tries to join with a code that does not exist in the system, a "Room not found" error must be displayed.
- Empty or whitespace-only player names must be rejected.

### 3. Room Isolation
- Each room must operate in its own isolated state.
- Data from one room (participants, drawing status, guesses) must never be visible or accessible from another room.
- Unique codes must be generated to prevent collisions between active rooms.

### 4. Real-time Lobby Sync (via Polling)
- Since WebSockets are forbidden, the frontend must implement a robust polling mechanism.
- The participant list must refresh automatically every 2 seconds to show new players joining or existing players leaving.
- Polling must be efficient and stop when the user navigates away from the lobby.

### 5. Game Start Permissions
- Only the host sees the "Start Game" button.
- The "Start Game" button remains disabled until the room has at least 2 participants (the drawer and at least one guesser).
- Once the minimum player count is met, the button becomes active, allowing the host to transition the room to the 'playing' status.

## Technical Constraints
- No WebSockets; use HTTP GET polling for state synchronization.
- All state must be managed in-memory on the backend; no external databases.
- Use Zod for strict schema validation of all incoming API requests.
