# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement room creation with automatic host assignment, room join with input
validation, multi-room isolation, automatic lobby polling (~2s), and host-only
game start with a 2-player minimum. All sync uses HTTP polling; all state is
in-memory.

## Technical Context

**Language/Version**: TypeScript 5.6+, Node.js 18+

**Primary Dependencies**: Express 4.21, React 18, React Router 6, Zod 3.23,
Vite 5, Vitest 3.1

**Storage**: In-memory only (no databases)

**Testing**: Vitest in both backend and frontend

**Target Platform**: Web browser (modern), Node.js server

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Lobby polling every ~2s; response times <500ms for
room creation, join, and snapshot fetch

**Constraints**: No WebSockets (HTTP polling only), no databases, no
authentication, no new state-management or routing libraries, in-memory state
only

**Scale/Scope**: Lab-scale (2-4 concurrent players on a single server)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gates from Constitution

- **AI-Assisted Development**: All output reviewed; ambiguities clarified.
  → PASS (spec written, no open NEEDS CLARIFICATION markers)
- **TypeScript & Type Safety**: Full typing, Zod for validation.
  → PASS (tech stack conforms)
- **Architecture Constraints**: No WebSockets, no databases, no auth.
  → PASS (polling-based, in-memory, no auth)
- **Test-First & Validation**: Tests before implementation; edge cases handled.
  → PASS (test tasks included in plan)
- **Deterministic Game Logic**: Not directly applicable to lobby/room setup.

**Result**: All gates pass. No violations require justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── api.md           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── router.ts
│   │   └── rooms.ts
│   ├── services/
│   │   └── roomService.ts
│   ├── models/
│   │   └── types.ts
│   └── app.ts
└── tests/
    └── rooms.test.ts

frontend/
├── src/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── StartPage.tsx
│   ├── services/
│   │   └── api.ts
│   ├── state/
│   │   └── roomStore.ts
│   └── components/
│       └── ParticipantList.tsx
└── tests/
    └── lobby.test.tsx
```

**Structure Decision**: Option 2 (Web application) selected. The project has
separate `backend/` and `frontend/` directories. No changes to project
structure are needed for this feature.

## Complexity Tracking

> No Constitution Check violations — complexity tracking not required.
