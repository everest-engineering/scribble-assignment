# Implementation Plan: Host Tracking on Room Creation

**Branch**: `001-host-tracking` | **Date**: 2026-07-05 | **Spec**: `specs/001-host-tracking/spec.md`

**Input**: Feature specification from `specs/001-host-tracking/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add host tracking to room creation: the creator is automatically designated as
host (stored via `hostId` on Room and `isHost` flag on Participant). Display a
"Host" label next to the host's name on all screens where player names appear
(lobby, game screen, scoreboard). Requires backend type/ logic changes and
frontend type/UI changes — no new dependencies, no new endpoints.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+ (backend), modern browsers (frontend)

**Primary Dependencies**: Express + Zod (backend), React 18 + React Router 6 + Vite (frontend)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts`

**Testing**: Vitest — existing tests at `backend/src/services/roomStore.test.ts` and `backend/src/api/schemas.test.ts`; frontend tests at `frontend/src/services/api.test.ts`

**Target Platform**: Node.js 18+ (backend), modern browsers (frontend via Vite)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: None specific — no measurable performance impact from this feature

**Constraints**: No WebSockets, no databases, no auth, no new dependencies. Match existing code patterns (including in-place mutation in `joinRoom`).

**Scale/Scope**: Single feature — host label and tracking only. Host transfer/leaving explicitly deferred per spec assumptions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Deterministic Game Logic | ✅ Pass | Host is always the creator — deterministic, no randomness |
| II. RESTful Synchronization | ✅ Pass | Host info returned via existing HTTP polling; no push needed |
| III. Validation Rigor | ✅ Pass | Player name validation already exists via Zod; host assignment is internal state |
| IV. Brownfield Enhancement | ✅ Pass | Extend existing types/interfaces; no new files, no new dependencies |
| V. State Isolation & Immutability | ✅ Pass | Room isolation preserved; follow existing mutation patterns (in-place push in joinRoom) |

**No violations** — Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-host-tracking/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts           # Add isHost to Participant, hostId to Room
│   ├── services/
│   │   └── roomStore.ts      # Set isHost=true in createRoom, hostId on Room
│   ├── api/
│   │   └── rooms.ts          # No change needed (participant spread propagates new fields)
│   └── tests/
│       ├── roomStore.test.ts # Update test assertions to include isHost/hostId
│       └── schemas.test.ts   # No changes needed

frontend/
├── src/
│   ├── services/
│   │   └── api.ts            # Add isHost to Participant interface
│   ├── pages/
│   │   ├── LobbyPage.tsx     # Add "Host" badge next to host's name
│   │   └── GamePage.tsx      # Add "Host" badge in player info sidebar
│   ├── components/
│   │   ├── Scoreboard.tsx    # Update to show participant names + host label
│   │   └── ...               # No changes to other components
│   └── state/
│       └── roomStore.ts      # No change needed (Participant type flows through)
```

**Structure Decision**: Web application layout (Option 2). Backend under
`backend/`, frontend under `frontend/`. This follows the existing project
structure.

## Complexity Tracking

> Not required — all Constitution Check gates pass with no violations.
