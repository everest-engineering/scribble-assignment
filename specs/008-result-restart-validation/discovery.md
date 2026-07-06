# Discovery: Result, Restart, and Final Validation

**Phase**: Analysis | **Date**: 2026-07-06 | **Input**: Spec + plan + source code cross-reference

## Scope & Findings

### Decision: Room Status Extension

- **Decision**: Add `"result"` to the `RoomStatus` union type. No new Room fields needed — existing fields (`secretWord`, `scores`, `guesses`) serve result display.
- **Rationale**: The result state is a read-only view of the existing room data. Adding new fields would duplicate data already present.
- **Alternatives considered**:
  - Separate `GameResult` entity duplicated from Room fields (rejected — violates DRY, adds sync complexity)
  - Result-specific snapshot type (rejected — frontend already handles conditional rendering by status)

### Critical Issue: `toRoomSnapshot` Secret Word Visibility

- **Discovery**: `toRoomSnapshot()` only includes `secretWord` when `viewerParticipantId === room.currentDrawerId`. In result state, all participants must see the correct word (FR-003).
- **Fix**: Add `room.status === "result"` check — when true, always include `secretWord` regardless of viewer identity.
- **File**: `backend/src/services/roomStore.ts:281-296`

### Critical Issue: Missing Status Guards in Gameplay Endpoints

- **Discovery**: `addCanvasStroke()`, `clearCanvas()`, and `nextWord()` only check `participantId !== room.currentDrawerId` — they never verify `room.status`. After the game ends, the former drawer could continue drawing/advancing via direct API calls.
- **Fix**: Add `if (room.status === "result") return error` guards to all three functions.
- **Files**: `backend/src/services/roomStore.ts:213-279`

### Frontend Type Alignment

- **Discovery**: Frontend `RoomSnapshot.status` was typed as `"lobby" | "drawing"` — must be widened to include `"result"`.
- **File**: `frontend/src/services/api.ts:32`

### Frontend Store Guard Issue

- **Discovery**: `setRoomSnapshot()` guards against `currentRound` decreasing (prevents stale poll overwrites). But restart legitimately resets `currentRound` to 0, which would be blocked.
- **Fix**: Add `room.status !== "lobby"` exception to the guard.
- **File**: `frontend/src/state/roomStore.ts:73-81`

### Code Locations Verified

| Area | File | Lines | What We Learned |
|------|------|-------|-----------------|
| RoomStatus type | `backend/src/models/game.ts` | 2 | Currently `"lobby" \| "drawing"` — extend with `"result"` |
| Room interface | `backend/src/models/game.ts` | 31-45 | All fields needed for result view already exist |
| RoomSnapshot | `backend/src/models/game.ts` | 47-60 | Status type must be updated alongside RoomStatus |
| `toRoomSnapshot` | `backend/src/services/roomStore.ts` | 281-296 | Secret word hidden from non-drawers — needs result-state exception |
| `addCanvasStroke` | `backend/src/services/roomStore.ts` | 213-233 | No status check — add result-state guard |
| `clearCanvas` | `backend/src/services/roomStore.ts` | 235-254 | No status check — add result-state guard |
| `nextWord` | `backend/src/services/roomStore.ts` | 256-279 | No status check — add result-state guard |
| `submitGuess` | `backend/src/services/roomStore.ts` | 144-211 | Already checks `status !== "drawing"` — correctly rejects in result |
| `startGame` | `backend/src/services/roomStore.ts` | 111-142 | Checks `status !== "lobby"` — correctly allows after restart |
| Routes pattern | `backend/src/api/rooms.ts` | 1-175 | Follow POST route pattern with `participantId` query param |
| `roomViewerQuerySchema` | `backend/src/api/schemas.ts` | 15-17 | `participantId` optional — manual `!participantId` check in route |
| Frontend `RoomSnapshot` | `frontend/src/services/api.ts` | 30-43 | Status type `"lobby" \| "drawing"` — needs `"result"` |
| Frontend `api` methods | `frontend/src/services/api.ts` | 72-117 | Follow existing POST pattern for new endpoints |
| `setRoomSnapshot` guard | `frontend/src/state/roomStore.ts` | 73-81 | Blocks `currentRound` decrease — breaks restart |
| `RoomStore` methods | `frontend/src/state/roomStore.ts` | 83-165 | Follow `withLoading` + `setRoomSnapshot` pattern |
| `GamePage` poll | `frontend/src/pages/GamePage.tsx` | 35-53 | No restart detection — needs lobby navigation on status change |
| LobbyPage poll | `frontend/src/pages/LobbyPage.tsx` | 37-66 | Already auto-navigates on `status !== "lobby"` — covers result state |
| Existing tests | `backend/src/services/roomStore.test.ts` | 1-62 | Room isolation + CRUD — no gameplay state tests yet |
| Scoreboard component | `frontend/src/components/Scoreboard.tsx` | 1-36 | Reusable for result view — shows participants + scores |
| ResultPanel component | `frontend/src/components/ResultPanel.tsx` | 1-30 | Reusable for result view — shows guess history |
