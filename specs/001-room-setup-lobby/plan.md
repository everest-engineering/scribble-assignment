# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-lab` (spec dir `001-room-setup-lobby`) | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Add a host concept to the in-memory room model, expose it in the snapshot,
strengthen join validation with specific client-side messaging, and make the
lobby live via ~2s polling with a host-only, ≥2-player Start control. No new
endpoints are required for this scenario; it builds on the existing
`POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code`.

## Technical Context

**Language/Version**: TypeScript (Node 18+ backend, React 18 frontend)

**Primary Dependencies**: Express + Zod (backend); React + React Router v6 + Vite
(frontend). No new top-level dependencies.

**Storage**: In-memory `Map<string, Room>` (no DB).

**Testing**: Vitest (backend `roomStore.test.ts`/`schemas.test.ts`, frontend
`api.test.ts`) plus manual two-tab browser validation.

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`.

**Project Type**: Web application (separate `backend/` + `frontend/`).

**Performance Goals**: Lobby reflects roster changes within ~2s (polling cadence).

**Constraints**: Polling only (no WebSockets); in-memory only; no auth.

**Scale/Scope**: Small lab — a handful of rooms, a few players each.

## Constitution Check

*GATE: must pass before and after design.*

- **I. Brownfield-First** — PASS. Extends existing files (`game.ts`,
  `roomStore.ts`, `api.ts`, `LobbyPage.tsx`, `JoinRoomPage.tsx`,
  `state/roomStore.ts`); no rewrites, no new libraries.
- **II. Spec-Driven** — PASS. Every change traces to an FR in
  [spec.md](./spec.md); ran specify → clarify before this plan.
- **III. Deterministic Game Rules** — N/A for this scenario (no word/score yet);
  room code generation is the existing logic and unchanged.
- **IV. Polling-Only** — PASS. Lobby uses `setInterval(2000)` + `GET /rooms/:code`
  with `clearInterval` cleanup; no push.
- **V. Incremental Validation** — PASS. Validated via two tabs + both builds +
  vitest before Scenario 2.
- **VI. AI Review Discipline** — PASS. Granular commits, line-by-line review, no
  co-author line.

No violations → Complexity Tracking empty.

## State Model

### Backend (`backend/src/models/game.ts`)

```
Room {
  code: string
  status: "lobby"            // unchanged this scenario
  hostId: string             // NEW — id of the creating participant
  participants: Participant[]
  createdAt, updatedAt: string
}

RoomSnapshot {
  code, status, participants, availableWords, roles   // existing
  hostId: string             // NEW — surfaced to clients
}
```

`Participant` is unchanged. The host is `participants.find(p => p.id === hostId)`.

### Frontend (`frontend/src/services/api.ts` types + `state/roomStore.ts`)

- `RoomSnapshot` type mirrors the backend: add `hostId: string`.
- `RoomState` gains no new fields; `participantId` already stored. Host check is
  derived: `room.hostId === participantId`.
- A polling loop lives in `LobbyPage` via `useEffect` (not the store), so the
  interval is tied to the component lifecycle and cleaned up on unmount.

## Data Flow

1. **Create**: `POST /rooms` → `createRoom()` sets `hostId = creator.id` →
   snapshot (now with `hostId`) → store `setRoomSession` → navigate to `/lobby`.
2. **Join (valid)**: `JoinRoomPage` trims code; if non-empty →
   `POST /rooms/:code/join` → snapshot → `/lobby`.
3. **Join (empty)**: client rejects with "Room code is required"; no request.
4. **Join (unknown)**: backend 404 → client maps to "Room not found — check your
   code and try again".
5. **Lobby polling**: `LobbyPage` `useEffect` starts `setInterval(2000)` calling
   `roomStore.fetchRoom()`; each tick refreshes the snapshot; `clearInterval` on
   unmount. A failed tick keeps the last roster + subtle note.
6. **Start gating**: host-only Start button, `disabled` until
   `participants.length >= 2`; non-hosts see "Waiting for host to start…".

## File-Level Plan

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `hostId` to `Room` and `RoomSnapshot`. |
| `backend/src/services/roomStore.ts` | Set `hostId` in `createRoom`; include `hostId` in `toRoomSnapshot`. |
| `backend/src/services/roomStore.test.ts` | Assert `hostId === creator id`; assert room isolation. |
| `frontend/src/services/api.ts` | Add `hostId` to `RoomSnapshot` type. (`/bug` base-URL already fixed in discovery.) |
| `frontend/src/pages/JoinRoomPage.tsx` | Trim + empty-code guard with exact message; map 404 → not-found message. |
| `frontend/src/pages/LobbyPage.tsx` | Add 2s polling `useEffect` w/ cleanup; host "(Host)" indicator; host-only, ≥2-player Start; non-host waiting message; resilient poll. |

## Testing Strategy

- **Unit (vitest)**: `roomStore` — `createRoom` sets `hostId`; two rooms are
  isolated; `toRoomSnapshot` includes `hostId`.
- **Manual two-tab**: create in tab A (see "(Host)"), join in tab B, confirm A
  updates within ~2s; confirm Start disabled at 1 player, enabled for host at 2,
  absent for non-host; confirm empty/unknown code messages.
- **Builds**: `cd backend && npm run build`; `cd frontend && npm run build` — both
  zero errors.

## Risks

- **Polling churn**: a 2s interval calling `fetchRoom` could surface transient
  errors; mitigated by FR-011 (retain last roster, no redirect on single failure).
- **Host identity after creator leaves**: out of scope; documented assumption (no
  reassignment). If the host closes the tab, the room keeps the stale `hostId`.
- **Type drift**: backend and frontend `RoomSnapshot` must stay in sync; both
  updated in the same slice and covered by the build.

## Project Structure

```text
specs/001-room-setup-lobby/
├── spec.md
├── plan.md          # this file
├── checklist.md     # /speckit.checklist output
└── tasks.md         # /speckit.tasks output
```

**Structure Decision**: Existing web-app layout (`backend/` + `frontend/`) is
reused as-is; no new directories.

## Complexity Tracking

No constitution violations — none.
