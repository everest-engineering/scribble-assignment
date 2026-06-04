# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-lab-attempt-2` | **Date**: 2026-06-02 | **Spec**: [.specify/specs/001-room-setup-lobby/spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/001-room-setup-lobby/spec.md`

## Summary
Implement the missing components for room setup and lobby management: host identification, automatic 2-second polling for state synchronization, restricted "Start Game" functionality (host-only, minimum 2 players), and improved validation with clear error feedback.

## Technical Context

**Language/Version**: TypeScript 5.x (Strict Mode)

**Primary Dependencies**: React 18, Vite, Express, Zod, Vitest

**Storage**: In-memory `Map` in `roomStore.ts`

**Testing**: Vitest (Unit and Integration)

**Target Platform**: Modern Browsers / Node.js

**Project Type**: Web application (Frontend + Backend)

**Performance Goals**: Lobby state sync within 2s of server update

**Constraints**: HTTP Polling only (No WebSockets); In-memory only (No DB)

**Scale/Scope**: Support for multiple isolated rooms with 2+ players each

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Ensure compliance with [Scribble Assignment Constitution](.specify/memory/constitution.md):
1. **TypeScript**: Strict mode enabled (Principle I). ✅
2. **Stack**: Frontend (React 18/Vite), Backend (Node/Express/Zod/HTTP Polling). No WebSockets, DBs, Auth (Principle II). ✅
3. **Architecture**: Clean separation (api/services/models/state), functional components, immutable structures (Principle III). ✅
4. **Minimalism**: Minimal memory footprint, no extra features (Principle IV). ✅
5. **Scope**: Strictly adhere to defined features. No unrelated refactors (Principle V). ✅
6. **Testing**: Vitest for all tests, minimum 90% code coverage (Principle VI). ✅

## Project Structure

### Documentation (this feature)

```text
.specify/specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts      # Update Room/Participant types
│   ├── services/
│   │   └── roomStore.ts # Add host tracking, validation
│   └── api/
│       ├── rooms.ts     # Update API responses
│       └── schemas.ts   # Add Zod schemas
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── LobbyPage.tsx    # Polling & Start logic
│   │   └── JoinRoomPage.tsx # Validation feedback
│   └── state/
│       └── roomStore.ts # Implementation of polling
└── tests/
```

**Structure Decision**: Web application (Frontend + Backend) structure selected as per the project's existing layout.

## Complexity Tracking

*No violations identified.*
