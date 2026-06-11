# Implementation Plan: Room Setup and Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Players can create game rooms, join with a room code, see a live-updating lobby of participants, and the host can start the game when enough players are present. The feature builds on existing room creation/join infrastructure, adding host tracking, validation, automatic polling, and game start with drawer assignment and word selection.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Express 4.x, React 18, Zod 3.x, react-router-dom 6.x, Vite 5.x, Vitest

**Storage**: In-memory (JavaScript `Map` in `roomStore.ts`). No persistence.

**Testing**: Vitest for backend unit/integration tests, Vitest + jsdom for frontend component tests

**Target Platform**: Web browser (Chrome, Firefox, Safari) + Node.js backend

**Project Type**: Web application (monorepo with `backend/` and `frontend/`)

**Performance Goals**: Room creation/join <2s round-trip, lobby poll ~2s interval, participant list updates <3s

**Constraints**: No WebSockets, no databases, no auth, no new state/routing libraries. All game logic deterministic.

**Scale/Scope**: Up to 8 participants per room, ~100 concurrent rooms, single-server

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript-First & Type Safety | PASS | Existing codebase uses TypeScript + Zod; no changes needed |
| II. Incremental Brownfield Enhancement | PASS | All changes within existing directory structure; extending existing services/routes/components |
| III. Deterministic Game Logic | VIOLATION | Room code generation uses random 4-char selection; drawer assignment and word selection on game start use random selection. Justified in Complexity Tracking |
| IV. Polling-First Synchronization | PASS | Lobby updates use ~2s HTTP polling; no real-time protocols introduced |
| V. Critical Self-Review & Validation | PASS | Standard review practice applies |
| No databases | PASS | In-memory only |
| No authentication | PASS | No auth added |
| No real-time protocols | PASS | HTTP polling only |
| No new state/routing libraries | PASS | Uses existing `roomStore` pattern |
| Starter word list | PASS | Uses existing `STARTER_WORDS` |
| Scoring | N/A | Scoring not in scope for this feature |

**GATE EVALUATION**: Minor violation (III) for room code generation, drawer assignment, and word selection randomness. Justification documented in Complexity Tracking. Post-design re-check required.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-v1.md
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── router.ts        # Mount /rooms routes
│   │   ├── rooms.ts         # POST/GET /rooms, POST /rooms/:code/join, POST /rooms/:code/start
│   │   └── schemas.ts       # Zod schemas for request/response validation
│   ├── models/
│   │   └── game.ts          # Room, Participant, RoomSnapshot types
│   ├── services/
│   │   └── roomStore.ts     # In-memory room storage, create/join/start logic
│   └── seed/
│       └── starterData.ts   # STARTER_WORDS, STARTER_ROLES
└── tests/
    └── services/
        └── roomStore.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── GuessForm.tsx      # Not in scope (game feature)
│   │   ├── ResultPanel.tsx    # Not in scope (game feature)
│   │   ├── RoomCodeBadge.tsx  # Already built
│   │   └── Scoreboard.tsx     # Not in scope (game feature)
│   ├── pages/
│   │   ├── CreateRoomPage.tsx  # Add name validation, loading state
│   │   ├── GamePage.tsx        # Not in scope (game feature)
│   │   ├── JoinRoomPage.tsx    # Add name + code validation, loading state
│   │   ├── LobbyPage.tsx       # Add polling, host check, start game flow
│   │   └── StartPage.tsx       # Already built
│   ├── routes/
│   │   └── index.tsx          # Already correct
│   ├── services/
│   │   └── api.ts             # Fix base URL bug, add startGame method
│   ├── state/
│   │   └── roomStore.ts       # Add startGame, polling mechanism
│   └── styles/
│       └── app.css            # Already built (no changes needed)
└── tests/
```

**Structure Decision**: Web application monorepo (Option 2). Backend handles REST API + in-memory game state. Frontend handles UI with polling-based state sync. No new directories needed; all changes extend existing files.

## Complexity Tracking

> **Violation justification for Constitution Principle III (Deterministic Game Logic)**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Random room code generation (4-char alphanumeric) | Unique room identification requires unpredictable codes to prevent guessing; deterministic sequential codes would allow room enumeration | Sequential codes (0001, 0002...) would allow players to join arbitrary rooms without the code being shared explicitly |
| Random drawer assignment on game start | Drawer selection must be unpredictable to ensure fairness across rounds | Round-robin is possible but would require tracking round history; randomness is simpler and allowable for the initial implementation given spec requires it |
| Random word selection on game start | Word selection from the starter list should not be predictable by the drawer | Deterministic index-based selection (e.g., next in array) would make the word predictable; this is acceptable only because the starter list has 5 words and the spec does not restrict selection method |
