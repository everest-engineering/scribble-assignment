# Implementation Plan: Post Game Experience

**Branch**: `004-post-game-experience` | **Date**: 2026-06-09 | **Spec**: `specs/004-post-game-experience/spec.md`

**Input**: Feature specification from `/specs/004-post-game-experience/spec.md`

## Summary

Implement round-end transition (triggered by correct guess), a shared result screen showing the secret word, player standings, and guess log, plus a host-initiated restart that resets round state but preserves the participant list.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js 18+ (backend), React 18 (frontend)

**Primary Dependencies**: Express (backend), React 18 + React Router v6 (frontend), Zod (validation), Vite (build)

**Storage**: In-memory only (no databases per constitution). Round state already stored in RoundState object.

**Testing**: Manual validation via quickstart.md.

**Target Platform**: Web browser (modern Chrome, Firefox, Safari)

**Project Type**: Web application (Express backend + React SPA frontend)

**Performance Goals**: Round-end transition visible to all players within 2s of correct guess. Restart visible within 2s.

**Constraints**: HTTP polling only (max 2s interval). No databases. In-memory state only. No auth.

**Scale/Scope**: 2-8 players per room. Single round result + restart cycle.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — TypeScript Strict Mode
- All source code MUST use TypeScript strict mode. No `any`.
- **Status**: ✅ Existing codebase uses strict mode. No violations expected.

### Principle II — Functional Components & Hooks
- React components MUST be functional with hooks.
- **Status**: ✅ Result screen and restart button will be functional components.

### Principle III — Short-Polling Sync (2-Second Maximum)
- All sync via HTTP polling ≤2s. No WebSockets.
- **Status**: ✅ Result state transition and restart detected via existing polling at 500ms-2s.

### Principle IV — Strict Input & Name Validation
- All user input validated via Zod on backend.
- **Status**: ✅ Restart action uses existing participantId validation.

### Principle V — Testable Game Logic (NON-NEGOTIABLE)
- Business logic in services layer. Pure functions where possible.
- **Status**: ✅ Round-end logic and restart logic in roomStore.ts.

### Hard Constraints — No databases, no auth, no WebSockets, no new state-management libraries
- **Status**: ✅ All respected.

**GATE**: ✅ PASS — all principles satisfied. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/004-post-game-experience/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # API contract documentation
└── tasks.md             # Phase 2 output (generated later)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts           # Add "finished" to RoundPhase
│   ├── services/roomStore.ts    # endRound(), restartGame() logic
│   └── api/
│       └── rooms.ts             # POST /:code/restart route

frontend/
├── src/
│   ├── pages/
│   │   ├── GamePage.tsx         # Updated with finished-phase result screen
│   │   └── ResultPage.tsx       # NEW: result screen component
│   ├── services/api.ts          # restartGame() API method
│   └── state/roomStore.ts       # restartGame() store method
```

**Structure Decision**: Both backend and frontend already exist. New types extend existing files. One new page (`ResultPage.tsx`). Round phase enum gains `"finished"`.

## Complexity Tracking

No constitutional violations — complexity tracking not required.
