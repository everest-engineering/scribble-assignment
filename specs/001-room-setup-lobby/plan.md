# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Implement Scenario 1 lobby lifecycle on the existing Scribble starter: track `hostId` on room creation, validate join codes (client + server), reject post-start joins, poll the lobby every ~2 s, and add a host-only `POST /rooms/:code/start` that flips status to `playing` and triggers auto-navigation to `/game` for all clients. Extends brownfield files in `backend/src` and `frontend/src` without new dependencies.

## Technical Context

**Language/Version**: TypeScript on Node.js 18+ (backend) and ES2020+ (frontend via Vite)

**Primary Dependencies**: Express 4, Zod, React 18, React Router v6, Vitest (backend tests)

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts` — no persistence

**Testing**: Vitest for backend service/API unit tests; manual two-tab validation per [quickstart.md](./quickstart.md)

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`

**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

**Performance Goals**: Lobby participant updates visible within ~3 s (2 s poll interval + network)

**Constraints**: HTTP polling only; no WebSockets/DB/auth; no drawer/word/gameplay in this slice

**Scale/Scope**: Single lab room count (dozens of concurrent rooms in memory); 4 lobby/start/join API changes + 2 page updates + client store

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (Scribble Constitution v1.0.0)

| Gate | Requirement | Pass? |
|------|-------------|-------|
| Brownfield First | Plan extends existing starter files; no rewrite-from-scratch | ✅ |
| Spec traceability | Feature maps to spec acceptance criteria and ordered tasks | ✅ |
| Scope constraints | HTTP polling only; in-memory state; no auth; no out-of-scope items | ✅ |
| TypeScript & Zod | Typed changes; backend payloads validated with Zod | ✅ |
| Deterministic rules | Host/code rules deterministic; word/scoring N/A this slice | ✅ |
| Incremental validation | Slice verifiable with two browser tabs ([quickstart.md](./quickstart.md)) | ✅ |
| Build health | `npm run build` passes in `backend/` and `frontend/` | ✅ (target) |

Post-design re-check: All gates pass. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entity/state model
├── quickstart.md        # Manual validation steps
├── contracts/
│   └── rooms-api.md     # REST contract extensions
└── tasks.md             # Phase 2 (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts           # +hostId, status "playing"
│   ├── services/roomStore.ts    # hostId, join guard, startGame()
│   ├── services/roomStore.test.ts
│   └── api/
│       ├── schemas.ts           # room code + start schemas
│       └── rooms.ts             # +POST /:code/start, join errors
└── package.json

frontend/
├── src/
│   ├── services/api.ts          # types + startGame()
│   ├── state/roomStore.ts       # startGame(), polling consumer
│   ├── utils/roomCode.ts        # NEW — validate/normalize
│   └── pages/
│       ├── LobbyPage.tsx        # poll, host UI, start API
│       └── JoinRoomPage.tsx     # client validation
└── package.json
```

**Structure Decision**: Web app layout (Option 2). All changes stay within existing `backend/src` and `frontend/src` trees per `AGENTS.md`.

## Implementation Sequence

Execute in order; each step should be committable.

### Phase A — Backend model & service

1. **`game.ts`**: Add `hostId: string` to `Room`; extend `RoomStatus` to `"lobby" | "playing"`; add `hostId` to `RoomSnapshot`.
2. **`roomStore.ts`**:
   - Set `hostId` to creator's participant id in `createRoom`.
   - Include `hostId` in `toRoomSnapshot`.
   - In `joinRoom`: return `{ error: "not_found" }` vs `{ error: "in_progress" }` or throw typed errors; reject when `status !== "lobby"`.
   - Add `startGame(code, participantId)` with host + min-players checks.
3. **`roomStore.test.ts`**: Cover hostId on create, join rejected when playing, start auth and player count.

### Phase B — Backend API

4. **`schemas.ts`**: Add `roomCodeSchema` (4-char alphabet regex), `startGameSchema` (`participantId`).
5. **`rooms.ts`**:
   - Map join failures to 404 / 409 with spec messages.
   - Add `POST /:code/start` route.
6. Update error messages to match [contracts/rooms-api.md](./contracts/rooms-api.md).

### Phase C — Frontend API & validation

7. **`api.ts`**: Mirror snapshot types (`hostId`, `"playing"` status); add `startGame(code, participantId)`.
8. **`utils/roomCode.ts`**: `normalizeRoomCode`, `validateRoomCode` → `{ ok: true } | { ok: false, message }`.
9. **`JoinRoomPage.tsx`**: Validate before submit; map API errors to user strings.

### Phase D — Lobby UX & polling

10. **`roomStore.ts`**: Add `startGame()` wrapping API call and snapshot update.
11. **`LobbyPage.tsx`**:
    - `useEffect` interval ~2000 ms calling `fetchRoom()`; cleanup on unmount.
    - On snapshot update, if `status === "playing"` → `navigate("/game", { replace: true })`.
    - Render `(Host)` when `participant.id === room.hostId`.
    - Show **Start Game** only when `participantId === hostId`; disable with message if `< 2` players.
    - Wire Start to `roomStore.startGame()` (not direct navigate).
    - Keep **Refresh Room** button (clarification Q3).

### Phase E — Validation

12. Run [quickstart.md](./quickstart.md) checklist with two tabs.
13. `npm run build` in both apps.

## Data Flow

```text
Create/Join → roomStore session (participantId + snapshot)
Lobby mount → setInterval 2s → GET /rooms/:code → update snapshot
              if status=playing → navigate /game
Host Start  → POST /rooms/:code/start → snapshot status=playing
              all clients pick up via poll → auto navigate
Join (late) → POST join → 409 if playing
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Polling continues after navigate | Clear interval in `useEffect` cleanup |
| Race: start before poll | Host navigates on successful start response OR next poll |
| Generic API errors | Map status codes in `api.ts` / pages per contract |
| GamePage accessible without start | Optional guard: redirect to lobby if `status === "lobby"` (defer if out of slice) |

## Complexity Tracking

> No constitution violations. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

## Artifacts Generated

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| API contract | [contracts/rooms-api.md](./contracts/rooms-api.md) |
| Quickstart | [quickstart.md](./quickstart.md) |

**Next command**: `/speckit-tasks` to decompose into ordered implementation tasks.
