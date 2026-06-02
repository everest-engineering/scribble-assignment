# Implementation Plan: Scribble Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer-flow/spec.md`

## Summary

Extend the existing game-start infrastructure to assign the host as the round-1 drawer and expose the secret word (`STARTER_WORDS[0]` = "rocket") exclusively to that drawer's client. The backend `startRoom()` and `toRoomSnapshot()` functions require targeted changes; the shared Zod schema gains two nullable fields (`drawerId`, `currentWord`); and the frontend `LobbyPage` and `GamePage` are updated to present drawer identity and the word. All work follows the Red-Green-Refactor TDD cycle.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict); Node.js 24.13 (backend); React 18.3 (frontend)

**Primary Dependencies**:
- Backend: Express 4.21, Zod 3.23, tsx (dev), Vitest 3.1
- Frontend: React 18, React Router DOM 6.30, Vite 5.4, Vitest 3.1 (jsdom), Zod (shared/)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` — no persistence (Constitution Principle V)

**Testing**: Vitest — backend (node env), frontend (jsdom env); ≥ 80% line/branch coverage gate; TDD required

**Target Platform**: Browser (Chrome/Firefox/Safari) + Node.js 24 server; single-host deployment

**Project Type**: Web application (frontend + backend monorepo)

**Performance Goals**: Secret word visible to drawer within 2 seconds of game start (SC-002); all players see drawer's name within 3 seconds (SC-005)

**Constraints**: Bundle ≤ 150 KB gzipped (Constitution Principle V); no persistence; `strict: true` TypeScript

**Scale/Scope**: Single-server, up to 4 players per room, in-memory only; ~8 modified source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | TypeScript strict mode | ✅ PASS | Both `backend/tsconfig.json` and `frontend/tsconfig.json` have `"strict": true`; new nullable fields typed as `string \| null` |
| 2 | Functional components & existing patterns | ✅ PASS | All pages are function components; new code follows existing hooks + store conventions |
| 3 | TDD (Vitest ≥ 80%) | ✅ PLANNED | All new `startRoom` and `toRoomSnapshot` behaviour gets failing tests before production code |
| 4 | Accessibility (WCAG 2.1 AA) | ✅ PLANNED | "Need at least 2 players" label is visible text (not tooltip-only); drawer identity announced via `aria-live` |
| 5 | No persistence introduced | ✅ PASS | All new state remains in-memory; no DB, localStorage, or file writes |
| 6 | Zod contracts present | ✅ PLANNED | `shared/schemas/room.ts` updated with `drawerId` and `currentWord` before any implementation |
| 7 | Error boundary coverage | ✅ PASS | `PageErrorBoundary` already wraps all pages; no new pages introduced |

**Post-design re-check**: No violations. The two new nullable fields on `RoomSnapshot` are additive — no breaking change to the existing Zod contract or API shape.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-contracts.md # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (modified files)

```text
shared/
└── schemas/
    └── room.ts          # Add drawerId: string|null, currentWord: string|null to Zod schema

backend/
└── src/
    ├── models/
    │   └── game.ts              # Add drawerId, currentWord to Room and RoomSnapshot interfaces
    ├── services/
    │   ├── roomStore.ts         # startRoom(): set drawerId + currentWord; add already_started guard
    │   │                        # toRoomSnapshot(): filter currentWord by viewerParticipantId
    │   │                        # createRoom(): initialize drawerId: null, currentWord: null
    │   └── roomStore.test.ts    # TDD tests: drawer assignment, word visibility, already_started
    └── api/
        └── rooms.ts             # POST /:code/start: pass participantId to toRoomSnapshot()

frontend/
└── src/
    ├── pages/
    │   ├── LobbyPage.tsx        # Add "Need at least 2 players" label to disabled Start button
    │   └── GamePage.tsx         # Show drawer name (all players); show word only to drawer
    └── services/
        └── api.ts               # (No change needed — RoomSnapshot type inferred from shared schema)
```

**Structure Decision**: Web application (Option 2) — existing `backend/` and `frontend/` monorepo with `shared/` for Zod contracts. No new directories required.

## Complexity Tracking

No Constitution violations. No entries required.
