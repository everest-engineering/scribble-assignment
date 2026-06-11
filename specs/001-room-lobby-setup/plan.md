# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-lobby-setup` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-lobby-setup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Enable players to create and join game rooms with unique codes, see live participant
updates via lobby polling, and allow the host to start the game once a minimum of
2 players are present. Rooms are isolated, invalid codes are rejected with clear
feedback, and the creator is automatically the host.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+, target ES2022)

**Primary Dependencies**: Express 4, React 18, React Router v6, Vite 5, Zod

**Storage**: In-memory only (volatile Map-based room store on backend)

**Testing**: Vitest (both backend and frontend)

**Target Platform**: Web browser (modern) + Node.js server

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Room creation and join complete in <2s from user action;
lobby polling at ~2s intervals with minimal payload size

**Constraints**: No WebSockets (HTTP polling only); no databases; no authentication;
`participantId` is the sole identity token; frontend room state held in-memory
(client refresh resets state)

**Scale/Scope**: Lab-scale (2+ concurrent browser tabs, single server process)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **III. Test-First (NON-NEGOTIABLE)**: Tests MUST be written before
  implementation code. Plan must include test tasks. GATE: failing tests required
  before implementation.
- **IV. Validated REST API**: All new API payloads MUST use Zod schemas at the
  boundary. GATE: every new endpoint must have request validation.
- **V. Strict Boundaries**: Polling is HTTP-based (passes); storage is in-memory
  (passes); no auth (uses participantId — passes); scope limited to room setup &
  lobby (passes).

**Status**: No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-lobby-setup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # Room, Participant, Room types + new fields
│   ├── services/
│   │   └── roomStore.ts     # hostId, startGame, polling support
│   ├── api/
│   │   ├── schemas.ts       # New Zod schemas for start/restart
│   │   ├── rooms.ts         # New endpoints: POST /:code/start
│   │   └── router.ts
│   └── app.ts

frontend/
├── src/
│   ├── state/
│   │   └── roomStore.ts     # Auto-polling, host tracking
│   ├── pages/
│   │   ├── LobbyPage.tsx    # Auto-refresh, host UI, start button
│   │   └── GamePage.tsx     # Post-start destination
│   ├── components/
│   │   └── ...
│   └── services/
│       └── api.ts           # startGame method
```

**Structure Decision**: Web application (Option 2) — existing backend/frontend
split in the repository. No new packages or monorepo changes needed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Complexity tracking not required.

## Phase 0: Research

### Unknowns Resolved

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Tech stack | TypeScript, Express, React, Zod, Vitest | Existing project conventions |
| Host tracking | `hostId` field on Room, matched against `participantId` | No auth available; participantId is sole identity |
| Polling mechanism | `setInterval` on LobbyPage, calls `GET /rooms/:code` | Matches existing fetchRoom pattern |
| Error handling on poll failure | Silent retry on next interval, keep stale UI | Clarified during spec review |
| Room code format | 4-char alphanumeric (excl. 0/O/1/I) via Zod validation | Existing starter convention |
| Start game transition | `POST /rooms/:code/start` → room status changes to "playing" | New dedicated endpoint |

### Research Artifacts

- [research.md](./research.md) — consolidated findings

## Phase 1: Design

### Artifacts Generated

- [data-model.md](./data-model.md) — entity definitions, fields, state transitions
- [contracts/api.md](./contracts/api.md) — HTTP API contracts for all endpoints
- [quickstart.md](./quickstart.md) — runnable validation scenarios

### Agent Context

Plan reference updated in `AGENTS.md` between `<!-- SPECKIT START -->` and
`<!-- SPECKIT END -->` markers.
