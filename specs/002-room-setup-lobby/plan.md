# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-lab` | **Date**: 2026-06-01 | **Spec**: [spec.md](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/specs/002-room-setup-lobby/spec.md)

**Input**: Feature specification from `/specs/002-room-setup-lobby/spec.md`

**Note**: This plan defines data models, interface contracts, and the system layout for the Room Setup & Lobby feature.

## Summary

The Room Setup & Lobby feature enables host tracking, multi-room isolation, client-side and server-side join validation, lobby auto-polling at ~2s interval, host-only game start gated by a 2-player minimum, and error recovery/termination on host disconnect or network failure.
We will:
1. Extend the in-memory room storage on the backend to track `hostId`.
2. Compute `isHost` in the participant list snapshot.
3. Implement ~2s auto-polling in `LobbyPage.tsx` using a React `useEffect` interval.
4. Render a warning banner in the lobby when polling fails.
5. Destroy/terminate the room immediately if the host disconnects or leaves.
6. Only render the "Start Game" button for the host, and disable it if there are fewer than 2 participants.

## Technical Context

**Language/Version**: Node.js v18+, TypeScript v5.x (strict mode)

**Primary Dependencies**: Express, Zod (for validation), React (v18), React Router (v6), Vitest

**Storage**: In-memory Map in the backend `roomStore.ts` (isolated by Room Code)

**Testing**: Vitest for backend unit/integration tests and frontend state/helper tests

**Target Platform**: Modern Web Browsers (Chrome, Safari, Firefox, Edge)

**Project Type**: Web application (React frontend + Node/Express backend)

**Performance Goals**:
- Lobby polling updates within 2.5s of state changes
- UI state updates (Zod validation, button enabling) within 200ms of user/network events

**Constraints**:
- Strictly no WebSockets or Socket.io; state sync must be pure HTTP polling
- Strictly no database persistence; state must be in-memory
- Host leaving must immediately destroy the room, redirecting guests to the landing page

**Scale/Scope**:
- Isolation of up to 100+ concurrent rooms with minimal memory footprint
- Cleanups of empty or inactive rooms (garbage collection)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **TypeScript Strict Mode**: Yes. The codebase compiles with strict TS checks, and all new code will have explicit, strong typing.
2. **Functional React Components**: Yes. `LobbyPage` and other pages are functional components utilizing standard hooks (`useEffect`, `useState`, `useSyncExternalStore`).
3. **90% Test Coverage Requirement**: Yes. Core room and API helpers will have unit tests ensuring at least 90% coverage.
4. **Pure HTTP Polling & Single-Round Scope**: Yes. Auto-polling in `LobbyPage` uses standard `setInterval` at a ~2s interval. No real-time transport protocol is used.
5. **In-Memory Isolated Storage**: Yes. All rooms are stored in-memory, keyed by room code in a map.

## Project Structure

### Documentation (this feature)

```text
specs/002-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Technical research and choices
├── data-model.md        # Entities, validation schemas, and state transitions
├── quickstart.md        # Setup, execution, and local verification guides
├── contracts/
│   └── rooms-api.md     # HTTP Endpoint requests, responses, and schemas
└── checklists/
    └── requirements.md  # Acceptance criteria checklists
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts     # Room routes (/rooms, /rooms/:code/join, /rooms/:code/start, /rooms/:code/leave)
│   │   ├── router.ts    # Main router mapping
│   │   ├── schemas.ts   # Zod request validators
│   │   └── schemas.test.ts  # Zod schema unit tests
│   ├── models/
│   │   └── game.ts      # Game, Room, and Participant types
│   └── services/
│       ├── roomStore.ts      # Core in-memory storage, join/leave/start logic
│       └── roomStore.test.ts # Unit tests for room store business logic

frontend/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Card.tsx
│   │   ├── PageHeader.tsx
│   │   └── RoomCodeBadge.tsx
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── StartPage.tsx
│   ├── services/
│   │   └── api.ts       # API helper functions and types
│   └── state/
│       └── roomStore.ts # Zustand-like react store
└── tests/
```

**Structure Decision**: Web application layout (Option 2) is used with clean separation between the frontend React application and the backend Express service.

## Complexity Tracking

No violations of the Constitution identified. The design is simple, using React state, vanilla CSS, and standard HTTP endpoints without unnecessary abstractions.
