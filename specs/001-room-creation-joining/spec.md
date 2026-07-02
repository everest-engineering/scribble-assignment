# Feature Specification: Room Creation & Joining (Slice 1)

## Overview
Implement the room creation and joining flow for the multiplayer Scribble Game. This slice covers the initial setup of a game room, host designation, lobby synchronization via HTTP polling, and authorization checks for starting a game.

---

## User Story
```text
As a player,
I want to create a new room or join an existing room using a unique room code,
so that I can play a drawing game with my friends in an isolated game session.
```

---

## Core Terminology & Data Model Updates
- **Host**: The player who creates the room. Only the Host can start the game.
- **Room Code**: A unique, uppercase 4-character alphanumeric string generated deterministically by the server.
- **Lobby State**: The initial room state before game play starts, where players assemble.
- **Active Session**: An isolated memory instance representing a single game room.

### State Schema Extensions (Proposed)
To support host-tracking and lifecycle checks:
- **`Room` (Backend)**: Add `hostId: string` containing the `participantId` of the room creator.
- **`RoomSnapshot` (Shared API)**: Add `hostId: string` to inform the frontend who is authorized to start.

---

## Functional Requirements

### 1. Room Creation
- A player MUST be able to create a new game room by submitting their player name.
- The server MUST generate a unique room code.
- The creator of the room MUST automatically be designated as the **Host** (`hostId` set to their participant ID).
- The room status MUST be set to `"lobby"` initially.
- The player names MUST be validated (trimmed, non-empty, rejection of whitespace-only).

### 2. Joining a Room
- A player MUST be able to join an existing room by submitting a valid room code and their player name.
- The server MUST uppercase the room code parameter to ensure case-insensitive matching.
- The frontend MUST validate that the room code and player name are not empty (or whitespace-only) before making the join API request, showing a clear error message (e.g., "Room code cannot be empty") to avoid invalid API requests.
- Invalid room codes (malformed or not found) MUST be rejected with a `404` or `400` status and a clear JSON error message: `"Room not found."`
- Duplicate player joins within the same session MUST be prevented or handled cleanly (e.g. by appending a suffix or rejecting duplicate names, depending on clarification).

### 3. Lobby Synchronization (HTTP Polling)
- All players in the room MUST view the lobby showing the player list.
- The client MUST sync room state by polling the server approximately every 2 seconds (`2000ms`).
- In-memory room isolation MUST be guaranteed. Room data operations (joining, leaving) in Room A MUST NEVER affect Room B.

### 4. Game Initiation
- Only the player matching the `hostId` MUST have authorization to start the game.
- The game MUST NOT start unless there are at least two players (`participants.length >= 2`) present in the lobby.
- Non-host start actions MUST be rejected with a `403 Forbidden` status.

---

## Acceptance Criteria

### AC1 - Create Room
- **Given** a player wants to host a game,
- **When** they submit a valid player name (whitespace trimmed, non-empty) to create a room,
- **Then** the server generates a unique room code,
- **And** registers the creator as the host (`hostId` matching their participant ID),
- **And** returns a `201 Created` status with the new room session,
- **And** the player successfully enters the Lobby screen.

### AC2 - Join Existing Room
- **Given** an existing room code,
- **When** a player enters the code and a valid player name,
- **Then** they successfully join the room,
- **And** they are registered as a participant,
- **And** they appear in the lobby player list for all connected clients.

### AC3 - Invalid Room Code
- **Given** an invalid, empty, or non-existent room code,
- **When** a player attempts to join,
- **Then** the system rejects the request,
- **And** returns a structured error message (e.g., `404 Not Found` or `400 Bad Request`),
- **And** the frontend displays a clear, user-friendly error message to the player.

### AC4 - Room Isolation
- **Given** multiple active game rooms (e.g., Room `ABCD` and Room `WXYZ`),
- **When** players join or leave Room `ABCD`,
- **Then** the player list and status of Room `WXYZ` remain completely unchanged and unaffected.

### AC5 - Lobby Refresh
- **Given** multiple players in a lobby,
- **When** a new player joins or an existing player disconnects/leaves,
- **Then** the lobby player list updates automatically across all clients within approximately 2 seconds without requiring manual refresh.

### AC6 - Start Game
- **Given** at least two players are present in the lobby,
- **When** the host clicks "Start Game",
- **Then** the backend changes the room status to `"active"` (or `"game"`),
- **And** the game starts successfully for all participants.

### AC7 - Prevent Invalid Start
- **Given** only one player (the host) is present in the lobby,
- **When** the host attempts to start the game,
- **Then** the action is rejected on both frontend and backend, showing an appropriate warning message.

### AC8 - Host Authorization
- **Given** a player who is not the host (participant ID does not match `hostId`),
- **When** they attempt to trigger the start game action (either via UI manipulation or direct API call),
- **Then** the action is denied on the backend (returning a `403 Forbidden` error) and the UI restricts the action.

---

## Edge Cases & Handling Strategy

| Edge Case | Handling Strategy |
|-----------|-------------------|
| **Empty or whitespace player name** | Reject on client and server with a `400 Bad Request` validation error: `"Player name cannot be empty."` |
| **Malformed/missing room code** | Reject on backend using `Zod` query/param validation; respond with `400 Bad Request` or `404 Not Found`. |
| **Non-existent room code** | Reject on backend with `404 Not Found` and a message: `"Room not found."` |
| **Duplicate names in same room** | Append a differentiator (e.g., `"Alice (2)"`) or reject with `400 Bad Request` to ensure unique identity in UI. |
| **Simultaneous player joins** | Since the backend uses an in-memory `Map` and push array synchronously on a single Node thread, simultaneous requests will resolve sequentially without concurrency conflicts. |
| **Transient polling network error**| The client MUST handle failed polling requests gracefully: keep trying after the next interval, and display a subtle "Reconnecting..." status indicator if consecutive errors occur. |
| **Lobby page refresh** | The client state SHOULD recover by storing the `participantId` and `roomCode` in browser storage (e.g. `sessionStorage`) so refreshing the page doesn't throw the player out of the room. |
| **Host disconnects/leaves** | If the host leaves or disconnects: either migrate the host role to the next oldest active participant in the list, or terminate the lobby. *Proposed implementation: Migrate host to the next participant in the list to keep game playable.* |
| **Double start triggers** | If a host triggers start game multiple times rapidly, the backend MUST check the room status and ignore subsequent start requests if the game is already in progress. |
