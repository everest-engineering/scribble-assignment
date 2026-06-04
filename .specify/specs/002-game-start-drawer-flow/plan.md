# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

## Summary

Implement robust player name validation during room join/creation and game start mechanics, specifically host drawer designation and deterministic secret word selection from a provided list.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js, React 18

**Primary Dependencies**: Express, Zod, Vite

**Storage**: In-memory (Map)

**Testing**: Vitest

**Target Platform**: Web

**Project Type**: Full-stack Web Service

**Performance Goals**: < 100ms API response time

**Constraints**: Adhere strictly to Constitution (No WebSockets, No Auth, HTTP polling only). Client-side masking of the secret word (backend provides `currentWord` in state, frontend MUST conditionally mask based on `isDrawer` client-side flag).

**Scale/Scope**: Small scale (concurrent active rooms)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Compliance verified:
1. **TypeScript**: Strict mode enabled.
2. **Stack**: React 18/Vite, Node/Express/Zod/HTTP Polling.
3. **Architecture**: Clean separation (api/services/models/state).
4. **Minimalism**: No unjustified dependencies.
5. **Scope**: Strictly adhere to defined features.
6. **Testing**: Vitest, >90% coverage.

## Failure Modes

- **Host Disconnection**: Upon host disconnection after game start, the backend MUST immediately clear the room state and notify remaining clients via the next polling response to prevent orphan game sessions.

## Project Structure

```text
backend/
├── src/
│   ├── api/
│   ├── models/
│   ├── services/
│   └── seed/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── state/
└── tests/
```

**Structure Decision**: Standard full-stack layout.

## Complexity Tracking

No violations.
