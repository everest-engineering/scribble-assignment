# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-assignment` (single-branch lab) | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

**Feature Group**: 1 of 4 — Scenario 1

## Summary

Extend the existing in-memory room flow so that (a) the room creator is recorded as **host**, (b) joining
rejects empty and unknown codes with distinct messages, (c) the lobby **auto-polls every ~2s**, and (d) a
**host-only start** endpoint transitions the room to a started state once ≥2 players are present, after
which all players' clients auto-advance to the game screen on their next poll. The approach is a brownfield
extension of the current `Room` model, the `/rooms` router, and the lobby UI — no new dependencies, no
real-time transport, polling only.

## Technical Context

**Language/Version**: TypeScript (backend Node 18+ / ESM; frontend React 18 + Vite)

**Primary Dependencies**: Backend — Express, Zod (existing). Frontend — React, React Router, custom store via `useSyncExternalStore` (existing). **No new dependencies.**

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` (no database — per constitution).

**Testing**: Vitest (existing `*.test.ts` in both packages); manual two-browser validation per constitution Principle V.

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`.

**Project Type**: Web application (frontend + minimal REST backend).

**Performance Goals**: Lobby reflects membership changes within ~2s (poll interval). No throughput targets.

**Constraints**: Polling-only sync (no WebSockets); no auth/sessions/persistence; reuse existing routes/state; only touch files related to this group.

**Scale/Scope**: A handful of concurrent rooms, a few players each; single-process in-memory store.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Specification Before Implementation | Spec + acceptance criteria exist and are clarified before planning | ✅ spec.md + clarifications committed |
| II. Incremental Delivery | Work is scoped to Group 1 only; later groups deferred | ✅ scope fenced in spec Assumptions |
| III. Brownfield Enhancement | Extend existing model/routes/UI; no rewrite; touch only related files | ✅ see Project Structure (edits to existing files + 1 new endpoint handler) |
| IV. Simplicity Over Expansion | No WebSockets, DB, auth, or new libraries | ✅ polling only; `status` enum widened by one value; no new deps |
| V. Validation First | Plan defines observable two-browser validation | ✅ quickstart.md |
| VI. AI Responsibility | Plan to be reviewed before implementing | ✅ checkpoint before `/speckit.implement` |
| VII. Traceability | Each design element maps to FR IDs | ✅ data-model & contracts cite FRs |
| VIII. Commit Discipline | Granular commits per slice | ✅ task ordering supports this |

**Result: PASS** — no violations; Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── spec.md              # Feature spec (+ Clarifications)
├── research.md          # Phase 0 — decisions & rationale
├── data-model.md        # Phase 1 — Room/Participant/Snapshot model + state machine
├── quickstart.md        # Phase 1 — two-browser validation guide
├── contracts/
│   └── rooms-api.md     # Phase 1 — REST contract for /rooms (incl. new start endpoint)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
backend/src/
├── models/game.ts            # EDIT: add hostId to Room/RoomSnapshot; widen RoomStatus to "lobby" | "active"
├── services/roomStore.ts     # EDIT: set host on create; add startGame(); expose hostId via toRoomSnapshot
├── api/schemas.ts            # EDIT: add startRoomSchema (participantId); keep code/join schemas
├── api/rooms.ts              # EDIT: POST /:code/start handler; 404 message → "No room with that code."
└── api/router.ts             # (no change — /rooms already mounted)

frontend/src/
├── services/api.ts           # EDIT: add startRoom(); expose hostId/status on RoomSnapshot type
├── state/roomStore.ts        # EDIT: add startGame(); helpers already store participantId
├── pages/JoinRoomPage.tsx    # EDIT: trim + reject empty code with "Enter a room code." before calling API
├── pages/LobbyPage.tsx       # EDIT: 2s polling; host badge; host-only gated Start; auto-advance on "active"
└── pages/CreateRoomPage.tsx  # (no change required for Group 1; name validation is Group 2)
```

**Structure Decision**: Web-application layout (existing `backend/` + `frontend/`). All changes are edits to
existing files plus one new backend route handler and one new client action. No new modules, no new
top-level directories, consistent with brownfield Principle III.

## Phase 0 — Research

See [research.md](./research.md). All spec `[NEEDS CLARIFICATION]` were resolved in `/speckit.clarify`;
research records the resulting technical decisions (host representation, start-state value, polling
mechanism, error surfacing) with rationale and rejected alternatives.

## Phase 1 — Design & Contracts

- **Data model**: [data-model.md](./data-model.md) — `Room` gains `hostId`; `RoomStatus` widens to
  `"lobby" | "active"`; `RoomSnapshot` exposes `hostId` and `status`. Includes the lobby→active state machine.
- **Contracts**: [contracts/rooms-api.md](./contracts/rooms-api.md) — documents existing `POST /rooms`,
  `POST /rooms/:code/join`, `GET /rooms/:code` plus the **new** `POST /rooms/:code/start`, with request/
  response shapes, status codes, and error bodies traced to FRs.
- **Quickstart**: [quickstart.md](./quickstart.md) — two-browser validation script covering host badge,
  join errors, isolation, polling, and host-only start + auto-advance.
- **Agent context**: `CLAUDE.md` SPECKIT block updated to point at this plan.

## Data Flow (summary)

1. **Create** → `POST /rooms` → store sets `hostId = creator.id`, `status = "lobby"` → returns
   `{ participantId, room }`; client stores `participantId`, renders lobby with host badge.
2. **Join** → client trims code; empty → "Enter a room code." (no request); otherwise
   `POST /rooms/:code/join` → 404 "No room with that code." if unknown, else returns snapshot.
3. **Poll** → lobby `setInterval(2000)` → `GET /rooms/:code?participantId=…` → updates participant list;
   `isHost = participantId === room.hostId`; Start enabled iff `isHost && participants.length >= 2`.
4. **Start** → host clicks → `POST /rooms/:code/start { participantId }` → server verifies host + ≥2
   players → `status = "active"`. Every client's next poll sees `status === "active"` → navigates to `/game`.

## Complexity Tracking

*No constitution violations — section intentionally empty.*
