# Implementation Plan: Round Result & Restart

**Branch**: `004-round-result-restart` | **Date**: 2026-06-11 | **Spec**: `specs/004-round-result-restart/spec.md`

**Input**: Feature specification from `specs/004-round-result-restart/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a "results" game phase after a round ends (all guessers correct or timer expiry), showing the correct word, final scores, and full guess history. The host can trigger a restart that returns all players to the lobby with the player roster intact and all round-specific data cleared.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20+, React 18

**Primary Dependencies**: Express 4.x (backend), Vite (frontend build), Zod (validation), Vitest (testing)

**Storage**: N/A — in-memory only via `Map<string, Room>` in `roomStore.ts`

**Testing**: Vitest (backend: roomStore.test.ts, schemas.test.ts, rooms.test.ts; frontend: GamePage.test.tsx, api.test.ts)

**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) via frontend; Node.js backend

**Project Type**: Web application (Express API backend + React SPA frontend)

**Performance Goals**: Poll interval of ~2s per client; state snapshot computed and returned in <50ms; support ~20 concurrent rooms

**Constraints**: No WebSockets, no databases, no auth. All state in-memory. `structuredClone` for immutable reads.

**Scale/Scope**: Small-scale classroom/lab game; <50 concurrent players expected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gates

1. **TypeScript-First (I)**: All new types, interfaces, and functions MUST have explicit annotations. No `any`. Codegen does not apply — all changes are manual. **PASS**

2. **RESTful HTTP Polling (II)**: No WebSockets. State transitions (round end, restart) are reflected on the client's next poll. The results screen and restart action both use HTTP POST/GET only. **PASS**

3. **In-Memory State Only (III)**: No database. All results state and round data live on the `Room` object in the `Map`. Active room cleanup timer (`cleanup.ts`) still applies. **PASS**

4. **Deterministic Game Logic (IV)**: Round-end detection remains deterministic (all guessers scored ≥100). Restart is an explicit host action. No randomness introduced. **PASS**

5. **Incremental Implementation & Validation (V)**: This feature builds on existing round lifecycle. No existing behavior is broken. Each user story maps to a set of tasks. **PASS**

6. **Out-of-Scope Boundaries**: No WebSockets, databases, auth, new libraries, multiple rounds, drawer rotation, timers, bonuses, or unrelated refactors. Restart returns to lobby without auto-starting a new round. **PASS**

**Result**: All gates pass. No violations requiring complexity tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-round-result-restart/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # Add "results" to RoomStatus; add restart-related types
│   ├── services/
│   │   └── roomStore.ts     # Add endRound(), restartGame(); update toRoomSnapshot()
│   └── api/
│       ├── rooms.ts         # Add POST /:code/restart endpoint
│       └── schemas.ts       # Add restart request schema
└── src/api/rooms.test.ts    # Add restart integration tests

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx    # Handle navigation from "results" state
│   │   ├── GamePage.tsx     # Auto-navigate to ResultsPage when roundOver
│   │   └── ResultsPage.tsx  # NEW: Results screen with restart control
│   ├── components/
│   │   └── ResultsView.tsx  # NEW: Shared results display (correct word, scores, guesses)
│   ├── state/
│   │   └── roomStore.ts     # Add restartRoom() action
│   ├── services/
│   │   └── api.ts           # Add restartRoom() API call; update RoomSnapshot.status
│   └── routes/
│       └── index.tsx        # Add /results route
└── src/pages/GamePage.test.tsx  # Update tests for new status behavior
```

**Structure Decision**: Web application pattern (backend/ + frontend/) is already established and unchanged by this feature.

## Complexity Tracking

N/A — no constitution violations. All gates pass.
