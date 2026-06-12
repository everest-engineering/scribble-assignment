# Implementation Plan: Game Start — First Round Drawer & Secret Word

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Extend the existing Room Setup feature to support the transition from lobby to active gameplay. When the host starts the game with at least two players, the room status changes to `playing`, the host is designated as the drawer, and the first word from the fixed starter list (`rocket`) is selected as the secret word. The secret word is visible only to the drawer; guessers see an underscore placeholder. If the host/drawer leaves mid-round, the room immediately resets to `lobby` and clears all round state. All synchronization continues to use HTTP polling (~2s) on both the lobby and game screens.

## Technical Context

**Language/Version**: Node.js 22 (from `.nvmrc`), TypeScript 5.6

**Primary Dependencies**: Express 4.21, React 18.3, React Router 6.30, Vite 5.4, Zod 3.23

**Storage**: In-memory only (no database; `Map<string, Room>` in `backend/src/services/roomStore.ts`)

**Testing**: vitest 3.1 (backend and frontend)

**Target Platform**: Modern web browsers (ES2022+)

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Game start < 500ms; room poll < 500ms; drawer/word reveal < 1s

**Constraints**: HTTP polling only (no WebSockets/SSE); in-memory state must be explicitly cleaned up; no authentication/session persistence; secret word must never leak to guessers in API or UI

**Scale/Scope**: Single-server deployment; concurrent rooms bounded by memory; expected < 100 concurrent rooms for evaluation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Evaluation | Notes |
|-----------|------------|-------|
| I. TypeScript-First & Strict Typing | Pass | All changes use strict types; Zod validates requests/responses |
| II. In-Memory State Discipline | Pass | Room store remains a `Map`; round state is minimal (`drawerId`, `currentWord`) and cleared on host leave |
| III. HTTP Polling Only | Pass | `GamePage` adds `setInterval` + `fetch` (~2s); no WebSockets introduced |
| IV. Extend the Starter | Pass | Edits confined to existing `game.ts`, `roomStore.ts`, `rooms.ts`, `api.ts`, `roomStore.ts` (state), `LobbyPage.tsx`, `GamePage.tsx` |
| V. Phased Implementation | Pass | This is the second feature group (Game Start); Room Setup is complete and validated |

**Post-Design Re-check**: Pass — all principles upheld by the design. No new dependencies, no real-time protocols, in-memory cleanup planned, strict typing preserved, changes scoped to existing files.

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
│   ├── api/
│   │   ├── rooms.ts
│   │   ├── router.ts
│   │   ├── schemas.ts
│   │   └── schemas.test.ts
│   ├── models/
│   │   └── game.ts
│   ├── services/
│   │   ├── roomStore.ts
│   │   └── roomStore.test.ts
│   ├── seed/
│   │   └── starterData.ts
│   ├── app.ts
│   └── server.ts
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Card.tsx
│   │   ├── GuessForm.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ResultPanel.tsx
│   │   ├── RoomCodeBadge.tsx
│   │   └── Scoreboard.tsx
│   ├── pages/
│   │   ├── StartPage.tsx
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   ├── state/
│   │   └── roomStore.ts
│   ├── styles/
│   │   └── app.css
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

**Structure Decision**: Option 2 — Web application with separate `backend/` and `frontend/` packages. This matches the existing monorepo layout. All feature work stays within the established directories.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations.
