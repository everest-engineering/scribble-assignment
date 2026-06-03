# Implementation Plan: Game Start & Drawer Flow

**Branch**: `scribble-lab` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

Implement the game start sequence where player names are validated (trimmed, no duplicates, max 32 chars). Upon starting the first round, the host/first player is designated as the Drawer. The system deterministically selects a secret word which is only sent in the state payload to the Drawer, while non-drawers receive blanks and a waiting message.

## Technical Context

**Language/Version**: TypeScript
**Primary Dependencies**: Node.js, Express, Zod, React v18, React Router v6
**Storage**: In-memory only (no databases)
**Testing**: Standard JS testing tools
**Target Platform**: Web browsers and Node.js server
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Minimal latency for polling updates
**Constraints**: In-memory only, HTTP polling only, strict out-of-scope rules apply.
**Scale/Scope**: Support small lobby sizes typical for party games.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **TypeScript First**: All logic will be in TypeScript.
- [x] **In-Memory & Polling**: No WebSockets or DBs will be used. State managed in-memory and synced via polling.
- [x] **Extend, Don't Replace**: We will extend the existing room and player models.
- [x] **Scope Guardrails**: No auth, timers, rotating drawers, or out-of-scope features added.
- [x] **AI & Review**: Changes will be granular.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── state/
```

**Structure Decision**: Web application structure with independent backend and frontend directories as mandated by project constitution.

## Complexity Tracking

No constitution violations present.
