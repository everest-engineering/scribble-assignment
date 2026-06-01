# Implementation Plan: Drawing Canvas and Guess Scoring

**Branch**: `003-drawing-canvas` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-drawing-canvas/spec.md`

## Summary

Extend the existing HTTP-only Scribble room flow so the active drawer can draw
and clear the canvas, guessers can submit trimmed case-insensitive guesses, and
all players receive synchronized guess history and scoring updates through
polling. The implementation stays in-memory, uses the current Express/React
stack, and adds only the minimum round state needed to keep the room snapshot
consistent for all viewers.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js with ES modules in both backend
and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest,
`tsx`, jsdom

**Storage**: In-memory only; room, round, canvas, guess, and score state live in
process memory and are discarded when the server stops

**Testing**: Vitest for backend and frontend, with jsdom for browser-facing
component and store tests

**Target Platform**: Node.js backend API plus browser-based React SPA

**Project Type**: Web application

**Performance Goals**: Polling should reflect room updates within the existing
2 second refresh cadence and keep draw/guess interactions responsive

**Constraints**: HTTP request/response only, no WebSockets, no databases, no
sessions or auth, strict TypeScript, minimal and disposable room state

**Scale/Scope**: Single-process multiplayer rooms with one active canvas and one
active guess history per room round

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The work stays within the existing backend/frontend stack and does not add an
  unsupported architecture or dependency pattern.
- All new code can be written in strict TypeScript without `any` and without
  loosening the repo's compiler settings.
- The feature uses HTTP request/response flows only, with polling for
  freshness, and does not rely on WebSockets, databases, sessions, or other
  forbidden persistence/push mechanisms.
- The implementation extends the starter code instead of rewriting it and keeps
  room/round state minimal and disposable.
- The plan includes tests for the important edge cases: hidden drawer-only
  guess input, trimmed and case-insensitive guesses, empty-guess rejection,
  score updates, and synchronized history through polling.

## Project Structure

### Documentation (this feature)

```text
specs/003-drawing-canvas/
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
│   ├── services/
│   └── *.test.ts

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── state/
│   └── *.test.tsx
```

**Structure Decision**: Use the existing monorepo layout with backend HTTP
routes in `backend/src/api`, state management in `backend/src/services` and
`frontend/src/state`, shared room and round models in `backend/src/models`, and
UI updates in `frontend/src/pages` and `frontend/src/components`.

## Complexity Tracking

No constitution violations require justification for this feature.
