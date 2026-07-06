# Implementation Plan: Join Validation with Clear Error Messages

**Branch**: `sdd2/scribble-assignment` | **Date**: 2026-07-06 | **Spec**: specs/002-join-validation/spec.md

**Input**: Feature specification from `specs/002-join-validation/spec.md`

## Summary

Reject empty, whitespace-only, and non-existent room codes on the Join Room form with the exact error message "Invalid room code. Please try again with correct one." Validation is applied both client-side (before API call for instant feedback) and server-side (defense-in-depth via Zod + route handler). No data model changes required.

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend), Node.js 18+ (backend)

**Primary Dependencies**: Express 4.x (backend), Zod 3.x (backend validation), React 18 + Vite 5 (frontend)

**Storage**: In-memory Map (backend) — no database

**Testing**: Vitest (backend + frontend)

**Target Platform**: Modern browser (Chrome, Firefox, Safari, Edge) + Node.js server

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Client-side validation completes in <100ms (no network request); server-side validation adds <50ms overhead

**Constraints**: Error message must be exact string "Invalid room code. Please try again with correct one." for all invalid code scenarios; no data model changes; must preserve case-insensitive room code matching

**Scale/Scope**: Single room store in memory; max ~100 concurrent rooms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Rationale |
|-----------|-----------|-----------|
| **III. Validation Rigor** | ✅ PASS | Every user input trimmed (Zod `.trim()` on room code params). Empty/whitespace-only codes rejected with clear error message. Backend uses Zod schema validation. Frontend shows inline error. Case-insensitive matching preserved. |
| **IV. Brownfield Enhancement** | ✅ PASS | No new files created beyond spec artifacts. Existing route handler, schema, and page components extended. No new dependencies. Existing patterns (try/catch + next(error) + errorHandler middleware) preserved. |
| **V. State Isolation & Immutability** | ✅ PASS | No changes to room state model. Validation happens before any state mutation — `joinRoom()` is never called with invalid input. |
| **II. RESTful Synchronization** | ✅ PASS | No changes to sync model — validation is synchronous request/response. No WebSockets introduced. |
| **I. Deterministic Game Logic** | ✅ PASS | No game logic changes — purely input validation. |

All gates pass. No constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-join-validation/
├── plan.md              # This file
├── research.md          # Phase 0 — resolved unknowns
├── data-model.md        # Phase 1 — data model (no changes)
├── quickstart.md        # Phase 1 — verification steps
├── contracts/           # Phase 1 — API contract changes
├── checklists/          # Quality checklists
└── tasks.md             # Phase 2 — implementation tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── schemas.ts          # roomCodeParamsSchema validation update
│   │   ├── schemas.test.ts     # Schema validation tests
│   │   └── rooms.ts            # Updated error message + ZodError handling
│   └── services/
│       └── roomStore.ts        # Unchanged (validation at route layer)

frontend/
├── src/
│   ├── pages/
│   │   └── JoinRoomPage.tsx    # Client-side validation added
│   └── services/
│       └── api.ts              # Unchanged (error handling inherited)
```

**Structure Decision**: Web application with `backend/` + `frontend/` monorepo. All changes limited to existing files — no new source files required.

## Complexity Tracking

No constitution violations found. Complexity Tracking is not applicable.
