# Implementation Plan: Game Start & Drawer Flow

**Branch**: `003-game-start-drawer-flow` | **Date**: 2026-06-02 | **Spec**: [spec.md](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/specs/003-game-start-drawer-flow/spec.md)

**Input**: Feature specification from `/specs/003-game-start-drawer-flow/spec.md`

## Summary
Implement transitioning the drawing room status from `"lobby"` to `"game"` when the host starts the session. This includes:
1. Validating player names cleanly at the input boundaries.
2. Dynamically assigning roles (`drawer` and `guesser`) based on host status.
3. Deterministically selecting `"rocket"` as the starting round secret word.
4. Implementing role-based snapshot filtering in `toRoomSnapshot` to restrict secret word visibility to the drawer client only.

## Technical Context

**Language/Version**: Node.js v18+, TypeScript v5+

**Primary Dependencies**: Express, React, React Router, Vite, Zod

**Storage**: In-memory isolated storage (`Map<string, Room>` in roomStore)

**Testing**: Vitest for unit and validation testing

**Target Platform**: Modern web browsers (frontend) and Node.js (backend server)

**Project Type**: Full-stack multi-player web application

**Performance Goals**:
- Form validation error response under 200ms
- Game transitions visible across clients within 2.5s (constrained by 2s polling intervals)

**Constraints**:
- Strictly in-memory storage (no DB)
- Pure HTTP polling (no WebSockets)
- Zero secretWord leakage on guest/guesser snapshots

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript Strict Mode**: ✅ Strict compilation enabled. Types are explicit. No `any` used.
- **Functional React Components**: ✅ All pages (CreateRoomPage, JoinRoomPage, LobbyPage, GamePage) are functional components using hooks.
- **80% Test Coverage Requirement**: ✅ Core business logic in `roomStore` and `schemas` has dedicated unit test suites.
- **Pure HTTP Polling & Single-Round Scope**: ✅ Client uses 2s auto-polling cadence. WebSockets are strictly forbidden. No multi-round state storage in v1.
- **In-Memory Isolated Storage**: ✅ Session storage is completely in-memory, keyed by room code. Host departure deletes the room.

## Project Structure

### Documentation (this feature)

```text
specs/003-game-start-drawer-flow/
├── plan.md              # This file
├── research.md          # Technical decisions and rationale
├── data-model.md        # Extended entities and interfaces
└── tasks.md             # Ordered checklists and dependencies
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts      # Extended Participant, Room, RoomSnapshot types
│   ├── services/
│   │   └── roomStore.ts # Core role assignment and filtering logic
│   └── api/
│       ├── rooms.ts     # Route handlers for create, join, start, leave
│       └── schemas.ts   # Zod validation rules
└── src/services/roomStore.test.ts

frontend/
├── src/
│   ├── components/      # Common Card, Badges, GuessForm components
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx # Role display and secretWord render logic
│   └── services/
│       └── api.ts       # Shared TypeScript models and client requests
```

**Structure Decision**: Web application layout (Option 2) matching backend/ and frontend/ directories in repository root.

## Complexity Tracking

No constitution violations detected or complexity overrides needed.
