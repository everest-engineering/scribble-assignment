# Scenario 1 - Room Setup And Lobby

## User Story

As a player, I want to create or join a room so that I can play the drawing game with other players.

## Acceptance Criteria

### AC-01 Host Assignment

Given a player creates a room

When the room is created successfully

Then the creator becomes the host automatically.

### AC-02 Join Room Validation

Given a player enters a room code

When the code is empty or invalid

Then a clear error message should be shown.

### AC-03 Room Isolation

Given multiple rooms exist

When players join different rooms

Then players should only see participants from their own room.

### AC-04 Lobby Polling

Given players are in the lobby

When new players join

Then the participant list should refresh automatically approximately every 2 seconds.

### AC-05 Start Game Rules

Given a player is the host

When at least 2 players are present

Then the host can start the game.

Given less than 2 players are present

Then the game cannot be started.
