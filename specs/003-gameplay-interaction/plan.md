# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

When a round is active, the drawer draws on a canvas using mouse/touch (vector strokes). Stroke data is included in the room snapshot response and propagated to all participants via the existing 2s polling mechanism. Guessers see the drawing in read-only mode and submit text guesses. Guesses are trimmed, compared case-insensitively against the secret word, and scored (100 points for correct, 0 for incorrect). Guess history and scores are synced to all participants via polling.

## Technical Context

**Language/Version**: TypeScript (backend Node.js, frontend React 18)

**Primary Dependencies**: Express + Zod (backend), React Router v6 + Vite (frontend)

**Storage**: In-memory only — extends existing `Map<string, Room>` with guesses and scores stored on the Room object's current round

**Testing**: Vitest (backend), no frontend test framework yet

**Target Platform**: Browser (modern Chrome/Firefox/Safari) + Node.js server

**Project Type**: Web application (Express backend + React frontend, monorepo)

**Performance Goals**: Drawing updates and guess feedback propagate to all participants within 2 seconds (one polling cycle)

**Constraints**: Constitution strict boundaries — no WebSockets, no DB, no auth. HTTP polling only. Canvas data transmitted via existing polling mechanism; vector strokes are compact enough for lab-scale use.

**Scale/Scope**: Lab-scale (2+ browser tabs, single server process). Canvas: simple free-drawing with single color, single brush width, clear button. No colors, eraser, undo, or shape tools.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. TypeScript First | ✅ PASS | Existing codebase fully typed; new code follows same pattern |
| II. Immutability & Purity | ✅ PASS | Guesses and scores appended immutably; stroke data is value-based |
| III. Test-First (NON-NEGOTIABLE) | ✅ PASS | All new features require failing tests before implementation |
| IV. Validated REST API | ✅ PASS | Guess submission via existing POST endpoint with Zod validation |
| V. Strict Boundaries | ✅ PASS | No WebSockets/DB/auth added; canvas data via HTTP polling; in-memory only |

**Result**: PASS — all gates clear. No complexity justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # Add Guess, StrokePoint, Stroke types; extend Round with strokes, guesses
│   ├── services/
│   │   └── roomStore.ts     # Add submitGuess(), addStroke(), clearCanvas()
│   ├── api/
│   │   ├── rooms.ts         # POST /:code/guess, POST /:code/stroke, POST /:code/clear
│   │   └── schemas.ts       # Zod schemas for guess, stroke, clear endpoints
│   └── seed/
│       └── starterData.ts   # No changes

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx     # Add canvas (drawer) + read-only canvas (guessers), guess form, scoreboard, history
│   ├── components/
│   │   ├── DrawingCanvas.tsx     # NEW: interactive canvas for drawer
│   │   ├── GuessingCanvas.tsx    # NEW: read-only canvas for guessers
│   │   ├── GuessForm.tsx         # Extend: wire to API, show feedback
│   │   └── GuessHistory.tsx      # NEW: list of past guesses with results
│   ├── state/
│   │   └── roomStore.ts     # Add guess history, scores, canvas state
│   └── services/
│       └── api.ts           # Add submitGuess(), addStroke(), clearCanvas() API calls
```

**Structure Decision**: Web application (backend + frontend) — follows existing monorepo structure exactly. No structural changes needed.

## Complexity Tracking

No violations — all gates pass cleanly. Complexity tracking not required.
