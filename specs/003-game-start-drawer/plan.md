# Implementation Plan: Game Start & Drawer Flow

**Branch**: `003-game-start-drawer` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-game-start-drawer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement game start transition from lobby to round 1: validate all player names (trimmed, empty/whitespace-only triggers "awaiting rename" state with inline correction), designate host as drawer with clear visual indicator across all clients, deterministically select the first word from the starter list, and deliver it exclusively to the drawer via server-side filtering. Extends the existing `startGame` flow in `roomStore.ts` to enforce name validation before room transitions to `"playing"`, and adds round tracking with per-player word visibility.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+, React 18

**Primary Dependencies**: Express 4.x (backend), React 18 (frontend), Vite 5.x (frontend build), Zod 3.x (validation)

**Storage**: In-memory only (backend `Map<string, Room>` with `structuredClone` snapshots)

**Testing**: Vitest (backend unit tests for roomStore + schemas; frontend unit tests for api.ts; manual two-browser-tab testing per spec acceptance scenarios)

**Target Platform**: Modern web browser (Chrome, Firefox, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Transition from lobby to round 1 in under 2 seconds (SC-001); name validation error within 1 second (SC-002); drawer identification visible within 3 seconds (SC-003)

**Constraints**: No WebSockets, no databases, no authentication; all sync via HTTP polling; in-memory state only

**Scale/Scope**: Up to 8 players per room; round 1 only (multi-round support out of scope for this feature)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (TypeScript-First & Type Safety)**: All new types (Round, RoomStatus extension) MUST be fully typed with no `any`. Zod schemas MUST validate name inputs and start-game payloads. ✅ No violation.
- **Principle II (Brownfield Enhancement Discipline)**: The existing `startGame` in `roomStore.ts` already transitions rooms to `"playing"`. This feature MUST extend that method (add name validation, drawer assignment, word selection) without rewriting the existing room/participant model. ✅ No violation — codebase already explored in detail.
- **Principle III (Deterministic Game Logic) (NON-NEGOTIABLE)**: Word selection MUST be deterministic. The spec specifies the first word from the starter list for round 1. `STARTER_WORDS` is a `readonly` array, so `STARTER_WORDS[0]` is always `"rocket"` for round 1. This is directly testable (SC-005). ✅ Enforced by design.
- **Principle IV (HTTP Polling & In-Memory State)**: Game state (round info, drawer, word) is fetched via existing polling on `GET /rooms/:code`. No WebSockets introduced. Word is filtered server-side per viewer (clarification Q2), so no word data leaks in polling responses to non-drawers. ✅ No violation.
- **Principle V (Validation & Edge Case Rigor)**: This feature directly enforces this principle: inline name validation at game start, "awaiting rename" state for invalid names, Zod validation on start-game payload, deterministic word selection, late-join spectator mode, server-side word filtering. ✅ Enforced by design.

**Gate status**: ✅ PASS — All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/003-game-start-drawer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-contract.md  # API request/response contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   ├── rooms.ts           # Extend POST /:code/start: add name validation, return round info
    │   ├── schemas.ts         # Add gameStartResponseSchema, awaitingRename types
    │   └── schemas.test.ts    # Add tests for new schemas
    ├── models/
    │   └── game.ts            # Add Round type, extend RoomStatus with "awaiting_rename", add currentRound to Room
    ├── services/
    │   └── roomStore.ts       # Extend startGame: name validation, drawer assignment, word selection, awaiting_rename state
    └── seed/
        └── starterData.ts     # Expand STARTER_WORDS to at least 10 words

frontend/
└── src/
    ├── pages/
    │   ├── LobbyPage.tsx      # Wire start-game button to handle rename state; show drawer indicator
    │   └── GamePage.tsx       # Replace placeholder: show drawer identifier, word for drawer, guessing UI for guessers
    ├── services/
    │   └── api.ts             # Update fetchRoom response type to include currentRound, drawerId, currentWord
    ├── state/
    │   └── roomStore.ts       # Add round state, drawer ID, current word; handle awaiting_rename polling response
    └── components/
        └── DrawerIndicator.tsx # NEW: badge/label showing who the current drawer is
```

**Structure Decision**: Web application — two-project layout (`backend/` + `frontend/`). No new projects or top-level dependencies. All changes follow existing patterns established by the Room Setup & Lobby feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. Complexity tracking not required.
