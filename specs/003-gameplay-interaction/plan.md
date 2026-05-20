# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-05-20 | **Spec**: specs/003-gameplay-interaction/spec.md

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Implement the core gameplay loop: drawer draws on a canvas (freehand strokes, clearable), guessers submit text guesses (trimmed, case-insensitive, 50-char max), guesses are evaluated against the secret word (+100 for correct, +0 for incorrect), and canvas state, guess history, and scores are synced to all players via the existing polling mechanism.

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022 backend / ESNext frontend)

**Primary Dependencies**: Backend: Express 4, cors, zod. Frontend: React 18, React Router 6, Vite 5. No additional libraries.

**Storage**: In-memory. Extend Room with canvas strokes array, guesses array, and per-participant scores.

**Testing**: Manual two-tab multiplayer validation per constitution (no test framework configured)

**Target Platform**: Node.js 18+ (backend), modern browsers with Canvas API (frontend)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Canvas stroke save <100ms, guess evaluation <50ms, snapshot response <200ms p95

**Constraints**: No WebSockets, no database, no authentication, no new state-management or routing libraries. Polling is the sole sync mechanism. Canvas state must be serializable for API transfer. Guesses are validated server-side. Drawing and guess data are in-memory only.

**Scale/Scope**: Max 100 rooms, max 8 players per room, max ~500 strokes per canvas, max ~100 guesses per round

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| **I. TypeScript-First & Type Safety** | ✅ All new entities (CanvasStroke, Guess, Score) typed with interfaces; Zod for guess submission validation; `unknown` used if needed |
| **II. Spec-Driven Workflow** | ✅ Following prescribed workflow; spec created with 2 clarifications incorporated |
| **III. Immutability & Error Handling** | ✅ Guess submissions are append-only (no mutation of existing guesses); canvas strokes are saved as full-array replacement; error states handled gracefully in UI |
| **IV. Incremental Delivery & Validation** | ✅ Scenario 3 (Gameplay) implemented after Scenario 2 (Game Start); two-tab testing; build before handoff |
| **V. AI-Assisted Development Discipline** | ✅ All AI output human-reviewed before commit; no architectural decisions without approval |
| **Additional Constraints** | ✅ No WebSockets/DB/auth; no new libraries; existing stack reused; polling-only sync |

**Gate result: PASS** — No violations. Complexity tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # Updated API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # + CanvasStroke, Guess, GuessSnapshot types; Round gains strokes, guesses
│   ├── services/
│   │   └── roomStore.ts         # + saveStrokes(), clearCanvas(), submitGuess(), toRoomSnapshot extended
│   └── api/
│       └── rooms.ts             # + POST /:code/draw stroke, POST /:code/guess, clearing (via draw)
│       └── schemas.ts           # + guess submission schema (trim, max 50, reject empty)

frontend/
├── src/
│   ├── components/
│   │   └── Canvas.tsx           # + functional drawing canvas (mouse/touch, clear button)
 │   │   └── GuessForm.tsx        # + guess input field + submit (hidden for drawer, disabled after correct) — existing file, updated
 │   │   └── ResultPanel.tsx      # + scrollable guess list with correct-guess highlighting — existing file, updated
│   │   └── Scoreboard.tsx       # + per-player score display
│   ├── pages/
│   │   └── GamePage.tsx         # + integrate Canvas, GuessForm, ResultPanel, Scoreboard
│   ├── services/
│   │   └── api.ts               # + draw, clearCanvas, submitGuess API functions; extended snapshot types
│   └── state/
│       └── roomStore.ts         # + guess history, scores, canvas polling updates
```

**Structure Decision**: Option 2 — Web application with `backend/` and `frontend/` subdirectories. Matches existing project layout.

## Complexity Tracking

No violations found. Complexity tracking not required.
