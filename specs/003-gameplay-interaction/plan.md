# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Build an interactive drawing canvas for the drawer, sync the strokes via HTTP polling, allow guessers to submit guesses (with rate limiting), and apply scoring rules for correct guesses, all using in-memory state.

## Technical Context

**Language/Version**: TypeScript, Node.js (Backend), React v18 (Frontend)
**Primary Dependencies**: Express, Zod (Backend), React, React Router v6, Vite (Frontend)
**Storage**: In-memory ONLY
**Testing**: Manual / Standard React Testing Library
**Target Platform**: Web browsers (Frontend), Node.js server (Backend)
**Project Type**: Monolithic web app (backend + frontend)
**Performance Goals**: Minimal memory footprint, smooth canvas rendering (<16ms frame), 500ms sync batches.
**Constraints**: No WebSockets, no databases, no authentication.
**Scale/Scope**: In-memory game rooms, HTTP polling.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript-First**: Passed. All data structures and API contracts will use TS and Zod.
- **II. Architecture**: Passed. Using HTTP polling exclusively. State will be stored in-memory.
- **III. Security**: Passed. Zod validation for guess submissions. Rate limiting of 1 guess/sec.
- **IV. Testing**: Passed. Code will be modular.
- **V. Error Handling**: Passed. Standardized error responses.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          
├── data-model.md        
├── quickstart.md        
├── contracts/
│   └── api.md           
└── tasks.md             # To be created later
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # Zod schemas, types
│   ├── services/        # Room/Game state management, Scoring logic
│   └── api/             # Express routes for drawing and guessing
└── tests/

frontend/
├── src/
│   ├── components/      # Canvas, Chat/Guess input
│   ├── state/           # roomStore.ts updates
│   └── services/        # API polling calls
└── tests/
```

**Structure Decision**: Selected the web application structure (backend + frontend) to match the existing monolithic setup.

## Complexity Tracking

No violations of the Constitution.
