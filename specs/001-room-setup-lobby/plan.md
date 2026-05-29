# Implementation Plan: Room Setup and Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-28 | **Spec**: [specs/001-room-setup-lobby/spec.md](spec.md)

**Input**: Feature specification for host tracking, room isolation, and lobby polling.

## Summary
This feature enhances the starter app by introducing host-controlled game rooms with automatic lobby synchronization via HTTP polling (~2s). It ensures strict room isolation and validates game-start preconditions (host identity and minimum player count).

## Technical Context

**Language/Version**: TypeScript / Node.js 18+

**Primary Dependencies**: Express, React, Zod, Vitest

**Storage**: In-memory `Map` (backend), React state + SyncExternalStore (frontend)

**Testing**: Vitest for backend service and frontend store tests.

**Project Type**: Web application (Frontend + Backend)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. TypeScript Strict Mode** (Strict mode active in both package tsconfigs)
- [x] **II. Testing Discipline** (Tests planned for service logic and store)
- [x] **III. Extend the Starter Application** (Preserving existing store/service patterns)
- [x] **IV. Deterministic Gameplay** (Status transitions are explicit)
- [x] **V. Simplicity First** (Polling used instead of WebSockets)
- [x] **VI. Room State Isolation** (Isolated by unique room code)
- [x] **VII. Polling-Based Synchronization** (HTTP GET every 2 seconds)
- [x] **VIII. Validation Consistency** (Names/codes trimmed and validated)
- [x] **IX. Explicit Game States** (Lobby, Playing statuses used)
- [x] **X. Specification-Driven Development** (Research completed)
- [x] **XI. Incremental Feature Delivery** (Focus strictly on Setup/Lobby)
- [x] **XII. AI-Assisted but Human-Reviewed** (Implementation plan follows research)
- [x] **XIII. Scope Discipline** (No WebSockets/DBs)
- [x] **XIV. Traceable Implementation** (Maps to Scenario 1)

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Current state and gaps
├── data-model.md        # Extended Room and Participant types
├── quickstart.md        # Manual verification steps
├── contracts/
│   └── api.md           # API signatures
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts     # Update endpoints, add POST /:code/start
│   │   └── schemas.ts   # Update Zod schemas (trim/validate)
│   ├── models/
│   │   └── game.ts      # Add hostId and status types
│   └── services/
│       └── roomStore.ts # Core logic for host assignment and status transitions
└── tests/               # Service unit tests

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx # Implement polling and host UI
│   │   ├── CreateRoomPage.tsx # Add validation
│   │   └── JoinRoomPage.tsx   # Add validation
│   ├── services/
│   │   └── api.ts       # Update types and add startGame method
│   └── state/
│       └── roomStore.ts # Update store with startGame logic
└── tests/               # Store and component tests
```

**Structure Decision**: Web application structure detected. Work will be balanced between backend service logic and frontend state/UI updates.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
