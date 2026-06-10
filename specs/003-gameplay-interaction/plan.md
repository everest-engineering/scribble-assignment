# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Add core gameplay mechanics to an active round: a drawable HTML5 canvas for the drawer (with
clear action), a guess submission endpoint that trims/rejects empty inputs, compares
case-insensitively against the server-held secret word, awards 100 points for correct guesses
(0 for incorrect), stores a per-room guess log, and syncs scores + guess history to all players
via the existing room-state polling endpoint.

## Technical Context

**Language/Version**: TypeScript 5.6 — Node.js 22 (backend), Vite + React 18 (frontend)

**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, Context API (frontend)

**Storage**: In-memory `Map<string, Room>` — no persistence

**Testing**: Vitest (both backend and frontend)

**Target Platform**: localhost; modern browsers

**Project Type**: Web application (frontend + minimal REST backend)

**Performance Goals**: Canvas interactions feel instant; guess submission reflects within the
next polling cycle (≤ 3 seconds)

**Constraints**: No WebSockets, no DB, no auth; canvas does not sync to guessers; secret word
comparison is server-side only

**Scale/Scope**: Lab demo; 2–6 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-Driven Architecture | ✅ Pass | Canvas extracted to a `DrawingCanvas` component; `ResultPanel` upgraded in place; no monolithic views |
| II. Type Safety | ✅ Pass | `Guess` and `scores` added to shared models; no `any` |
| III. Test-First / 80% coverage | ✅ Pass | `submitGuess` store logic covered by unit tests before implementation |
| IV. Accessibility (WCAG 2.1 AA) | ✅ Pass | Canvas has `aria-label`; Clear button is keyboard-accessible; guess list uses semantic markup |
| V. Secure by Default | ✅ Pass | Guess comparison is server-side; `secretWord` never sent to guessers |
| Bundle ≤150 KB | ✅ Pass | HTML5 canvas — no new runtime dependencies |

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── checklists/
    └── requirements.md
```

### Source Code (affected files)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              ← add Guess interface; add scores + guesses to Room + RoomSnapshot
│   ├── api/
│   │   ├── rooms.ts             ← add POST /:code/guess route
│   │   └── schemas.ts           ← add submitGuessSchema (participantId, text with trim+min(1))
│   └── services/
│       ├── roomStore.ts         ← add submitGuess(); extend startGame() to init scores+guesses;
│       │                           extend toRoomSnapshot() to include scores + guesses
│       └── roomStore.test.ts    ← tests for submitGuess, score init, guess storage

frontend/
├── src/
│   ├── services/
│   │   └── api.ts               ← add Guess interface; extend RoomSnapshot with scores + guesses;
│   │                               add api.submitGuess()
│   ├── components/
│   │   ├── DrawingCanvas.tsx    ← NEW: HTML5 canvas with draw + clear, drawer-only
│   │   ├── GuessForm.tsx        ← wire up api.submitGuess(); client-side empty check
│   │   ├── Scoreboard.tsx       ← render scores from room snapshot
│   │   └── ResultPanel.tsx      ← render guess history from room snapshot
│   └── pages/
│       └── GamePage.tsx         ← swap canvas placeholder for DrawingCanvas; pass room to
│                                   Scoreboard and ResultPanel
```

**Structure Decision**: Web application layout — same `backend/` + `frontend/` structure as FG1
and FG2.
