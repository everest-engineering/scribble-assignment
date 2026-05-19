# Implementation Plan: Game Start and Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-05-19 | **Spec**: specs/002-game-start-drawer/spec.md

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Extend the game start flow to atomically create a Round entity with host-as-drawer assignment, deterministically select a secret word from an expanded (20+) starter list, and expose the word only to the drawer via the room snapshot. Add name re-validation at game start, drawer-disconnect abort handling, and a placeholder/animation for guessers on the game screen.

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022 backend / ESNext frontend)

**Primary Dependencies**: Backend: Express 4, cors, zod. Frontend: React 18, React Router 6, Vite 5

**Storage**: In-memory (add Round to roomStore alongside Room Map)

**Testing**: Manual two-tab multiplayer validation per constitution (no test framework configured)

**Target Platform**: Node.js 18+ (backend), modern browsers (frontend)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Game start <2s, word selection <50ms, snapshot response <200ms p95

**Constraints**: No WebSockets, no database, no authentication, no new state-management or routing libraries. Round creation atomic with game start. Word visibility must be filtered per viewer in the snapshot.

**Scale/Scope**: Max 100 rooms, max 8 players per room, word list 20-50 entries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| **I. TypeScript-First & Type Safety** | ✅ Round entity has typed interface, Zod for any new validation, `unknown` used if needed |
| **II. Spec-Driven Workflow** | ✅ Following prescribed workflow; spec updated with 4 clarifications |
| **III. Immutability & Error Handling** | ✅ Room mutations use existing `cloneRoom` pattern; word list is read-only const; centralized error handling reused |
| **IV. Incremental Delivery & Validation** | ✅ Scenario 2 implemented after Scenario 1; two-tab testing; build before handoff |
| **V. AI-Assisted Development Discipline** | ✅ All AI output human-reviewed before commit; no architectural decisions made without approval |
| **Additional Constraints** | ✅ No WebSockets/DB/auth; no new libraries; existing stack reused; README is source of truth |

**Gate result: PASS** — No violations. Complexity tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # Updated API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # + Round interface, RoundSnapshot type
│   ├── services/
│   │   └── roomStore.ts     # + startGame extended, selectWord(), toRoomSnapshot updated for round/word filtering
│   ├── seed/
│   │   └── starterData.ts   # + expanded word list (20+)
│   ├── api/
│   │   ├── rooms.ts         # + word filtered in snapshot per viewer
│   │   └── schemas.ts       # (no changes expected)
│   └── server.ts            # (no changes expected)

frontend/
├── src/
│   ├── components/
│   │   └── Canvas.tsx        # (scaffolded, placeholders only for this phase)
│   ├── pages/
│   │   └── GamePage.tsx      # + drawer identification, word display, guesser placeholder
│   ├── services/
│   │   └── api.ts            # + RoundSnapshot type, currentRound in RoomSnapshot
│   └── state/
│       └── roomStore.ts      # (no changes expected — polling/snapshot already works)
```

**Structure Decision**: Option 2 — Web application with `backend/` and `frontend/` subdirectories. Matches existing project layout.

## Complexity Tracking

No violations found. Complexity tracking not required.
