# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

The feature will be implemented within the existing monorepo: a TypeScript/Node.js backend and a React+Vite TypeScript frontend. The following concrete technical choices align with repository defaults and the constitution.

- **Language/Version**: Node.js 18+ runtime, TypeScript 5.6.x (matches frontend `package.json`), ES Modules
- **Primary Dependencies**: Backend: `express`, `zod`; Frontend: `react`, `react-dom`, `react-router-dom`, `vite` (see `frontend/package.json`)
- **Storage**: In-memory room state only (no external databases) — `Room` objects held in process memory per constitution
- **Testing**: `vitest` for unit and integration tests; React Testing Library for component tests; integration tests using test server helpers in `tests/` and `backend/src/api` integration tests
- **Target Platform**: Node.js server for backend; modern browser for frontend (development: Chromium-based browsers)
- **Project Type**: Web application (frontend + backend)
- **Performance Goals**: Local dev responsiveness: lobby and ResultsPage render within 3s after restart on typical dev machine; timing integration test asserts <3s for cleared state in local environment
- **Constraints**: No WebSockets or server push; strictly in-memory state; TypeScript-first with Zod validation for API contracts; Test-First development workflow
- **Scale/Scope**: Intended for small-scale in-memory rooms in dev/test environments; production-grade scaling is out of scope for this feature

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Gates determined by repository constitution (examples):

- TypeScript-first: code and tests MUST be TypeScript with strict typing
- Zod validation: backend request/response schemas MUST use Zod
- Test-First: vitest tests required for new features and fixes
- No WebSockets: realtime push protocols are prohibited
- In-Memory Only: no external databases or persistent stores
- CI gates: tests and lint must pass before merge

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
backend/
├── src/
│   ├── models/
│   │   └── game.ts                        # room/round model (in-memory Room objects)
│   ├── services/
│   │   └── roomStore.ts                   # room lifecycle, restart logic, cleanup
│   └── api/
│       ├── rooms.ts                       # endpoints for restart/room management
│       ├── restart.integration.test.ts     # integration tests (restart.*.test.ts exist)
│       └── router.ts
└── tests/
    └── api/
        ├── restart.integration.test.ts
        ├── restart.secrets.test.ts
        └── restart.timing.test.ts

frontend/
├── src/
│   ├── pages/
│   │   ├── ResultsPage.tsx                # shows end-of-round results and restart actions
│   │   └── LobbyPage.tsx                  # room re-creation/join flow after restart
│   └── state/
│       └── roomStore.ts                   # client-side room state reset/rehydration
└── tests/
    └── restart.flow.test.ts
```

**Structure Decision**: Reference and update the existing restart tests under `backend/tests/api/` and implement restart-related behavior in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts`. Update `frontend/src/pages/ResultsPage.tsx` and `frontend/src/state/roomStore.ts` to support rehydration and navigation after a restart.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
