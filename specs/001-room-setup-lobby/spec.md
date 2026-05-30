# Feature Specification: Room Setup & Lobby

This feature specification details the requirements, validation rules, edge cases, and acceptance criteria for the room setup and lobby lifecycle in the Scribble drawing game.

## 1. Description and Goal
The goal of this feature is to enable players to create separate, isolated game rooms and join existing rooms via room codes. Additionally, the lobby screen must support real-time user updates via polling to show the list of currently connected participants, and assign host rights to the room creator to control game start actions.

## 2. Detailed Requirements

### 2.1 Room Creation and Host Assignment
* When a user creates a new game room (submitting their name via the room creation form), the backend must generate a unique 4-character room code.
* The backend must register the creator's participant ID as the `hostId` of the room.
* The room's initial status must be `"lobby"`.
* The creator is automatically redirected to the Lobby screen with host-specific administration tools visible (e.g., a "Start Game" button).

### 2.2 Joining a Room
* A user can join an existing room by typing in the 4-character room code and their desired player username.
* The system must check if the room code exists and is currently in the `"lobby"` phase. If the game is already in progress, the join attempt must be rejected.
* The player's name must be trimmed and validated. Empty or whitespace-only names must be rejected.
* Users must be redirected to the Lobby screen on success.

### 2.3 Lobby Polling
* The frontend must poll the backend at a regular interval of approximately 2 seconds (`2000ms`) to retrieve the current room snapshot.
* This polling must dynamically update the participant list, ensuring that when new players join, they appear on all screens within the polling interval.
* Manual refresh is supported but automatic polling is the primary sync mechanism.

### 2.4 Multi-Room Isolation
* All game rooms must be completely isolated from one another.
* Operations such as joining, leaving, drawing, or guessing in Room A must have zero impact or visibility in Room B.

## 3. Input Validation and Rules
* **Invalid Room Code**: Attempting to join with an empty, non-existent, or malformed room code must fail with an explicit user-facing error message (e.g., "Room not found").
* **Username Trim and Validation**: Usernames must have leading and trailing whitespaces stripped. If the remaining string is empty, the join request is rejected.
* **Name Uniqueness**: If a user tries to join using a username that matches another active participant's name in that specific room, the system should reject the join or handle it gracefully to avoid name collisions.

## 4. Acceptance Criteria
* **AC 1**: A user creating a room becomes the host. The room code is generated and shown.
* **AC 2**: Joining requires a valid room code and a non-empty name. Empty names are rejected.
* **AC 3**: The lobby list updates automatically every 2 seconds without requiring manual refresh.
* **AC 4**: Host-specific controls (e.g., "Start Game") are only visible to the host and disabled if there are fewer than 2 players.
* **AC 5**: Rooms are fully isolated; player lists are separate.
