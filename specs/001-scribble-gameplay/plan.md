# Implementation Plan: Scribble Gameplay Core

**Branch**: `001-scribble-gameplay` | **Date**: 2026-06-12 | **Spec**: `../specs/001-scribble-gameplay/spec.md`

**Input**: Feature specification from `/specs/001-scribble-gameplay/spec.md`

## Summary

This feature fills the missing gameplay mechanics in the Scribble starter app. It will extend the current frontend and backend to enforce room ownership, host-controlled game start, deterministic drawer assignment with secret-word visibility, canvas clearing, guess submission and normalization, score calculation, result display, and restart flow. The plan keeps all behavior in-memory and synchronized via periodic HTTP polling.

## Technical Context

**Language/Version**: TypeScript on both frontend and backend; Node.js 22+ for the backend; React 18 on the frontend.

**Primary Dependencies**: Backend uses Express, Zod, tsx; frontend uses React, React Router v6, Vite.

**Storage**: In-memory backend state only; no database or external persistence.

**Testing**: Vitest for unit and feature tests on both frontend and backend.

**Target Platform**: Web browser client with Node.js/Express backend.

**Project Type**: Web application with separate frontend and backend packages.

**Performance Goals**: Responsive polling-based state sync (~2 second cadence) with lightweight API payloads.

**Constraints**: No WebSockets or push-based transport; no authentication or sessions; no database; must fit within the existing repo structure and starter code.

**Scale/Scope**: Single-round gameplay per room, with 2+ players and one active drawer; in-memory sessions reset on backend restart.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This plan aligns with the constitution by preserving the in-memory backend constraint, using HTTP polling only, and remaining incremental with explicit user scenarios and contract-driven API design.

## Project Structure

### Documentation (this feature)

```text
specs/001-scribble-gameplay/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   ├── router.ts
│   │   ├── schemas.ts
│   │   └── schemas.test.ts
│   ├── models/
│   │   └── game.ts
│   ├── seed/
│   │   └── starterData.ts
│   ├── services/
│   │   ├── roomStore.ts
│   │   └── roomStore.test.ts
│   ├── app.ts
│   └── server.ts
frontend/
├── package.json
├── tsconfig.json
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   ├── state/
│   │   └── roomStore.ts
│   └── styles/
│       └── app.css
```

**Structure Decision**: Use the existing backend/frontend split; feature work occurs in the existing `backend/src` and `frontend/src` files, with documentation under `specs/001-scribble-gameplay`.

## Complexity Tracking

No constitution violations were identified; the plan is compatible with the existing architecture and the lab’s explicit scope.
