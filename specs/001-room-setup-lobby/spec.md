# Feature Specification: Room Setup & Lobby (US1)

**Feature Branch**: `001-scribble-game`
**Created**: 2026-06-04
**Status**: Complete

## User Story

A player wants to host or join a drawing game. They create a room with their name and receive a unique room code. A second player joins using that code. Both players see each other in the lobby, which refreshes automatically without manual interaction. Only the host can start the game, and only once at least 2 players have joined.

## Acceptance Scenarios

1. **Given** a player enters a non-empty name and clicks Create Room, **When** the room is created, **Then** the player lands in the Lobby as the host and a unique room code is displayed.
2. **Given** a second player enters the room code and a non-empty name, **When** join succeeds, **Then** the player lands in the Lobby and the host sees them within ~2 seconds without refreshing.
3. **Given** 2+ players are in the lobby, **When** the host views the lobby, **Then** a Start Game button is visible and enabled only to the host.
4. **Given** only 1 player is in the lobby, **When** the host views the lobby, **Then** the Start Game button is visible but disabled.
5. **Given** a player submits an empty or whitespace-only name, **When** they submit, **Then** "Name cannot be empty" is shown and no API call is made.
6. **Given** a player joins with a non-existent code, **When** they submit, **Then** a clear error is shown.
7. **Given** two separate rooms exist, **When** each lobby is polled, **Then** participant lists never bleed across rooms.

## Functional Requirements

- FR-001: `createRoom` sets `hostId` to the creator's `participantId`
- FR-002: `joinRoom` appends participant; host sees them within next poll cycle (~2s)
- FR-003: Lobby polls `GET /rooms/:code` every 2 seconds with `clearInterval` cleanup
- FR-004: Start Game button shown only when `room.hostId === participantId`; disabled when `participants.length < 2`
- FR-005: `playerName` trimmed and validated `min(1)` on both client and server

## Success Criteria

- SC-001: Two-tab test — Tab 2 appears in Tab 1 lobby within 2 seconds, no Refresh pressed
- SC-002: Start button absent on Tab 2 (guesser view)
- SC-003: Empty name rejected before any network call
