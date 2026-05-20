# Implementation Plan: Result, Restart And Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-result-restart-validation/spec.md`

## Summary

Add round-end detection (all guessers correct OR timer expiry), a "result" state showing the correct word/final scores/guess history/canvas, and a host-only restart that clears round state and returns everyone to the lobby with players and cumulative scores preserved.

## Technical Context

**Language/Version**: TypeScript 5.x (backend), TypeScript 5.x (frontend)

**Primary Dependencies**: Backend: Express, Zod, tsx. Frontend: React 18, React Router 6, Vite. (No new libraries.)

**Storage**: In-memory (existing `Map<string, Room>` in `roomStore.ts`). No database.

**Testing**: Manual two-tab multiplayer testing (per constitution). No test framework.

**Target Platform**: Web — Node.js server + modern browser (Chromium-based, Firefox, Safari).

**Project Type**: Web application (Express backend + React frontend).

**Performance Goals**: All players see state changes within one polling cycle (2000ms).

**Constraints**: In-memory only, no WebSockets, polling-based sync (2000ms interval), no authentication, no database.

**Scale/Scope**: Local multiplayer (2-8 players per room, max 100 rooms).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. TypeScript-First & Type Safety | ✅ PASS | All new code fully typed; Zod for validation; no `any` |
| II. Spec-Driven Workflow | ✅ PASS | Follows prescribed workflow; spec artifacts maintained |
| III. Immutability & Error Handling | ✅ PASS | Centralized error handlers; no frontend crashes on failure |
| IV. Incremental Delivery & Validation | ✅ PASS | Scenario 4 of 4; builds after each unit; two-tab testing |
| V. AI-Assisted Development Discipline | ✅ PASS | Human review required; no AI architectural decisions |

**Timer exception**: The constitution lists "timers" as out of scope. This spec adds a `timerDuration` setting and server-side timer. **Rationale**: Timers were excluded for earlier scenarios (room setup, game start, gameplay) where round end was not needed. For this scenario (result/restart), a round end trigger is essential — the timer ensures every round terminates so players can reach the result state. Without it, a round with unguessable words runs indefinitely. This directly supports the in-scope "Result & Restart" feature.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions & rationale
├── data-model.md        # Phase 1 — entity design
├── quickstart.md        # Phase 1 — implementation checklist
├── contracts/           # Phase 1 — API contracts
│   └── api.md
└── tasks.md             # Phase 2 — implementation tasks (created by /speckit.tasks)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # Add RoomStatus "result", add timerStartedAt/timerDuration to Round
│   ├── services/
│   │   └── roomStore.ts         # Add endRound(), restartGame(), timer expiry check
│   └── api/
│       └── rooms.ts             # Add POST /:code/restart, GET /:code/room returns result state

frontend/
├── src/
│   ├── pages/
│   │   ├── GamePage.tsx         # Detect result state → show result UI instead of game UI
│   │   └── LobbyPage.tsx        # Preserved (already navigates back from active if status changes)
│   ├── components/
│   │   └── ResultView.tsx       # NEW: result display (correct word, scores, history, canvas, restart btn)
│   └── state/
│       └── roomStore.ts         # Add restartGame(), endRound detection in polling
```

**Structure Decision**: Web application with existing backend/frontend split. No new directories or services.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Timer (constitution out-of-scope) | Round must end so result state can be reached | Manual host-only end-round requires active host action; timer provides automatic fallback |
