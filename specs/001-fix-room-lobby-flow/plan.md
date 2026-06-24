# Implementation Plan: Fix Room Lobby Flow

**Branch**: `add-specs` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-fix-room-lobby-flow/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Fix the broken room creation, joining, and lobby refresh flows caused by a typo
in the frontend API base URL (`/bug` suffix). Also add inline form validation on
the Create Room and Join Room pages, and add a loading state to the lobby
refresh button.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+

**Primary Dependencies**: Express 4.x (backend), React 18 (frontend), Vite 5.x
(frontend build), Zod 3.x (validation)

**Storage**: In-memory only (backend Map)

**Testing**: Manual two-browser-tab testing per spec acceptance scenarios

**Target Platform**: Modern web browser (Chrome, Firefox, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Lobby refresh completes in under 2 seconds; loading
indicator appears within 200ms

**Constraints**: No WebSockets, no databases, no authentication; all sync via
HTTP polling

**Scale/Scope**: Two players per room, single-room test scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (TypeScript-First)**: All changes MUST be fully typed. No `any`.
  All new validation logic MUST use typed error messages. ✅ No violation.
- **Principle II (Brownfield Enhancement)**: MUST read existing code before
  writing. Changes MUST conform to established patterns (functional components,
  existing store pattern, existing error display). ✅ No violation.
- **Principle III (Deterministic Game Logic)**: Not applicable — lobby flow has
  no game mechanics. ✅ N/A.
- **Principle IV (HTTP Polling & In-Memory)**: The fix preserves HTTP polling
  for lobby refresh. No real-time protocols introduced. ✅ No violation.
- **Principle V (Validation & Edge Case Rigor)**: This feature directly
  implements this principle by adding inline form validation and consistent
  error display. ✅ Enforced by design.

**Gate status**: ✅ PASS — All constitution principles satisfied. No complexity
justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-room-lobby-flow/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx   # Add inline name validation
│   │   ├── JoinRoomPage.tsx     # Add inline name + code validation
│   │   └── LobbyPage.tsx        # Loading state already wired via store
│   ├── services/
│   │   └── api.ts              # Fix URL typo (primary bug)
│   └── state/
│       └── roomStore.ts        # Fix fetchRoom() to use withLoading()
```

**Structure Decision**: Web application — two-project layout (`backend/` +
`frontend/`). All changes are in `frontend/src/`. Backend is unmodified.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. Complexity tracking not required.
