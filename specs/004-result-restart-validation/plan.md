# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart-validation/spec.md`

## Summary

Extend the polling-driven room lifecycle with a shared result state that reveals the final secret word, scores, and guess history to every player, then add a host-only restart action that clears round-specific state and returns everyone to the lobby without dropping the current player list.

## Technical Context

**Language/Version**: TypeScript 5.6, ES Modules

**Primary Dependencies**: Express, React 18, React Router v6, Vite, Zod

**Storage**: In-memory only; no persistence layer

**Testing**: Vitest for backend and frontend unit/integration coverage

**Target Platform**: Browser frontend + Node.js backend

**Project Type**: Web application

**Performance Goals**: Result/restart changes visible on the next polling cycle, targeting ~2 second sync latency

**Constraints**: HTTP polling only, no WebSockets/SSE, no databases, no auth/session layer, strict TypeScript, minimal in-memory room state

**Scale/Scope**: Small multiplayer rooms, one active round lifecycle per room, multiple rooms allowed in memory until explicitly cleaned up

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- HTTP-only sync only: pass. No push transport introduced.
- In-memory only: pass. No DB, no auth/session state.
- Type-safe boundaries: pass. API edges remain Zod-validated TypeScript.
- Deterministic behavior: pass. Result, restart, scores, and snapshots are reproducible.
- Spec-first delivery: pass. Spec, plan, and downstream artifacts stay in sync before implementation.
- Verify locally: pass. Feature validation will require multi-tab polling checks.
- Out-of-scope check (Principle VI): pass. No WebSockets, databases, auth, deployment, Docker, new state/routing libs, multiple rounds, drawer rotation, timers, bonuses, custom word packs, spectator mode, room moderation, room passwords, or starter rewrites.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   ├── models/
│   └── services/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── state/
└── tests/
```

**Structure Decision**: Use the existing split web application layout. Backend result/restart state lives in `backend/src/models` and `backend/src/services`, with HTTP handlers in `backend/src/api`. Frontend polling, result rendering, and restart affordances stay in `frontend/src/state`, `frontend/src/services`, `frontend/src/pages`, and `frontend/src/components`. Feature docs stay under `specs/004-result-restart-validation/`.

## Complexity Tracking

Not required. The constitution check passes without exceptions, so no design violation needs justification.
