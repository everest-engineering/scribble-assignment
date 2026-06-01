# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Build the core gameplay loop for Scribble: an interactive drawing canvas with color/width tools, canvas clear, guess submission with server-side validation, polled guess history, deterministic scoring, and round-end logic (auto when all correct or manual drawer reveal).

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+ backend, React 18 + Vite frontend)

**Primary Dependencies**: Express + Zod (backend); React 18 + React Router v6 (frontend)

**Storage**: In-memory only — existing `Map<string, Room>` pattern in `roomStore.ts`

**Testing**: Vitest (both backend and frontend)

**Target Platform**: Web browsers (Chrome, Firefox, Safari)

**Project Type**: Web application (Express API backend + React SPA frontend)

**Performance Goals**: Canvas strokes visible to all players within one poll cycle (<3s), guesses validated and returned within one poll cycle (<3s)

**Constraints**: Max 1 MB serialized canvas data, 200-char guess limit, no WebSockets, no databases, no authentication

**Scale/Scope**: Single-server, multi-room in-memory game. Rooms cleaned up when inactive.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. AI-Assisted Development | ✅ PASS | Human review required before commits |
| II. TypeScript & Type Safety | ✅ PASS | All new code fully typed, Zod for validation |
| III. Architecture Constraints | ✅ PASS | HTTP polling (no WebSockets), in-memory (no DB), no auth, no new state libs |
| IV. Test-First & Validation | ✅ PASS | Tests written before implementation, edge cases covered |
| V. Deterministic Game Logic | ✅ PASS | Scoring fixed at 1 point per correct guess, deterministic round-end |

No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── strokes.md       # Canvas stroke API contract
│   ├── guesses.md       # Guess submission API contract
│   └── game-actions.md  # Game action endpoints (clear, reveal)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts              # ADD: DrawingStroke, Guess, Score types
    ├── services/
    │   └── roomStore.ts         # MODIFY: Add strokes, guesses, scores to Room; add round-end logic
    ├── api/
    │   ├── router.ts            # MODIFY: Mount new routes
    │   ├── rooms.ts             # MODIFY: Add stroke/guess/game-action handlers
    │   └── schemas.ts           # MODIFY: Add Zod schemas for guesses, strokes
    └── seed/
        └── starterData.ts       # UNCHANGED

frontend/
└── src/
    ├── pages/
    │   └── GamePage.tsx         # MODIFY: Real canvas, drawing tools, guess form wiring, activity panel
    ├── components/
    │   ├── DrawingCanvas.tsx    # ADD: Interactive HTML5 canvas with color/width pickers
    │   ├── GuessForm.tsx        # MODIFY: Wire to API, show validation feedback
    │   ├── ResultPanel.tsx      # MODIFY: Render real guess history
    │   └── Scoreboard.tsx       # MODIFY: Render real scores
    ├── services/
    │   └── api.ts               # MODIFY: Add stroke/guess/game-action API calls
    └── state/
        └── roomStore.ts         # MODIFY: Add stroke/guess/score state, polling
```

## Complexity Tracking

No constitution violations detected. No complexity justification needed.

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/src/models/game.ts` | MODIFY | Add `DrawingStroke`, `Guess`, `RoundStatus`, `PlayerScore` types |
| `backend/src/services/roomStore.ts` | MODIFY | Add state fields, stroke/guess/score/round-end logic |
| `backend/src/api/router.ts` | MODIFY | Mount new stroke/guess/game-action routes |
| `backend/src/api/rooms.ts` | MODIFY | Add request handlers for canvas, guess, reveal endpoints |
| `backend/src/api/schemas.ts` | MODIFY | Add Zod validation for guess text, stroke data |
| `frontend/src/pages/GamePage.tsx` | MODIFY | Replace canvas placeholder, wire components |
| `frontend/src/components/DrawingCanvas.tsx` | ADD | Interactive HTML5 canvas with toolbars |
| `frontend/src/components/GuessForm.tsx` | MODIFY | Wire to API with loading/error feedback |
| `frontend/src/components/ResultPanel.tsx` | MODIFY | Render real guesses with correct/incorrect markers |
| `frontend/src/components/Scoreboard.tsx` | MODIFY | Render real player scores |
| `frontend/src/services/api.ts` | MODIFY | Add stroke/guess/game-action API functions |
| `frontend/src/state/roomStore.ts` | MODIFY | Add stroke/guess/score state and polling updates |
