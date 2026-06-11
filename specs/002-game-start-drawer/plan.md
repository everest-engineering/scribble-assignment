# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

When a game transitions from lobby to "playing" status, the first round begins automatically. The host becomes the drawer (visible to all), a secret word is deterministically selected based on room code + round number, and the word is shown only to the drawer. Other participants see the drawer identity and word length. Round data is appended to the existing `GET /rooms/:code` endpoint with participant-aware filtering.

## Technical Context

**Language/Version**: TypeScript (backend Node.js, frontend React 18)

**Primary Dependencies**: Express + Zod (backend), React Router v6 + Vite (frontend)

**Storage**: In-memory only — extends existing `Map<string, Room>` with round data stored on the Room object

**Testing**: Vitest (backend), no frontend test framework yet

**Target Platform**: Browser (modern Chrome/Firefox/Safari) + Node.js server

**Project Type**: Web application (Express backend + React frontend, monorepo)

**Performance Goals**: Drawer identity propagated to all participants within 3 seconds (via existing 2s polling)

**Constraints**: Constitution strict boundaries — no WebSockets, no DB, no auth. HTTP polling only.

**Scale/Scope**: Lab-scale (2+ browser tabs, single server process)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. TypeScript First | ✅ PASS | Existing codebase fully typed; new code follows same pattern |
| II. Immutability & Purity | ✅ PASS | Room cloning already used; round data created immutably |
| III. Test-First (NON-NEGOTIABLE) | ✅ PASS | All new features require failing tests before implementation |
| IV. Validated REST API | ✅ PASS | Extend existing endpoint; Zod schemas for any new validation |
| V. Strict Boundaries | ✅ PASS | No WebSockets/DB/auth added; HTTP polling reused; in-memory only |

**Result**: PASS — all gates clear. No complexity justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
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
│   ├── models/
│   │   └── game.ts          # Add Round type, extend Room with rounds[]
│   ├── services/
│   │   └── roomStore.ts     # Add createRound(), getRound(), extend toRoomSnapshot for round data
│   ├── api/
│   │   ├── rooms.ts         # GET /:code returns round data (participant-aware)
│   │   └── schemas.ts       # No new schemas needed (extends existing endpoint)
│   └── seed/
│       └── starterData.ts   # Existing word list — no changes
├── tests/
│   └── services/
│       └── roomStore.test.ts # Tests for round creation, word selection, role assignment
│   └── api/
│       └── schemas.test.ts   # Existing — no new schemas

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx    # Already navigates to /game on "playing" — no changes needed
│   │   └── GamePage.tsx     # NEW: minimal game page showing role/word/word-length
│   ├── state/
│   │   └── roomStore.ts     # Extend RoomState with round fields
│   └── services/
│       └── api.ts           # Typed round data in RoomSnapshot
```

**Structure Decision**: Web application (backend + frontend) — follows existing monorepo structure exactly. No structural changes needed.

## Complexity Tracking

No violations — all gates pass cleanly. Complexity tracking not required.
