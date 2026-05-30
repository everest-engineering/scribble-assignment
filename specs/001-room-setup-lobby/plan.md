# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Extend the existing Scribble starter so players can create and join isolated rooms, see a
live lobby via HTTP polling (~2s), and let only the host start the game when at least two
participants are present. Work is brownfield: add `hostParticipantId` and a `playing` room
status on the backend, expose a host-only start endpoint, enrich the room snapshot for lobby
UI, and replace manual-only lobby refresh with automatic polling plus start-game gating on
the frontend.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+, ES modules) on backend and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts` (no persistence)

**Testing**: Vitest (`backend` unit tests for room store and schemas); manual two-browser
validation for lobby polling and start-game flows; `npm run build` in both apps before handoff

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`

**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

**Performance Goals**: Lobby snapshot refresh within ~2s; API responses suitable for
low-traffic lab use (no formal SLA)

**Constraints**: HTTP polling only; no WebSockets, databases, or auth; minimal diffs to starter
files; name trimming deferred to Scenario 2

**Scale/Scope**: Single-room lab sessions, 2–8 players per room, four user stories (P1–P4),
one new REST endpoint (`POST /rooms/:code/start`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md` (Scribble v1.0.0):

- [x] **Brownfield First**: Plan extends starter files; no rewrite-from-scratch or unrelated refactors
- [x] **TypeScript + Zod**: New start endpoint and schema updates use Zod; models typed in `game.ts` and `api.ts`
- [x] **HTTP Polling Only**: Lobby sync via `setInterval` + `GET /rooms/:code`; no push protocols
- [x] **Spec Kit Traceability**: Plan maps FR-001–FR-013 to files, data model, and contracts below
- [x] **Deterministic Game Rules**: Host-on-create and 2-player start gate covered; drawer/word logic deferred to Scenario 2
- [x] **Out-of-Scope Clean**: No new libraries, timers, or multi-round logic in this slice
- [x] **Validation Plan**: Two-browser manual test steps in [quickstart.md](./quickstart.md); builds required

## Discovery Findings (Starter Gaps)

| Gap | Relevant files | Spec refs |
|-----|----------------|-----------|
| No host tracking on room create | `backend/src/services/roomStore.ts`, `backend/src/models/game.ts` | FR-002, FR-013 |
| Join form lacks empty-code client validation | `frontend/src/pages/JoinRoomPage.tsx` | FR-004 |
| Lobby uses manual refresh only | `frontend/src/pages/LobbyPage.tsx` | FR-008, FR-009 |
| Start Game visible to all; no player minimum | `frontend/src/pages/LobbyPage.tsx` | FR-010, FR-011, FR-012 |
| No start-game API | `backend/src/api/rooms.ts` | FR-010, FR-011 |
| `RoomSnapshot` has no host indicator | `backend/src/models/game.ts`, `toRoomSnapshot()` | FR-013 |
| `RoomStatus` is only `"lobby"` | `backend/src/models/game.ts` | US4 handoff |
| Game page does not guard lobby status | `frontend/src/pages/GamePage.tsx` | Edge case: bookmarked `/game` |
| Default API URL typo (`/bug` suffix) | `frontend/src/services/api.ts` | Blocks local dev if unset |

**Assumptions documented in spec**: duplicate display names allowed; case-insensitive room codes;
participant identity via `participantId` returned at create/join.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entity design
├── quickstart.md        # Manual validation steps
├── contracts/
│   └── rooms-api.md     # REST contract deltas
└── tasks.md             # Phase 2 (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # Add POST /:code/start; extend snapshots
│   │   └── schemas.ts        # startRoomSchema, stricter join code validation
│   ├── models/
│   │   └── game.ts           # hostParticipantId, RoomStatus "playing", snapshot fields
│   └── services/
│       └── roomStore.ts      # host on create, startRoom(), snapshot builder
└── src/services/roomStore.test.ts

frontend/
├── src/
│   ├── pages/
│   │   ├── JoinRoomPage.tsx  # Client-side empty/whitespace code rejection
│   │   ├── LobbyPage.tsx     # Polling, host badge, gated start button
│   │   └── GamePage.tsx      # Redirect if status still "lobby"
│   ├── services/
│   │   └── api.ts            # startRoom(); fix default API base URL; type updates
│   └── state/
│       └── roomStore.ts      # startGame(); silent poll vs loading poll
```

**Structure Decision**: Web application layout (Option 2). All changes stay within existing
`backend/src/{api,models,services}` and `frontend/src/{pages,services,state}` paths.

## Data Flow

```text
Create Room
  CreateRoomPage → roomStore.createRoom → POST /rooms
  → roomStore set session → navigate /lobby

Join Room
  JoinRoomPage (validate code) → roomStore.joinRoom → POST /rooms/:code/join
  → navigate /lobby

Lobby Polling (every ~2000ms while on /lobby)
  LobbyPage useEffect → roomStore.fetchRoom (silent) → GET /rooms/:code?participantId=
  → update participant list; if status === "playing" → navigate /game

Start Game (host only, ≥2 players)
  LobbyPage → roomStore.startGame → POST /rooms/:code/start { participantId }
  → backend sets status "playing" → next poll (or immediate response) → all clients → /game
```

## Implementation Sequence

1. **Backend model & store** — Add `hostParticipantId`, extend `RoomStatus`, update
   `createRoom`, `toRoomSnapshot` (include `hostParticipantId` and per-participant `isHost`).
2. **Backend start endpoint** — `startRoom(code, participantId)` with host and min-player
   checks; wire `POST /rooms/:code/start` with Zod schema.
3. **Backend tests** — Host assignment, start rejection for non-host and single player.
4. **Frontend types & API** — Mirror snapshot shape; add `startRoom()`; fix default
   `API_BASE_URL`.
5. **Join validation** — Trim/reject empty room code on client before request.
6. **Lobby polling & UI** — 2s interval, cleanup on unmount, host badge, gated start button
   with messaging, optional manual refresh retained.
7. **Game guard & navigation** — Redirect `/game` → `/lobby` when status is `lobby`; auto-
   navigate all lobby clients when status becomes `playing`.
8. **Manual validation** — Follow [quickstart.md](./quickstart.md) with two browser tabs.

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Unit | Vitest for `roomStore` host/start rules and Zod schemas |
| Integration | Manual two-browser flows per quickstart |
| Build | `npm run build` in `backend/` and `frontend/` |
| Regression | Existing create/join tests continue to pass |

## Risks

| Risk | Mitigation |
|------|------------|
| Polling sets global `isLoading` and flickers UI | Use silent fetch path in `roomStore` for poll ticks |
| Non-host starts via direct API call | Backend enforces host + lobby status; return 403 |
| Clients miss start transition | Poll detects `status === "playing"` and navigates |
| `/bug` API URL breaks local testing | Fix default to `http://localhost:3001` in plan step 4 |

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
