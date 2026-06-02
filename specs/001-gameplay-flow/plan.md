# Implementation Plan: Gameplay Flow Build-Out

**Branch**: `001-gameplay-flow` | **Date**: 2026-06-01 | **Spec**: [../spec.md](../spec.md)
**Input**: Feature specification from `/specs/001-gameplay-flow/spec.md`

## Summary

The existing starter application already provides working room creation and join flows with an Express backend and a React frontend. This plan extends those flows by adding the game lifecycle on top of the starter room system:

- validate player names and room codes
- mark the room creator as host and enforce host-only game start
- implement lobby polling for live participant updates
- add game-round state, drawer assignment, secret word visibility, guess submission, scoring, result display, and restart behavior

The technical approach preserves the current in-memory backend store and HTTP polling architecture, while extending the REST surface where needed and reusing the existing frontend state store.

## Technical Context

**Language/Version**: TypeScript on Node.js with React 18  
**Primary Dependencies**: Express, Zod, React, React Router v6, Vite, Vitest  
**Storage**: In-memory room state only  
**Testing**: Vitest for backend and frontend tests, manual browser validation for lobby/game flows  
**Target Platform**: Web browser frontend + Node.js backend  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Lobby polling refreshes state within ~2 seconds; room state remains isolate per code; minimal memory usage for active rooms  
**Constraints**: No WebSockets, no database, no authentication; preserve current app architecture and avoid introducing new cross-room state  
**Scale/Scope**: Single-room multiplayer gameplay, 2+ participants per round, incremental extension of starter codebase

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- This implementation maintains the existing in-memory backend and does not add any database.
- It avoids WebSocket or push protocols by using periodic HTTP polling for state refresh.
- It preserves the starter app’s architecture and only extends the minimal domain model required for gameplay.
- It keeps naming and validation rules explicit and supports test-first change verification.

## Project Structure

### Documentation (this feature)

```text
specs/001-gameplay-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   └── services/
│       └── roomStore.ts
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
```

**Structure Decision**: The feature remains a web application with a backend API and a React frontend. Existing files in `backend/src` and `frontend/src` will be extended rather than replaced, preserving the current starter architecture.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | The starter architecture already supports this feature; no new project boundaries are required | Additional frameworks or DBs would violate scope and increase risk |
