# Implementation Plan: Game Start and Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-05-28 | **Spec**: [specs/002-game-start-drawer-flow/spec.md](spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer-flow/spec.md`

## Summary

This phase implements the transition into active gameplay. When the host starts the game, the server will deterministically assign the host as the drawer and all other participants as guessers. The server will select the word "rocket" as the secret word. Crucially, the backend will conditionally mask this `secretWord` as `null` in the API payload for any user who is not the drawer to prevent network-tab cheating. Finally, late joins will be strictly rejected once a room is in the "playing" state.

## Technical Context

**Language/Version**: TypeScript / Node.js 18+

**Primary Dependencies**: Express, React, Zod, Vitest

**Storage**: In-memory `Map` (backend), React state + SyncExternalStore (frontend)

**Testing**: Vitest for backend service and frontend store tests.

**Project Type**: Web application (Frontend + Backend)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. TypeScript Strict Mode** (Strict mode active; masking utilizes explicit typing via `null`)
- [x] **II. Testing Discipline** (Tests required for role assignment and payload masking logic)
- [x] **III. Extend the Starter Application** (Preserving existing architecture)
- [x] **IV. Deterministic Gameplay** (Word selection hardcoded to "rocket")
- [x] **V. Simplicity First** (No timers or complex rounds)
- [x] **VII. Polling-Based Synchronization** (Transitions rely on established 2s polling)
- [x] **VIII. Validation Consistency** (Trimming enforced, 403 blocks implemented)
- [x] **IX. Explicit Game States** (`playing` status gates behavior)
- [x] **X. Specification-Driven Development** (Aligned with spec requirements)
- [x] **XI. Incremental Feature Delivery** (Focus strictly on Game Start transition)
- [x] **XII. AI-Assisted but Human-Reviewed** (Implementation plan follows spec)
- [x] **XIII. Scope Discipline** (No WebSockets, no multi-round logic)
- [x] **XIV. Traceable Implementation** (Maps to Scenario 2)

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Extended Room and Participant types
├── quickstart.md        # Manual verification steps
└── contracts/
    └── api.md           # API signatures for conditional masking
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts     # Update GET /:code logic to use participantId for masking
│   │   └── schemas.ts   # Verify/ensure trimming is strict
│   ├── models/
│   │   └── game.ts      # Add role to Participant, secretWord to Room
│   └── services/
│       └── roomStore.ts # Implement assignRoles(), selectWord(), and conditional toRoomSnapshot()
└── tests/               # Service unit tests for masking and roles

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx # Update to show drawer tools vs guesser inputs based on role
│   └── state/
│       └── roomStore.ts # Verify store handles new Snapshot payload
└── tests/               # Component tests
```

**Structure Decision**: Web application structure. Backend changes focus heavily on data masking and state transition logic. Frontend changes focus on conditionally rendering the GamePage based on the assigned role.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
