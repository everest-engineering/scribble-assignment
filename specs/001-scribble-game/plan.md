# Implementation Plan: Scribble Game Completion

**Branch**: `sdd-scribble-assignment` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-scribble-game/spec.md`

## Summary

Extend the existing Scribble starter into a complete one-round drawing and
guessing game. The implementation preserves the current React + Express
brownfield structure, extends the in-memory room model, adds host and game
lifecycle rules, and keeps all synchronization on REST polling.

## Technical Context

**Language/Version**: TypeScript, Node.js 18+, npm 9+
**Primary Dependencies**: Express, Zod, React 18, React Router 6, Vite, Vitest
**Storage**: In-memory backend room store only
**Testing**: Vitest for backend service/schema and frontend component/state behavior; manual two-browser validation for full multiplayer flow
**Target Platform**: Browser frontend with local Express backend
**Project Type**: Brownfield web application with `backend/` and `frontend/`
**Performance Goals**: Lobby and game snapshots update through polling every about 2 seconds; drawing and guess state remain responsive for a single room with several participants
**Constraints**: No WebSockets, databases, authentication, sessions, Docker, deployment, CI, new state-management libraries, or new routing libraries
**Scale/Scope**: Single-round in-memory Scribble game for assignment validation; multiple rooms may coexist and must remain isolated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec governance: PASS. Plan traces to `spec.md`, discovery notes, and all four assignment feature groups.
- Brownfield extension: PASS. Existing Express route/service boundaries and React page/store patterns are extended rather than replaced.
- Polling-only sync: PASS. Synchronization uses existing fetch-based API client and periodic room snapshot polling.
- Type-safe validated boundaries: PASS. Zod schemas will validate room codes, participant ids, player names, drawing updates, guesses, host actions, and restart actions.
- Testable delivery: PASS. Backend game rules, state transitions, and validation receive automated tests; the full two-browser path receives manual validation notes.

## Project Structure

### Documentation (this feature)

```text
specs/001-scribble-game/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rest-api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   ├── seed/
│   │   └── starterData.ts
│   └── services/
│       ├── roomStore.ts
│       └── roomStore.test.ts
└── src/api/
    └── schemas.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── GuessForm.tsx
│   │   ├── ResultPanel.tsx
│   │   └── Scoreboard.tsx
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   ├── state/
│   │   └── roomStore.ts
│   └── styles/
│       └── app.css
```

**Structure Decision**: Use the existing two-package web app layout. Do not add
top-level dependencies or new architectural layers unless a task proves the
existing boundaries insufficient.

## Phase 0: Research

Research decisions are captured in [research.md](./research.md). No unresolved
technical clarifications remain.

## Phase 1: Design and Contracts

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/rest-api.md](./contracts/rest-api.md)
- [quickstart.md](./quickstart.md)

### Acceptance Criteria Coverage

| Spec Item | Plan Coverage |
|-----------|---------------|
| US1 / FR-001-FR-006 | Host id in room model, validated create/join, polling lobby, host-only start gate |
| US2 / FR-007-FR-010 | Active room state, drawer assignment, deterministic word, viewer-specific snapshots |
| US3 / FR-011-FR-017 | Drawing state, clear action, guess validation, guess history, score updates, result transition |
| US4 / FR-018-FR-021 | Result snapshot, host-only restart, state reset, validation/reflection notes |

## Complexity Tracking

No constitutional violations are planned.

