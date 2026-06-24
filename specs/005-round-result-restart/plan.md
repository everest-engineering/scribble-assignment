# Implementation Plan: Round Result, Restart & Final Validation

**Branch**: `assignment` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-round-result-restart/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a "result" state to the game lifecycle: when a round ends (all guessers guess correctly), the room transitions to `"result"` status where all players see the secret word, final scores ranked, and full guess history. The host can then trigger a restart that clears all round state, returns everyone to the lobby, and preserves the player list, allowing the host to manually start a new game.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+, React 18

**Primary Dependencies**: Express 4.x (backend), React 18 (frontend), Vite 5.x (frontend build), Zod 3.x (validation)

**Storage**: In-memory only — round result data is the existing `Round` entity in a terminal state (`room.currentRound` preserved as-is); restart nullifies `currentRound` and resets scores

**Testing**: Vitest (backend unit tests for round end detection, restart logic, result snapshot filtering); manual two-browser-tab testing per spec acceptance scenarios

**Target Platform**: Modern web browser (Chrome, Firefox, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Result screen visible within 2 seconds of round end (SC-001); restart completes within 3 seconds (SC-003)

**Constraints**: No WebSockets, no databases, no authentication; all sync via HTTP polling; result state data identical for all players (word visible to everyone post-round); host-only restart action

**Scale/Scope**: Up to 8 players per room; single completed round per result cycle; restart preserves player identities indefinitely across sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (TypeScript-First & Type Safety)**: New types (`RoomStatus` extended with `"result"`) and new endpoint schemas MUST be fully typed with no `any`. Zod schemas MUST validate restart and round-end payloads. ✅ No violation.
- **Principle II (Brownfield Enhancement Discipline)**: Extend existing `RoomStatus` union type and `toRoomSnapshot` rather than creating new top-level stores. New endpoints follow existing Express Router pattern. Existing `Room.currentRound` reused for result display (no new entity). ✅ No violation — codebase explored in depth.
- **Principle III (Deterministic Game Logic) (NON-NEGOTIABLE)**: Round end detection is deterministic — when all non-drawer participants have guessed correctly, the round ends. Restart always resets to same initial lobby state. Identical inputs always produce identical outputs. ✅ Enforced by design.
- **Principle IV (HTTP Polling & In-Memory State)**: Result state and restart are synced via existing polling on `GET /rooms/:code`. New POST endpoints (`/round/end`, `/restart`) are stateless commands that update in-memory state, reflected in subsequent polling responses. No WebSockets introduced. ✅ No violation.
- **Principle V (Validation & Edge Case Rigor)**: Edge cases documented in spec (host disconnect, late joiner, zero guesses, slow polling). Zod validation on all new endpoints. Result screen clears all sensitive round data on restart. ✅ Enforced by design.

**Gate status**: ✅ PASS — All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/005-round-result-restart/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-contract.md  # API request/response contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   ├── rooms.ts           # Add POST /:code/round/end, POST /:code/restart routes
    │   └── schemas.ts         # Add roundEndBodySchema, restartBodySchema
    ├── models/
    │   └── game.ts            # Extend RoomStatus with "result"; add RoundEndResult type
    └── services/
        └── roomStore.ts       # Add endRound, restartGame functions; modify toRoomSnapshot for "result" state (show word to all); auto-detect round end in submitGuess

frontend/
└── src/
    ├── pages/
    │   ├── ResultPage.tsx     # NEW: result screen showing word, ranked scores, guess history; host sees restart button
    │   └── GamePage.tsx       # Navigate away when status becomes "result"; hide guess input for correct guessers
    ├── services/
    │   └── api.ts             # Add endRound, restartGame API calls
    ├── state/
    │   └── roomStore.ts       # Add endRound, restartGame actions; polling handles "result" status
    ├── components/
    │   ├── Scoreboard.tsx     # Reuse with result-specific styling (ranked, finalized)
    │   └── GuessHistory.tsx   # Reuse — already shows full guess history
    └── App.tsx                # Add /result route
```

**Structure Decision**: Web application — two-project layout (`backend/` + `frontend/`). No new projects or top-level dependencies. All changes follow patterns established by the Gameplay Interaction feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. Complexity tracking not required.
