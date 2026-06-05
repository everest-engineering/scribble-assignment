# Plan: Room Setup & Lobby

## Source

- Spec: `speckit/specs/01-room-setup-lobby.md`
- Constitution: `speckit/constitution.md`
- Discovery: `speckit/discovery.md`

## Goal

Implement the first room lifecycle slice: host assignment, room-code validation, room isolation, lobby polling, host-only start controls, and minimum-player enforcement. Keep all sync over HTTP polling and all room state in memory.

## Current State

The backend currently supports room creation, join, and fetch only. Rooms include `code`, `status`, `participants`, `createdAt`, and `updatedAt`, but no host identity or game-start transition.

The frontend currently stores one room snapshot and participant id. The lobby can manually refresh the room, and the `Start Game` button only navigates to `/game` locally.

## Backend Plan

1. Extend the room model in `backend/src/models/game.ts`.
   - Add a non-null `hostParticipantId` to `Room`.
   - Add `hostParticipantId` and viewer-derived host capability to `RoomSnapshot`.
   - Extend `RoomStatus` beyond `lobby` only enough to represent a started game state for this feature group.

2. Tighten request validation in `backend/src/api/schemas.ts`.
   - Trim and reject empty room codes.
   - Validate room code format consistently.
   - Add a start-game request schema that includes `participantId`.

3. Update room creation and join logic in `backend/src/services/roomStore.ts`.
   - Set the creator as `hostParticipantId`.
   - Normalize room codes before lookup.
   - Preserve room isolation by mutating only the targeted room.
   - Return snapshots that expose host identity and whether the viewer is host.

4. Add start-game service logic in `backend/src/services/roomStore.ts`.
   - Reject missing rooms.
   - Reject unknown participants.
   - Reject non-host participants.
   - Reject rooms with fewer than 2 participants.
   - Transition room status from `lobby` to game-started state.

5. Add a start-game route in `backend/src/api/rooms.ts`.
   - Use a route such as `POST /rooms/:code/start`.
   - Parse params and body with Zod.
   - Return the updated room snapshot on success.
   - Surface clear errors through the existing error handler.

## Frontend Plan

1. Update frontend API types and methods in `frontend/src/services/api.ts`.
   - Match the backend `RoomSnapshot` shape.
   - Add `startGame(code, participantId)`.

2. Update room store behavior in `frontend/src/state/roomStore.ts`.
   - Add a `startGame` action.
   - Keep existing snapshot updates centralized.
   - Preserve graceful error handling.

3. Update lobby polling in `frontend/src/pages/LobbyPage.tsx`.
   - Start a 2-second polling interval while the lobby is mounted.
   - Stop polling on unmount.
   - Handle polling failures without crashing the UI.
   - Navigate to `/game` or otherwise respond when a polled snapshot shows the room has started.

4. Update lobby host controls in `frontend/src/pages/LobbyPage.tsx`.
   - Show or enable start controls only for the host.
   - Disable or block start when fewer than 2 participants are present.
   - Display clear feedback for host-only and minimum-player cases.

5. Update create/join forms if needed.
   - Trim room codes before submission.
   - Display clear feedback for empty or invalid room codes.

## Data Flow

1. Host creates room.
   - Frontend calls `POST /rooms`.
   - Backend creates first participant, stores `hostParticipantId`, and returns a room snapshot.
   - Frontend stores `participantId` and room snapshot.

2. Player joins room.
   - Frontend trims and normalizes code input.
   - Backend validates code, finds matching room, adds participant, and returns only that room snapshot.
   - Existing lobby participants see the new player on the next poll.

3. Lobby polling.
   - Frontend calls `GET /rooms/:code?participantId=...` every 2 seconds.
   - Backend returns the latest room snapshot with viewer-specific host capability.
   - Frontend updates participant list and start-game UI from the snapshot.

4. Host starts game.
   - Frontend calls `POST /rooms/:code/start` with `participantId`.
   - Backend verifies host and minimum-player rules.
   - Backend changes room status.
   - Other clients observe the transition on their next poll.

## Testing Plan

1. Backend service tests in `backend/src/services/roomStore.test.ts`.
   - Creator is stored as host.
   - Joining one room does not affect another room.
   - Unknown and invalid room codes are rejected.
   - Non-host start attempts fail.
   - Host start with one participant fails.
   - Host start with 2 participants succeeds.

2. Backend schema/API tests in `backend/src/api/schemas.test.ts` or route tests if available.
   - Empty room code is rejected.
   - Whitespace room code is rejected.
   - Lowercase valid code is normalized.
   - Start-game payload requires participant id.

3. Frontend API/store tests in `frontend/src/services/api.test.ts` and store tests if added.
   - Start-game API calls the expected endpoint.
   - Failed API responses surface readable errors.

4. Manual validation with two browser tabs.
   - Create a room as host.
   - Join the same room as a second player.
   - Confirm the host tab updates within about 2 seconds.
   - Confirm a separate room does not show the second player.
   - Confirm non-host cannot start.
   - Confirm host cannot start alone.
   - Confirm host can start with 2 players and both tabs observe the transition.

## Risks

1. Local participant id is currently only in memory, so browser refresh may lose viewer identity.
2. Polling can overlap if a request takes longer than 2 seconds unless guarded.
3. Adding room status now should stay minimal so later feature groups can extend it without rework.
4. Frontend and backend room snapshot types are duplicated, so contract drift is possible.

## Out Of Scope

1. Drawing canvas behavior.
2. Drawer assignment.
3. Secret word visibility.
4. Guess submission.
5. Scoring.
6. Results and restart.
7. WebSockets, databases, authentication, or persistence.
