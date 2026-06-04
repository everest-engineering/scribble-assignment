# Implementation Plan: Room Lobby Access

**Branch**: `001-room-lobby-access` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-lobby-access/spec.md`

## Summary

Implement room creation/join flows with a fully isolated in-memory room store,
automatic 2000 ms lobby polling, host-only start rules, and host-departure
cleanup before game start. Extend the existing HTTP stack and room state
patterns rather than introducing new transport or state layers.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ and React 18

**Primary Dependencies**: Express, React Router v6, Vite, Zod, Vitest

**Storage**: In-memory room store only

**Testing**: Vitest for backend room-store and schema coverage, frontend
service/store coverage, and browser validation for multi-tab polling,
host-departure cleanup, and host/start flows

**Target Platform**: Local web app in modern browsers, backend on Node.js

**Project Type**: Full-stack web application

**Performance Goals**: Lobby changes should become visible on a 2000 ms
polling cycle; room actions should feel immediate for local development

**Constraints**: No WebSockets, no database, no authentication, no sessions,
no new routing or state libraries, no top-level dependencies unless justified

**Scale/Scope**: Small local-session multiplayer use, with a handful of active
rooms and participants per run

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- HTTP-only sync only: satisfied through existing REST endpoints plus polling.
- In-memory only: satisfied by the backend `Map<string, Room>` store.
- Type-safe boundaries: satisfied by TypeScript and Zod at API boundaries.
- Deterministic behavior: satisfied by explicit room-code, host, and start rules.
- Spec-first delivery: satisfied by updating spec, plan, and next tasks before
  implementation.
- Verify locally: required via browser validation in at least two tabs.
- Out-of-scope check (Principle VI): confirm the plan does NOT include
  WebSockets, databases, auth, deployment, Docker, new state/routing libs,
  multiple rounds, drawer rotation, timers, bonuses, custom word packs,
  spectator mode, room moderation, room passwords, or starter rewrites.
  Any match MUST be removed before proceeding.

No constitution violations require justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-lobby-access/
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
└── src/
    ├── api/
    ├── models/
    └── services/

frontend/
└── src/
    ├── components/
    ├── pages/
    ├── services/
    └── state/
```

**Structure Decision**: This is a standard monorepo web app. Room logic lives
in `backend/src/services`, API routes in `backend/src/api`, shared room state
in `frontend/src/state`, and user flows in `frontend/src/pages`.

## Complexity Tracking

No constitution violations require justification.
