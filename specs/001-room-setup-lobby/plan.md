# Implementation Plan: Room Setup and Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Implement the Feature Group 1 lobby flow by extending the existing in-memory room service, Express room routes, React room store, and lobby pages. The plan preserves the current TypeScript/ES module monorepo, adds host-aware room snapshots and start-game validation, improves room-code/player-name validation, and replaces manual lobby refresh as the primary synchronization path with HTTP polling every 2 seconds.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js backend, React 18 frontend, ES Modules.

**Primary Dependencies**: Express, Zod, React, React Router, Vite, Vitest, existing Context/external-store room state.

**Storage**: In-memory backend room state only; no database or persistent storage.

**Testing**: Backend Vitest tests for room service and schemas, frontend Vitest tests for API service, TypeScript builds, and manual two-tab browser validation.

**Target Platform**: Local browser clients plus local Node.js backend.

**Project Type**: Web app: React frontend plus Express backend.

**Performance Goals**: Room creation/join in under 30 seconds from the user perspective; lobby changes visible within 2 seconds; no duplicate polling timers per mounted lobby view.

**Constraints**: HTTP polling only, 2-second lobby cadence, in-memory state, no authentication, no sessions, no databases, no WebSockets or push protocols, no unrelated refactors.

**Scale/Scope**: Feature Group 1 lobby scope only: room creation, join-by-code, room isolation, lobby refresh, host-only start, and minimum 2-player start gate.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Brownfield Extension**: PASS. Extend `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/schemas.ts`, `backend/src/api/rooms.ts`, `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, and existing lobby/create/join pages. No rewrite or unrelated refactor planned.
- **Full-Stack Input Validation**: PASS. Frontend validates required player name and room code before submission; backend validates player names, room code shape, participant IDs, host status, and minimum player count before mutating state.
- **Polling-Only Synchronization**: PASS. Lobby synchronization uses `GET /rooms/:code?participantId=...` every 2 seconds and cleans the timer when the lobby unmounts or game state changes.
- **Simple Implementation**: PASS. Room data remains in memory and uses existing service functions. No database, auth, sessions, WebSockets, or new state library.
- **Specification Traceability**: PASS. Planned changes map to US1-US4 and FR-001 through FR-015 from `spec.md`.
- **Human Review of AI Output**: PASS. Validation includes code review against the spec, TypeScript checks, focused tests, and two-tab manual browser verification before acceptance.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts
│   ├── services/roomStore.ts
│   ├── services/roomStore.test.ts
│   ├── api/schemas.ts
│   ├── api/schemas.test.ts
│   └── api/rooms.ts

frontend/
├── src/
│   ├── services/api.ts
│   ├── services/api.test.ts
│   ├── state/roomStore.ts
│   ├── pages/CreateRoomPage.tsx
│   ├── pages/JoinRoomPage.tsx
│   ├── pages/LobbyPage.tsx
│   └── styles/app.css
```

**Structure Decision**: Use the existing web application split. Backend ownership stays in `backend/src/api`, `backend/src/services`, and `backend/src/models`; frontend ownership stays in `frontend/src/services`, `frontend/src/state`, and existing page components.

## Complexity Tracking

No constitution violations.

## Phase 0: Research Summary

Detailed decisions are captured in [research.md](./research.md).

- Use the existing in-memory `Map` room store and add host/start metadata directly to the room model.
- Keep start-game as an explicit backend mutation that verifies host identity and player count before changing room status.
- Use a mounted-lobby polling effect with `setInterval` at 2 seconds and cleanup on unmount/status transition.
- Normalize room codes by trimming and uppercasing before lookup while validating the expected code shape.

## Phase 1: Design Summary

### Backend Changes

- Extend `RoomStatus` beyond `lobby` to include a started/in-game state needed by successful host start.
- Add `hostParticipantId` and derived `canStart`/`isHost` information to room snapshots.
- Harden `createRoom`, `joinRoom`, `getRoom`, and new start-game behavior in `backend/src/services/roomStore.ts`.
- Add backend schema validation for trimmed player names, room code format, participant IDs, and start-game payload/query data.
- Add a start endpoint under the existing rooms router and keep `GET /rooms/:code` as the polling contract.
- Add focused tests for host assignment, invalid codes, room isolation, host-only start, minimum player count, and no mutation on rejected attempts.

### Frontend Changes

- Trim and validate player names and room codes before create/join requests, then display clear form errors.
- Align API response/request types with host-aware room snapshots and the start-game endpoint.
- Extend `RoomStore` with `startGame`, controlled polling helpers, and status-aware state updates.
- Update `LobbyPage` to start polling every 2 seconds, clean up timers, show host labels, show start eligibility, and disable/hide start actions for non-hosts.
- Keep manual refresh only as a secondary fallback if useful; the primary experience is automatic refresh.
- Update styles in `frontend/src/styles/app.css` for host labels, disabled start state, and lobby feedback as needed.

### State Model

- Backend room state remains the source of truth: room code, status, participants, host participant ID, created/updated timestamps.
- Frontend state stores the current room snapshot, participant ID, loading/error state, and uses the snapshot to derive host/start UI behavior.
- Successful start transitions only the target room out of lobby state; other rooms remain unchanged.
- If the host leaves before start in a later task, host transfer follows the spec assumption and should be handled inside the room service.

### API Changes

- `POST /rooms`: create room with `{ playerName }`, returns `{ participantId, room }` where room includes host/start metadata.
- `POST /rooms/:code/join`: join lobby by normalized code with `{ playerName }`, rejects invalid/not-joinable rooms.
- `GET /rooms/:code?participantId=...`: polling endpoint returning the current room snapshot from the viewer perspective.
- `POST /rooms/:code/start`: start the game with `{ participantId }`, rejects non-hosts and rooms with fewer than 2 players.

### Polling Strategy

- `LobbyPage` polls `GET /rooms/:code?participantId=...` every 2 seconds while the current room is in lobby state.
- Polling starts after a room session exists and stops on unmount, lost room state, or transition away from lobby.
- The polling effect must not create duplicate intervals across re-renders.
- Poll failures show non-destructive lobby feedback and keep the last known room snapshot.

### Files Affected

- `backend/src/models/game.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/services/roomStore.test.ts`
- `backend/src/api/schemas.ts`
- `backend/src/api/schemas.test.ts`
- `backend/src/api/rooms.ts`
- `frontend/src/services/api.ts`
- `frontend/src/services/api.test.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/styles/app.css`

## Post-Design Constitution Check

- **Brownfield Extension**: PASS. Design extends listed existing files and adds only feature documentation/contracts.
- **Full-Stack Input Validation**: PASS. User-controlled values are validated in forms and at backend boundaries before mutation.
- **Polling-Only Synchronization**: PASS. Only standard HTTP requests and a 2-second client polling interval are planned.
- **Simple Implementation**: PASS. No prohibited infrastructure or new broad abstraction is introduced.
- **Specification Traceability**: PASS. Data model, contracts, and quickstart map back to US1-US4 and FR-001 through FR-015.
- **Human Review of AI Output**: PASS. Quickstart includes review, test, and two-tab validation steps before acceptance.
