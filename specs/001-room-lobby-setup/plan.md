# Implementation Plan: Scenario 1 Room Setup & Lobby

**Branch**: `assignment` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-lobby-setup/spec.md`

**Note**: This plan is limited to Scenario 1 room setup and lobby behavior.

## Summary

Extend the starter room flow so room creation records a host, joining enforces
clear empty/invalid room-code feedback, lobby snapshots stay isolated per room,
and the lobby refreshes automatically every 2 seconds. The backend remains the
source of truth for host-only start rules through a dedicated start endpoint,
while the frontend room store and lobby page consume the richer room snapshot
and redirect to the existing game placeholder only after the backend marks the
room as started.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ (backend) and React 18
with Vite (frontend)

**Primary Dependencies**: Express, Zod, React, React Router, Vite, Vitest

**Storage**: In-memory room and game state only

**Testing**: `cd backend && npm test`, `cd frontend && npm test`, plus manual
two-tab browser validation for multiplayer flows

**Target Platform**: Node.js backend and modern desktop browser clients

**Project Type**: Monorepo web application (`backend/` + `frontend/`)

**Performance Goals**: Lobby membership updates should appear for connected
players within one polling interval, with a target of about 2 seconds

**Constraints**: HTTP polling only; no WebSockets; no database/persistence; no
authentication/session layer; keep room memory footprint minimal; preserve the
starter architecture; keep scope strictly to Scenario 1

**Scale/Scope**: Small multiplayer rooms for one-round local validation using
at least two browser tabs and optionally a second room for isolation checks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] The change is scoped to a concrete scenario/user story and preserves the
      README checkpoint order unless a deviation is justified.
- [x] All changed backend boundaries have explicit TypeScript types and Zod
      validation for request/response payloads.
- [x] Multiplayer synchronization remains HTTP polling against in-memory state
      only; no forbidden persistence or realtime transport is introduced.
- [x] The plan preserves the existing monorepo structure and documents any new
      dependency or abstraction that materially expands the surface area.
- [x] Verification covers every touched surface, including affected builds,
      affected tests, and manual two-tab validation for multiplayer/UI flows.

**Post-Design Re-Check**: Pass. The design keeps all state in memory, adds no
new dependencies, uses Zod for new request bodies and stricter room-code
validation, and limits the room-state transition to `lobby -> playing` without
introducing Scenario 2+ gameplay logic.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-lobby-setup/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-scenario1.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   ├── rooms.ts
    │   ├── schemas.ts
    │   └── schemas.test.ts
    ├── models/
    │   └── game.ts
    └── services/
        ├── roomStore.ts
        └── roomStore.test.ts

frontend/
└── src/
    ├── pages/
    │   ├── JoinRoomPage.tsx
    │   ├── LobbyPage.tsx
    │   └── GamePage.tsx
    ├── services/
    │   ├── api.ts
    │   └── api.test.ts
    ├── state/
    │   └── roomStore.ts
    └── styles/
        └── app.css
```

**Structure Decision**: Keep backend room rules in `backend/src/services`,
request validation in `backend/src/api`, and client session/lobby flow in
`frontend/src/state` plus `frontend/src/pages`. No new app layers or packages
are required.

## Phase 0: Research Outcomes

- Use an explicit `hostParticipantId` on each room so host authority is stable
  across polling and does not depend on list position.
- Add a backend-owned `POST /rooms/:code/start` action that receives the
  caller's `participantId` and enforces host-only start plus the 2-player
  minimum before changing room status.
- Represent the Scenario 1 start transition by expanding room status from
  `lobby` to `playing`, allowing the existing game placeholder route to be used
  without introducing drawer or scoring logic.
- Poll from `LobbyPage` on a 2-second interval using the existing room store's
  fetch path so the store remains the single source of frontend room state.
- Tighten room-code validation at both boundaries: client-side trim/empty guard
  for fast feedback and backend schema validation for exact 4-character codes
  before join/start/fetch logic runs.
- Correct the frontend API base URL to point to the backend host instead of the
  broken starter default so Scenario 1 can run end to end.

See [research.md](./research.md) for decisions, rationale, and alternatives.

## Phase 1: Design

### Backend Model Changes

- Update [`backend/src/models/game.ts`](../../../backend/src/models/game.ts) so
  `RoomStatus` becomes `"lobby" | "playing"`.
- Add `hostParticipantId` to `Room` and `RoomSnapshot`.
- Add `viewerIsHost`, `canStartGame`, and `minimumPlayersToStart` to
  `RoomSnapshot` so the client can render host state without duplicating the
  backend's start rules.
- Keep participant shape unchanged for Scenario 1; player-name trimming remains
  a Scenario 2 concern.

### Backend Service Changes

- Update [`backend/src/services/roomStore.ts`](../../../backend/src/services/roomStore.ts)
  so `createRoom()` sets the initial host to the creator.
- Keep `joinRoom()` scoped to membership changes in an existing room and ensure
  it never mutates unrelated rooms.
- Add a `startRoom(code, participantId)` service that:
  - returns a not-found result when the room does not exist
  - returns a forbidden result when the caller is not the host
  - returns a conflict result when the room has fewer than 2 players or is no
    longer in lobby state
  - updates only the addressed room to `status: "playing"` on success
- Update `toRoomSnapshot()` to calculate viewer-specific flags from
  `hostParticipantId`, `participantId`, current status, and participant count.

### API Changes

- Keep `POST /rooms` and `POST /rooms/:code/join`, but return the enriched room
  snapshot with host and start-state metadata.
- Tighten [`backend/src/api/schemas.ts`](../../../backend/src/api/schemas.ts):
  - room-code params trim and uppercase input before validating an exact
    4-character code
  - add a start-room request schema requiring `participantId`
- Update [`backend/src/api/rooms.ts`](../../../backend/src/api/rooms.ts) to add
  `POST /rooms/:code/start`.
- Error mapping:
  - `400` for invalid room-code format or malformed start request
  - `403` for non-host start attempts
  - `404` for unknown room codes
  - `409` for valid requests that violate the minimum-player or room-state rule

### Frontend Room Store Changes

- Fix [`frontend/src/services/api.ts`](../../../frontend/src/services/api.ts) so
  the default base URL points to the actual backend host.
- Extend `RoomSnapshot` and `RoomSessionResponse` types in
  [`frontend/src/services/api.ts`](../../../frontend/src/services/api.ts) to
  match the backend contract.
- Add `startGame()` to [`frontend/src/state/roomStore.ts`](../../../frontend/src/state/roomStore.ts)
  so the current session can call `POST /rooms/:code/start` using the stored
  `participantId`.
- Keep `fetchRoom()` lightweight for polling and continue storing the latest
  room snapshot centrally for all room pages.

### Frontend Page Changes

- Update [`frontend/src/pages/JoinRoomPage.tsx`](../../../frontend/src/pages/JoinRoomPage.tsx)
  to trim the room code before submit and stop empty/whitespace-only attempts
  before the request is sent.
- Update [`frontend/src/pages/LobbyPage.tsx`](../../../frontend/src/pages/LobbyPage.tsx)
  to:
  - start a 2-second polling interval while the user remains in a lobby room
  - display which participant is host
  - show host-only start availability and the 2-player minimum clearly
  - disable or hide start interactions for non-hosts
  - call `roomStore.startGame()` for hosts
  - navigate to `/game` automatically when polled room status changes to
    `"playing"`
- Keep [`frontend/src/pages/GamePage.tsx`](../../../frontend/src/pages/GamePage.tsx)
  as a placeholder screen, but ensure it can accept the post-start room shape
  without depending on Scenario 2+ fields.
- Update [`frontend/src/styles/app.css`](../../../frontend/src/styles/app.css)
  only as needed for host labeling and disabled/start-state messaging.

### File-Level Change Plan

- `backend/src/models/game.ts`: add host and start-state fields to room types
- `backend/src/services/roomStore.ts`: add host tracking, start rule
  enforcement, and enriched snapshots
- `backend/src/services/roomStore.test.ts`: cover host assignment, room
  isolation, minimum-player enforcement, and non-host rejection
- `backend/src/api/schemas.ts`: add start schema and stricter room-code rules
- `backend/src/api/schemas.test.ts`: cover trimmed/invalid room-code validation
- `backend/src/api/rooms.ts`: add start endpoint and map service outcomes to
  HTTP responses
- `frontend/src/services/api.ts`: fix base URL, add `startGame`, update room
  snapshot types
- `frontend/src/services/api.test.ts`: cover start endpoint request shape and
  fetch/create/join URL expectations
- `frontend/src/state/roomStore.ts`: add `startGame`, keep polling snapshot
  updates centralized
- `frontend/src/pages/JoinRoomPage.tsx`: client-side empty-code validation
- `frontend/src/pages/LobbyPage.tsx`: polling, host display, guarded start flow,
  and automatic transition to the game route
- `frontend/src/pages/GamePage.tsx`: accept enriched room snapshot after start
- `frontend/src/styles/app.css`: host marker and lobby status messaging

### Backend Enforcement Rules

- A room creator is always the initial host of the room they create.
- Only the participant whose ID matches `hostParticipantId` may start that room.
- A room may only be started while its status is `lobby`.
- A room may only be started when `participants.length >= 2`.
- Join, fetch, and start operations must operate only on the addressed room
  code and must never leak participants or state across rooms.
- Invalid room-code format fails before room lookup; unknown well-formed room
  codes fail at lookup time.

### Validation Strategy

- Automated backend validation:
  - schema tests for room-code parsing and start request validation
  - room-store tests for host assignment, isolation, and start guards
- Automated frontend validation:
  - API service tests for fetch/create/join/start request formatting
- Manual two-tab validation:
  - Tab A creates a room and confirms host labeling
  - Tab B joins with the valid room code and appears in Tab A within one
    polling interval
  - empty and invalid room-code attempts stay on the join screen with clear
    errors
  - Tab B cannot start the game
  - Tab A cannot start while alone but can start after Tab B joins
  - both tabs leave the lobby once the host starts
  - a second room can be created in parallel to confirm isolation

## Complexity Tracking

No constitution exceptions or additional architectural complexity are required
for this feature.
