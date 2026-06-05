# Implementation Plan: Round End — Results Display and Lobby Restart

**Branch**: `005-round-end-restart` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-round-end-restart/spec.md`

## Summary

The host can end an active round via a new "End Round" button; the room transitions to `"ended"` status. All clients polling `GET /rooms/:code` detect the new status and display a result screen showing the correct word, final scores, and full guess history. The host then clicks "Play Again" to reset the room to `"lobby"` with players preserved and guesses cleared; all clients redirect to the lobby within the next poll cycle. This is a **backend + frontend change** across 7 existing files — no new files, no new routes.

## Technical Context

**Language/Version**: TypeScript (strict). React 18 (frontend). Node.js + Express (backend).

**Primary Dependencies**: Existing — React Router 6, Zod, existing `useRoomState` / `useRoomStore` hooks. All already installed.

**Storage**: In-memory only. `room.status` transitions to `"ended"` on end-round; `room.guesses` reset to `[]` on restart. No database.

**Testing**: Manual two-tab browser verification per constitution Principle IV. Existing Vitest suite (25 tests) must remain green.

**Target Platform**: Local development. Backend on `localhost:3001`, frontend on `localhost:5173`.

**Project Type**: Web application — fullstack change (`backend/src/` + `frontend/src/`).

**Performance Goals**: Result screen appears within 2 seconds (one polling cycle). Lobby redirect after restart appears within 2 seconds (SC-001, SC-004).

**Constraints**: No new npm dependencies. No new routes. No new page files. Result screen rendered conditionally inside `GamePage.tsx`.

**Scale/Scope**: 2–8 players, single round, in-memory.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | 7 existing files modified, 0 new files. No new routes, no new page components. |
| II. Spec-Driven Development | ✅ Pass | `spec.md` exists with 12 FRs and 2 user stories before any code is written. |
| III. Deterministic Game Rules | ✅ Pass | End-round and restart are host-triggered (not timer-based). Word selection unchanged across restarts (`availableWords[0]`). |
| IV. Incremental Validation | ✅ Pass | US1 (result display) independently testable; US2 (restart) buildable on top. Both verified with two browser tabs. Polling remains at 2 seconds. |
| V. Simplicity & Scope | ✅ Pass | No WebSockets, no timers, no new dependencies. `"ended"` is a one-character string addition to an existing type. |

**Post-design re-check**: No violations. Adding `"ended"` to `RoomStatus` is additive; all existing handlers continue to work because they check specific status values, not negation.

## Project Structure

### Documentation (this feature)

```text
specs/005-round-end-restart/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: 6 decisions resolved
├── data-model.md        # Phase 1: RoomStatus extension, state reset table
├── contracts/
│   └── api.md           # Phase 1: POST /end, POST /restart, modified GET /rooms/:code
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code

```text
backend/src/
├── models/
│   └── game.ts              # Add "ended" to RoomStatus union
├── services/
│   └── roomStore.ts         # Add endRound(), restartRoom()
└── api/
    ├── schemas.ts            # Add endRoundBodySchema, restartRoomBodySchema
    └── rooms.ts              # Add POST /:code/end, POST /:code/restart handlers

frontend/src/
├── services/
│   └── api.ts               # Update RoomSnapshot.status type; add endRound(), restartRoom()
├── state/
│   └── roomStore.ts         # Add endRound(), restartRoom() to RoomStore
└── pages/
    └── GamePage.tsx         # Add result-screen conditional render; "End Round" button;
                             # lobby-redirect useEffect when status === "lobby"
```

**Structure Decision**: Web application (existing layout). Zero new files in source code.

## Implementation Notes

### Backend

**`game.ts`** — Extend the union:
```typescript
export type RoomStatus = "lobby" | "active" | "ended";
```

**`roomStore.ts`** — Add two functions:

`endRound(code, requestingParticipantId)`:
- Get room; return `{ error: "not_found" }` if missing
- Return `{ error: "forbidden" }` if caller is not `room.hostId`
- Return `{ error: "not_active" }` if `room.status !== "active"`
- Set `room.status = "ended"`; `saveRoom(room)`; return `{ room: toRoomSnapshot(cloneRoom(room)) }`

`restartRoom(code, requestingParticipantId)`:
- Get room; return `{ error: "not_found" }` if missing
- Return `{ error: "forbidden" }` if caller is not `room.hostId`
- Return `{ error: "not_ended" }` if `room.status !== "ended"`
- Set `room.status = "lobby"`, `room.guesses = []`; `saveRoom(room)`; return `{ room: toRoomSnapshot(cloneRoom(room)) }`

**`schemas.ts`** — Both endpoints share the same body shape:
```typescript
export const endRoundBodySchema = z.object({
  participantId: z.string().uuid()
});
export const restartRoomBodySchema = z.object({
  participantId: z.string().uuid()
});
```

**`rooms.ts`** — Add two handlers following the existing `startRoom` pattern:
- `POST /:code/end` → calls `endRound()`; 200 on success; 403/404/409 on error
- `POST /:code/restart` → calls `restartRoom()`; 200 on success; 403/404/409 on error

### Frontend

**`api.ts`** — Update status type, add two methods:
```typescript
// In RoomSnapshot:
status: "lobby" | "active" | "ended"

// New api methods:
endRound(code: string, participantId: string) → Promise<{ room: RoomSnapshot }>
restartRoom(code: string, participantId: string) → Promise<{ room: RoomSnapshot }>
```

**`roomStore.ts`** — Add to `RoomStore` class:
```typescript
async endRound() {
  if (!this.state.room || !this.state.participantId) return null;
  const response = await this.withLoading(() =>
    api.endRound(this.state.room!.code, this.state.participantId!)
  );
  this.setRoomSnapshot(response.room);
  return response.room;
}

async restartRoom() {
  if (!this.state.room || !this.state.participantId) return null;
  const response = await this.withLoading(() =>
    api.restartRoom(this.state.room!.code, this.state.participantId!)
  );
  this.setRoomSnapshot(response.room);
  return response.room;
}
```

**`GamePage.tsx`** — Three additions:

1. **Lobby-redirect effect** — add after existing effects:
```typescript
useEffect(() => {
  if (room?.status === "lobby") {
    navigate("/lobby", { replace: true });
  }
}, [room?.status, navigate]);
```

2. **"End Round" button** — inside the existing `<div className="button-row">` at the bottom, show conditionally for the host when status is "active":
```tsx
{isDrawer && room.status === "active" && (
  <button className="button button--danger" onClick={() => store.endRound()}>
    End Round
  </button>
)}
```

3. **Result screen** — when `room.status === "ended"`, render a result view instead of the full game layout:
```tsx
if (room.status === "ended") {
  return <ResultScreen room={room} participantId={participantId} isHost={isDrawer} store={store} />;
}
```

The result screen is a small inline render (not a new component file) showing:
- "The word was: [secretWord]" heading
- Sorted scoreboard list (reuses `room.scores`)
- Guess history list (reuses `room.guesses`)
- Host: "Play Again" button → `store.restartRoom()`
- Non-host: "Waiting for host to start a new round…" paragraph

Inline vs component: the result screen is simple enough (< 30 lines JSX) to inline in `GamePage.tsx` as a local helper or early return, avoiding a new file (constitution Principle I).

## Complexity Tracking

> No constitution violations — table not required.
