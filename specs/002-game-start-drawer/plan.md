# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-04 | **Spec**: [specs/002-game-start-drawer/spec.md](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/specs/002-game-start-drawer/spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer/spec.md`

## Summary

This feature validates and trims player names upon room creation or join. It also handles transitioning the game from the lobby to an active state, designating the Host as the drawer for the first round, selecting a secret word deterministically from the starter word list, and masking the word for guessers.

## Technical Context

**Language/Version**: TypeScript / Node.js 18+ ES Modules

**Primary Dependencies**: Express, Zod, React 18, React Router v6

**Storage**: In-memory store (`roomStore.ts`)

**Testing**: Vitest

**Target Platform**: Web application (Vite frontend + Express backend)

**Project Type**: Web application

**Performance Goals**: UI updates and validation transitions within 1 second

**Constraints**: Ephemeral store only, HTTP polling sync only, no WebSockets, strict type safety

**Scale/Scope**: Multiplayer rooms up to 8 players, simple round setup

## Constitution Check

- TypeScript-First and Strict Type Safety: YES
- In-Memory Ephemeral Data Only (NON-NEGOTIABLE): YES
- HTTP Polling Sync Only (NON-NEGOTIABLE): YES
- React 18 functional components and strict hooks: YES
- Styling must use vanilla CSS: YES
- Authentication, sessions, JWT, or OAuth are strictly forbidden: YES

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts
│   ├── services/
│   │   └── roomStore.ts
│   └── api/
│       ├── rooms.ts
│       └── schemas.ts
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── state/
```

**Structure Decision**: Monorepo with React frontend and Express backend as structured above.

## Complexity Tracking

No violations.
