# Implementation Plan: Round Results and Game Restart

**Branch**: `004-round-results-restart` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-round-results-restart/spec.md`

## Summary

After a round ends, the room enters a `results` state where all participants can see the secret word, final scores, and full guess history. The host can then restart the game, returning everyone to the lobby while preserving the player list and host, and clearing all round-specific state.

This feature extends the existing Express backend and React frontend with two new state transitions (`playing -> results`, `results -> lobby`), two new API endpoints (`end`, `restart`), and conditional UI rendering within the existing `/game` route.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+, ES Modules)

**Primary Dependencies**: Express 4.x (backend), React 18 + React Router 6 + Vite (frontend)

**Storage**: In-memory only (`Map<string, Room>` in `roomStore.ts`)

**Testing**: Vitest (backend), browser-based validation with two tabs (frontend)

**Target Platform**: Local web server + browser

**Project Type**: Web application (backend/frontend split)

**Performance Goals**: HTTP polling ~2s interval, sub-200ms API response times

**Constraints**: No WebSockets, no databases, no authentication, no persistent storage

**Scale/Scope**: Single-room gameplay, one round per game, up to ~10 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: TypeScript-First & Strict Typing
- **Status**: PASS. All new code will use strict types; `RoomStatus` expands to `"lobby" | "playing" | "results"`.

### Principle II: In-Memory State Discipline
- **Status**: PASS. No new storage layers; state remains in `roomStore.ts` `Map`.

### Principle III: HTTP Polling Only
- **Status**: PASS. Results state sync uses existing ~2s polling on `GET /rooms/:code`.

### Principle IV: Extend the Starter
- **Status**: PASS. Changes are additive: two new endpoints, one new status value, conditional UI in `GamePage`.

### Principle V: Phased Implementation with Validation Gates
- **Status**: PASS. Feature 004 is the final phase in the planned sequence (001 → 002 → 003 → 004).

### Game Rule & Scope Constraints Check
- One round only: PASS. Restart returns to lobby; no automatic round progression.
- Word list fixed: PASS. No changes to word list.
- Host-only actions: PASS. `end` and `restart` restricted to host.
- Score rules unchanged: PASS. 100 for first correct, 0 otherwise.
- Drawer sees word, guessers do not (during play): PASS. In `results`, word revealed to all.
- On restart, round state cleared, players/host preserved: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/004-round-results-restart/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # Add "results" to RoomStatus; update RoomSnapshot
│   ├── services/
│   │   └── roomStore.ts     # Add endRound(), restartGame(); update submitGuess() auto-end
│   └── api/
│       ├── rooms.ts         # Add POST /:code/end and POST /:code/restart routes
│       ├── schemas.ts       # Add endRoundSchema, restartGameSchema
│       └── router.ts        # Unchanged
│
frontend/
├── src/
│   ├── services/
│   │   └── api.ts           # Add api.endRound(), api.restartGame(); update RoomSnapshot type
│   ├── pages/
│   │   └── GamePage.tsx     # Add results UI branch; add End Round button (host only)
│   └── components/
│       └── ResultPanel.tsx  # Optionally enhance for results state display
│
```

**Structure Decision**: Web application split (backend + frontend). All changes are localized to the files listed above.

## File-Level Changes

| File | Change | Rationale |
|------|--------|-----------|
| `backend/src/models/game.ts` | Extend `RoomStatus` union with `"results"` | New game phase required by spec |
| `backend/src/services/roomStore.ts` | Add `endRound()`, `restartGame()`, update `submitGuess()` to auto-transition | Core business logic for round lifecycle |
| `backend/src/api/rooms.ts` | Wire `POST /:code/end` and `POST /:code/restart` | Expose new operations to clients |
| `backend/src/api/schemas.ts` | Add Zod schemas for `end` and `restart` payloads | Request validation consistency |
| `frontend/src/services/api.ts` | Add `endRound()` and `restartGame()` helpers; update `RoomSnapshot` type | Frontend access to new endpoints |
| `frontend/src/pages/GamePage.tsx` | Render results UI when `status === "results"`; conditionally show action buttons | UX for round end and restart |
| `frontend/src/components/ResultPanel.tsx` | Potentially enhance styling for results prominence | Minor UX polish |

## Complexity Tracking

No constitution violations identified.
