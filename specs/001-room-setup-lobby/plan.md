# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Scenario 1 upgrades the starter's manual room flow into a real lobby. On the backend we add
**host tracking** to the in-memory room model, tighten **room-code validation** (trim,
reject empty, case-insensitive lookup, clear not-found feedback), and expose **per-viewer
host identity** plus a **canStart** signal through the room snapshot. On the frontend we
replace the lobby's manual refresh button with **automatic ~2s polling** (started on mount,
stopped on unmount), mark the host in the participant list, and gate the **Start Game**
control to host-only when at least two players are present. No new dependencies; all changes
extend existing files following the established `roomStore.ts` and centralized-error patterns.

## Technical Context

**Language/Version**: TypeScript (ES Modules). Node.js 18+ backend, React 18 frontend.

**Primary Dependencies**: Backend — Express, Zod, `tsx` (run), `node:crypto`. Frontend —
React 18, React Router 6, Vite. No new runtime dependencies introduced.

**Storage**: In-memory only (`Map<string, Room>` in `services/roomStore.ts`). No persistence
(constitutional requirement).

**Testing**: Existing unit tests (`roomStore.test.ts`, `schemas.test.ts`, `api.test.ts`).
Extend with host-tracking, validation, and canStart cases. Manual two-tab validation per spec.

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend
`http://localhost:5173`. Modern browser.

**Project Type**: Web application (Express backend + React frontend monorepo).

**Performance Goals**: Lobby reflects participant changes within ~2s via HTTP polling.
No real-time/push. Minimal memory footprint for rooms.

**Constraints**: No WebSockets, no database, no auth (constitution Principle II). HTTP polling
only. Fully isolated rooms. Deterministic behavior. UI must not crash on transient API errors.

**Scale/Scope**: Small lobbies (a handful of players per room). Single round, "lobby" status
only in this scenario. ~5 backend files and ~4 frontend files touched.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. TypeScript-First & Type Safety | All new code fully typed; no `any`; Zod at request boundaries; centralized backend errors; UI tolerates API failures | PASS — host/canStart fields typed; join uses Zod `.trim().min()`; lobby retains last snapshot on refresh failure |
| II. Architectural Constraints | No WebSockets/DB/auth; HTTP polling ~2s; in-memory state | PASS — polling via `setInterval`; state stays in `Map`; no new infra |
| III. Deterministic Game Rules | Predictable host/start rules | PASS — host = creator (first participant); start allowed iff viewer is host AND participants ≥ 2 |
| IV. Spec-Driven Workflow | Traces to spec FR/SC | PASS — see Requirements Traceability below |
| V. Disciplined AI Usage & Self-Review | Granular commits, consistent with structure | PASS — changes confined to existing api/services/models + pages/state |
| VI. Testing & Validation Discipline | Unit tests for deterministic logic; two-tab validation; both builds pass | PASS — see Testing Strategy |

**Out-of-scope guard**: No player-name validation (Scenario 2), no drawer/word logic, no
multi-round, timers, or persistence. Confirmed against README "Explicitly Out Of Scope".

**Result**: PASS. No violations; Complexity Tracking not required.

## Findings (Discovery)

Gaps in the starter relative to Scenario 1:

1. **No host concept** — `Room` (`models/game.ts`) has no host field; `toRoomSnapshot`
   ignores `viewerParticipantId` (`void viewerParticipantId`), so no client can tell who the
   host is or whether *they* are the host.
2. **Weak code validation** — `roomCodeParamsSchema` is `z.string()` with no trim/min; join
   returns a generic `404 "Unable to join room"`. Empty/whitespace codes aren't meaningfully
   rejected, and there's no distinct "not found" message contract.
3. **Manual refresh only** — `LobbyPage.tsx` exposes a "Refresh Room" button and calls
   `roomStore.fetchRoom()` on click; there is no automatic polling.
4. **Ungated start** — the "Start Game" button is always rendered/enabled for everyone and
   simply navigates to `/game`; no host check, no 2-player minimum.
5. **Snapshot lacks start signal** — nothing tells the client whether starting is currently
   allowed.

Relevant files: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`,
`backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`, `frontend/src/services/api.ts`,
`frontend/src/state/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx`,
`frontend/src/pages/JoinRoomPage.tsx`.

## State Model Changes

**Backend `Room`** (add): `hostId: string` — the participant id of the creator.

**Backend `RoomSnapshot`** (add): `hostId: string`, and per-viewer fields
`viewerParticipantId: string | null`, `isHost: boolean`, `canStart: boolean`
(`isHost && participants.length >= 2`). `toRoomSnapshot` starts honoring `viewerParticipantId`.

**Frontend `RoomState`** (`state/roomStore.ts`): unchanged shape, but the stored
`RoomSnapshot` now carries `hostId`/`isHost`/`canStart`. Add a polling controller
(`startPolling(intervalMs)` / `stopPolling()`) that repeatedly calls `fetchRoom()` and, on
failure, sets a non-fatal error while preserving the last `room` snapshot.

## Data Flow

1. **Create** → `POST /rooms` → `createRoom` sets `hostId` = creator id → snapshot returns
   `isHost: true`, `canStart: false` (1 player) → client stores session, routes to `/lobby`.
2. **Join** → `POST /rooms/:code/join` (code trimmed, upper-cased, validated) → on miss,
   `404 { message: "Room not found" }`; on hit, participant appended → snapshot returns
   `isHost: false`. Client shows clear error or routes to `/lobby`.
3. **Lobby poll** → every ~2s `GET /rooms/:code?participantId=...` → snapshot recomputes
   `participants`, `isHost`, `canStart` for that viewer → store updates → UI re-renders host
   badge, participant list, and Start gating. Interval cleared on unmount.
4. **Start** → enabled only when `canStart` true (host + ≥2). Navigates to `/game`
   (downstream behavior owned by Scenario 2).

## Requirements Traceability

| Spec | Plan element |
|------|--------------|
| FR-001, FR-002, FR-003 | `createRoom` sets `hostId`; snapshot `isHost` |
| FR-004, FR-005 | `joinRoom` with trimmed, upper-cased, validated code |
| FR-006, FR-007 | Zod `.trim().min(1)` on code + distinct `400`/`404` messages |
| FR-008 | Per-room `Map` entry; snapshot built only from that room |
| FR-009 | Snapshot `participants`; lobby list (host marked) |
| FR-010, FR-011 | `startPolling`/`stopPolling` in store; `useEffect` cleanup in `LobbyPage` |
| FR-012, FR-013, FR-014 | `canStart` + host-only Start control with disabled message |
| FR-015 | Poll failure keeps last snapshot, sets soft error |
| FR-016 | In-memory `Map` only |

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── spec.md              # Feature spec
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (REST contracts)
│   └── rooms-api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/game.ts          # add hostId to Room; extend RoomSnapshot
    ├── services/roomStore.ts   # set hostId on create; host-aware toRoomSnapshot + canStart
    ├── api/schemas.ts          # trim + min(1) code validation
    └── api/rooms.ts            # distinct not-found message; pass viewer id through

frontend/
└── src/
    ├── services/api.ts         # RoomSnapshot type gains hostId/isHost/canStart
    ├── state/roomStore.ts      # startPolling/stopPolling; soft-fail refresh
    └── pages/
        ├── LobbyPage.tsx       # auto-poll on mount; host badge; gated Start
        └── JoinRoomPage.tsx    # clearer empty/not-found feedback
```

**Structure Decision**: Web-application layout (Option 2). All work extends existing backend
`api`/`services`/`models` and frontend `pages`/`state`/`services` directories per `AGENTS.md`.
No new directories or libraries.

## Testing Strategy

- **Backend unit** (`roomStore.test.ts`): creator becomes `hostId`; joiner is non-host;
  `canStart` false at 1 player, true at 2+; case-insensitive lookup; two rooms isolated.
- **Backend unit** (`schemas.test.ts`): empty/whitespace code rejected; valid code accepted.
- **Frontend unit** (`api.test.ts`): existing request shape still holds with new fields.
- **Manual two-tab**: create→host badge; join from 2nd tab→appears within ~2s without manual
  refresh; non-existent code→clear message; non-host has no Start; host Start enabled only at
  2+ players.
- **Builds**: `cd backend && npm run build`, `cd frontend && npm run build` both pass.

## Risks & Mitigations

- **Polling overlap / leaks**: guard against overlapping in-flight fetches and always clear
  the interval on unmount (`useEffect` cleanup).
- **Empty code routing**: an empty path segment makes `/rooms//join` ambiguous; validate the
  code client-side before calling and surface "code is required" without a network round-trip.
- **Snapshot back-compat**: adding fields to `RoomSnapshot` is additive; existing consumers
  (`Scoreboard`, etc.) are unaffected.
- **Refresh error noise**: soft errors must not replace a good participant list; store keeps
  last `room` and only annotates `error`.

## Complexity Tracking

No constitutional violations. Section intentionally empty.
