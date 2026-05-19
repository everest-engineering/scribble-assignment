# Implementation Plan: Phase 1 Room Lobby Setup

**Branch**: `002-room-lobby-setup` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-room-lobby-setup/spec.md`

**Note**: This plan is filled in by the `/speckit-plan` command and is grounded in
the current Express backend and React frontend starter.

## Summary

Implement Phase 1 room setup, lobby, and player-name validation by tightening room
and name validation, adding host-aware room state, introducing a host-only start
endpoint, and upgrading the lobby from manual refresh to controlled polling. The
feature stays within the existing in-memory architecture: backend state remains a
`Map<string, Room>`, frontend state remains the existing Context-backed `RoomStore`,
and clients move to the next screen only after the room status changes to
`"playing"`.

## Technical Context

**Language/Version**: TypeScript on Node.js backend and React 18 frontend

**Primary Dependencies**: Express, Zod, React Router v6, Vite

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts`

**Testing**: Existing app builds plus manual two-browser validation; optional
unit-level checks for pure helpers only

**Target Platform**: Local browser clients against a local Node.js HTTP API

**Project Type**: Web application with separate backend and frontend apps

**Performance Goals**: Lobby roster updates visible to connected players within
about 2 seconds of a join

**Constraints**: No WebSockets, no persistence, no authentication, no new top-level
dependencies unless justified, no Phase 2+ gameplay logic

**Scale/Scope**: Small classroom multiplayer sessions with multiple concurrent rooms
and a handful of players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: backend and frontend contracts remain fully typed; all state additions are
  explicit in existing TypeScript models.
- Pass: every changed boundary is validated at both form level and API level
  (`playerName`, room code, join eligibility, start eligibility).
- Pass: room state remains minimal and deterministic inside the in-memory service
  layer; no persistence or live transport is introduced.
- Pass: scope remains inside README-supported Phase 1 behavior only.
- Pass: the design includes story-level manual verification plus required app-build
  validation before handoff.

## Project Structure

### Documentation (this feature)

```text
specs/002-room-lobby-setup/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   ├── router.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   └── services/
│       └── roomStore.ts

frontend/
├── src/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   └── LobbyPage.tsx
│   ├── services/
│   │   └── api.ts
│   ├── state/
│   │   └── roomStore.ts
│   └── routes/
│       └── index.tsx
```

**Structure Decision**: Use the existing monorepo web-app layout. All backend
changes stay within `backend/src/models`, `backend/src/services`, and
`backend/src/api`. All frontend changes stay within `frontend/src/services`,
`frontend/src/state`, and the existing page components.

## Phase 0 Research

### Decisions

- Decision: keep room-code generation at four uppercase characters from the current
  easy-to-read alphabet.
  Rationale: it matches the starter, matches the approved clarification, and avoids
  introducing a migration or extra UX complexity.
  Alternatives considered: longer codes, letters-only codes, variable-length codes.

- Decision: add host and start eligibility directly to room state and room
  snapshots instead of introducing separate derived backend resources.
  Rationale: Phase 1 only needs one authoritative room object, and the service
  already owns all state transitions.
  Alternatives considered: computed host inference only on the client, separate
  lobby metadata object.

- Decision: use client polling every 2 seconds in the lobby, paused when the tab is
  hidden and cleaned up on unmount.
  Rationale: this satisfies the spec without WebSockets and prevents unnecessary
  polling while the page is backgrounded.
  Alternatives considered: manual refresh only, polling from a top-level app shell,
  shorter intervals.

- Decision: move clients to the next screen when `GET /rooms/:code` reports
  `status: "playing"` rather than navigating every user immediately from the start
  click.
  Rationale: it keeps non-host clients aligned with the authoritative room state and
  lets the polling loop coordinate the transition.
  Alternatives considered: local optimistic navigation only, host-triggered client
  broadcasts.

- Decision: enforce name trimming and empty-name rejection both in frontend forms
  and in backend Zod schemas.
  Rationale: this gives immediate UX feedback while preserving server-side defense
  in depth.
  Alternatives considered: frontend-only validation, backend-only validation.

## Phase 1 Design

### State Model Changes

- Backend `RoomStatus` in [backend/src/models/game.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/models/game.ts)
  widens from `"lobby"` to `"lobby" | "playing"`.
- Backend `Participant` gains a persistent room-scoped role marker for Phase 1:
  `role: "host" | "player"`.
- Backend `Room` gains `hostId: string` so the creator remains the single source of
  truth for start permission.
- Backend `RoomSnapshot` gains `hostId: string` and uses the widened `status` so the
  frontend can derive `isHost` and react to `"playing"`.
- Backend functions updated in
  [backend/src/services/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/services/roomStore.ts):
  `createParticipant`, `createRoom`, `joinRoom`, `getRoom`, `saveRoom`,
  `toRoomSnapshot`, plus a new `startRoom` service function and shared trim/code
  helpers.
- Frontend `RoomSnapshot` in
  [frontend/src/services/api.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/services/api.ts)
  gains `hostId` and widened `status`.
- Frontend `RoomStore` state in
  [frontend/src/state/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/state/roomStore.ts)
  keeps `room`, `participantId`, `error`, and `isLoading`, but adds lobby-polling
  control and start-flow support.
- Lobby derived state is computed on the frontend from the snapshot:
  `isHost = room.hostId === participantId`,
  `canStart = isHost && room.status === "lobby" && room.participants.length >= 2`,
  `disabledReason = non-host reason | minimum-player reason | null`.

### File-Level Changes

- [backend/src/models/game.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/models/game.ts)
  Update `RoomStatus`, add participant role type, add `role` to `Participant`, add
  `hostId` to `Room` and `RoomSnapshot`.

- [backend/src/services/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/services/roomStore.ts)
  Add constants/helpers for the easy-to-read room-code alphabet and trim logic;
  create host participants on room creation; create non-host participants on join;
  reject join attempts for non-existent or already-playing rooms; add `startRoom`
  that enforces room existence, room status, host-only access, and minimum-player
  checks; include `hostId` and new `status` in snapshots.

- [backend/src/api/schemas.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/api/schemas.ts)
  Tighten `playerName` validation to trimmed non-empty strings; tighten room-code
  validation to the approved 4-character alphabet; add a `startRoomSchema` for
  `participantId` in the request body; keep viewer query parsing for fetches.

- [backend/src/api/rooms.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/api/rooms.ts)
  Use validated/trimmed names directly, return clearer errors for join failures,
  add `POST /:code/start`, and map domain failures to stable HTTP codes for
  room-not-found, already-started, non-host, and too-few-players cases.

- [frontend/src/services/api.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/services/api.ts)
  Update shared types to match the new snapshot shape, add `startRoom(code,
  participantId)`, and keep fetch/create/join contracts aligned with backend
  validation.

- [frontend/src/state/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/state/roomStore.ts)
  Add helpers for trimmed names and derived lobby permissions, add `startRoom()`,
  add polling lifecycle methods such as `startLobbyPolling()` and
  `stopLobbyPolling()`, preserve roster on transient fetch errors, and expose enough
  state for the lobby to render disabled-start reasons.

- [frontend/src/pages/CreateRoomPage.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/pages/CreateRoomPage.tsx)
  Trim and validate the player name before calling the store, show immediate
  whitespace-only rejection feedback, and continue to navigate to `/lobby` on
  success.

- [frontend/src/pages/JoinRoomPage.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx)
  Trim and validate the player name, normalize and validate the room code against
  the approved 4-character format before submit, and surface distinct feedback for
  blank, malformed, and not-found codes.

- [frontend/src/pages/LobbyPage.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
  Start polling on mount, stop polling on unmount, pause/resume based on tab
  visibility, keep manual refresh as a fallback action, render host-aware start
  button disabled states and reasons, and route to `/game` when room status becomes
  `"playing"`.

- [frontend/src/routes/index.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/routes/index.tsx)
  No structural route change required; rely on lobby-driven navigation to the
  existing `/game` placeholder when status becomes `"playing"`.

### API Contract Additions and Changes

- `POST /rooms`
  Request: `{ "playerName": string }`
  Rules: name is trimmed, must remain non-empty after trimming.
  Response: `201` with `{ participantId, room }`, where `room` now includes
  `hostId` and `status: "lobby" | "playing"`.

- `POST /rooms/:code/join`
  Request: `{ "playerName": string }`
  Path rule: `code` must be exactly 4 uppercase characters from the easy-to-read
  alphabet.
  Errors: `400` invalid code or invalid name, `404` room not found, `409` room is
  no longer joinable because it already started.

- `GET /rooms/:code`
  Query: optional `participantId`
  Response: `{ room }` where `room.hostId` is present and `room.status` can be
  `"lobby"` or `"playing"`.

- `POST /rooms/:code/start`
  Request: `{ "participantId": string }`
  Success response: `200` with `{ room }`, where `room.status` is `"playing"`.
  Error codes:
  `404` room not found,
  `403` participant is not the host,
  `409` room already started,
  `422` fewer than two players.

### Data Flow

- Lobby polling
  `LobbyPage` starts a 2-second polling interval on mount through the store.
  The interval stops on unmount and while `document.visibilityState !== "visible"`,
  then resumes when the tab becomes visible again. Poll failures update error state
  without clearing the last valid `room.participants` snapshot.

- Start flow
  Host clicks Start Game -> `roomStore.startRoom()` -> `api.startRoom()` ->
  `POST /rooms/:code/start` validates host and player count -> backend sets
  `room.status = "playing"` -> store updates current snapshot -> lobby navigates to
  `/game`; non-host clients transition on the next successful polling tick.

- Name validation
  Create and Join pages trim input and reject whitespace-only names before network
  calls. Backend Zod schemas repeat the same rule so direct or stale clients cannot
  bypass it.

### Implementation Sequence

1. Update backend model types and Zod schemas in `backend/src/models/game.ts` and
   `backend/src/api/schemas.ts`.
2. Update backend room service logic in `backend/src/services/roomStore.ts`,
   including host assignment, join rules, and start gating.
3. Update backend routing in `backend/src/api/rooms.ts` for improved create/join
   behavior and the new start endpoint.
4. Update frontend shared API types and request helpers in
   `frontend/src/services/api.ts`.
5. Update frontend store logic in `frontend/src/state/roomStore.ts` for derived
   host state, start requests, and polling lifecycle.
6. Update `CreateRoomPage.tsx` and `JoinRoomPage.tsx` for fast-feedback name and
   code validation.
7. Update `LobbyPage.tsx` for roster polling, disabled start states, and transition
   to the existing game placeholder when room status becomes `"playing"`.
8. Run manual two-browser validation for every acceptance scenario and then run
   required backend and frontend builds.

### Testing Strategy

- Manual two-browser validation covers:
  create room with host auto-join, trimmed names, empty-name rejection, blank/malformed
  code rejection, not-found join rejection, two-room isolation, polling refresh
  within about 2 seconds, host-only start, and minimum-two-player enforcement.
- Optional unit-level checks are limited to pure helpers such as player-name trim
  validation, room-code format validation, and host/start eligibility checks if the
  implementation extracts them into standalone functions.
- Out of scope: end-to-end automation, persistence tests, load tests, and later
  gameplay automation.

### Risks and Mitigations

- Polling survives navigation or hidden tabs.
  Mitigation: own the interval inside the lobby lifecycle, clean it up on unmount,
  and pause while the tab is hidden.

- Race conditions around start.
  Mitigation: enforce `status === "lobby"` and host/minimum-player checks inside the
  start endpoint before mutating room state.

- Room-code generation collisions.
  Mitigation: keep `generateUniqueCode()` as the single source of truth and verify
  it still operates against the validated alphabet and existing room map.

- Client/server validation drift.
  Mitigation: keep the same room-code alphabet and length documented in both layers,
  preferably from a shared constant or at minimum with explicit lockstep comments.

## Complexity Tracking

No constitution violations are expected. The plan stays within the existing backend
and frontend structure and does not introduce new dependencies or architecture.
