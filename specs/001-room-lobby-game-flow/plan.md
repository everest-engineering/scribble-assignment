# Implementation Plan: Room Setup and Lobby

**Branch**: `assignment` | **Date**: 2026-05-31 | **Spec**: `specs/001-room-lobby-game-flow/spec.md`

**Input**: Scenario 1: room setup and lobby.

## Summary

Implement the room setup and lobby slice: create room, assign creator as host, join by unique code, reject invalid or empty inputs with clear feedback, isolate rooms, poll lobby state about every 2 seconds, and allow only the host to start once at least two players are present.

## Technical Context

**Language/Version**: Node.js + TypeScript backend; React + TypeScript frontend.

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest.

**Storage**: In-memory backend rooms only; frontend keeps transient in-app room state.

**Testing**: Vitest backend and frontend tests.

**Constraints**: No WebSockets, databases, authentication, accounts, or persistent sessions.

## Key Endpoints

- `POST /rooms`: create a room from a non-empty trimmed player name and return host session plus lobby snapshot.
- `POST /rooms/:code/join`: join by normalized room code and non-empty trimmed player name.
- `GET /rooms/:code?participantId=...`: poll the latest lobby snapshot.
- `POST /rooms/:code/start`: host-only start with at least two players.

## Data Flow

1. Creator submits a trimmed player name.
2. Backend creates a room, assigns creator as `hostId`, and returns `participantId` plus room snapshot.
3. Joiner submits a room code and trimmed player name.
4. Backend normalizes the code, validates room existence, and returns a room snapshot scoped to that room.
5. Lobby polls the room snapshot about every 2 seconds.
6. Host starts only when at least two participants are present.

## Implementation Tasks

- Validate create and join names after trimming.
- Normalize room code input to uppercase.
- Track `hostId` on room creation.
- Keep room participants/status isolated by room code.
- Poll lobby state by HTTP.
- Disable or reject start for non-hosts and rooms with fewer than two players.

## Validation

- Create room shows creator as host.
- Invalid and empty codes show clear feedback.
- Two rooms do not share participants or status.
- Lobby updates within about 2 seconds after another player joins.
- Only host can start and only with at least two players.
