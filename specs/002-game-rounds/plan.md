# Implementation Plan: Game Rounds

**Branch**: `assignment` | **Date**: 2026-06-08 | **Spec**: `specs/002-game-rounds/spec.md`

**Input**: Feature specification from `specs/002-game-rounds/spec.md`

## Summary

Extend the existing game-start flow to assign drawer/guesser roles, control secret-word visibility per role, and display roles and word on the game page. The host is always the drawer for v1. Polling continues on the game page to keep state in sync.

## Technical Context

**Language/Version**: TypeScript ES2022+ (strict mode enabled in both tsconfigs)

**Primary Dependencies**: Backend: Express 4, Zod 3; Frontend: React 18, React Router 6, Vite 5

**Storage**: In-memory (Map in `roomStore.ts`) — no database

**Testing**: Vitest (both backend and frontend)

**Target Platform**: Web browser (Chrome/Firefox/Safari) + Node.js server (v18+)

**Performance Goals**: Roles & word visible within 2s of game start (SC-001, SC-002, SC-003)

**Constraints**: No WebSockets (HTTP polling only — Constitution III); no database (Constitution IV); no auth (AGENTS.md); single round only, no drawer rotation (Constitution "Explicitly Out Of Scope")

**Scale/Scope**: Single-server, small multiplayer game lobbies; one drawer per round, host as drawer for v1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. TypeScript Strictness** | ✅ PASS | All new types (Role on snapshot, drawer/word fields) use typed interfaces + Zod schemas. No `any`. |
| **II. Brownfield Enhancement** | ✅ PASS | Additive changes only: field additions to existing models (`role` on ParticipantSnapshot, role-based `toRoomSnapshot` filtering), game page enhancements. No rewrites. |
| **III. HTTP Polling** | ✅ PASS | Existing `pollRoom` mechanism extends to the game page. No WebSockets. |
| **IV. In-Memory State** | ✅ PASS | Roles and word stored on the Room object in-memory. No database. |
| **V. Incremental & Verifiable** | ✅ PASS | Spec has Given/When/Then. Each FR is independently testable via the quickstart scenarios. |

**Gate Decision**: PASS — all principles satisfied. No complexity-tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-rounds/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts           # No model changes needed; roles stored on Participant
│   ├── services/roomStore.ts    # startGame assigns roles; toRoomSnapshot filters word per role; leaveRoom
│   ├── api/rooms.ts             # Existing routes handle role visibility; add POST /:code/leave
│   └── api/schemas.ts           # Add leaveRoomSchema
└── tests/
    └── services/roomStore.test.ts  # Role assignment tests

frontend/
├── src/
│   ├── pages/GamePage.tsx       # Role-aware rendering: drawer sees word, guesser sees placeholder
│   ├── components/GuessForm.tsx  # Existing; may need role-gating
│   ├── services/api.ts          # Add leaveRoom method; existing poll covers role data
│   └── state/roomStore.ts       # Add leaveRoom action
└── tests/
    └── pages/GamePage.test.ts   # Role rendering tests
```

**Structure Decision**: Web application (Option 2) — matches existing codebase layout.

## Complexity Tracking

No constitutional violations to justify. All changes are additive and within existing architectural boundaries.

## Phase 0: Research

### Open Questions

1. **Role of `toRoomSnapshot` viewer ID**: The function currently receives `viewerParticipantId` but does nothing with it (`void viewerParticipantId`). For this feature, the word must be hidden from guessers but shown to the drawer. The viewer ID param must be used to filter the word.
2. **Word exposure in GET route**: The `GET /rooms/:code` endpoint currently returns the full room (including word) to any caller. With role-based access, the word must be stripped unless the viewer is the drawer.
3. **Existing role field on ParticipantSnapshot**: The `ParticipantSnapshot` already has `role: ParticipantRole | null` but it's always set to `null` in `toRoomSnapshot`. We need to populate it.
4. **Polling on GamePage**: The lobby auto-polls at 2s. The game page needs the same polling to pick up role/word changes after the host starts the game. The simplest approach: reuse the existing `pollRoom` mechanism by mounting a polling `useEffect` on `GamePage` too.
5. **Host as drawer**: The spec assumption says host is always drawer for v1. This simplifies the selection algorithm.
6. **Deterministic word selection (FR-012)**: The spec says "deterministically" but the existing `startGame` uses `Math.random()`. This likely means "from the starter word list" (source-deterministic), not "predictably". We'll keep random selection from the list.

### Research Plan

1. Review existing `toRoomSnapshot` role-parameter usage
2. Design role filtering for word visibility
3. Confirm game-page polling approach
