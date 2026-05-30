# Plan — Scenario 4: Result, Restart & Final Validation

---

## Findings

### What exists and is relevant (post Scenario 3)

| Area | File | Current behavior |
|---|---|---|
| RoomStatus type | `backend/src/models/game.ts` | `"lobby" \| "playing"`. No `"finished"` value. |
| Room and RoomSnapshot | `backend/src/models/game.ts` | All needed fields exist: `status`, `hostId`, `drawerId`, `currentWord`, `guesses`, `participants` with `score`. No structural changes needed for Scenario 4. |
| toRoomSnapshot | `backend/src/services/roomStore.ts` | Filters `currentWord` with `viewerParticipantId === room.drawerId ? room.currentWord : null`. This must be relaxed when status is `"finished"` — all players should see the word. |
| submitGuess | `backend/src/services/roomStore.ts` | Returns `"not-playing"` when `room.status !== "playing"`. This correctly blocks guesses in `"finished"` state once the status is added. No change needed. |
| Schemas | `backend/src/api/schemas.ts` | Has `startGameSchema = z.object({ participantId: z.string().min(1) })`. Both `endRound` and `restartGame` need the same shape — can reuse the existing schema or add named aliases. |
| Rooms router | `backend/src/api/rooms.ts` | Five endpoints. No `POST /:code/end` or `POST /:code/restart`. |
| Frontend status type | `frontend/src/services/api.ts` | `status: "lobby" \| "playing"`. No `"finished"`. |
| Frontend api | `frontend/src/services/api.ts` | Has `createRoom`, `joinRoom`, `fetchRoom`, `startGame`, `submitGuess`. No `endRound` or `restartGame` methods. |
| Frontend store | `frontend/src/state/roomStore.ts` | Has `createRoom`, `joinRoom`, `fetchRoom`, `startGame`, `submitGuess`. No `endRound` or `restartGame` actions. |
| GamePage | `frontend/src/pages/GamePage.tsx` | Polls every 2s. Renders game content unconditionally when `room` is present. No status check that would switch to a result view. No "End Round" button. No navigation triggered by status change. |
| LobbyPage | `frontend/src/pages/LobbyPage.tsx` | Polls every 2s. No check for `room.status === "playing"` — non-host players are never auto-navigated to `/game` after the host starts a game. This gap matters for Scenario 4 restart. |

### What is missing

1. **`"finished"` status** — `RoomStatus` has no `"finished"` value. The backend has no way to express a completed round.
2. **`currentWord` visibility in finished state** — `toRoomSnapshot` always hides the word from non-drawers. In `"finished"` state, all players must see the correct word.
3. **`endRound` service function** — no logic to transition a room from `"playing"` to `"finished"`.
4. **`restartGame` service function** — no logic to reset a room back to `"lobby"` with players preserved and round state cleared.
5. **`POST /rooms/:code/end` endpoint** — does not exist.
6. **`POST /rooms/:code/restart` endpoint** — does not exist.
7. **Frontend result view** — `GamePage` renders the same playing layout regardless of status. There is no result view showing the correct word, final scores, and guess history after the round ends.
8. **"End Round" button in GamePage** — the host has no way to end the round from the UI.
9. **"Play Again" button on result view** — the host has no way to restart from the UI.
10. **Status-driven navigation in GamePage** — `GamePage` does not navigate to `/lobby` when `room.status` becomes `"lobby"` (required for the restart flow for non-host players).
11. **Status-driven navigation in LobbyPage** — `LobbyPage` does not navigate to `/game` when `room.status` becomes `"playing"` (required so non-host players auto-join the game screen after start, and so all players reach the game screen after a restart that goes through lobby then triggers another start).

---

## State Model Changes

### Backend — `backend/src/models/game.ts`

```
RoomStatus (before)                RoomStatus (after)
──────────────────────────         ─────────────────────────────
"lobby" | "playing"                "lobby" | "playing" | "finished"    ← NEW
```

No other model changes. `Room` and `RoomSnapshot` already carry all fields needed to display results: `currentWord`, `guesses`, and `participants` with `score`.

### Frontend — `frontend/src/services/api.ts`

```
RoomSnapshot.status (before)       RoomSnapshot.status (after)
──────────────────────────         ─────────────────────────────
"lobby" | "playing"                "lobby" | "playing" | "finished"    ← NEW
```

---

## Required API Changes

### Modified: `toRoomSnapshot` — `backend/src/services/roomStore.ts`

```
currentWord (before):
  viewerParticipantId === room.drawerId ? room.currentWord : null

currentWord (after):
  room.status === "finished" || viewerParticipantId === room.drawerId
    ? room.currentWord
    : null
```

In `"finished"` state the secret word is revealed to everyone. The existing filtering logic is preserved for the `"playing"` state.

### New schemas — `backend/src/api/schemas.ts`

Both new endpoints require only a `participantId` to identify the caller. The existing `startGameSchema` has the same shape. Two named exports are added for clarity:

```
endRoundSchema   = z.object({ participantId: z.string().min(1) })
restartGameSchema = z.object({ participantId: z.string().min(1) })
```

### New service: `endRound(code, participantId)`

- **File:** `backend/src/services/roomStore.ts`
- Returns `null` if room not found.
- Returns `"not-host"` if caller is not the host.
- Returns `"not-playing"` if room status is not `"playing"`.
- Sets `room.status = "playing"` → `"finished"`, saves, returns snapshot.
- Response snapshot is called with the caller's `participantId` — but since the status is now `"finished"`, `toRoomSnapshot` exposes `currentWord` to all anyway.

### New service: `restartGame(code, participantId)`

- **File:** `backend/src/services/roomStore.ts`
- Returns `null` if room not found.
- Returns `"not-host"` if caller is not the host.
- Returns `"not-finished"` if room status is not `"finished"`.
- Resets the room in place: `status = "lobby"`, `drawerId = null`, `currentWord = null`, `guesses = []`, each participant's `score = 0`.
- Room code, `hostId`, participants (names and ids) are preserved.
- Saves and returns the updated snapshot.

### New endpoint: `POST /rooms/:code/end`

- Parses params with `roomCodeParamsSchema`, body with `endRoundSchema`.
- Calls `endRound(code, participantId)`.
- Returns 404 if room not found, 403 if not host, 422 if not in playing state.
- Returns 200 with `{ room: snapshot }` on success.

### New endpoint: `POST /rooms/:code/restart`

- Parses params with `roomCodeParamsSchema`, body with `restartGameSchema`.
- Calls `restartGame(code, participantId)`.
- Returns 404 if room not found, 403 if not host, 422 if not in finished state.
- Returns 200 with `{ room: snapshot }` on success.

### New client methods — `frontend/src/services/api.ts`

```
endRound(code, participantId)   → POST /rooms/:code/end    { participantId }
restartGame(code, participantId) → POST /rooms/:code/restart { participantId }
```

Both return `{ room: RoomSnapshot }`.

---

## Result State Flow

```
GamePage (host, status = "playing")
  → "End Round" button visible only when isHost
  → click "End Round" → roomStore.endRound()
  → POST /rooms/:code/end  { participantId: hostId }
  → endRound(): status = "finished", save
  → toRoomSnapshot: currentWord visible to all
  → response { room } — store updates snapshot
  → room.status is now "finished"
  → GamePage renders result view (conditional on status)
  → polling delivers "finished" snapshot to all other players within ~2s
  → all players see result view automatically
```

---

## Restart Flow

```
GamePage result view (host, status = "finished")
  → "Play Again" button visible only when isHost
  → click "Play Again" → roomStore.restartGame()
  → POST /rooms/:code/restart  { participantId: hostId }
  → restartGame(): status = "lobby", drawerId = null,
    currentWord = null, guesses = [], all scores = 0
  → response { room } — store updates snapshot
  → room.status is now "lobby"
  → GamePage useEffect detects status === "lobby" → navigate("/lobby")
  → non-host players: next poll returns status = "lobby"
  → GamePage useEffect fires for each → navigate("/lobby")
  → all players land on LobbyPage with same participants, zero scores
```

---

## Status-Driven Navigation

Both `GamePage` and `LobbyPage` need `useEffect` hooks that watch `room.status` and navigate based on status transitions. These replace the need for any page to manually navigate after an action — the store update from a poll or action response triggers the effect.

### GamePage additions

```
useEffect(() => {
  if (room?.status === "lobby") navigate("/lobby", { replace: true });
}, [room?.status, navigate]);
```

This covers:
- Host after restart (explicit navigate also fires, whichever is first is fine)
- Non-host players after restart (status changes to "lobby" via polling)

### LobbyPage addition

```
useEffect(() => {
  if (room?.status === "playing") navigate("/game", { replace: true });
}, [room?.status, navigate]);
```

This covers:
- Non-host players after the host starts the game (lobby polling delivers "playing" status)
- All players landing on the lobby after a restart — they stay there because status is "lobby"

---

## Data Flow

### End round
```
GamePage (host, status = "playing")
  → click "End Round"
  → roomStore.endRound()
  → POST /rooms/:code/end
  → status becomes "finished", currentWord now visible to all
  → store updates, GamePage re-renders result view immediately
  → other players see result view via next poll (~2s)
```

### Result view polling
```
GamePage (status = "finished")
  → polling continues every 2s (same useEffect)
  → GET /rooms/:code?participantId=...
  → toRoomSnapshot returns currentWord to all (status is "finished")
  → result view refreshes — scores and guesses stable at this point
```

### Restart
```
GamePage result view (host)
  → click "Play Again"
  → roomStore.restartGame()
  → POST /rooms/:code/restart
  → room reset: status = "lobby", round fields cleared
  → store updates snapshot
  → GamePage status-navigation useEffect fires → navigate("/lobby")
  → non-host players: poll returns status = "lobby" → same effect → navigate("/lobby")
  → LobbyPage mounts, polling resumes for all players
```

### Non-host auto-navigation to game (gap fixed)
```
LobbyPage (non-host, status = "lobby")
  → host clicks "Start Game" → status becomes "playing"
  → non-host's next poll returns status = "playing"
  → LobbyPage status-navigation useEffect fires → navigate("/game")
  → GamePage mounts for non-host player
```

---

## Implementation Sequence

### Step 1 — Backend: expand RoomStatus
- **File:** `backend/src/models/game.ts`
- Add `"finished"` to `RoomStatus`.
- Verify: `npm run build` in `backend/` passes.

### Step 2 — Backend: update `toRoomSnapshot` for finished state
- **File:** `backend/src/services/roomStore.ts`
- Change `currentWord` filtering to also expose the word when `room.status === "finished"`.
- Verify: `npm run build` in `backend/` passes.

### Step 3 — Backend: add `endRoundSchema` and `restartGameSchema`
- **File:** `backend/src/api/schemas.ts`
- Add both schemas (both are `z.object({ participantId: z.string().min(1) })`).
- Verify: `npm run build` in `backend/` passes.

### Step 4 — Backend: add `endRound` service function
- **File:** `backend/src/services/roomStore.ts`
- Add exported `endRound(code, participantId)` with host check, status check, and transition to `"finished"`.
- Verify: `npm run build` in `backend/` passes.

### Step 5 — Backend: add `restartGame` service function
- **File:** `backend/src/services/roomStore.ts`
- Add exported `restartGame(code, participantId)` with host check, status check, and full round-state reset.
- Verify: `npm run build` in `backend/` passes.

### Step 6 — Backend: add `POST /rooms/:code/end` and `POST /rooms/:code/restart` handlers
- **File:** `backend/src/api/rooms.ts`
- Add both route handlers using the new schemas and service functions.
- Verify: `npm run build` in `backend/` passes.

### Step 7 — Frontend: expand status type and add client methods
- **File:** `frontend/src/services/api.ts`
- Add `"finished"` to `status` in `RoomSnapshot`.
- Add `endRound(code, participantId)` and `restartGame(code, participantId)` to the `api` object.
- Verify: `npm run build` in `frontend/` passes.

### Step 8 — Frontend: add `endRound` and `restartGame` store actions
- **File:** `frontend/src/state/roomStore.ts`
- Add `endRound()` and `restartGame()` methods following the same `withLoading` pattern as `startGame`.
- Verify: `npm run build` in `frontend/` passes.

### Step 9 — Frontend: update `GamePage` — result view, End Round, status navigation
- **File:** `frontend/src/pages/GamePage.tsx`
- Add `useEffect` that navigates to `/lobby` when `room.status === "lobby"`.
- When `room.status === "finished"`: render a result view showing correct word, final scores, full guess history, and "Play Again" button for host only.
- When `room.status === "playing"`: render the existing playing layout, plus "End Round" button for host only.
- Verify: `npm run build` in `frontend/` passes.

### Step 10 — Frontend: update `LobbyPage` — auto-navigate to game on status change
- **File:** `frontend/src/pages/LobbyPage.tsx`
- Add `useEffect` that navigates to `/game` when `room.status === "playing"`.
- Verify: `npm run build` in `frontend/` passes.

---

## Files Touched

| File | Change type |
|---|---|
| `backend/src/models/game.ts` | Modify — add `"finished"` to `RoomStatus` |
| `backend/src/api/schemas.ts` | Modify — add `endRoundSchema` and `restartGameSchema` |
| `backend/src/services/roomStore.ts` | Modify — update `toRoomSnapshot`, add `endRound`, add `restartGame` |
| `backend/src/api/rooms.ts` | Modify — add `POST /:code/end` and `POST /:code/restart` handlers |
| `frontend/src/services/api.ts` | Modify — add `"finished"` to status, add `endRound` and `restartGame` methods |
| `frontend/src/state/roomStore.ts` | Modify — add `endRound` and `restartGame` actions |
| `frontend/src/pages/GamePage.tsx` | Modify — result view, End Round button, Play Again button, status navigation |
| `frontend/src/pages/LobbyPage.tsx` | Modify — auto-navigate to game when status becomes "playing" |

No new files. No new libraries.

---

## Testing Strategy

### Backend unit tests (`backend/src/services/roomStore.test.ts`)
- `endRound`: room not found returns null.
- `endRound`: non-host returns `"not-host"`.
- `endRound`: room not in "playing" returns `"not-playing"`.
- `endRound`: success sets status to `"finished"` and returns snapshot.
- `restartGame`: room not found returns null.
- `restartGame`: non-host returns `"not-host"`.
- `restartGame`: room not in "finished" returns `"not-finished"`.
- `restartGame`: success sets status to `"lobby"`, clears `drawerId`, `currentWord`, `guesses`, and all participant scores.
- `restartGame`: participants (names, ids) are preserved after restart.
- `toRoomSnapshot`: in `"finished"` status, `currentWord` is returned for all viewers regardless of `viewerParticipantId`.
- `toRoomSnapshot`: in `"playing"` status, `currentWord` is still hidden from non-drawers.

### Backend schema tests (`backend/src/api/schemas.test.ts`)
- `endRoundSchema`: missing `participantId` is rejected.
- `restartGameSchema`: missing `participantId` is rejected.

### Frontend service tests (`frontend/src/services/api.test.ts`)
- `api.endRound`: makes a `POST` to `/rooms/:code/end` with `{ participantId }`.
- `api.restartGame`: makes a `POST` to `/rooms/:code/restart` with `{ participantId }`.

---

## Risks

| Risk | Mitigation |
|---|---|
| Status-navigation effects in `LobbyPage` and `GamePage` could create navigation loops | The effects are guarded by specific status values. `LobbyPage` navigates only when `"playing"`, `GamePage` navigates only when `"lobby"`. Neither fires on its target page's expected status, so no loop is possible. |
| Non-host players on `GamePage` receive `status = "lobby"` from a poll mid-restart before they navigate — stale render | The navigation effect fires immediately when the store update delivers `"lobby"`. At worst the result view renders one extra frame. |
| `restartGame` must reset all participant scores — mutating participants directly on the stored room object | `structuredClone` in `cloneRoom` is used for all returns, so the mutation is safe on the live object before cloning. The pattern is identical to how `submitGuess` mutates participant scores. |
| Guess submissions arriving between the host clicking "End Round" and the backend saving `"finished"` status | Unlikely but possible with concurrent tabs. The `endRound` handler runs synchronously in Node's event loop. Any guess request that arrives after the status is set will receive `"not-playing"`. Any that arrived before will be processed before `endRound` runs. No data loss. |
| `toRoomSnapshot` change to expose word in `"finished"` state affects all five endpoints | Intended. All endpoints call `toRoomSnapshot`. In lobby state `currentWord` is null anyway, so the condition `room.status === "finished"` is safely a no-op for lobby snapshots. |
