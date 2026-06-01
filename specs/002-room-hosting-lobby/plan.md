# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement Room Hosting & Lobby using the existing Express backend and React frontend. The backend will expose HTTP endpoints for creating, joining, polling room state, and starting a game. The frontend will poll the lobby endpoint every ~2s (with small jitter) to display participants. All server-side validation will use Zod and runtime state will be in-memory per the project constitution.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Node 18+ for backend, ESModules)

**Primary Dependencies**: Express, Zod, crypto (Node builtin), vitest (tests)

**Storage**: In-memory room store (no external DB)

**Testing**: `vitest` for unit and contract tests; add tests for `roomStore` and API routes

**Target Platform**: Local development / Node.js server + browser frontend (Vite)

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Support a baseline of 100 concurrent active rooms in-memory without observable degradation; lobby polling interval ~2s p99 visibility target 2.5s.

**Constraints**: No WebSockets; no external DBs; TypeScript-first and Zod validation required by constitution; room TTL configurable via `ROOM_TTL_MS` (default 300000 ms).

**Scale/Scope**: Single-process in-memory prototype. Document migration path for multi-process/shared-store if higher scale required.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

All planned decisions comply with the repository constitution:

- **TypeScript First**: Implementation and tests will be TypeScript (backend + frontend).
- **Zod Validation**: All API shapes will be validated with Zod in `src/api/schemas.ts`.
- **Test-First**: Add vitest tests for `roomStore` and API routes before implementation where feasible.
- **No WebSockets**: Design uses HTTP polling only (2s + jitter).
- **In-Memory Only**: Room state stored in-memory; `ROOM_TTL_MS` governs cleanup.

No constitution violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: Use the existing web application layout (backend + frontend).

Source changes will be concentrated in:

- `backend/src/services/roomStore.ts` — core in-memory room management (create, join, get, start, cleanup)
- `backend/src/api/rooms.ts` — API routes for room create/join/get/start plus Zod schemas
- `frontend/src/pages/CreateRoomPage.tsx`, `JoinRoomPage.tsx`, `LobbyPage.tsx` — UI wiring for create/join/polling

Tests:

- `backend/src/services/roomStore.test.ts` (unit tests)
- `backend/src/api/schemas.test.ts` (contract tests)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
