# Implementation Plan: Room Setup and Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Extend the working starter to fully implement Scenario 001: add explicit `hostId` tracking on rooms,
harden player-name validation (trimmed, non-empty, max 20 chars), add client-side room-code format
validation (alphanumeric-only), reject joins on non-lobby rooms, add a host-only game-start endpoint
with a ≥2 player gate, implement ~2 s lobby polling so new participants appear automatically, and
surface a host-indicator and Start Game button in the lobby UI. Fix the pre-existing API URL bug.

## Technical Context

**Language/Version**: TypeScript 5.6 — Node.js 22 (backend); React 18 / Vite 5 (frontend)
**Primary Dependencies**: Express 4.x, Zod 3.x (backend); React 18, React Router 6 (frontend)
**Storage**: In-memory `Map<string, Room>` — no persistence, resets on restart
**Testing**: Vitest (both backend and frontend)
**Target Platform**: Node.js server + evergreen browser
**Project Type**: Full-stack web application (brownfield extension)
**Performance Goals**: Create/join round-trip < 3 s; lobby poll cadence ≈ 2 s; no frame drops
**Constraints**: No WebSockets; no DB; no auth; HTTP polling only; in-memory state only
**Scale/Scope**: Single backend process; up to 8 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — all gates still pass.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| P1 Brownfield | All changes extend existing files; no folder restructuring | ✅ PASS | No new top-level directories; only existing files modified + one new route added |
| P2 Spec-driven | Every changed behavior traces to a spec.md FR | ✅ PASS | All 15 FRs mapped to concrete file changes in plan |
| P3 Scope | No WebSockets, DB, auth, new routing/state libraries | ✅ PASS | Polling via `setInterval`; in-memory only; no new npm packages required |
| P4 TypeScript | No `any`; shared shapes in `game.ts`; immutable updates | ✅ PASS | `hostId` added to `game.ts`; frontend types mirror backend; `structuredClone` retained |
| P5 Validation | Zod on all inputs; `HttpError` for errors; frontend never crashes | ✅ PASS | `playerName` schema updated; `startGameSchema` added; all error paths surface via `withLoading` |
| P6 Deterministic | No `Math.random()` in gameplay; code gen is infrastructure | ✅ PASS | Code generation uses `Math.random()` only for unique room codes (not gameplay); no game word selection in this scenario |
| P7 State model | `hostId` explicit; snapshot includes `hostId`; status expanded | ✅ PASS | `Room.hostId` and `RoomSnapshot.hostId` both added |
| P8 Testing | Existing tests green; new logic has unit tests | ✅ PASS | New tests cover: name validation, `joinRoom` status gate, `startRoom` logic, `toRoomSnapshot` hostId |
| P9 AI usage | All diffs reviewed against spec before commit | ✅ PASS | Process requirement |
| P10 Commits | One coherent slice per commit | ✅ PASS | Process requirement |

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md          # This file
├── research.md      # Phase 0 output
├── data-model.md    # Phase 1 output
├── quickstart.md    # Phase 1 output
├── contracts/
│   └── api.md       # Phase 1 output
└── tasks.md         # Phase 2 output (/speckit-tasks)
```

### Source Code — Files Changed by This Scenario

```text
backend/
└── src/
    ├── models/
    │   └── game.ts              # Add hostId to Room + RoomSnapshot; expand RoomStatus
    ├── api/
    │   ├── schemas.ts           # Make playerName required+validated; add startGameSchema
    │   └── rooms.ts             # Fix join error messages; add POST /:code/start route
    └── services/
        ├── roomStore.ts         # createRoom stores hostId; joinRoom checks status;
        │                        #   add startRoom(); toRoomSnapshot includes hostId
        └── roomStore.test.ts    # New tests for name validation, status gate, startRoom

frontend/
└── src/
    ├── services/
    │   ├── api.ts               # Fix URL bug (/bug→/api); add hostId to types; add startGame()
    │   └── api.test.ts          # Add test for startGame call shape
    ├── state/
    │   └── roomStore.ts         # Add startGame() method
    └── pages/
        ├── CreateRoomPage.tsx   # Validate name non-empty before submit
        ├── JoinRoomPage.tsx     # Client-side alphanumeric code validation
        └── LobbyPage.tsx        # Add polling, host indicator, Start Game button, nav on active
```

## Implementation Notes

### Backend changes (in dependency order)

1. **`game.ts`** — add `hostId: string` to `Room` and `RoomSnapshot`; expand `RoomStatus` to
   `"lobby" | "active" | "ended"`. This is the foundational type change all other changes depend on.

2. **`schemas.ts`** — update `createRoomSchema` and `joinRoomSchema` so `playerName` is
   `z.string().trim().min(1, "Name is required").max(20)`; add
   `startGameSchema = z.object({ participantId: z.string().uuid() })`.

3. **`roomStore.ts`** — four changes:
   - `createRoom(playerName: string)` — parameter is now required (not optional); first
     participant's `id` is stored as `room.hostId`.
   - `joinRoom` — after the `if (!room)` null check, add: if `room.status !== "lobby"` throw
     `HttpError(409, "Game already in progress")` (imported and re-exported from schemas).
   - New `startRoom(code, participantId)` — look up room; 404 if missing; 409 if not lobby;
     403 if `participantId !== room.hostId`; 400 if `participants.length < 2`; set
     `room.status = "active"`; call `saveRoom`; return cloned room.
   - `toRoomSnapshot` — include `room.hostId` in returned snapshot.

4. **`rooms.ts`** — three changes:
   - POST `/rooms`: use validated (now required) `playerName`; improve 201 response messages.
   - POST `/:code/join`: improve error message to "Room not found" (was "Unable to join room");
     propagate the 409 from `joinRoom` (it will throw `HttpError` now).
   - New POST `/:code/start`: parse body with `startGameSchema`; call `startRoom`; return
     `{ room: toRoomSnapshot(result, body.participantId) }`.

### Frontend changes (in dependency order)

5. **`api.ts`** — fix `API_BASE_URL` (`/bug` → `/api`); update `RoomSnapshot` to include
   `hostId: string` and `status: "lobby" | "active" | "ended"`; add
   `startGame(code, participantId)` → `POST /rooms/:code/start`.

6. **`roomStore.ts`** (frontend) — add `async startGame()` method that calls `api.startGame`
   inside `withLoading`; on success call `setRoomSnapshot`.

7. **`CreateRoomPage.tsx`** — add client-side check: trim name, show error if empty before
   calling `store.createRoom`. (The backend now enforces this too, but early client feedback
   is better UX.)

8. **`JoinRoomPage.tsx`** — add client-side validation before API call:
   - Trim and check non-empty for name.
   - Trim code; check non-empty; check `/^[a-zA-Z0-9]+$/`; show specific error if fails.
   - Only call `store.joinRoom` after both checks pass.

9. **`LobbyPage.tsx`** — the largest frontend change:
   - Read `room` and `participantId` from `useRoomState()`.
   - `useEffect` starts a `setInterval(async () => { await store.fetchRoom() }, 2000)`;
     clears on unmount.
   - When `room.status` transitions to `"active"`, navigate to `/game` (use `useNavigate`).
   - Render participant list; mark the participant whose `id === room.hostId` with a "(host)"
     label or equivalent indicator.
   - Render "Start Game" button only when `participantId === room.hostId`.
   - Disable the button when `room.participants.length < 2`; show helper text
     "Waiting for more players…".
   - Show `error` from store state if polling fails.

### New unit tests

**`backend/src/services/roomStore.test.ts`** additions:
- `createRoom` with empty string throws / returns error via validation.
- `joinRoom` on an active room returns 409-semantics (or the `HttpError` is thrown).
- `startRoom` with non-host participantId throws 403.
- `startRoom` with < 2 participants throws 400.
- `startRoom` with correct host and ≥ 2 participants returns status `"active"`.
- `toRoomSnapshot` includes `hostId` matching the creator's participantId.

**`backend/src/api/schemas.test.ts`** additions:
- `createRoomSchema` rejects missing `playerName`.
- `createRoomSchema` rejects whitespace-only `playerName` (after `.trim().min(1)`).

## Complexity Tracking

No constitution violations. No complexity justification required.
