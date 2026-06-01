# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer-flow/spec.md`

## Summary

This feature implements the state transition from Lobby to Game. The host will trigger the transition, the backend will randomly assign a drawer and securely provide them with 3 secret word options. Guessers will see a waiting screen until the drawer selects a word, at which point the canvas unlocks and the round timer begins.

## Technical Context

**Language/Version**: Node.js (backend), React v18 (frontend), TypeScript
**Primary Dependencies**: Express, Zod, Vite, React Router v6, Zustand/Context
**Storage**: In-memory ONLY
**Testing**: N/A
**Target Platform**: Web
**Project Type**: Monolithic frontend + backend web application
**Performance Goals**: HTTP Polling (~2s intervals), minimal memory footprint
**Constraints**: No WebSockets, no databases, no auth, strict Zod validation
**Scale/Scope**: Small scale, in-memory rooms

## Constitution Check

*GATE: Passed*
- **TypeScript-First**: Yes, will strictly type all new data structures.
- **In-Memory State / No DB**: Yes, the round and word dictionaries are in-memory.
- **HTTP Polling Only / No WebSockets**: Yes, relying on the existing HTTP polling structure.
- **Zod Validation**: Yes, all new request payloads will be validated via Zod.
- **Centralized Error Handling**: Yes, will use the backend's existing error handlers.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Web application (frontend + backend detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/
```

**Structure Decision**: The standard web application frontend/backend split matches the existing starter code.
