# Implementation Plan: Gameplay Interaction

**Branch**: `sdd-2-scribble-assignment` (single-branch workflow) | **Date**: 2026-06-01 | **Spec**: `specs/003-gameplay-interaction/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add canvas drawing (drawer), guess submission/scoring (guessers), guess history display (all), and auto-redirect on game start. Canvas is synced via dedicated HTTP polling at 1s interval; room state/guesses/scores via existing room poll at 2s interval.

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend)
**Primary Dependencies**: Backend — Express 4, Zod 3, cors. Frontend — React 18, React Router 6, Vite 5. No new top-level dependencies.
**Storage**: In-memory only (constitutional constraint)
**Testing**: vitest (backend)
**Target Platform**: Node.js (backend), modern browsers (frontend)
**Project Type**: Web application (monolith with backend + frontend directories)
**Performance Goals**: Canvas updates visible within 1s (1s poll), room state within 2s (2s poll)
**Constraints**: HTTP polling only (no WebSockets), in-memory only, no auth, no new dependencies
**Scale/Scope**: Single game room, ~2–10 participants

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Clean Code & Atomic Commits | ✓ PASS | Changes are isolated per file/concern, atomic commits planned |
| II. Deterministic & Testable Game Logic | ✓ PASS | Guess comparison is deterministic (trim + case-insensitive exact match), scoring is pure logic isolated from I/O |
| III. TypeScript Strictness | ✓ PASS | No `any` types needed; all new types explicitly defined |
| IV. Spec-Artifact Consistency | ✓ PASS | Spec updated with clarifications; plan tracks spec changes |
| V. Brownfield Respect | ✓ PASS | No rewrites; additive changes only to existing models/store/routes/components |
| No WebSockets | ✓ PASS | HTTP polling only (1s canvas, 2s room) |
| No Databases | ✓ PASS | Scores/guesses/canvas stored on in-memory Room objects |
| No Authentication | ✓ PASS | No auth-related changes |
| No New Top-Level Dependencies | ✓ PASS | HTML5 Canvas is browser-native; no libraries needed |

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code

**Structure Decision**: Web application (backend + frontend). No changes to directory structure — all changes are additive within existing files or create new files in existing directories.

```text
backend/
└── src/
    ├── models/game.ts          # NEW: Point, Stroke, Guess types; Room/RoomSnapshot field additions
    ├── api/schemas.ts          # NEW: submitGuessSchema, saveCanvasSchema, clearCanvasSchema
    ├── api/rooms.ts            # NEW: guess, canvas routes
    └── services/roomStore.ts   # NEW: submitGuess, canvas CRUD functions

frontend/
└── src/
    ├── services/api.ts         # NEW: submitGuess, fetchCanvas, saveCanvas, clearCanvas
    ├── state/roomStore.ts      # NEW: guesses/canvas state + polling methods
    ├── pages/LobbyPage.tsx     # MODIFY: auto-redirect on status === "playing"
    ├── pages/GamePage.tsx      # MODIFY: canvas + guess polling, wire components
    ├── components/Canvas.tsx   # NEW: HTML5 Canvas drawing component
    ├── components/GuessForm.tsx # MODIFY: wire to submitGuess
    ├── components/Scoreboard.tsx # MODIFY: render real scores
    ├── components/ResultPanel.tsx # MODIFY: render guess history
    └── styles/app.css          # ADD: canvas-related styles
```

## Complexity Tracking

No constitution violations. All changes are additive and within existing patterns.

## Implementation Order

1. Backend types + schemas
2. Backend room store functions (submitGuess, canvas CRUD)
3. Backend routes
4. Frontend API client additions
5. Frontend store additions
6. Frontend auto-redirect (LobbyPage)
7. Canvas component + GamePage integration
8. GuessForm wiring
9. Scoreboard + ResultPanel wiring
10. Build validation
