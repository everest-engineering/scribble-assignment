# Implementation Plan: Room Setup and Lobby

## Scope

This feature slice extends the starter create/join flow into a validated multiplayer lobby. It remains within the assignment constraints: no persistence, no authentication, no WebSockets, and no new routing or state libraries.

## Technical Approach

- Backend room state stays in the existing in-memory room store.
- `Room` gains `hostParticipantId` so host-only actions can be enforced.
- Create and join payloads are validated with Zod schemas.
- Room codes are normalized at the API boundary and store boundary.
- Room snapshots become viewer-specific so controls can be derived from server state.
- Frontend create and join forms reject whitespace-only names before request submission.
- The lobby polls `GET /rooms/:code` every 2 seconds and passes the stored participant id.
- The start button is enabled only when the server snapshot returns `canStart`.

## Files

- `backend/src/models/game.ts`
- `backend/src/api/schemas.ts`
- `backend/src/api/rooms.ts`
- `backend/src/services/roomStore.ts`
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/LobbyPage.tsx`

## Risks

- A stale frontend snapshot could enable the wrong UI state. Server-side host and participant-count checks remain authoritative.
- In-memory rooms reset when the backend restarts. This is accepted for the assignment scope.

## Validation Plan

- Backend tests for create, join, host assignment, unknown room, name rejection, room isolation, and start preconditions.
- Frontend tests for API request shape and room store session state.
- Manual two-browser flow to confirm lobby polling and host-only start behavior.
