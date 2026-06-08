# Implementation Plan: Room & Lobby Management

**Branch**: `001-room-lobby-management` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-lobby-management/spec.md`

## Summary

Extend the existing Scribble starter so players can host or join a drawing room via a unique 4-character code, with the creator becoming host, robust code validation, full room isolation, a live lobby that refreshes via ~2-second REST polling, presence tracking via a last-seen heartbeat, and a host-only "start game" action gated on at least 2 players. All state lives in the existing in-memory `roomStore`; no new transport, storage, or dependencies are introduced. The feature ends at the transition into the game (status flips to `playing`); actual gameplay is a later increment.

## Technical Context

**Language/Version**: TypeScript (Node.js backend, React 18 frontend) — versions per existing `package.json` files; no upgrades.

**Primary Dependencies**: Backend — Express, Zod (existing). Frontend — React, React Router, Vite (existing). **No new dependencies.**

**Storage**: In-memory `Map<code, Room>` in `backend/src/services/roomStore.ts` only. No database, file, or cache persistence (Constitution IV).

**Testing**: Vitest (backend unit tests for `roomStore` and `schemas`; frontend has `api.test.ts`). Manual two-browser acceptance is the primary gate (Constitution: Technology Constraints).

**Target Platform**: Local dev — backend on `http://localhost:3001`, frontend Vite dev server; modern browsers.

**Project Type**: Web application (separate `backend/` + `frontend/`).

**Performance Goals**: Lobby reflects join/leave within ~2s (one poll cycle). Departure detected within ~10s of last poll. Create/join visible to user in <5s (spec SC-001/SC-002).

**Constraints**: REST polling only — each refresh is a plain `GET /rooms/:code` (Constitution III). No WebSockets/streaming/push. No server-side timers/intervals — presence pruning is **lazy** (computed on read). Capacity fixed at 8. Code format 4-char uppercase alphanumeric (already produced by starter).

**Scale/Scope**: Small party game — up to 8 players per room, modest number of concurrent rooms; single-process in-memory store.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield Respect | ✅ PASS | `discovery.md` exists (5 incomplete behaviors, 2 assumptions, relevant files). This plan extends existing `roomStore`, `rooms` router, and `LobbyPage` — no rewrite. |
| II. Spec-Driven Increments | ✅ PASS | Following specify → clarify → plan; one business scenario (room & lobby). Every change traces to an FR. |
| III. Polling, Not Real-Time | ✅ PASS | Lobby liveness via `GET /rooms/:code` at ~2s. No new transport. Presence is heartbeat-on-poll, pruned lazily on read — no push, no server timers. |
| IV. Strict Scope Discipline | ✅ PASS | In-memory only; no auth; no new top-level dependency. Out-of-scope items (rounds, timers, drawer rotation, scoring) explicitly NOT built. `status: "playing"` is only a transition flag, not gameplay. |
| V. Self-Review Before Commit | ✅ PASS | Trim/empty-check/case-insensitive validations included; regression-aware (existing tests preserved); commits traceable to task IDs (next phase). |

**Gate result: PASS.** No violations → Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-lobby-management/
├── plan.md              # This file
├── research.md          # Phase 0 — technical decisions
├── data-model.md        # Phase 1 — entities, fields, state transitions
├── quickstart.md        # Phase 1 — run & two-browser validation
├── contracts/
│   └── rooms-api.md     # Phase 1 — REST endpoint contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 — created by /speckit-tasks (NOT here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # MODIFY: add POST /:code/start; pass viewer id to snapshot on GET
│   │   ├── router.ts         # (unchanged) error/not-found handlers reused
│   │   └── schemas.ts        # MODIFY: startRoomSchema; keep code/viewer schemas
│   ├── models/
│   │   └── game.ts           # MODIFY: RoomStatus += "playing"; Room.hostId; Participant.lastSeenAt; expose hostId in snapshot
│   ├── services/
│   │   └── roomStore.ts      # MODIFY: host assignment, capacity, name disambiguation, heartbeat touch + lazy prune, startGame, host-leave close
│   └── seed/starterData.ts   # (unchanged)
└── src/**/*.test.ts          # EXTEND: roomStore + schemas tests for new behavior

frontend/
├── src/
│   ├── pages/
│   │   ├── LobbyPage.tsx      # MODIFY: ~2s polling, host indicator, host-only Start (min 2), closed-room ejection, navigate on "playing"
│   │   ├── JoinRoomPage.tsx   # MODIFY: empty-code guard + clearer error messages
│   │   └── CreateRoomPage.tsx # (minor) ensure name passed; no structural change
│   ├── services/api.ts        # MODIFY: add startRoom(); surface status code on errors; types for hostId/status union
│   └── state/roomStore.ts     # MODIFY: startGame(); handle room-closed (404) during polling
└── src/**/*.test.ts           # EXTEND: api test for start endpoint
```

**Structure Decision**: Web application (Option 2). Reuse the existing `backend/` + `frontend/` layout exactly. No new top-level directories. All room/game state stays in `backend/src/services/roomStore.ts` (Constitution: State boundary); frontend state remains derived from polling.

## Complexity Tracking

> No constitution violations — no entries required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | — | — |

## Phase 0 — Research

See [research.md](./research.md). All technical unknowns resolved (host representation, lazy heartbeat pruning, host-leave closure signalling, name disambiguation, start-game gating, frontend polling lifecycle). No remaining NEEDS CLARIFICATION.

## Phase 1 — Design & Contracts

- [data-model.md](./data-model.md) — Room, Participant, RoomSnapshot fields, constants (`MAX_PLAYERS = 8`, `PRESENCE_TIMEOUT_MS = 10000`, `POLL_INTERVAL_MS = 2000`), and the lobby → playing → closed state transitions with FR traceability.
- [contracts/rooms-api.md](./contracts/rooms-api.md) — REST contracts for `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`, and the new `POST /rooms/:code/start`, including status codes and error bodies.
- [quickstart.md](./quickstart.md) — how to run both servers and the two-browser acceptance script mapped to user stories.
- Agent context: `CLAUDE.md` SPECKIT block updated to reference this plan.

**Post-Design Constitution Re-Check: PASS** — design adds no dependencies, no transport, no persistence; one new REST endpoint reusing existing patterns; presence handled without timers.
