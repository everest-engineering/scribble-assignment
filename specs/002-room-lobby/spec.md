# Feature Specification: Room & Lobby Sync

**Feature Branch**: `002-room-lobby`

**Created**: 2026-06-05

**Status**: Draft

## Objective

Enable players to create a room, join by code, and stay synchronized in a lobby with a shared participant list. The room creator is the host and only the host may start the game after at least two players have joined.

## Acceptance Criteria

1. Given a player creates a room, when the room is created, then they receive a unique room code and are marked as the host.
2. Given a valid room code, when another player joins, then they enter the same room lobby and their presence appears in the roster for all participants.
3. Given an empty or invalid room code, when a player attempts to join, then the join fails with clear feedback and no lobby entry occurs.
4. Given a lobby with fewer than 2 players, when the host views the start control, then the game cannot be started.
5. Given a lobby with at least 2 players, when the host views the start control, then the host can start the game and non-hosts cannot.
6. Given lobby state changes, when participants refresh state, then the participant list updates automatically on a short polling interval.

## Edge Cases

- Joining with whitespace-only room code is rejected.
- Duplicate room codes are not allowed.
- Host designation remains stable even if additional players join.
- Player names are trimmed before admission.

## Key Requirements

- Room creation must return a unique join code.
- Host assignment must happen on create and be preserved.
- Room access must be isolated from other room codes.
- Lobby state must be refresher-friendly and suitable for periodic polling.
