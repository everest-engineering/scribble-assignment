# Implementation Plan: Room Setup And Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-27 | **Spec**: specs/001-room-setup-lobby/spec.md

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Players can create or join isolated game rooms via a 4-character alphanumeric code. The room creator is designated as host and is the only one who can start the game once at least 2 players are present. The lobby refreshes player state via HTTP polling every ~2 seconds. Invalid or empty room codes are rejected with clear feedback.

## Technical Context

**Language/Version**: TypeScript 5.6 (backend + frontend), Node.js 22+ (runtime)

**Primary Dependencies**: Express 4 (backend), React 18 (frontend), Vite 5 (build), Zod 3 (validation), React Router 6 (routing)

**Storage**: In-memory (Map-based, no databases per project constraints)

**Testing**: No test framework currently configured — tests are out of scope for this plan phase

**Target Platform**: Web browser (modern Chrome/Firefox/Safari) + Node.js server

**Project Type**: Web application (monorepo: Express backend + React frontend)

**Performance Goals**: Lobby polling completes in under 1s round-trip; room code generation in under 100ms; lobby renders within 500ms of data arrival

**Constraints**: No WebSockets, no databases, no authentication. All sync is HTTP polling. In-memory only — rooms are ephemeral and lost on server restart.

**Scale/Scope**: Maximum ~100 concurrent rooms, ~10 players per room. Single-server deployment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file (`.specify/memory/constitution.md`) contains placeholder template values and has not been populated with project-specific principles. No active gates are defined. Proceeding with standard development practices:

- TypeScript-first, no `any`, prefer `unknown` for dynamic types (as established in AGENTS.md)
- Zod validation for all API payloads
- Immutable data patterns (structuredClone already in use)
- Existing project patterns (Express Router, roomStore, RoomStoreProvider) to be followed
- No WebSockets, databases, or auth (project constraints from AGENTS.md)

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
│   ├── models/
│   │   └── game.ts              # Room, Participant, RoomSnapshot types
│   ├── services/
│   │   └── roomStore.ts         # In-memory room CRUD + startGame
│   ├── api/
│   │   ├── router.ts            # Express router + error handlers
│   │   ├── schemas.ts           # Zod schemas for request validation
│   │   └── rooms.ts             # Room endpoints (create, join, fetch, start)
│   └── server.ts                # Entry point

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── LobbyPage.tsx        # Auto-polling lobby with host controls
│   │   ├── CreateRoomPage.tsx   # Room creation form
│   │   └── JoinRoomPage.tsx     # Room join form with validation
│   ├── state/
│   │   └── roomStore.ts         # Room state + polling logic
│   └── services/
│       └── api.ts               # API client
```

**Structure Decision**: Web application (Option 2). The monorepo is split into `backend/` and `frontend/` directories as established in the existing codebase. No new projects or structural changes needed.

## Complexity Tracking

No constitution violations to justify.
