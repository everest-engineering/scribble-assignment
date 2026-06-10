# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-10 | **Spec**: [spec.md](../002-game-start-drawer/spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

Add game-start logic to transition rooms from `"lobby"` to `"playing"`, assign the host as drawer, deterministically select a secret word from the starter list, and expose drawer identity + secret word (drawer-only) in all game state responses. Also enforce player name validation (trimming, character whitelist, max 15 chars) on create/join.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+ backend, React 18 frontend)

**Primary Dependencies**: Express 4.x (backend), React 18 + React Router v6 (frontend), Zod 3.x (validation)

**Storage**: In-memory only (no database, no persistent storage — per Constitution III)

**Testing**: Vitest 3.x (both backend and frontend)

**Target Platform**: Web browser (Chromium/Firefox/Safari — modern evergreen)

**Project Type**: Web application (Express REST API backend + React SPA frontend)

**Performance Goals**: ~2s polling interval for game state sync; lightweight in-memory per-room footprint

**Constraints**: No WebSockets or real-time push (Constitution II); no databases (Constitution III); no authentication (project scope); no drawer rotation (deferred to future iteration)

**Scale/Scope**: Small multiplayer lab game (1 room ~ 2-10 players, single-round focus for this feature)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Rationale |
|-----------|--------|-----------|
| **I. TypeScript-First** | ✅ PASS | All new code will be fully typed; no `any` |
| **II. RESTful HTTP Polling** | ✅ PASS | Game state sync via existing polling mechanism; no WebSockets |
| **III. In-Memory State Only** | ✅ PASS | All game state (room, participants, secret word) in-memory |
| **IV. Deterministic Game Logic** | ✅ PASS | Word selection uses deterministic hash of room code modulo word list length |
| **V. Incremental Implementation** | ✅ PASS | Feature follows Spec Kit phases; no scope creep |
| **Out-of-Scope Boundaries** | ✅ PASS | No WebSockets, DB, auth, deployment, drawer rotation, multiple rounds, word packs, spectator, moderation, or unrelated refactors |

**Verdict**: All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts           # Add drawerId, secretWord to Room; add secretWord to RoomSnapshot
│   ├── services/
│   │   └── roomStore.ts      # Add deterministic word selection; name validation; drawer-aware snapshot
│   ├── api/
│   │   ├── rooms.ts           # Wire name validation into create/join routes
│   │   └── schemas.ts         # Add name validation schemas (trim, alphanumeric, max 15)
│   └── seed/
│       └── starterData.ts     # Unchanged

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx      # Keep existing polling (already navigates on status !== "lobby")
│   │   └── GamePage.tsx       # Add polling; show secret word for drawer; show drawer indicator
│   ├── components/
│   │   └── (existing)         # Possibly add DrawerIndicator component
│   ├── services/
│   │   └── api.ts             # Update types (drawerId, secretWord)
│   └── state/
│       └── roomStore.ts       # Add fetchRoom polling in GamePage
```

**Structure Decision**: Web application (Option 2) — already established in the project. No structural changes needed; this feature modifies existing files within the same layout.

## Complexity Tracking

Not needed — all Constitution gates pass with no violations.
