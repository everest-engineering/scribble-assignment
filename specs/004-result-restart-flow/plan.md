# Implementation Plan: Result, Restart & Final Validation

**Branch**: `scribble-lab` | **Date**: 2026-05-28 | **Spec**: [specs/004-result-restart-flow/spec.md](spec.md)

**Input**: Feature specification for round conclusion, scoring accumulation, and role rotation.

## Summary
This phase completes the core game lifecycle. We will implement two new transitions: `playing -> results` (manually triggered by the host via "Finish Round") and `results -> lobby` (manually triggered by host via "Restart Game"). Crucially, participant scores will accumulate across restarts, and the `drawer` role will rotate sequentially among participants using a seniority-based round-robin approach.

## Technical Context

**Language/Version**: TypeScript / Node.js 18+

**Primary Dependencies**: Express, React, Zod, Vitest

**Storage**: In-memory `Map` (backend)

**Testing**: Vitest for rotation logic and state cleanup verification.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. TypeScript Strict Mode** (Standard types for lastDrawerId and rotation index)
- [x] **II. Testing Discipline** (Rotation unit tests planned)
- [x] **III. Extend the Starter Application** (Reusing polling sync)
- [x] **IV. Deterministic Gameplay** (Seniority-based rotation)
- [x] **V. Simplicity First** (Manual triggers instead of complex timers)
- [x] **VI. Room State Isolation** (Isolated per room code)
- [x] **VII. Polling-Based Synchronization** (Transitions detectable via room.status)
- [x] **VIII. Validation Consistency** (Host identity checked for finish/restart)
- [x] **IX. Explicit Game States** (Results state introduced)
- [x] **X. Specification-Driven Development** (Research completed)
- [x] **XI. Incremental Feature Delivery** (Focus on Lifecycle completion)
- [x] **XII. AI-Assisted but Human-Reviewed** (Design based on user clarifications)
- [x] **XIII. Scope Discipline** (No automated rotations or timers)
- [x] **XIV. Traceable Implementation** (Maps to Scenario 4)

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-flow/
├── plan.md              # This file
├── research.md          # Rotation and persistence decisions
├── data-model.md        # lastDrawerId and transition logic
├── quickstart.md        # Manual verification steps
└── contracts/
    └── api.md           # POST /finish and POST /restart endpoints
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts     # Add /finish and /restart endpoints
│   │   └── schemas.ts   # Add finish/restart validation schemas
│   ├── models/
│   │   └── game.ts      # Add lastDrawerId to Room
│   └── services/
│       └── roomStore.ts # Core logic for finishRound, restartGame, and role rotation
└── tests/               # Rotation logic tests

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx # Handle results state via conditional rendering
│   ├── services/
│   │   └── api.ts       # Add finishRound and restartGame methods
│   └── state/
│       └── roomStore.ts # Store updates for finish/restart
```

**Structure Decision**: Web application structure. Backend changes focus on role management and lifecycle transitions. Frontend work introduces a new `ResultPage` (or conditional render in GamePage).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
