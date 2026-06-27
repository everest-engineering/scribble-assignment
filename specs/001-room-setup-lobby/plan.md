# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-26 | **Spec**: specs/001-room-setup-lobby/spec.md

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement room creation, joining by code, lobby auto-refresh via polling,
host designation, and host-only game start with a 2-player minimum.
All state is in-memory; sync uses HTTP polling.

## Technical Context

**Language/Version**: TypeScript (ES2022, NodeNext module resolution, strict mode)

**Primary Dependencies**: Express 4 + Zod (backend); React 18 + React Router 6 + Vite (frontend)

**Storage**: In-memory only (Map-based room store on backend)

**Testing**: Vitest, minimum 80% line coverage

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)

**Project Type**: Web application (Express backend + React frontend)

**Performance Goals**: Lobby polling at ~2s intervals; create/join response under 500ms p95

**Constraints**: No WebSockets, no databases, no auth, polling-only sync.
Backend centralized error handling. Zod for request validation.
Functional components with hooks on frontend.

**Scale/Scope**: Lab project — small scale, no production deployment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript-First (Strict Mode)**: TypeScript strict mode enabled, `any` forbidden.
- **Extend, Don't Rewrite**: All changes extend starter codebase, preserve structure.
- **Spec-Driven Development**: Spec artifacts committed before implementation.
- **Deterministic Game Logic**: Game rules deterministic (in-scope for later scenarios).
- **Minimal Dependencies**: No new state-management or routing libraries beyond starter.
- **Technical Constraints**: No WebSockets, no DB, no auth, polling-only, Zod validation,
  functional components, 80% Vitest coverage.
- **No violations detected**: Complexity tracking not required.

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
│   │   └── game.ts          # Room, Participant types (extend existing)
│   ├── services/
│   │   └── roomStore.ts     # In-memory store (extend existing)
│   └── api/
│       ├── router.ts        # API router (extend existing)
│       ├── rooms.ts         # Room endpoints (extend existing)
│       └── schemas.ts       # Zod schemas (extend existing)
└── src/
    └── services/
        └── roomStore.test.ts  # Extend existing tests

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx      # Add auto-polling (extend existing)
│   │   ├── CreateRoomPage.tsx  # Add name validation (extend existing)
│   │   ├── JoinRoomPage.tsx    # Add name validation (extend existing)
│   │   └── GamePage.tsx       # Placeholder (existing)
│   ├── services/
│   │   └── api.ts             # Add startRoom method (extend existing)
│   └── state/
│       └── roomStore.ts       # Add polling logic (extend existing)
```

**Structure Decision**: Option 2 — Web application (`frontend` + `backend`). All
changes extend existing starter files, never replace them.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. Complexity tracking not required.
