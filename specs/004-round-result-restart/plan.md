# Implementation Plan: Round Result and Restart

**Branch**: `004-round-result-restart` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-round-result-restart/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Add a results phase after a round ends showing the secret word, guess outcomes, and scores to all players. Provide a "Play Again" action that resets the room to lobby state while preserving the player roster.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+ backend, React 18 + Vite frontend)

**Primary Dependencies**: Express + Zod (backend); React 18 + React Router v6 (frontend)

**Storage**: In-memory only — existing `Map<string, Room>` pattern in `roomStore.ts`

**Testing**: Vitest (both backend and frontend)

**Target Platform**: Web browsers (Chrome, Firefox, Safari)

**Project Type**: Web application (Express API backend + React SPA frontend)

**Performance Goals**: Results visible to all players within one poll cycle (<3s); restart reflected in lobby within one poll cycle (<3s)

**Constraints**: No WebSockets, no databases, no authentication, in-memory only, HTTP polling for all sync

**Scale/Scope**: Single-server, multi-room in-memory game. Rooms cleaned up when inactive.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. AI-Assisted Development | ✅ PASS | Human review required before commits |
| II. TypeScript & Type Safety | ✅ PASS | All new code fully typed, Zod for validation |
| III. Architecture Constraints | ✅ PASS | HTTP polling (no WebSockets), in-memory (no DB), no auth, no new state libs |
| IV. Test-First & Validation | ✅ PASS | Tests written before implementation, edge cases covered |
| V. Deterministic Game Logic | ✅ PASS | State transitions are deterministic (round end → results → lobby); "Play Again" produces identical lobby state given same inputs |

No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/004-round-result-restart/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── results.md       # Results state API contract
│   └── restart.md       # Play Again API contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts              # MODIFY: Replace "round_ended" with "results" in RoomStatus
    ├── services/
    │   └── roomStore.ts         # MODIFY: Update status checks, add playAgain()
    ├── api/
    │   ├── router.ts            # UNCHANGED (auto-mounted)
    │   ├── rooms.ts             # MODIFY: Add play-again route, update status checks
    │   └── schemas.ts           # MODIFY: Add playAgainSchema
    └── seed/
        └── starterData.ts       # UNCHANGED

frontend/
└── src/
    ├── pages/
    │   └── GamePage.tsx         # MODIFY: Show results UI when status === "results", add "Play Again" button
    ├── components/
    │   └── ResultPanel.tsx      # MODIFY: Enhance for results display (show word, final outcomes)
    ├── services/
    │   └── api.ts               # MODIFY: Add playAgain(), update status type
    └── state/
        └── roomStore.ts         # MODIFY: Add playAgain() method
```

## Complexity Tracking

No constitution violations detected. No complexity justification needed.

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/src/models/game.ts` | MODIFY | Replace `"round_ended"` with `"results"` in `RoomStatus` type |
| `backend/src/services/roomStore.ts` | MODIFY | Update status checks (`round_ended` → `results`), add `playAgain()` function that resets room to lobby preserving players |
| `backend/src/api/schemas.ts` | MODIFY | Add `playAgainSchema` for request validation |
| `backend/src/api/rooms.ts` | MODIFY | Add `POST /:code/play-again` route, update any status string references |
| `frontend/src/services/api.ts` | MODIFY | Update `RoomSnapshot.status` type, add `playAgain()` API function |
| `frontend/src/state/roomStore.ts` | MODIFY | Add `playAgain()` store method |
| `frontend/src/pages/GamePage.tsx` | MODIFY | Update `round_ended` references to `results`, show "Play Again" button, enhance results display |
| `frontend/src/components/ResultPanel.tsx` | MODIFY | Enhance to show results content (word, final outcomes) in results phase |
