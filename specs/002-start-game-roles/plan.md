# Implementation Plan: Game Start & Role Assignment

**Branch**: `002-start-game-roles` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-start-game-roles/spec.md`

## Summary

Allow the host to start the game from the lobby. When the game starts, the system must atomically assign roles (one drawer selected uniformly at random, all others become guessers), present the drawer with 3 word options to choose from, and reveal the selected secret word only to the drawer. All synchronization uses HTTP short-polling at ≤2s intervals per the constitution.

## Technical Context

**Language/Version**: TypeScript (strict: true), Node.js 18+

**Primary Dependencies**: Express (backend), React 18 + React Router v6 (frontend), Vite (build), Zod (validation), Vitest (testing)

**Storage**: In-memory only (no database)

**Testing**: Vitest for both backend and frontend

**Target Platform**: Node.js 18+ (backend), modern browsers (frontend)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: HTTP polling ≤2s, response times <100ms for start-game and word-selection operations

**Constraints**: No databases, no authentication, no WebSockets, no new state-management libraries

**Scale/Scope**: 2-8 players per room, in-memory, single-server

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | No violations — new code follows existing patterns |
| II. Functional Components & Hooks | ✅ PASS | React components for game screen, role display, word selection |
| III. Short-Polling Sync (≤2s) | ✅ PASS | All client-server sync via HTTP polling at 2s intervals |
| IV. Strict Input & Name Validation | ✅ PASS | Zod validation for all new endpoints (word selection, start game) |
| V. Testable Game Logic | ✅ PASS | Role assignment, word selection, word bank — all pure functions in services layer |
| Hard Constraints (no DB, no auth, no WebSockets) | ✅ PASS | All state in-memory, no auth needed (participantId-based), no WS |

**No violations identified. Complexity tracking not required.**

## Project Structure

### Documentation (this feature)

```text
specs/002-start-game-roles/
├── plan.md              # This file
├── research.md          # Phase 0 — architectural decisions
├── data-model.md        # Phase 1 — entity definitions
├── quickstart.md        # Phase 1 — test scenarios
├── contracts/
│   └── api.md           # Phase 1 — API contracts
└── tasks.md             # Phase 2 — task breakdown (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts      # Extended: RoundState, WordBank, drawerId, secretWord, wordOptions
│   ├── services/
│   │   └── roomStore.ts # Extended: startGame(), selectWord(), role/word assignment logic
│   └── api/
│       ├── schemas.ts   # Extended: wordSelectionSchema, role response schemas
│       ├── rooms.ts     # Extended: POST /rooms/:code/start returns roles+words
│       └── router.ts    # Extended: new POST /rooms/:code/select-word route
│
frontend/
├── src/
│   ├── services/
│   │   └── api.ts       # Extended: startGame() returns role, selectWord()
│   ├── state/
│   │   └── roomStore.ts # Extended: roles, wordOptions, drawer/guesser views
│   └── pages/
│       ├── LobbyPage.tsx       # Extended: game starts, transitions to GamePage
│       ├── GamePage.tsx        # NEW: shows drawer word selection or guesser waiting
│       └── DrawerWordSelect.tsx # NEW: drawer picks from 3 word options
```

**Structure Decision**: Single web-app structure with separate backend/ and frontend/ directories as established. No new packages or monorepo tools needed.

## Complexity Tracking

No constitution violations. Section unused.
