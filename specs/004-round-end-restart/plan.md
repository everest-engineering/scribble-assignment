# Implementation Plan: Round End and Restart

**Branch**: `004-round-end-restart` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-round-end-restart/spec.md`

## Summary

Extend the existing HTTP-only Scribble room flow so the first correct guess
ends the round, every viewer can see the end-of-round summary, and the host can
restart the room back to the lobby without recreating the participant list.
The implementation keeps round state in memory, adds only the minimum phase
tracking needed for an ended-round summary, and continues to use polling for
freshness.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js with ES modules in both backend
and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite,
Vitest, `tsx`, jsdom

**Storage**: In-memory only; room and round state live in process memory and
are discarded when the server stops

**Testing**: Vitest for backend and frontend, with jsdom for browser-facing
component and store tests

**Target Platform**: Node.js backend API plus browser-based React SPA

**Project Type**: Web application

**Performance Goals**: End-of-round and restart state changes should appear on
the next polling refresh and complete within the existing HTTP request cycle

**Constraints**: HTTP request/response only, no WebSockets, no databases, no
sessions or auth, strict TypeScript, minimal and disposable room state

**Scale/Scope**: Single-process multiplayer rooms with one active or ended
round summary per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Confirm the work stays within the existing backend/frontend stack and does
  not introduce an unsupported architecture or dependency pattern.
- Confirm all new code can be written in strict TypeScript without `any` and
  without weakening the repo's compiler settings.
- Confirm the feature uses HTTP request/response flows only, with polling for
  freshness where required, and does not rely on WebSockets, databases,
  sessions, or other forbidden persistence/push mechanisms.
- Confirm the implementation extends the starter code instead of rewriting it
  and keeps room/round state minimal and disposable.
- Confirm the plan includes tests for the edge cases that matter to the
  feature, including first-correct-guess termination, late-action rejection,
  host-only restart, and preserved player lists after restart.

## Project Structure

### Documentation (this feature)

```text
specs/004-round-end-restart/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   ├── models/
│   ├── seed/
│   └── services/
└── *.test.ts

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── state/
└── *.test.tsx
```

**Structure Decision**: Use the existing monorepo layout with HTTP routes in
`backend/src/api`, in-memory round and room logic in `backend/src/services`,
shared room and round types in `backend/src/models`, and UI updates in
`frontend/src/pages`, `frontend/src/components`, and `frontend/src/state`.

## Complexity Tracking

No constitution violations require justification for this feature.
