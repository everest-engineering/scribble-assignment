# Implementation Plan: Room Setup & Lobby

**Feature**: Group 1 — Scenario 1 (Room Setup & Lobby)

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Status**: Draft

**Constitution**: Compliant with `.specify/memory/constitution.md` — brownfield extension, HTTP polling
only, in-memory store, no auth, Zod at the boundary, server is source of truth.

## Summary

Add host tracking, join/code validation, verified multi-room isolation, automatic ~2s lobby polling,
and host-only start (≥2 players) that flips the room from `lobby` to `started` and moves every
participant to the game screen. Drawer assignment and secret word selection are deferred to Group 2.
Extends the existing in-memory `roomStore`, Zod schemas, `rooms` router, external `RoomStore`, and
lobby/join pages — no new dependencies, no rewrites.

> **Terminology**: The spec and clarifications use status `"started"`. Some drafts use `"in-round"`;
> they mean the same transition for Group 1. Implementation MUST use `"started"` to match the spec.

## 1. Technical Context

### Tech stack (unchanged — no new dependencies)

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router v6, Vite, TypeScript (strict) |
| Frontend state | Custom `RoomStore` via `useSyncExternalStore` (`frontend/src/state/roomStore.ts`) |
| Backend | Node.js, Express, TypeScript (ESM), `tsx` for dev |
| Validation | Zod (`backend/src/api/schemas.ts`) |
| Storage | In-memory `Map<string, Room>` (`backend/src/services/roomStore.ts`) |
| Sync | HTTP polling every ~2s (`setInterval` calling `GET /rooms/:code`) |

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`.

**Testing**: Extend existing `roomStore.test.ts`, `schemas.test.ts`, `api.test.ts`.

**Scale/Scope**: Classroom-scale rooms; many independent rooms in one process.

### Constraints (from constitution)

- **No WebSockets** — all lobby/game sync is polling.
- **No database** — rooms live only in the in-memory `Map`; lost on restart.
- **No auth** — host identity is a field on the room, not a credential.
- **Extend, don't replace** — reuse existing routes, store, state store, routing, and components.
- **Validate at the boundary** — every payload/param parsed with Zod before logic runs.
- **Server is source of truth** — clients never invent room status locally.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Extend, Don't Replace | Existing files/structure; no new deps; no unrelated refactor | PASS |
| II. Spec-Driven & Traceable | Every change maps to FR-001…FR-019 | PASS |
| III. Deterministic Game Rules | Host/isolation logic pure + unit-tested | PASS (word/scoring N/A here) |
| IV. Validation at Edge | Zod + server-side start enforcement | PASS |
| V. Stay In Scope | Polling only; in-memory; no forbidden features | PASS |

No violations. Complexity Tracking omitted.

## 2. Findings (current starter state)

| Finding | Evidence | Implication for Group 1 |
|---------|----------|-------------------------|
| No host concept | `Room` has no `hostId`; `createRoom` adds creator as plain participant | Add `hostId` on create (Gap 1) |
| Snapshot ignores viewer | `toRoomSnapshot` does `void viewerParticipantId` | Expose `hostId` / `isHost` so clients gate Start (Gap 6) |
| No start endpoint | `rooms.ts` has only create/join/get | Add `POST /:code/start` with host + 2-player gate (Gap 5) |
| Status is a single literal | `RoomStatus = "lobby"` | Widen to `"lobby" \| "started"` |
| No lobby polling | `LobbyPage` only refreshes on button click | Add `setInterval(~2000ms)` (Gap 2) |
| Client-side start only | Start button calls `navigate("/game")` directly | Server-driven start + poll-based navigation |
| Join code partially normalized | `JoinRoomPage` uppercases; backend uppercases param | Add empty/whitespace rejection at edge + client (FR-007) |

**API base URL**: `frontend/src/services/api.ts` defaults to `http://localhost:3001` (no `/bug` in
current tree). Ensure `VITE_API_URL` points at the running backend when testing; treat correct env
as a run precondition (see Risks).

## 3. State Model

### 3.1 Backend model changes (`backend/src/models/game.ts`)

Widen room status and add host tracking. Status gains `started` so the lobby→game transition is
server-driven.

```typescript
export type RoomStatus = "lobby" | "started";

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;          // NEW — participant id of the creator
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;          // NEW — clients gate the Start control
  participants: Array<Participant & { isHost: boolean }>;
  availableWords: string[];
  roles: ParticipantRole[];
}
```

`availableWords` / `roles` remain in the snapshot (starter contract) but are **not consumed** by
Group 1. Word selection and role assignment are Group 2.

### 3.2 Backend store changes (`backend/src/services/roomStore.ts`)

- **`createRoom`**: set `hostId` to the created participant's `id`; initialize `status: "lobby"`.
- **New `startRoom(code, participantId)`** — discriminated result for clean route mapping:

  | Outcome | `reason` | HTTP (route maps) |
  |---------|----------|-------------------|
  | Room missing | `"not-found"` | 404 |
  | Not host | `"forbidden"` | 403 |
  | &lt;2 players | `"too-few-players"` | 422 |
  | Already `started` | — | 200 idempotent (return current room) |
  | Success | — | 200, set `status = "started"`, bump `updatedAt` |

- **`toRoomSnapshot`**: include `hostId` and per-participant `isHost`. Use `viewerParticipantId` only
  for forward-compat / optional `isHost` on viewer; secret word hiding waits until Group 2.

### 3.3 Frontend state changes (`frontend/src/state/roomStore.ts`)

- Mirror `RoomSnapshot`: `hostId`, `status: "lobby" | "started"`, `isHost` on participants.
- Add **`startGame()`**: calls `api.startRoom(code, participantId)`, stores returned snapshot.
- **Polling stays in `LobbyPage`** (not the store): `useEffect` + `setInterval` calling existing
  `fetchRoom()`; cleanup on unmount (FR-010).
- Derive **`isHost`** in components: `room?.hostId === participantId` (keeps store minimal).

## 4. Data Flow

### 4.1 Create → Lobby

`CreateRoomPage` → `roomStore.createRoom(name)` → `POST /rooms` → backend sets `hostId = creator.id`,
`status = "lobby"` → `{ participantId, room }` → store saves session → navigate `/lobby`.

### 4.2 Join → Lobby

`JoinRoomPage` rejects empty/whitespace code client-side (visible message, no request). Otherwise
`joinRoom(code, name)` → `POST /rooms/:code/join` (code trimmed + uppercased at edge). Unknown code →
404 `{ message }` → error shown, no navigation. Success → `/lobby`.

### 4.3 Lobby polling (~2s)

`LobbyPage` mounts → `setInterval(fetchRoom, 2000)`; cleared on unmount. Each tick →
`GET /rooms/:code?participantId=...` → store updates snapshot → participant list re-renders. If
`room.status === "started"` → navigate `/game` (poll-driven transition for non-hosts, FR-017). Fetch
failures set readable error; interval continues; lobby does not crash (FR-019).

### 4.4 Host starts the game

Host clicks Start (enabled only when `isHost && participants.length >= 2`). `roomStore.startGame()` →
`POST /rooms/:code/start { participantId }` → backend validates → `status = "started"`. Host
navigates to `/game` immediately; other tabs reach `/game` on next poll (~2s). Non-host attempt →
403; store sets error; no navigation, no status change.

## 5. File-Level Plan

### Backend

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `hostId` to `Room`; widen `RoomStatus` to `"lobby" \| "started"`; snapshot includes `hostId` + `isHost` on participants |
| `backend/src/services/roomStore.ts` | Set `hostId` in `createRoom`; add `startRoom` with discriminated results + idempotent re-start; include `hostId`/`isHost` in `toRoomSnapshot` |
| `backend/src/api/schemas.ts` | Add `startRoomSchema` (`participantId: z.string().min(1)`); shared code trim/normalize helper; reject empty code |
| `backend/src/api/rooms.ts` | Add `POST /:code/start`; map `startRoom` results to 200 / 403 / 404 / 422 with clear messages |
| `backend/src/api/router.ts` | No change (already mounts `/rooms`; centralized `errorHandler` stays) |
| `backend/src/services/roomStore.test.ts` | Host on create; start gates; isolation; idempotent start |
| `backend/src/api/schemas.test.ts` | `startRoomSchema` validation |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Add `startRoom(code, participantId)`; extend `RoomSnapshot` type |
| `frontend/src/state/roomStore.ts` | Mirror types; add `startGame()` |
| `frontend/src/pages/JoinRoomPage.tsx` | Block submit on empty/whitespace code before request |
| `frontend/src/pages/LobbyPage.tsx` | ~2s polling; host badge; gate Start on `isHost && count >= 2`; `startGame()` + navigate; auto-nav when `status === "started"`; remove manual-only refresh as primary sync |
| `frontend/src/pages/CreateRoomPage.tsx` | No functional change (host is backend-driven) |
| `frontend/src/styles/app.css` | Minor styles only if needed for host badge / disabled-start copy |
| `frontend/src/services/api.test.ts` | `startRoom` URL/body |

## 6. API Contract (Group 1)

See [contracts/rooms-api.md](./contracts/rooms-api.md). Summary:

- **New** `POST /rooms/:code/start` — body `{ participantId }`; 200 / 403 / 404 / 422.
- **Modified** create/join/get snapshots include `hostId`, `status`, `isHost`.

Unchanged route paths; existing `HttpError` + `errorHandler` for messages.

## 7. Implementation Sequence

Each step is a candidate for one granular, traceable commit (Scenario 1).

1. **Model** — widen `RoomStatus`, add `hostId` to `Room` + `RoomSnapshot` participant shape.
2. **Store (host)** — assign `hostId` in `createRoom`; include in `toRoomSnapshot`; fix tests.
3. **Store (start)** — implement `startRoom` with host / min-player / idempotency logic + unit tests.
4. **Schema + route** — `startRoomSchema` + `POST /:code/start` status mapping.
5. **Frontend API + state** — `startRoom` client + `startGame()` action; mirror types.
6. **Join validation** — empty/whitespace code client-side + backend edge.
7. **Lobby polling + start gate** — interval, host indicator, gated Start, poll-driven `/game` nav.
8. **Validate** — two browser tabs per [quickstart.md](./quickstart.md); `npm test` + `npm run build`.

## 8. Testing Strategy

### Automated

- **`roomStore.test.ts`**: `createRoom` sets `hostId`; `startRoom` not-found / forbidden /
  too-few-players; success sets `started`; idempotent when already started; two rooms isolated.
- **`schemas.test.ts`**: `startRoomSchema` rejects missing/empty `participantId`; code param rejects
  empty/whitespace.
- **`api.test.ts`**: `startRoom` posts correct path/body.

### Manual (two browser tabs — constitution quality gates)

1. Tab A creates room → code shown, A is host.
2. Tab B joins → appears in both lists within ~2s without manual refresh.
3. Tab B (non-host) cannot start.
4. With 1 player, host cannot start; with 2+, host starts → both tabs on `/game` within ~2s.
5. Invalid/empty join code → clear error, no navigation.
6. Parallel second room → no cross-room leakage.

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Wrong API base URL at runtime | Confirm backend on `:3001`; set `VITE_API_URL` if needed; no unrelated api.ts refactor in this group |
| Polling overlap / stale closures | `useEffect` cleanup; avoid setState after unmount; optional in-flight guard on `fetchRoom` |
| Poll-driven nav race (host before others) | Acceptable within ~2s per spec; non-hosts transition on next tick via `status === "started"` |
| `RoomStatus` widen breaks exhaustiveness | Update all switches in same slice; TypeScript strict will flag |
| Empty player names (starter) | Out of scope Group 1; Group 2 per spec |
| Scope creep (drawer/word on start) | FR-018 test: start must not assign role or word |

## 10. Out of Scope

Per constitution §V and spec: name trim/reject (Group 2), drawer assignment, secret word, drawing,
guessing, scoring, results, restart, WebSockets, databases, auth, timers, multiple rounds, new
libraries, unrelated refactors.

## Implementation Notes & Deviations (post-execution)

Recorded per constitution Principle II (traceability):

- **T008**: The forward-looking `viewerParticipantId` argument on `toRoomSnapshot` was kept (renamed
  `_viewerParticipantId`, intentionally unused) rather than deleted, since callers still pass a viewer
  id and Group 2 will use it to hide the secret word from guessers. The `void` no-op was removed.
- **LobbyPage UX additions** (within FR-016/FR-019 intent, not new scope): a "(you)" marker next to the
  current participant and a "Leave Lobby" button replacing the old direct-to-game button.
- **T031**: No new CSS was required — existing `form__error` and `player-list__meta` classes covered the
  host badge and disabled-start messaging.
- **Scope guard**: client-side player-name trim/reject was intentionally NOT added (deferred to Group 2
  per §10). Only the in-scope room-code emptiness guard (FR-007) is enforced in `JoinRoomPage`.

## Project Structure (documentation)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/rooms-api.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (next)
```
