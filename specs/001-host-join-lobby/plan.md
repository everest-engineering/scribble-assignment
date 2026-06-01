# Implementation Plan: Host and Join Lobby Flow

**Branch**: `001-host-join-lobby` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-host-join-lobby/spec.md`

**Note**: This plan is now associated with the feature branch created from
`scribble-lab`, so the existing commits are available on the new branch.

## Summary

Implement the multiplayer room entry path so the room creator becomes the host,
room joins are validated and isolated, lobby state refreshes automatically via
polling, and only the host can start the game after at least two players are
present.

## Technical Context

**Language/Version**: TypeScript 5.6, ES Modules

**Primary Dependencies**: Express, React 18, React Router v6, Vite, Zod,
Vitest, tsx

**Storage**: In-memory only on the backend; no database or persistent store

**Testing**: Vitest for backend and frontend unit/integration coverage

**Target Platform**: Web application running in a browser with a Node.js backend

**Project Type**: Web application with separate backend and frontend packages

**Performance Goals**: Lobby updates should appear within roughly 2 seconds
while the view is open

**Constraints**: HTTP only, no WebSockets, no databases, no auth, strict
TypeScript, preserve the starter structure

**Scale/Scope**: Single-room and multi-room gameplay flows for a small
multiplayer session

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
specs/001-host-join-lobby/
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
with no new top-level app layer. Room behavior stays in `backend/src/services`,
route handling stays in `backend/src/api`, shared room state stays in
`frontend/src/state`, and UI updates stay in the existing page/component
structure.

## Complexity Tracking

No constitution violations require justification for this feature. The work
fits the existing monorepo layout and the current HTTP/in-memory constraints.
