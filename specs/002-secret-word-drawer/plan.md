# Implementation Plan: Secret Word Drawer

**Branch**: `002-secret-word-drawer` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-secret-word-drawer/spec.md`

## Summary

Implement the first-round game start flow so the host becomes the drawer, the host chooses a word from the starter list, and the chosen word is visible only to the drawer while guessers see the round without the secret word.

## Technical Context

**Language/Version**: TypeScript 5.6, ES Modules

**Primary Dependencies**: Express, React 18, React Router v6, Vite, Zod, Vitest, tsx

**Storage**: In-memory only on the backend; no database or persistent store

**Testing**: Vitest for backend and frontend unit/integration coverage

**Target Platform**: Web application running in a browser with a Node.js backend

**Project Type**: Web application with separate backend and frontend packages

**Performance Goals**: Round start state should be visible on the next room refresh cycle and remain consistent for all viewers of the same room

**Constraints**: HTTP only, no WebSockets, no databases, no auth, strict TypeScript, preserve the starter structure

**Scale/Scope**: Small multiplayer rooms with one active first-round drawer and hidden secret word per room

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
  and keeps room/game state minimal and disposable.
- Confirm the plan includes tests for the edge cases that matter to the
  feature, not just the happy path.

## Project Structure

### Documentation (this feature)

```text
specs/002-secret-word-drawer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
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

**Structure Decision**: Use the existing `backend/` and `frontend/` packages
with no new top-level app layer. Game-round behavior stays in
`backend/src/services` and `backend/src/api`, shared round state stays in
`frontend/src/state`, and UI updates stay in the existing page/component
structure.

## Complexity Tracking

No constitution violations require justification for this feature. The work
fits the existing monorepo layout and the current HTTP/in-memory constraints.
