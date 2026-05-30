# Implementation Plan: Gameplay Interaction

**Branch**: `004-gameplay-interaction` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-gameplay-interaction/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the core gameplay loop: the drawer draws/clears a canvas visible to all guessers; guessers submit text guesses that are trimmed, case-insensitively compared, and scored (100 points correct, 0 incorrect); empty guesses rejected; guess history synced via polling to all players. Extends `Room` with canvas strokes and guess history on the `Round` model, adds new API endpoints for guess submission and canvas sync, and wires the frontend GamePage with a drawing canvas for the drawer and a guess input + history panel for guessers.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+, React 18

**Primary Dependencies**: Express 4.x (backend), React 18 (frontend), Vite 5.x (frontend build), Zod 3.x (validation)

**Storage**: In-memory only — canvas strokes stored as `Stroke[]` on `Round`, guess history stored as `Guess[]` on `Round`, snapshots via `structuredClone`

**Testing**: Vitest (backend unit tests for guess processing, canvas sync, schema validation; frontend component tests if needed; manual two-browser-tab testing per spec acceptance scenarios)

**Target Platform**: Modern web browser (Chrome, Firefox, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Canvas updates visible within 2 seconds (SC-001); guess processing within 1 second (SC-002); history sync within 2 seconds (SC-003)

**Constraints**: No WebSockets, no databases, no authentication; all sync via HTTP polling; in-memory state only; guess comparison case-insensitive with whitespace trimmed

**Scale/Scope**: Up to 8 players per room; single-round gameplay (multi-round progression out of scope); no rate limiting on guess submissions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (TypeScript-First & Type Safety)**: All new types (`Guess`, `Stroke`, `Round` extensions) MUST be fully typed with no `any`. Zod schemas MUST validate guess submissions and canvas payloads. ✅ No violation.
- **Principle II (Brownfield Enhancement Discipline)**: The existing `Round` model MUST be extended with `strokes` and `guesses` arrays rather than creating new top-level stores. Existing polling pattern (`GET /rooms/:code`) extended to include new fields. New endpoints follow existing Express Router pattern. ✅ No violation — codebase explored in detail.
- **Principle III (Deterministic Game Logic) (NON-NEGOTIABLE)**: Guess scoring is deterministic — identical guess text against the same secret word always produces the same score. Canvas stroke order is preserved. ✅ Enforced by design.
- **Principle IV (HTTP Polling & In-Memory State)**: Canvas state and guess history are synced via existing polling on `GET /rooms/:code`. New POST endpoints for guess submission and canvas updates are stateless commands that update in-memory state, which is then reflected in subsequent polling responses. No WebSockets introduced. ✅ No violation.
- **Principle V (Validation & Edge Case Rigor)**: Guesses are trimmed, case-insensitively compared, empty guesses rejected. Zod validation on all new endpoints. Edge cases documented in spec (drawer guessing, duplicate text, canvas race conditions). ✅ Enforced by design.

**Gate status**: ✅ PASS — All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/004-gameplay-interaction/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-contract.md  # API request/response contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   ├── rooms.ts           # Add POST /:code/guess, POST /:code/canvas, POST /:code/canvas/clear
    │   └── schemas.ts         # Add guessBodySchema, canvasStrokeSchema, canvasClearSchema, new response shape schemas
    ├── models/
    │   └── game.ts            # Add Guess, Stroke types; extend Round with strokes[], guesses[], scores Map
    ├── services/
    │   └── roomStore.ts       # Add submitGuess, updateCanvas, clearCanvas, processGuess helpers; extend toRoomSnapshot
    └── seed/
        └── starterData.ts     # Unchanged

frontend/
└── src/
    ├── pages/
    │   └── GamePage.tsx       # Replace placeholder: drawing canvas for drawer, guess input + history for guessers
    ├── services/
    │   └── api.ts             # Add submitGuess, updateCanvas, clearCanvas API calls; extend fetchRoom response types
    ├── state/
    │   └── roomStore.ts       # Add guess history, canvas strokes (strokes[]), guess input state, correct-guess flag
    └── components/
        ├── Canvas.tsx         # NEW: drawing canvas component (drawer only) with draw/clear
        ├── GuessInput.tsx     # NEW: guess text input for guessers
        └── GuessHistory.tsx   # NEW: scrollable guess history list with guesser names and correct/incorrect markers
```

**Structure Decision**: Web application — two-project layout (`backend/` + `frontend/`). No new projects or top-level dependencies. All changes follow patterns established by the Game Start & Drawer Flow feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. Complexity tracking not required.
