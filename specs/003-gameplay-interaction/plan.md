# Implementation Plan: Gameplay Interaction - Drawing, Guessing & Scoring

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-11 | **Spec**: [spec.md](../003-gameplay-interaction/spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Implement canvas drawing (strokes + clear) for the drawer, guess submission with case-insensitive comparison for guessers, score tracking (100 pts per correct guess), and round-end detection when all guessers have guessed correctly. All game state (canvas, guesses, scores) syncs to all players via the existing ~2s polling mechanism.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 22+ backend with tsx, React 18 frontend with Vite)

**Primary Dependencies**: Express 4.x + Zod 3.x (backend), React 18 + React Router v6 (frontend). No additional canvas/drawing libraries — use native HTML Canvas API.

**Storage**: In-memory only (no database, no persistent storage — per Constitution III). Canvas actions, guesses, and scores stored on the Room object.

**Testing**: Vitest 3.x (both backend and frontend)

**Target Platform**: Web browser (Chromium/Firefox/Safari — modern evergreen)

**Project Type**: Web application (Express REST API backend + React SPA frontend)

**Performance Goals**: ~2s polling interval for game state sync; strokes stored as arrays of point coordinates (lightweight); guess history bounded by number of players per round (max ~10 entries per round).

**Constraints**: No WebSockets or real-time push (Constitution II); no databases (Constitution III); no authentication (project scope); canvas rendering must use native HTML Canvas API (no external drawing library per project conventions).

**Scale/Scope**: Small multiplayer lab game (1 room ~ 2-10 players, single-round focus for this feature)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Rationale |
|-----------|--------|-----------|
| **I. TypeScript-First** | ✅ PASS | All new code fully typed; define interfaces for CanvasAction, Guess, GuessEntry, Score |
| **II. RESTful HTTP Polling** | ✅ PASS | Canvas state, guesses, and scores included in existing polling response (`GET /rooms/:code`). New endpoints (`POST canvas`, `POST guess`) are standard request-response. |
| **III. In-Memory State Only** | ✅ PASS | Canvas actions, guesses, and scores stored in-memory on the Room object. Cleared when round ends. |
| **IV. Deterministic Game Logic** | ✅ PASS | Guess comparison is deterministic (trim + case-insensitive equals). Scoring is deterministic (100 for correct, 0 for incorrect, reject duplicates). |
| **V. Incremental Implementation** | ✅ PASS | Feature follows Spec Kit phases; scope limited to drawing, guessing, scoring within an active round. No round rotation, timers, or word packs. |
| **Out-of-Scope Boundaries** | ✅ PASS | No WebSockets, DB, auth, deployment, drawer rotation, multiple rounds, timers, word packs, spectator, moderation, or unrelated refactors. |

**Verdict**: All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts               # Add CanvasAction, GuessEntry, ScoreMap types; extend Room with canvas/guesses/scores
│   ├── services/
│   │   ├── roomStore.ts          # Add canvas management, guess submission, scoring, round-end detection
│   │   └── roomStore.test.ts     # Tests for new service functions
│   ├── api/
│   │   ├── rooms.ts              # Add POST canvas, POST guess routes; update GET to include new state
│   │   ├── schemas.ts            # Add canvas action schema, guess submission schema
│   │   └── schemas.test.ts       # Tests for new schemas
│   └── seed/
│       └── starterData.ts        # Unchanged

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx          # Add canvas rendering, wire GuessForm, wire Scoreboard, wire ResultPanel
│   ├── components/
│   │   ├── DrawingCanvas.tsx     # NEW: HTML5 canvas with mouse/touch drawing, clear button
│   │   ├── GuessForm.tsx         # Wire to API (submit guess, show result feedback)
│   │   ├── Scoreboard.tsx        # Wire to display real scores from room state
│   │   └── ResultPanel.tsx       # Wire to display guess history from room state
│   ├── services/
│   │   ├── api.ts                # Add submitCanvasAction(), submitGuess(); update types
│   │   └── api.test.ts           # Tests for new API methods
│   └── state/
│       └── roomStore.ts          # Add canvasActions, guessHistory, scores to RoomState
```

**Structure Decision**: Web application (Option 2) — already established. New files added within the existing layout.

## Complexity Tracking

Not needed — all Constitution gates pass with no violations.
