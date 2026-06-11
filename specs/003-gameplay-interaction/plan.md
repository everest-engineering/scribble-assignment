# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Enable the core gameplay loop: drawer draws strokes that are synced to all guessers via a dedicated canvas polling endpoint; guessers submit guesses that are validated server-side; correct guesses earn 100 points; round ends when all guessers guess correctly or host ends it early.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+

**Primary Dependencies**: Express 4 (backend), React 18 + React Router 6 (frontend), Zod 3 (validation)

**Storage**: In-memory (RoomStore Map + new canvas state per room). No database.

**Testing**: Vitest (backend unit tests), manual two-tab (frontend)

**Target Platform**: Web (Chrome/Firefox/Safari — latest 2 major versions)

**Project Type**: Web application (frontend + REST backend)

**Performance Goals**: Canvas poll completes within 500ms; guess feedback within 2s; canvas stroke appears on guesser screen within 3s

**Constraints**: No real-time protocols (polling only), no new state/routing libraries, all data in-memory

**Scale/Scope**: Single room, max 8 participants, single round

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript-First | PASS | All new types/interfaces will be fully typed with no `any` |
| II. Incremental Brownfield | PASS | Extends existing `Room`, `GamePage`, `roomStore`, adds new endpoints |
| III. Deterministic Game Logic | PASS (see below) | Scoring uses fixed 100-point formula; no randomness introduced |
| IV. Polling-First | PASS | Canvas state delivered via separate polling endpoint; guess results via room poll |
| V. Critical Self-Review | PASS | Two-tab validation of drawing sync and guess feedback |

**Deterministic rules to enforce**:
- Scoring: exactly 100 points per correct guess, no speed bonuses
- Round end: deterministic — when all guessers have guessed correctly or host ends
- Guess comparison: exact case-insensitive match after trimming

## GATE Evaluation

**Result: PASS** — No constitution violations. Existing patterns (polling, in-memory storage, typed models) are followed. New canvas state storage is in-memory per room, consistent with existing Room model.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — design decisions
├── data-model.md        # Phase 1 — entity definitions
├── quickstart.md        # Phase 1 — validation guide
├── contracts/
│   └── api-v1.md        # API contract changes
└── tasks.md             # (/speckit.tasks output)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── router.ts        # NEW: draw, guess, end-round routes
│   │   ├── rooms.ts         # Minor: expose scores in snapshot
│   │   └── schemas.ts       # NEW: draw, guess, end-round schemas
│   ├── models/
│   │   └── game.ts          # NEW: CanvasState, Stroke, Guess, Score types
│   ├── services/
│   │   └── roomStore.ts     # MAJOR: canvas store, guess logic, scoring, round end
│   └── seed/
│       └── starterData.ts   # No change

frontend/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx        # MAJOR: submit strokes to server, render remote strokes
│   │   ├── GuessForm.tsx     # MAJOR: submit guess, display feedback, error handling
│   │   ├── ResultPanel.tsx   # MAJOR: show guess log
│   │   ├── Scoreboard.tsx    # MAJOR: show participant scores
│   │   └── WordDisplay.tsx   # No change
│   ├── pages/
│   │   └── GamePage.tsx      # MAJOR: canvas polling, end-round button, role-based guess form
│   ├── services/
│   │   └── api.ts            # NEW: submitDraw, clearCanvas, submitGuess, fetchCanvas, endRound
│   ├── state/
│   │   └── roomStore.ts      # MAJOR: add canvas polling, round state
│   └── styles/
│       └── app.css           # Add guess-log, scoreboard, error states

tests/
├── backend/
│   └── roomStore.test.ts     # NEW: guess validation, scoring, round-end logic
└── frontend/
    └── (manual two-tab)
```

**Structure Decision**: Option 2 (Web application) — existing frontend/backend split. No restructuring needed.

## Complexity Tracking

*No constitution violations to justify; Complexity Tracking left empty.*

## Phase 0: Research & Design Decisions

See [research.md](research.md) for detailed findings.

**Key decisions**:
1. **Canvas stroke format**: Array of `{color, points: {x,y}[]}` segments; sent as JSON via POST, stored in-memory per room
2. **Canvas endpoints**: `POST /rooms/:code/draw` (append stroke), `DELETE /rooms/:code/draw` (clear), `GET /rooms/:code/canvas` (fetch all strokes)
3. **Guess endpoint**: `POST /rooms/:code/guess` with `{participantId, text}`; returns `{correct, points, alreadyGuessed}`
4. **Room status transition**: `playing` → `finished` on round end; results embed in snapshot
5. **Score storage**: Map<participantId, number> on Room; scores reset on room creation
6. **Canvas polling**: Separate ~2s interval independent of room state polling
7. **Guess log**: Array of `{participantId, text, correct}` on Room; included in snapshot when `status === "playing"` or `status === "finished"`

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](data-model.md) — new entities: `CanvasState`, `Stroke`, `Guess`, `Score`.

### API Contracts

See [contracts/api-v1.md](contracts/api-v1.md) — new endpoints: draw, clear, guess, canvas fetch, end round. Existing room snapshot extended with scores and guess log.

### Quickstart

See [quickstart.md](quickstart.md) — validation scenarios for two-tab testing of drawing sync, guessing, scoring, and round end.
