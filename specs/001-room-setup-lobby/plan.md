# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-lab` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary
The goal of this feature is to establish a secure, validated room creation and joining process with automatic state polling and host controls. The backend will manage room states entirely in-memory, generate 6-character alphanumeric room codes, enforce a 12-player capacity limit, validate nicknames (max 20 chars), and clean up idle clients (no poll for 10s) using a background interval. The frontend will implement lobby auto-polling (every 2 seconds) and limit game initiation (Start Game) exclusively to the host when at least 2 players are present.

## Technical Context

**Language/Version**: TypeScript, Node.js (v18+)

**Primary Dependencies**: React (v18), React Router (v6), Vite, Express, Zod, Vitest

**Storage**: In-memory only (`Map<string, Room>` in `roomStore.ts`). No persistent database is used.

**Testing**: Vitest for component/store tests and backend unit tests.

**Target Platform**: Web browsers (Chrome, Safari, Firefox)

**Project Type**: Monorepo Web Application (React frontend + Express backend)

**Performance Goals**: 
- Lobby refresh updates reflected on all connected screens within 2.5 seconds (under the 2s poll rate).
- Validation responses for invalid codes or full rooms returned within 500ms.

**Constraints**:
- Strictly NO WebSockets or push protocols. Polling is the only synchronization mechanism.
- Strictly NO database storage. 
- Maximum player capacity of 12 per room.
- Nickname length limit of 20 characters.

**Scale/Scope**: Up to 100 concurrent active rooms in server memory.

## Constitution Check

*GATE: Passed. No violations identified.*

- **TypeScript First & Strict Styling**: All backend and frontend code fully typed. Strict styling classes used.
- **Minimal In-Memory & Polling Architecture**: In-memory state only. Heartbeat cleanup loop implemented. Polling interval set to 2s.
- **Extend, Don't Replace**: Extending the starter Express routes and React component pages without modifications to unrelated files.
- **Strict Scope Guardrails**: No database, authentication, WebSockets, or invite link logic planned.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── spec.md                  # Feature Specification
├── plan.md                  # This file
├── research.md              # Architectural decisions and rationales
├── data-model.md            # TypeScript schemas and database representations
├── quickstart.md            # Instructions to boot and test
└── contracts/
    └── api-endpoints.md     # Request/response specs for room endpoints
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts         # Room routes (GET /rooms/:code, POST /join, POST /start)
│   │   └── schemas.ts       # Validation schemas (createRoomSchema, joinRoomSchema)
│   ├── models/
│   │   └── game.ts          # Backend Room, RoomSnapshot, and Participant model definitions
│   └── services/
│       └── roomStore.ts     # Room lifecycle logic (code generator, connection tracking, idle cleanup)

frontend/
├── src/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx # Player input validation
│   │   ├── JoinRoomPage.tsx   # Player input and code validation
│   │   └── LobbyPage.tsx      # Auto-polling hook, host check, start button state
│   ├── services/
│   │   └── api.ts           # HTTP requests and TypeScript definitions
│   └── state/
│       └── roomStore.ts     # Zustand/React-store methods (startRoom, fetchRoom)
```

**Structure Decision**: Web application option (detected `backend/` and `frontend/` workspaces). Real paths identified above.

## Complexity Tracking

*No constitution violations. Complexity tracker is not required.*
