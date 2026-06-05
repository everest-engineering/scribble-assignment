# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart-validation/spec.md`

## Summary

Add round-end and restart mechanics to the Scribble game. When the host clicks "End Round",
the room transitions to `status: "result"` and all players see a results view showing the
secret word revealed, final scores sorted descending, and the full guess history. The host
sees a "Restart" button; non-host players see "Waiting for [host name] to restart…". On
restart the room returns to `status: "lobby"` with all round state cleared and all players
preserved. Non-host players detect both transitions automatically via the existing 2-second
polling loop.

## Technical Context

**Language/Version**: TypeScript 5.6 — Node.js 22 (backend), React 18 + Vite 5 (frontend)

**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6 (frontend);
Vitest 3 (both)

**Storage**: In-memory `rooms: Map<string, Room>` — per Principle V

**Testing**: `vitest run` in `backend/` and `frontend/`

**Target Platform**: Web browser — two tabs for manual validation

**Project Type**: Web application — `backend/` + `frontend/` monorepo

**Performance Goals**: Results view visible to all players within 3 s of host clicking
"End Round" (2 s polling + propagation); lobby view visible within 3 s of host restarting

**Constraints**: No WebSockets; no new top-level npm dependencies; TypeScript everywhere,
`any` forbidden; in-memory store only

**Scale/Scope**: Lab-scale — 2–5 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ PASS | All changes extend existing files; one new component (`RoundResultsView`) is additive; no rewrites |
| II. TypeScript Everywhere | ✅ PASS | `RoomStatus` already includes `"result"` on both backend and frontend; new functions fully typed; `any` forbidden |
| III. Spec-Driven Development | ✅ PASS | Every task maps to FR-001–FR-014 or an acceptance scenario |
| IV. Polling-Only Sync | ⚠️ JUSTIFIED DEVIATION | Constitution says "stop polling on `'result'` status". However, non-host players must poll while in `"result"` to detect restart (FR-010). Since `"result"` is a transitional state (not terminal), polling continues. See Complexity Tracking. |
| V. In-Memory Store Only | ✅ PASS | `endRoom` and `restartRoom` operate solely on the existing `rooms` Map |
| VI. Incremental Validation | ✅ PASS | Validate with two browser tabs after implementation |

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          ← no change (RoomStatus already has "result")
│   ├── services/
│   │   └── roomStore.ts     ← extend: add endRoom + restartRoom; modify toRoomSnapshot
│   └── api/
│       ├── schemas.ts       ← extend: add endRoomSchema, restartRoomSchema
│       └── rooms.ts         ← extend: add POST /:code/end and POST /:code/restart routes

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           ← extend: add endRoom + restartRoom methods
│   ├── state/
│   │   └── roomStore.ts     ← extend: add endRoom + restartRoom methods
│   ├── pages/
│   │   └── GamePage.tsx     ← extend: "End Round" button; detect result/lobby status; render RoundResultsView
│   └── components/
│       └── RoundResultsView.tsx  ← new: word reveal, sorted scores, guess history, restart/waiting UI
```

**Structure Decision**: Web application (Option 2) — existing `backend/` + `frontend/` monorepo.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Polling continues during `"result"` status (Principle IV exception) | Non-host players must detect the host's restart transition via polling (FR-010). Without polling, non-host players would be stuck on the results screen indefinitely. | WebSockets are forbidden. A client-side "check once on restart" pattern requires coordinating the exact moment of restart without a push mechanism — impossible without polling or WebSockets. |

## Implementation Notes

### Backend

**`backend/src/services/roomStore.ts`**

- Add `endRoom(code, participantId)`:
  - 404 if room not found
  - 403 if `participantId !== room.hostId`
  - Set `room.status = "result"`, update `updatedAt`, persist
  - Return `{ room: toRoomSnapshot(cloneRoom(room), participantId) }`

- Add `restartRoom(code, participantId)`:
  - 404 if room not found
  - 403 if `participantId !== room.hostId`
  - Set `room.status = "lobby"`, clear `drawerId` (undefined), `secretWord` (undefined), `guesses` ([]), `scores` ({}), `canvasData` (null)
  - Keep `room.participants` and `room.hostId` intact
  - Update `updatedAt`, persist
  - Return `{ room: toRoomSnapshot(cloneRoom(room), participantId) }`

- Modify `toRoomSnapshot`:
  - Change the `secretWord` inclusion condition from "viewer is drawer" to:
    ```
    if status === "result" → include secretWord for all viewers
    else if drawerId && viewerParticipantId === drawerId → include secretWord
    ```

**`backend/src/api/schemas.ts`**

- Add `endRoomSchema = z.object({ participantId: z.string() })`
- Add `restartRoomSchema = z.object({ participantId: z.string() })`

**`backend/src/api/rooms.ts`**

- Import `endRoom`, `restartRoom` from `roomStore`
- Import `endRoomSchema`, `restartRoomSchema` from `schemas`
- Add `router.post("/:code/end", ...)` → validates params + body, calls `endRoom`, returns `{ room }`
- Add `router.post("/:code/restart", ...)` → validates params + body, calls `restartRoom`, returns `{ room }`

### Frontend

**`frontend/src/services/api.ts`**

- Add `endRoom(code, participantId)`:
  ```ts
  request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/end`, {
    method: "POST",
    body: JSON.stringify({ participantId })
  })
  ```
- Add `restartRoom(code, participantId)`:
  ```ts
  request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
    method: "POST",
    body: JSON.stringify({ participantId })
  })
  ```

**`frontend/src/state/roomStore.ts`**

- Add `endRoom()` method: calls `api.endRoom(room.code, participantId)`, calls `setRoomSnapshot`
- Add `restartRoom()` method: calls `api.restartRoom(room.code, participantId)`, calls `setRoomSnapshot`

**`frontend/src/pages/GamePage.tsx`**

- Add `isHost = room.hostId === participantId` constant (alongside existing `isDrawer`)
- Add `handleEndRound` async handler: calls `store.endRoom()`, catches and sets `pollError`
- Extend polling handler: after successful `store.fetchRoom()`, check if `updated?.status === "lobby"` → `clearInterval`, `navigate("/lobby")`
- In render: add early return `if (room.status === "result") return <RoundResultsView onRestart={...} />`  
  (mounting/unmounting `RoundResultsView` cleanly avoids leaving canvas listeners active)
- Add "End Round" button in the header area, visible only when `isHost && room.status === "playing"`:
  ```tsx
  {isHost && (
    <button className="button button--secondary" onClick={handleEndRound}>
      End Round
    </button>
  )}
  ```
  Note: FR-014 is satisfied by the conditional — button is only rendered when status is "playing"
  (the early return for "result" means this block is never reached in that status)

**`frontend/src/components/RoundResultsView.tsx`** *(new file)*

Props: none — reads directly from `useRoomState()` and `useRoomStore()`; uses `useNavigate()`

Renders:
1. **Word reveal**: `<p>The word was: <strong>{room.secretWord}</strong></p>`
2. **Scores** (sorted descending by score, ties in join order):
   ```ts
   const sorted = [...room.participants].sort(
     (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)
   );
   ```
   Render as `<ul>` with name + score pairs
3. **Guess history** (submission order, colour-coded green/red same as ResultPanel):
   - Empty state: `"No guesses were submitted."` (per FR-007)
4. **Host controls**: if `participantId === room.hostId`:
   - "Restart" button → calls `store.restartRoom()` then `navigate("/lobby")`
5. **Non-host message**: else:
   - `"Waiting for {hostName} to restart…"` where `hostName = room.participants.find(p => p.id === room.hostId)?.name ?? "host"`

### Polling behaviour in result status

The GamePage `setInterval` continues running during `"result"` status (justified deviation per
Complexity Tracking). The existing cleanup (`return () => clearInterval(id)`) fires on unmount,
which happens when `room.status === "result"` triggers the early return to `RoundResultsView`…
but `RoundResultsView` is rendered *within* `GamePage`, not as a separate route. The interval
lives in `GamePage`'s `useEffect` scope and keeps ticking.

When polling detects `status === "lobby"` (host restarted), the handler navigates to `"/lobby"`,
unmounting `GamePage` and clearing the interval.

The host's immediate transitions (end round and restart) are driven by the API response in
`store.endRoom()` / `store.restartRoom()`, not by polling, so they are immediate from the
host's perspective.
