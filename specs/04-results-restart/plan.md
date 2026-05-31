# Implementation Plan: Group 4 — Results, Restart & Final Validation

**Branch**: `group-4-results-restart` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md) | **Tasks**: [tasks.md](tasks.md)

---

## Summary

Add `"results"` to `RoomStatus`, implement `endGame()` and `restartGame()` service functions, expose two new endpoints, wire the End Game button on `GamePage`, create `ResultsPage` (the only new file), add status-driven navigation in `GamePage` and `ResultsPage`, and reuse existing `Scoreboard` and `ResultPanel` components on the results screen.

---

## Technical Context

**Language/Version**: TypeScript 5.6 strict, Node 18+

**Primary Dependencies**: Express 4, React 18, Zod 3, React Router 6 — no new packages

**Storage**: In-memory `Map<string, Room>` — unchanged

**Testing**: Vitest on both packages

**Constraints**: No WebSockets, no new npm dependencies, TypeScript strict, no `any`

---

## Constitution Check

| Rule | Status | Notes |
|---|---|---|
| Extend existing files only | ⚠️ One exception | `ResultsPage.tsx` is a new file — plan explicitly names it (constitution allows this) |
| No new npm dependencies | ✅ | None needed |
| Zod schemas in `schemas.ts` | ✅ | `endRoomSchema` + `restartRoomSchema` added there |
| All API calls through `api.ts` | ✅ | `api.endGame()` + `api.restartGame()` added there |
| Polling via `setInterval`/`clearInterval` | ✅ | Same pattern in `ResultsPage` |
| TypeScript strict, no `any` | ✅ | All new fields fully typed |

---

## Project Structure

### Files that change

```text
backend/src/
├── models/
│   └── game.ts               ← widen RoomStatus to include "results"
├── services/
│   └── roomStore.ts          ← add endGame(), restartGame(); update toRoomSnapshot() for results status
└── api/
    ├── schemas.ts            ← add endRoomSchema, restartRoomSchema
    └── rooms.ts              ← add POST /:code/end and POST /:code/restart routes

frontend/src/
├── services/
│   └── api.ts                ← widen status; add endGame(), restartGame()
├── routes/
│   └── index.tsx             ← add /results route
├── pages/
│   ├── GamePage.tsx          ← add "results" status watcher; replace Exit Game with End Game (host only)
│   └── ResultsPage.tsx       ← NEW: results UI, polling, Play Again button, restart navigation
```

---

## Phase Design

### Phase 1 — Backend Model Extension (blocking)

Widen `RoomStatus` to `"lobby" | "playing" | "results"` in `game.ts`. No construction sites break — `"results"` is only added as a valid value, not required anywhere yet.

**Gate**: `npm run build` in `backend/` exits 0.

---

### Phase 2 — `endGame()` and `restartGame()` Service Functions

Add both functions to `roomStore.ts`. Use the same discriminated result pattern as `startGame()`.

`endGame(code, participantId)`:
- NOT_FOUND / FORBIDDEN / CONFLICT (`status !== "playing"`) / OK → set `status = "results"`, saveRoom.

`restartGame(code, participantId)`:
- NOT_FOUND / FORBIDDEN / CONFLICT (`status !== "results"`) / OK → reset fields:
  ```typescript
  room.status = "lobby";
  room.drawerParticipantId = null;
  room.currentWord = null;
  room.guesses = [];
  room.scores = {};
  ```
  saveRoom, return `{ code: "OK", room }`.

Also update `toRoomSnapshot()`: add a guard so `currentWord` is returned unconditionally when `room.status === "results"`:
```typescript
const revealWord = room.status === "results";
currentWord: (isDrawer || revealWord) ? room.currentWord : null,
```

**Gate**: `npm run build` passes. Manual verification: curl sequence (create → join → start → end → check status → restart → check status).

---

### Phase 3 — Schemas + Routes (parallel with Phase 4)

Add `endRoomSchema` and `restartRoomSchema` to `schemas.ts` (same shape as `startRoomSchema` — distinct exports).

Add `POST /:code/end` and `POST /:code/restart` routes to `rooms.ts` after `POST /:code/start`.

Both routes follow the same pattern: parse params + body, call service, translate result codes → HTTP, respond with `{ participantId, room: toRoomSnapshot(...) }`.

**Gate**: Curl smoke tests for both endpoints covering all result codes.

---

### Phase 4 — Frontend Types + API Functions (parallel with Phase 3)

Widen `status` in `api.ts` local `RoomSnapshot` to include `"results"`. Add `api.endGame()` and `api.restartGame()`, both returning `Promise<RoomSessionResponse>`.

**Gate**: `npm run build` in `frontend/` exits 0.

---

### Phase 5 — GamePage Updates

Two changes to `GamePage.tsx`:

1. **Status watcher**: add `useEffect` watching `room?.status`. When `"results"` → `navigate("/results", { replace: true })`. Same pattern as the `"playing"` watcher in `LobbyPage`.

2. **End Game button**: replace the existing "Exit Game" button with host/non-host conditional. Host sees "End Game" which calls `api.endGame`, updates store, navigates to `/results`. Non-host sees no end-game button (Exit Game can be retained or removed — see Risk notes).

**Gate**: Host clicks End Game → navigates to `/results`. Non-host is forwarded within ≤4 s via polling.

---

### Phase 6 — ResultsPage (new file + route)

Add `/results` to `routes/index.tsx`.

Create `ResultsPage.tsx`:
- Guard: navigate to `/` if `!room`.
- Poll every 2 s (`setInterval`/`clearInterval`).
- Status watcher: navigate to `/lobby` when `room.status === "lobby"` (after restart).
- Render: word reveal, `<Scoreboard scores={room.scores} participants={room.participants} />`, `<ResultPanel guesses={room.guesses} />`.
- Host: "Play Again" button → `api.restartGame` → `roomStore.setRoomSession` → `navigate("/lobby")`.
- Non-host: "Waiting for host to restart..." paragraph.

**Gate**: Full flow — end game → both on `/results` → correct word shown → scores and history visible → host clicks Play Again → both on `/lobby` → can start again.

---

### Phase 7 — Build & Test Verification

`npm run build && npm test` on both packages. All exit 0.

---

## Dependency Order

```
Phase 1 (game.ts: widen RoomStatus)
    ↓
Phase 2 (roomStore: endGame, restartGame, toRoomSnapshot update)
    ↓
Phase 3 (schemas + routes)     Phase 4 (frontend types + api functions)
    ↓                                   ↓
Phase 5 (GamePage updates) ←───────────┘
    ↓
Phase 6 (ResultsPage + route)
    ↓
Phase 7 (build + test)
```

---

## Risk & Notes

- **`currentWord` reveal**: must check `room.status === "results"` before `isDrawer` — otherwise the drawer guard overrides the reveal. Simplest: `const showWord = isDrawer || room.status === "results"`.
- **"Exit Game" button**: currently navigates to `/lobby` without an API call. It should be removed from `GamePage` for hosts (replaced by End Game) and for non-hosts (they are forwarded automatically on status change). If kept as a fallback for non-hosts, it navigates to `/lobby` directly — this is harmless since the backend state is unchanged.
- **`restartGame` resets `scores` to `{}`**: the `Scoreboard` in `LobbyPage` does not render scores (lobby has no scoreboard), so the empty object is safe. After restart, `startGame()` re-seeds all participant scores to 0.
- **`ResultsPage` is the only new file**: justified by the route system requiring a component — cannot reuse `GamePage` at `/results` since they have different nav controls and status guards.
