# Implementation Plan: Round Drawing, Guessing, and Scoring

**Branch**: `003-draw-guess-score` | **Date**: 2026-06-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-draw-guess-score/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Extend the active gameplay feature to support interactive canvas drawing, guess submission with validation, shared guess history via polling, and real-time scoring. The drawer draws freehand strokes on a normalized canvas and can clear it. Guessers submit text guesses that are trimmed and compared case-insensitively to the secret word. Correct guesses award 100 points; incorrect guesses award 0. All round state (scores, guess history, canvas strokes) is synchronized to every player via the existing ~2-second room snapshot polling. When the drawer leaves mid-round, all round state is cleared and the room returns to lobby.

## Technical Context

**Language/Version**: Node.js 22 (from `.nvmrc`), TypeScript 5.6

**Primary Dependencies**: Express 4.21, React 18.3, React Router 6.30, Vite 5.4, Zod 3.23

**Storage**: In-memory only (no database; `Map<string, Room>` in `backend/src/services/roomStore.ts`)

**Testing**: vitest 3.1 (backend and frontend)

**Target Platform**: Modern web browsers (ES2022+)

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Canvas stroke render < 500ms; guess history sync < 3s; scoreboard update < 3s; room poll < 500ms

**Constraints**: HTTP polling only (no WebSockets/SSE); in-memory state must be explicitly cleaned up; no authentication/session persistence; canvas coordinates normalized to 0–1000 logical units; secret word must never leak to guessers

**Scale/Scope**: Single-server deployment; concurrent rooms bounded by memory; expected < 100 concurrent rooms for evaluation; stroke data kept minimal (array of point arrays)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Evaluation | Notes |
|-----------|------------|-------|
| I. TypeScript-First & Strict Typing | Pass | All changes use strict types; Zod validates requests/responses; new models (GuessEntry, Stroke) are fully typed |
| II. In-Memory State Discipline | Pass | Room store remains a `Map`; round state additions (`scores`, `guessHistory`, `canvasStrokes`) are minimal and cleared on drawer leave/reset |
| III. HTTP Polling Only | Pass | Canvas, scores, and guess history all piggyback on existing `GET /rooms/:code` polling (~2s); no WebSockets introduced |
| IV. Extend the Starter | Pass | Edits confined to existing `game.ts`, `roomStore.ts`, `rooms.ts`, `schemas.ts`, `api.ts`, `roomStore.ts` (state), `GamePage.tsx`, `GuessForm.tsx`, `Scoreboard.tsx`, `ResultPanel.tsx`; new `Canvas.tsx` component only |
| V. Phased Implementation | Pass | This is the third feature group (Gameplay); Room Setup and Game Start are complete and validated |

**Post-Design Re-check**: Pass — all principles upheld by the design. No new dependencies, no real-time protocols, in-memory cleanup planned, strict typing preserved, changes scoped to existing files.

## Project Structure

### Documentation (this feature)

```text
specs/003-draw-guess-score/
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
│   │   ├── Canvas.tsx          (NEW)
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

**Structure Decision**: Option 2 — Web application with separate `backend/` and `frontend/` packages. This matches the existing monorepo layout. All feature work stays within the established directories. Only one new component (`Canvas.tsx`) is added; all other changes are edits to existing files.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations.
