# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Extend the existing Scribble starter so that the room creator is automatically
marked as host, player names are validated and trimmed on both frontend and
backend, unknown room codes are rejected with a 404, the Lobby refreshes via
silent `setTimeout`-after-response polling (replacing the manual Refresh button),
the Start Game button is host-only and gated on ≥ 2 participants, and room
isolation is verified as a correctness guarantee.

All changes are brownfield extensions to the existing TypeScript
frontend (Vite + React) and backend (Node.js + Express) with no new top-level
npm dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) — frontend and backend

**Primary Dependencies**: Vite + React (frontend); Node.js + Express + Zod (backend)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts`

**Testing**: No new test framework introduced; existing `*.test.ts` files use
`node:test` (backend) and Vitest (frontend)

**Target Platform**: Local development — backend on `localhost:3001`, frontend
on `localhost:5173`

**Project Type**: Web application (frontend + REST backend)

**Performance Goals**: Lobby participant list reflects a new joiner within 4 s
(one 2 s poll cycle + response time)

**Constraints**: No new npm dependencies; no WebSockets; no persistence; no auth

**Scale/Scope**: Local multi-tab test; 2–4 concurrent participants per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield Discipline | ✅ Pass | All relevant files read before planning; no rewrites |
| II. Spec-Driven Development | ✅ Pass | Constitution → spec → clarify → plan order followed |
| III. Deterministic Game Rules | ✅ Pass | Not exercised in Scenario 1 |
| IV. AI-Assisted, Human-Accountable | ✅ Pass | Plan under developer review before commit |
| V. Validate Each Slice | ✅ Pass | Two-tab acceptance tests defined per story |
| Coding Standards — No new deps | ✅ Pass | All changes use existing Zod, React, Express |
| Coding Standards — TypeScript strict | ✅ Pass | `isHost` typed throughout; no `any` introduced |
| Coding Standards — Input validation | ✅ Pass | Trim + empty-reject on both frontend and backend |

Post-design re-check: all gates still pass (see data-model.md for type changes).

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (affected files)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts              # Add isHost to Participant; extend RoomStatus
    ├── api/
    │   ├── schemas.ts           # Tighten playerName: required, trim, non-empty
    │   └── rooms.ts             # Pass isHost to createParticipant calls
    └── services/
        └── roomStore.ts         # createParticipant(name, isHost); createRoom→true, joinRoom→false

frontend/
└── src/
    ├── services/
    │   └── api.ts               # Add isHost to Participant interface
    ├── state/
    │   └── roomStore.ts         # Add pollRoom() (silent fetch, no isLoading)
    └── pages/
        ├── CreateRoomPage.tsx   # Client-side trim + empty check before API call
        ├── JoinRoomPage.tsx     # Client-side trim + empty check; trim room code; 404 message
        └── LobbyPage.tsx        # Replace Refresh button with setTimeout polling;
                                 # host indicator; host-only Start Game; ≥2 gate
```

**Structure Decision**: Web application (Option 2). No new files or directories
created at the repository root; all changes are extensions to existing files in
`backend/src/` and `frontend/src/`.

## Complexity Tracking

No constitution violations. This section is intentionally empty.
