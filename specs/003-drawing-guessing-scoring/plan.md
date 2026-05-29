# Implementation Plan: Drawing, Guessing, and Scoring

**Branch**: `scribble-lab` | **Date**: 2026-05-28 | **Spec**: [specs/003-drawing-guessing-scoring/spec.md](spec.md)

**Input**: Feature specification for canvas interaction, scoring logic, and multi-player history sync.

## Summary

This phase adds the core gameplay loop. We will integrate `react-sketch-canvas` for the drawer UI, using logical 800x600 coordinates to ensure lines scale correctly across different player screens. The backend will be extended to store a history of strokes and guess attempts. Scoring will award 100 points for the first correct guess by each participant. All state (sketches and chat) will be synchronized using the established HTTP polling pattern.

## Technical Context

**Language/Version**: TypeScript / Node.js 18+

**Primary Dependencies**: Express, React, Zod, Vitest, **react-sketch-canvas**

**Storage**: In-memory `Map` (backend), React state + SyncExternalStore (frontend)

**Project Type**: Web application (Frontend + Backend)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. TypeScript Strict Mode** (Strict types used for Strokes and Guesses)
- [x] **II. Testing Discipline** (Tests planned for score validation and masking)
- [x] **III. Extend the Starter Application** (Preserving polling sync)
- [x] **IV. Deterministic Gameplay** (Scoring is exactly 100 points; grid is fixed 800x600)
- [x] **V. Simplicity First** (Polling used instead of WebSockets)
- [x] **VI. Room State Isolation** (Isolated by unique room code)
- [x] **VII. Polling-Based Synchronization** (Strokes/Guesses synced via GET /rooms/:code)
- [x] **VIII. Validation Consistency** (Guesses trimmed and lowercased)
- [x] **IX. Explicit Game States** (`playing` status gates interaction)
- [x] **X. Specification-Driven Development** (Research completed)
- [x] **XI. Incremental Feature Delivery** (Focus strictly on Interaction/Scoring)
- [x] **XII. AI-Assisted but Human-Reviewed** (Library choice and design reviewed)
- [x] **XIII. Scope Discipline** (No real-time vector broadcasting; no rounds)
- [x] **XIV. Traceable Implementation** (Maps to Scenario 3)

## Project Structure

### Documentation (this feature)

```text
specs/003-drawing-guessing-scoring/
├── plan.md              # This file
├── research.md          # Library and coordinate research
├── data-model.md        # Stroke and Guess entities
├── quickstart.md        # Manual verification steps
└── contracts/
    └── api.md           # New POST /strokes and /guesses endpoints
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts     # Add stroke and guess endpoints
│   │   └── schemas.ts   # Add stroke and guess Zod schemas
│   ├── models/
│   │   └── game.ts      # Add Stroke, Guess, and Score types
│   └── services/
│       └── roomStore.ts # Core logic for score calculation and history limit
└── tests/               # Unit tests for scoring rules

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx # Integrate react-sketch-canvas and GuessForm
│   ├── components/
│   │   ├── Scoreboard.tsx # Update to show scores
│   │   └── GuessHistory.tsx # NEW: Display sequential guess logs
│   ├── services/
│   │   └── api.ts       # Add submitStrokes and submitGuess methods
│   └── state/
│       └── roomStore.ts # Handle strokes and guesses in state
```

**Structure Decision**: Web application structure. Backend work involves new state collections and validation. Frontend work involves integrating a new library and connecting it to the polling sync.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
