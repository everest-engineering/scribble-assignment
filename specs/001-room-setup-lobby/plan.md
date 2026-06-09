# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement room creation with automatic host designation, room joining via unique
code with validation, lobby polling at ~2s intervals, and host-only start game
with a minimum 2-player requirement. The existing backend already has basic
create/join/get endpoints and an in-memory store; this plan adds host tracking,
input validation, polling, and the start-game gate.

## Technical Context

**Language/Version**: TypeScript 5.x (backend Node.js 18+, frontend React 18)

**Primary Dependencies**: Backend: Express, Zod, tsx. Frontend: React 18, React
Router v6, Vite, Zustand (via Context API pattern in roomStore.ts)

**Storage**: In-memory only (Map<string, Room> in roomStore.ts — no database)

**Testing**: Backend: Vitest. Frontend: Vitest

**Target Platform**: Modern browsers (frontend) + Node.js (backend)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Lobby poll response ≤2s interval; validation error
display ≤1s; room create/join ≤2s round-trip

**Constraints**:
- No WebSockets or real-time push (constitution Principle III)
- No databases (constitution Hard Constraints)
- No authentication (constitution Hard Constraints)
- TypeScript strict mode (constitution Principle I)
- Zod validation for all request payloads (constitution Principle IV)
- Business logic in src/services/, not in route handlers (constitution Principle V)

**Scale/Scope**: Small-scale casual multiplayer (2-8 players per room)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ Pass | Existing codebase uses strict TS; no violations expected |
| II. Functional Components & Hooks | ✅ Pass | All existing components are functional; new ones will follow |
| III. Short-Polling Sync (2s Max) | ✅ Pass | Lobby uses HTTP polling; no WebSockets introduced |
| IV. Strict Input & Name Validation | ✅ Pass | Zod schemas will validate player names and room codes |
| V. Testable Game Logic | ✅ Pass | Host/join logic in roomStore.ts services; testable pure functions |

No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts         # Modify: add start-game endpoint
│   │   ├── schemas.ts       # Modify: add host/start schemas, name validation
│   │   └── router.ts        # No change needed
│   ├── models/
│   │   └── game.ts          # Modify: add hostId, expand RoomStatus
│   └── services/
│       └── roomStore.ts     # Modify: host tracking, name validation, start-game

frontend/
├── src/
│   ├── components/
│   │   └── (no new components needed)
│   ├── pages/
│   │   ├── CreateRoomPage.tsx  # Minor: validation feedback
│   │   ├── JoinRoomPage.tsx    # Minor: validation feedback
│   │   └── LobbyPage.tsx       # Modify: add polling, host indicator, start-game gate
│   ├── services/
│   │   └── api.ts              # Modify: add startGame, pollRoom
│   └── state/
│       └── roomStore.ts        # Modify: add polling, host awareness, start game
```

**Structure Decision**: Web application (Option 2) — existing backend/ + frontend/ layout retained. No structural changes.

## Complexity Tracking

No constitution violations — complexity tracking not required.
