# Feature Specification: Room Setup and Lobby

## Description
Players can create or join a game room using a unique room code. The room creator becomes the host automatically. Players in the lobby should see synchronized participant updates through polling. Only the host can start the game when at least two players are present.

---

## User Stories

### US-01 Create Room
As a player,
I want to create a room,
so that I can host a Scribble game.

### US-02 Join Room
As a player,
I want to join an existing room using a room code,
so that I can participate in the game.

### US-03 Lobby Synchronization
As a player,
I want the lobby to refresh automatically,
so that I can see updated participants without manual refresh.

### US-04 Start Game
As a host,
I want to start the game only when enough players are present,
so that gameplay can begin correctly.

---

## Acceptance Criteria

### AC-01
Creating a room generates a unique room code.

### AC-02
The player who creates the room becomes the host automatically.

### AC-03
Joining with an invalid room code shows a clear error message.

### AC-04
Empty or whitespace-only player names are rejected.

### AC-05
Lobby participants refresh automatically within approximately 2 seconds.

### AC-06
Only the host can see and use the start game action.

### AC-07
The game cannot start unless at least 2 players are present.

### AC-08
Rooms remain isolated from each other.

---

## Edge Cases

### EC-01
Joining a non-existent room should display an error message.

### EC-02
Whitespace-only player names should be rejected.

### EC-03
Polling failures should not crash the application.

### EC-04
A non-host player attempting to access start game functionality should be prevented.

### EC-05
Refreshing the browser should preserve the current lobby state if room data still exists in memory.

---

## Data Requirements

### Room
- code
- hostId
- participants
- gameState

### Participant
- id
- name
- isHost

---

## Non-Goals
- No WebSockets
- No authentication
- No persistent database storage
- No multiple rounds
- No spectator mode