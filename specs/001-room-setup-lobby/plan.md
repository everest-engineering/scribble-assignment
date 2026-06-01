# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Implement Scenario 1 behavior for room setup and lobby management. This includes host assignment during room creation, player name and room code validation, automatic lobby polling every ~2 seconds, and host-only start gating when at least two players are present.

## Technical Context

**Language/Version**: Node.js 18+ backend, React 18+ frontend, TypeScript.

**Primary Dependencies**:

- Backend: Express, Zod
- Frontend: React, react-router-dom, Vite

**Storage**: In-memory backend room store only.

**Testing**: Vitest for backend and frontend tests.

**Target Platform**: Browser-based web client and local Node backend.

**Project Type**: Web application with separate `backend/` and `frontend/` projects.

**Constraints**:

- No WebSockets; use HTTP polling only.
- No database persistence.
- No authentication.
- Centralize runtime validation with Zod.

## Constitution Check

- Uses TypeScript-first development.
- Preserves in-memory state only.
- Uses HTTP polling for lobby synchronization.
- Validates API input with Zod schemas.
- Uses React functional components and hooks.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── spec.md
├── plan.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   └── schemas.ts
│   ├── models/
│   ├── seed/
│   └── services/
│       └── roomStore.ts
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   └── LobbyPage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
```

**Structure Decision**: This is a web application with separated backend and frontend code, aligned with existing repository structure.

## Scenario 1 Design

### Backend changes

- Add host metadata to the first participant created in `createRoom()`.
- Enforce trimmed, non-empty player names in `createRoom` and `joinRoom`.
- Keep room codes uppercase and case-insensitive during lookup.
- Add `POST /rooms/:code/start` to move a room from `lobby` into the next phase.
- Reject start requests from non-hosts and when there are fewer than two players.
- Keep room isolation intact by returning only the requested room snapshot.

### Frontend changes

- Validate trimmed player names in `CreateRoomPage` and `JoinRoomPage` before submission.
- Normalize room code input to uppercase in the join flow.
- Track `participantId` in the room store and derive host status from the room snapshot.
- Add lobby polling with `setInterval` every ~2000ms while the lobby is mounted.
- Show host identity and eligibility status in the lobby.
- Disable or hide the start button for non-hosts and until there are at least two players.

### Data model changes

- `Room` should expose `code`, `status`, `participants`, `createdAt`, and `updatedAt`.
- `Participant` should include `id`, `name`, `joinedAt`, and `isHost`.
- `RoomSnapshot` should include the room code, status, participant list, available words, and roles.
- `RoomSnapshot` must make host identity available to the client without exposing extra backend-only state.

### API surface changes

- `POST /rooms`: create room and return `participantId + room`.
- `POST /rooms/:code/join`: join an existing room, with code validation.
- `GET /rooms/:code`: fetch the current room snapshot.
- `POST /rooms/:code/start`: host-only game start transition.

### UI behavior

- The lobby shows the room code, participant list, current status, and host flag.
- The lobby polls automatically every 2 seconds.
- The start button is only enabled for the host and only when 2+ players are present.
- Validation messages appear for empty names and invalid room codes.

## Risk and Scope

- This phase is limited to lobby-level behavior only.
- Do not implement drawing, guesses, scoring, or result lifecycle yet.
- The start action may transition room state but does not fully implement later game mechanics in this phase.

## Test Plan

### Backend tests

- Verify room creation assigns host metadata.
- Verify joining with an invalid code returns an error.
- Verify whitespace-only names are rejected.
- Verify starting a game as a non-host is rejected.
- Verify starting a game with fewer than two players is rejected.
- Verify room lookup is case-insensitive.

### Frontend tests

- Verify create/join pages display inline validation for empty names.
- Verify join code input is normalized to uppercase.
- Verify the lobby fetches updates automatically when mounted.
- Verify only the host can start the game when 2+ players are present.

## Next Step

After this plan, generate `/speckit.tasks` for Scenario 1 implementation and then implement the first feature slice.
