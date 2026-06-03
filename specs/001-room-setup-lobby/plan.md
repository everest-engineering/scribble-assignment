# Implementation Plan: Room Setup & Lobby Navigation

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Complete the Scribble Room Setup & Lobby Navigation feature by wiring up the existing page scaffolds (`CreateRoomPage`, `JoinRoomPage`, `LobbyPage`) with correct backend behaviour: host tracking, max-player enforcement, a start-game endpoint, ~2s polling with auto-navigation, inline loading/error states, shared Zod contracts, and React error boundaries. All implementation follows TDD (Red-Green-Refactor).

## Technical Context

**Language/Version**: TypeScript 5.6 (strict); Node.js 24.13 (backend); React 18.3 (frontend)

**Primary Dependencies**:
- Backend: Express 4.21, Zod 3.23, tsx (dev), Vitest 3.1
- Frontend: React 18, React Router DOM 6.30, Vite 5.4, Vitest 3.1 (jsdom), Zod (to be added from `shared/` — already a backend dep)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` — no persistence (constitution Principle V)

**Testing**: Vitest — backend (node env), frontend (jsdom env); ≥ 80% line/branch coverage gate; TDD required

**Target Platform**: Browser (Chrome/Firefox/Safari) + Node.js 24 server; single-host deployment

**Project Type**: Web application (frontend + backend monorepo)

**Performance Goals**: Room creation and join in < 5s (SC-001, SC-002); lobby state within 3s of join (SC-003)

**Constraints**: Bundle ≤ 150 KB gzipped (constitution Principle V); no persistence; `strict: true` TypeScript

**Scale/Scope**: Single-server, up to 4 players per room, in-memory only; ~10 new/modified source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | TypeScript strict mode | ✅ PASS | `backend/tsconfig.json` has `"strict": true`; frontend follows the same |
| 2 | Functional components & existing patterns | ✅ PASS | All pages are function components; new code follows existing conventions |
| 3 | TDD (Vitest ≥ 80%) | ✅ PLANNED | Tests written before production code per Red-Green-Refactor |
| 4 | Accessibility (WCAG 2.1 AA) | ✅ PLANNED | `aria-label` on spinner; `aria-live` on participant list; logical tab order |
| 5 | No persistence introduced | ✅ PASS | All state remains in-memory; no DB, localStorage, or file writes |
| 6 | Zod contracts present | ✅ PLANNED | `shared/schemas/room.ts` defines all wire types before implementation |
| 7 | Error boundary coverage | ✅ PLANNED | `PageErrorBoundary` wraps `CreateRoomPage`, `JoinRoomPage`, `LobbyPage` |

**Post-design re-check**: No violations introduced. The `shared/` package is a plain TypeScript directory resolved via path aliases — no new runtime dependency or persistence mechanism.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── api-contracts.md # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
shared/
└── schemas/
    ├── room.ts          # Zod schemas + inferred types (single source of truth)
    └── index.ts         # Re-exports

backend/
├── src/
│   ├── models/
│   │   └── game.ts              # Add hostId, extend RoomStatus to include "in-progress"
│   ├── services/
│   │   ├── roomStore.ts         # Max-player enforcement, startRoom(), fix validation
│   │   └── roomStore.test.ts    # TDD tests for all store mutations
│   └── api/
│       ├── schemas.ts           # Tighten playerName/roomCode Zod schemas
│       ├── rooms.ts             # Add POST /:code/start handler
│       └── schemas.test.ts      # Tests for schema validation
└── tsconfig.json                # Add path alias for shared/

frontend/
├── src/
│   ├── components/
│   │   └── PageErrorBoundary.tsx    # React error boundary (class component)
│   ├── pages/
│   │   ├── CreateRoomPage.tsx       # Loading state, form validation, error boundary
│   │   ├── JoinRoomPage.tsx         # Loading state, form validation, error boundary
│   │   └── LobbyPage.tsx            # Polling, auto-navigate, host-only Start Game
│   ├── services/
│   │   └── api.ts                   # Fix URL bug, add Zod parse, import from shared/
│   └── state/
│       └── roomStore.ts             # Add startGame(), silent fetchRoom polling
├── vite.config.ts                   # Add resolve alias for shared/
└── tsconfig.json                    # Add path alias for shared/
```

**Structure Decision**: Web application (Option 2) — existing `backend/` and `frontend/` directories. Added `shared/` at repo root for cross-package Zod schemas per constitution Principle VI.

## Complexity Tracking

No constitution violations. No entries required.
