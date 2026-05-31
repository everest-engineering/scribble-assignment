# Implementation Plan: Result, Restart & Final Validation

**Branch**: `assignment-Anusha` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart-validation/spec.md`

## Summary

Add a `"finished"` room status representing the post-round result state. The host ends
an active round, transitioning the room to `"finished"` — at which point every participant
sees the revealed word, final scores, and complete guess history via the existing polling
mechanism. The host can restart from the result screen, returning all players to lobby
status with round state cleared. Non-host players cannot trigger either transition.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+ backend, React 18 frontend)

**Primary Dependencies**: Express 4.x, React 18, Vite 5, Zod 3.x, React Router 6, Vitest

**Storage**: In-memory `Map<string, Room>` at module scope — `backend/src/services/roomStore.ts`

**Testing**: Vitest; existing unit tests at `backend/src/services/roomStore.test.ts`,
`backend/src/api/schemas.test.ts`, and `frontend/src/services/api.test.ts`

**Target Platform**: Web browser (React SPA) + Node.js Express server

**Project Type**: Web application (Option 2 — `frontend/` + `backend/`)

**Performance Goals**: State changes propagate within one polling cycle (≤3 s, matching
existing 2 s interval established in spec 003)

**Constraints**: REST over HTTP only (no WebSockets, SSE, or GraphQL); in-memory store
only; no new npm packages required; existing polling interval is sufficient

**Scale/Scope**: Single game room, 2–10 participants

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Status |
|-----------|-----------|--------|
| I. Spec-First | Spec exists at `specs/004-result-restart-validation/spec.md` with acceptance scenarios, FRs, and success criteria | ✅ PASS |
| II. Brownfield Awareness | All existing routes, types, and store functions inspected before designing changes. Every change is additive: new `"finished"` value on existing union type, two new endpoints, new optional fields on existing `RoomSnapshot`. No existing API contract modified. | ✅ PASS |
| III. Incremental Delivery | Tasks will decompose by priority: US1 P1 (end round → result view), US2 P1 (restart → lobby), US3 P2 (host-only restart button). Each slice is independently verifiable. | ✅ PASS |
| IV. Critical AI Review | Not yet violatable at plan stage; author must review all generated code before staging | ✅ PENDING |
| V. Granular Commits | Each task committed separately; commit messages describe intent, not mechanics | ✅ PENDING |

**Post-Design Re-check**: No violations. Type addition and new endpoints are purely
additive. Behaviour for `"lobby"` and `"in-progress"` states is unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md                         # This file
├── research.md                     # Phase 0 output
├── data-model.md                   # Phase 1 output
├── quickstart.md                   # Phase 1 output
├── contracts/
│   ├── end-round.md                # POST /rooms/:code/end-round
│   ├── restart.md                  # POST /rooms/:code/restart
│   └── room-snapshot-finished.md   # GET /rooms/:code when finished
└── tasks.md                        # Phase 2 output (/speckit-tasks)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts             # ADD "finished" to RoomStatus; ADD RoundResult type;
│   │                           # UPDATE RoomSnapshot with optional result field
│   ├── services/
│   │   └── roomStore.ts        # ADD endRound(), restartGame();
│   │                           # UPDATE toRoomSnapshot() for "finished" state
│   └── api/
│       ├── rooms.ts            # ADD POST /rooms/:code/end-round
│       │                       #     POST /rooms/:code/restart
│       └── schemas.ts          # ADD EndRoundBody, RestartBody (reuse existing pattern)

frontend/
├── src/
│   ├── services/
│   │   └── api.ts              # ADD endRound(), restartGame() fetch calls
│   ├── state/
│   │   └── roomStore.ts        # ADD endRound(), restartGame() methods
│   ├── pages/
│   │   ├── GamePage.tsx        # ADD "End Round" button (host-only);
│   │   │                       # ADD room-status poll; navigate → /result on "finished"
│   │   └── ResultPage.tsx      # NEW — reveals word, shows scores + guesses;
│   │                           #   "Restart" button for host only;
│   │                           #   polls → /lobby on status "lobby"
│   └── routes/
│       └── index.tsx           # ADD /result → ResultPage
```

**Structure Decision**: Option 2 (web application) — matches existing `frontend/` +
`backend/` layout. No new directories required beyond `contracts/` docs folder.

## Complexity Tracking

> No constitution violations found — this section is intentionally empty.
