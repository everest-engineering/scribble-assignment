# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-result-restart-validation/spec.md`

## Summary

When a correct guess is submitted, automatically transition the room to `"completed"` status and
reveal the secret word to all players. All connected clients (polling every 2s) detect the state
change and navigate to a new `ResultsPage` that shows the correct word, full guess history, and
per-round + cumulative scores. The host's Restart button calls a new `POST /rooms/:code/restart`
endpoint that returns the room to `"lobby"` status with players and cumulative scores preserved
and all round state cleared; all clients detect the lobby status and navigate to `/lobby`.

## Technical Context

**Language/Version**: TypeScript 5.6 — Node.js 22 (backend), Vite + React 18 (frontend)

**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, Context API (frontend)

**Storage**: In-memory `Map<string, Room>` — no persistence

**Testing**: Vitest (both backend and frontend)

**Target Platform**: localhost; modern browsers

**Project Type**: Web application (frontend + minimal REST backend)

**Performance Goals**: Results screen visible to all players within the next polling cycle after
round end (≤ 3 seconds); restart transition completes within 2 seconds (SC-003)

**Constraints**: No WebSockets, no DB, no auth; polling-based sync only; timer-driven round end
is out of scope (only guess-triggered end is implemented); no host-promotion on disconnect

**Scale/Scope**: Lab demo; 2–6 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-Driven Architecture | ✅ Pass | `ResultsPage` is a self-contained page component; `GuessList`, `RoundScoreboard` extracted as sub-components |
| II. Type Safety | ✅ Pass | `roundScores` and `cumulativeScores` added to shared models; `RoomStatus "completed"` already typed; no `any` |
| III. Test-First / 80% coverage | ✅ Pass | `submitGuess` round-end logic, `restartGame`, and `startGame` score-preservation covered by unit tests before implementation |
| IV. Accessibility (WCAG 2.1 AA) | ✅ Pass | Results page uses semantic `<table>`/`<ul>`; Restart button is keyboard-accessible; correct word revealed in a labelled element |
| V. Secure by Default | ✅ Pass | Secret word revealed server-side only when `status === "completed"`; `restartGame` validates host identity server-side |
| Bundle ≤150 KB | ✅ Pass | No new runtime dependencies; new page and two components add negligible JS |

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── checklists/
    └── requirements.md
```

### Source Code (affected files)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              ← add roundScores to Room + RoomSnapshot
│   ├── api/
│   │   ├── rooms.ts             ← add POST /:code/restart route
│   │   └── schemas.ts           ← add restartGameSchema (participantId)
│   └── services/
│       ├── roomStore.ts         ← auto-end in submitGuess (isCorrect → status "completed");
│       │                           add restartGame(); update startGame() score init;
│       │                           reveal secretWord in snapshot when status "completed";
│       │                           update toRoomSnapshot() to include roundScores
│       └── roomStore.test.ts    ← tests for round-end transition, restartGame, cumulative scores

frontend/
├── src/
│   ├── services/
│   │   └── api.ts               ← add restartGame(); add roundScores to RoomSnapshot
│   ├── state/
│   │   └── roomStore.ts         ← add restartGame() action
│   ├── pages/
│   │   ├── GamePage.tsx         ← navigate to /results when room.status === "completed"
│   │   └── ResultsPage.tsx      ← NEW: correct word, GuessList, RoundScoreboard, Restart button
│   ├── components/
│   │   ├── GuessList.tsx        ← NEW: ordered guess history with player name + correct badge
│   │   └── RoundScoreboard.tsx  ← NEW: per-round score + cumulative score table
│   └── routes/
│       └── index.tsx            ← add /results route → ResultsPage
```

**Structure Decision**: Web application layout — same `backend/` + `frontend/` structure as FG1,
FG2, FG3. `ResultsPage` follows the page-per-route pattern established by `LobbyPage` and
`GamePage`.

## Complexity Tracking

> No constitution violations — section not applicable.
