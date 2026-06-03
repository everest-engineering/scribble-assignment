# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart-flow` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-result-restart-flow/spec.md`

## Summary

Adds a post-round result state to the Scribble game. A round ends either automatically (first correct guess) or manually via a host "End Round" button. Both paths transition the room to a new `"ended"` status and expose `revealedWord` to all participants. All clients automatically navigate to a new `ResultPage` at `/result` via the existing 2-second poll. From the result screen, the host can restart the game, resetting the room to `"lobby"` with participants preserved and all round data cleared (scores reset to zero).

See [research.md](./research.md) for all architectural decisions, including the routing choice and race-condition analysis.

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend), Node.js 18+

**Primary Dependencies**: Express (backend router), Zod (request validation), React 18 + React Router v6 (frontend SPA), Vitest (unit tests)

**Storage**: In-memory `Map<string, Room>` on backend — no persistence

**Testing**: Vitest — backend service unit tests; frontend component/api unit tests

**Target Platform**: Dev server — backend port 3001, frontend port 5173

**Project Type**: Web application (Express REST API + React SPA)

**Performance Goals**: All participants see any status transition within ≤2 s (one poll cycle)

**Constraints**: No WebSockets; HTTP polling only; no database; no auth; `setInterval` MUST be cleared on unmount

**Scale/Scope**: In-memory single-process; small room sizes (2–10 players)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                  | Status  | Notes                                                                                                           |
| ------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------- |
| I. TypeScript-First                        | ✅ Pass | All new code in TypeScript; no `any`; new types explicitly declared                                             |
| II. In-Memory State Only                   | ✅ Pass | `revealedWord` lives in the existing in-memory `Map<string, Room>`; no storage added                            |
| III. HTTP Polling — No Real-Time Protocols | ✅ Pass | Two new POST endpoints; status transitions propagate via existing 2-second poll; no push protocols              |
| IV. Validate at Every System Boundary      | ✅ Pass | `endRoundSchema` + `restartRoomSchema` with Zod; 400/403/409 for all invalid inputs; UI does not crash on error |
| V. Minimal Footprint — No Auth, YAGNI      | ✅ Pass | Two new service functions, two new routes, one new page — all required by current user stories                  |

**Post-design re-check**: ✅ Pass — `revealedWord` field and `"ended"` status add no third-party dependencies; host identity via `room.hostId` unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts              # + "ended" in RoomStatus; + revealedWord?: string on Room and RoomSnapshot
    ├── services/
    │   └── roomStore.ts         # + endRound(); + restartRoom(); modified submitGuess(); modified toRoomSnapshot()
    └── api/
        ├── schemas.ts           # + endRoundSchema; + restartRoomSchema
        └── rooms.ts             # + POST /:code/end; + POST /:code/restart

frontend/
└── src/
    ├── pages/
    │   ├── GamePage.tsx         # + "End Round" button (host-only); + navigate to /result on status "ended"
    │   └── ResultPage.tsx       # NEW — result screen: word reveal, Scoreboard, ResultPanel, "Restart Game" (host)
    ├── routes/
    │   └── index.tsx            # + /result route → <ResultPage />
    ├── services/
    │   └── api.ts               # + "ended" in RoomStatus; + revealedWord; + endRound(); + restartRoom()
    └── styles/
        └── app.css              # + result page layout styles
```

**Structure Decision**: Web application (Option 2 — backend + frontend). All changes are additive within the existing directory structure. No new top-level directories.
