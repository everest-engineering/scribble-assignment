# Implementation Plan: Drawing & Guessing

**Branch**: `003-drawing-and-guessing` | **Date**: 2026-06-09 | **Spec**: `specs/003-drawing-and-guessing/spec.md`

**Input**: Feature specification from `/specs/003-drawing-and-guessing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the core gameplay loop for Scribble. The drawer draws on an HTML5 Canvas, strokes are synced to guessers via HTTP polling (500ms interval), and guessers submit text guesses validated case-insensitively against the secret word. All game logic lives in the services layer per Constitution V.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js 18+ (backend), React 18 (frontend)

**Primary Dependencies**: Express (backend), React 18 + React Router v6 (frontend), Zod (validation), Vite (build)

**Storage**: In-memory only (no databases per constitution). Stroke data and guesses stored in RoundState as JSON arrays.

**Testing**: No dedicated test framework configured for this feature. Manual validation via quickstart.md.

**Target Platform**: Web browser (modern Chrome, Firefox, Safari)

**Project Type**: Web application (Express backend + React SPA frontend)

**Performance Goals**: Drawer sees strokes locally in <100ms. Guessers see new strokes within 2s of completion (500ms polling target). Guess validation completes in <200ms server-side.

**Constraints**: HTTP polling only (no WebSockets, per Constitution III). Maximum polling interval 2s. No databases. In-memory state only. No auth.

**Scale/Scope**: 2-8 players per room. Single round only. Stroke history unbounded for round duration (acceptable for party-game scale).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — TypeScript Strict Mode
- All source code MUST use TypeScript strict mode. No `any` types.
- **Status**: ✅ No violations expected. Existing codebase already uses strict mode.

### Principle II — Functional Components & Hooks
- React components MUST be functional with hooks.
- **Status**: ✅ Canvas component and guess input will be functional components.

### Principle III — Short-Polling Sync (2-Second Maximum)
- All sync via HTTP polling ≤ 2s. No WebSockets.
- **Status**: ✅ Drawing sync uses 500ms HTTP polling. Guess submission uses POST requests. Within limits.

### Principle IV — Strict Input & Name Validation
- All user input validated via Zod on backend.
- **Status**: ✅ Guess text and stroke data will use Zod schemas.

### Principle V — Testable Game Logic (NON-NEGOTIABLE)
- Business logic in services layer. Pure functions where possible.
- **Status**: ✅ Stroke management, guess validation, and state transitions in roomStore.ts.

### Hard Constraints
- No databases, no auth, no WebSockets, no new state-management libraries.
- **Status**: ✅ All respected. In-memory RoundState arrays for strokes/guesses.

**GATE**: ✅ PASS — all principles satisfied. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/003-drawing-and-guessing/
├── plan.md              # This file
├── spec.md              # Feature specification (already written)
├── research.md          # Phase 0 output — technical decisions
├── data-model.md        # Phase 1 output — entity definitions
├── quickstart.md        # Phase 1 output — validation scenarios
├── contracts/
│   └── api.md           # API contract documentation
└── tasks.md             # Phase 2 output (generated later)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts             # Point, Stroke, Guess types
│   ├── services/roomStore.ts      # addStroke(), submitGuess() logic
│   └── api/
│       ├── schemas.ts             # strokeSchema, guessSchema
│       └── rooms.ts               # POST /:code/strokes, POST /:code/guess

frontend/
├── src/
│   ├── components/
│   │   └── DrawingCanvas.tsx      # Reusable canvas component
│   ├── pages/
│   │   └── GamePage.tsx           # Updated with canvas + guess UI
│   ├── services/
│   │   └── api.ts                 # addStroke(), submitGuess()
│   └── state/
│       └── roomStore.ts           # addStroke(), submitGuess() methods
```

**Structure Decision**: Both backend and frontend already exist. New types and endpoints extend existing files. One new component (`DrawingCanvas.tsx`).

## Complexity Tracking

No constitutional violations — complexity tracking not required.
