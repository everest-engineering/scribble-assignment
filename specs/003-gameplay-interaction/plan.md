# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Extend the existing polling-driven room model so active games expose drawing strokes, ordered guess history, and participant scores through the room snapshot. Drawer drawing and guess submissions stay HTTP-only; the backend remains the source of truth, while the frontend reuses the existing polling loop to keep the shared game feed current within one poll cycle.

## Technical Context

**Language/Version**: TypeScript 5.6, ES Modules

**Primary Dependencies**: Express, React 18, React Router v6, Vite, Zod

**Storage**: In-memory only; no persistence layer

**Testing**: Vitest for backend and frontend unit/integration coverage

**Target Platform**: Browser frontend + Node.js backend

**Project Type**: Web application

**Performance Goals**: Polling updates visible within ~2 seconds; room snapshots remain small enough for frequent HTTP refresh

**Constraints**: HTTP polling only, no WebSockets/SSE, no databases, no auth/session layer, strict TypeScript, minimal in-memory state

**Scale/Scope**: Small multiplayer rooms, one active round per room, multiple rooms allowed in memory until explicitly cleaned up

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- HTTP-only sync only: pass. No push transport introduced.
- In-memory only: pass. No DB, no auth/session state.
- Type-safe boundaries: pass. Existing and new API edges remain Zod-validated TypeScript.
- Deterministic behavior: pass. Guess comparison, scoring, and room snapshots remain reproducible.
- Spec-first delivery: pass. Spec, plan, and downstream tasks stay the source of truth before code.
- Verify locally: pass. Implementation will require polling checks in more than one tab.
- Out-of-scope check (Principle VI): pass. No WebSockets, databases, auth, deployment, Docker, new state/routing libs, multiple rounds, drawer rotation, timers, bonuses, custom word packs, spectator mode, room moderation, room passwords, or starter rewrites.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── room-gameplay-api.md
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

**Structure Decision**: Use the existing split web app layout. Backend gameplay state lives in `backend/src/services` and `backend/src/models`; HTTP routes stay in `backend/src/api`. Frontend polling, forms, and shared room state stay in `frontend/src/state`, `frontend/src/services`, `frontend/src/pages`, and `frontend/src/components`. Feature docs stay under `specs/003-gameplay-interaction/`.

## Complexity Tracking

Not required. The constitution check passes without exceptions, so no design violation needs justification.
