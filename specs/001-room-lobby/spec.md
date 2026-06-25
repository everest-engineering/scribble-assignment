# Feature Specification: Room Setup & Lobby (Scenario 1)

## Overview

Players create or join isolated rooms via a unique 4-character code. The creator is the host. The lobby auto-refreshes via polling. Only the host can start the game when at least 2 players are present.

## User Stories

- **US-1.1** As a host, I create a room and am identified as host in the lobby.
- **US-1.2** As a player, I join a room with a valid code and see myself in the participant list within ~2 seconds.
- **US-1.3** As a player, I receive clear feedback when I enter an invalid or empty room code.
- **US-1.4** As a non-host, I cannot start the game and see a waiting message.
- **US-1.5** As a host with 2+ players, I can start the game via the backend.

## Acceptance Criteria

### AC-1.1 Host on create
- **Given** a player creates a room, **When** the room is created, **Then** that player's `participantId` equals `hostId` in the room snapshot.

### AC-1.2 Join validation
- **Given** a player submits an empty or whitespace-only room code, **When** they attempt to join, **Then** the frontend shows a validation error without calling the API.
- **Given** a player submits a code for a non-existent room, **When** they join, **Then** the API returns 404 with message "Unable to join room".

### AC-1.3 Room isolation
- **Given** two rooms A and B exist, **When** a player joins room A, **Then** they only see participants from room A.

### AC-1.4 Lobby polling
- **Given** a player is on the lobby page, **When** another player joins, **Then** the participant list updates within ~2 seconds without manual refresh.

### AC-1.5 Host-only start
- **Given** a room with fewer than 2 players, **When** the host views the lobby, **Then** the Start Game button is disabled.
- **Given** a non-host player, **When** they view the lobby, **Then** no Start Game button is shown.
- **Given** a host with 2+ players, **When** they click Start Game, **Then** `POST /rooms/:code/start` is called and succeeds.

## Edge Cases

- Room code param with only whitespace → 400 "Room code is required"
- Host leaves (out of scope — no leave endpoint)
- Concurrent joins to same room → both appear in participant list on next poll

## Out of Scope

- WebSockets, auth, room passwords, kick/mute
