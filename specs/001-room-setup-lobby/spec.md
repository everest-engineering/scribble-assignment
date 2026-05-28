## Feature: Room Setup and Lobby

### Description

Users should be able to create or join isolated game rooms using a room code. The creator of the room becomes the host, the lobby should automatically synchronize using polling, and only the host should be allowed to start the game when enough players are present.

## Clarifications

### Session 2026-05-28
- Q: What happens when the host starts the game? → A: Navigate all players in the room to the Game page immediately.
- Q: What happens to the polling interval when a player leaves the Lobby? → A: Clear the polling interval immediately when the user leaves the Lobby.
- Q: What happens if the host leaves the room during the Lobby phase? → A: Transfer host status to the next player in the participant list.

### User Stories

* US-01: As a player, I want to create a room so I can host a Scribble game
* US-02: As a player, I want to join a room using a room code so I can play with others
* US-03: As a host, I want only authorized players in my room so room state remains isolated
* US-04: As a player, I want the lobby to update automatically so I can see participants joining in real time
* US-05: As a host, I want to start the game only when enough players are present
* US-06: As a player, I want validation messages for invalid inputs so I understand why an action failed

### Acceptance Criteria

* AC-01: Creating a room automatically assigns the creator as host
* AC-02: Host information persists while the room exists
* AC-03: Empty or whitespace-only player names are rejected
* AC-04: Empty or invalid room codes are rejected with clear feedback
* AC-05: Lobby automatically refreshes approximately every 2 seconds
* AC-06: Newly joined participants appear automatically in the lobby
* AC-07: Multiple rooms remain completely isolated from one another
* AC-08: Only the host can start the game; upon start, all players are navigated to the Game page immediately
* AC-09: Game start is blocked if fewer than 2 players are present
* AC-10: Backend validates host permissions before allowing game start
* AC-11: Polling intervals are cleared immediately when the user leaves the Lobby or the component unmounts
* AC-12: If the host leaves the room, host status is automatically transferred to the next player in the participant list

### Edge Cases

* EC-01: Joining with an invalid room code should show an error message
* EC-02: Joining with whitespace-only names should block submission
* EC-03: Non-host users attempting to start the game should receive an error
* EC-04: Refreshing one lobby should not affect another room
* EC-05: Rapid polling requests should not create duplicate intervals
* EC-06: Leaving and re-entering the lobby should not create memory leaks
* EC-07: Starting a game with only one player should fail gracefully
* EC-08: Host migration logic must ensure a room always has exactly one host as long as participants remain

### Data Requirements

* Room: { code, hostId, players, gameState }
* Player: { id, name, isHost }
* GameState: { lobby, playing, results }

### Non-goals

* No gameplay implementation
* No drawing canvas
* No guess handling
* No scoring system
* No restart flow
* No WebSockets or real-time socket communication
* No multiple rounds or timers
