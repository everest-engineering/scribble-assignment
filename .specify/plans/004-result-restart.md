# Implementation Plan: Result, Restart & Final Validation

**Feature Group**: 004 — Result, Restart & Final Validation
**Date**: 2026-06-09
**Spec**: `.specify/specs/004-result-restart.md`
**Input**: Discovery notes + spec + constitution

---

## Summary

Add the round-end lifecycle: a result state that reveals the secret word, final scores, and full guess history to all participants, and a host-triggered restart that clears round state and returns everyone to the lobby with their identities preserved.

---

## Constitution Check

| Principle | Relevance | Status |
|---|---|---|
| I. Spec-Driven Development | All work must trace to spec requirements | ✅ Plan maps to FR-001 through FR-007 |
| II. TypeScript Quality & Validation | Input validation, no `any` | ✅ Zod schema for restart body; room status union updated |
| III. Incremental Delivery | One feature group at a time | ✅ Only result and restart scope (no round mechanics, no winner logic) |
| IV. Traceability & Documentation | Tasks traceable to spec | ✅ Spec FR/AC references throughout |
| V. Review Discipline | Edge cases, isolation, no out-of-scope | ✅ Non-goals section in spec; no timer/winner/rotation logic introduced |

No gates violated. No complexity justification needed.

---

## 1. State Model Changes

### Backend — `src/models/game.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `"result"` to `RoomStatus` union | New room lifecycle status distinct from lobby and playing | FR-001, AC-001 |

**Updated type:**

```typescript
export type RoomStatus = "lobby" | "playing" | "result";
```

**No other model changes.** `Participant`, `Guess`, `Room`, and `RoomSnapshot` already carry all fields needed (score, guesses, secretWord, drawerId). The secret word reveal logic is handled in `toRoomSnapshot` based on status, not by adding new fields.

### Frontend — `src/services/api.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `"result"` to `RoomSnapshot.status` type union | Mirrors backend type change | FR-001, AC-001 |
| Add `endRound` method to API client | Calls new `POST /rooms/:code/end-round` | FR-001 |
| Add `restartGame` method to API client | Calls new `POST /rooms/:code/restart` | FR-005 |

**Updated type:**

```typescript
export interface RoomSnapshot {
  // ... existing fields unchanged
  status: "lobby" | "playing" | "result";
  // ... secretWord is already optional string — in result state it will always be present
}
```

### Frontend — `src/state/roomStore.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `endRound()` action | Calls API, updates snapshot | FR-001 |
| Add `restartGame()` action | Calls API, updates snapshot, triggers lobby navigation | FR-005, FR-006, FR-007 |

---

## 2. Backend Changes

### Models (`src/models/game.ts`)

- Update `RoomStatus`: `"lobby" | "playing"` → `"lobby" | "playing" | "result"`.

### Room Store (`src/services/roomStore.ts`)

- **`endRound(code, requesterId)`** — new function:
  - Look up room by code. Return `{ ok: false, status: 404 }` if not found.
  - Return `{ ok: false, status: 400 }` if room status is not `"playing"`.
  - Return `{ ok: false, status: 403 }` if the requester is not the host.
  - Transition room status to `"result"`.
  - Return `{ ok: true, room: cloneRoom(room) }`.
  - All existing fields (secretWord, guesses, scores) remain in place — no data is cleared. This ensures the result snapshot contains the full round outcome.

- **`restartGame(code, requesterId)`** — new function:
  - Look up room by code. Return `{ ok: false, status: 404 }` if not found.
  - Return `{ ok: false, status: 400 }` if room status is not `"result"`.
  - Return `{ ok: false, status: 403 }` if the requester is not the host.
  - Clear round-specific state:
    - `room.secretWord = ""`
    - `room.guesses = []`
    - `room.drawerId = ""`
    - Reset every participant's `score` to 0.
  - Transition room status to `"lobby"`.
  - Return `{ ok: true, room: cloneRoom(room) }`.
  - Participants array is untouched — all players and their IDs are preserved.

- **`toRoomSnapshot`** — update:
  - Current logic: secret word is included only if viewer is the drawer.
  - New logic: if `room.status === "result"`, ALWAYS include the secret word (`secretWord: room.secretWord`) regardless of viewer identity.
  - For `"lobby"` and `"playing"` statuses, behavior is unchanged.

### Routes (`src/api/rooms.ts`)

- **Add `POST /:code/end-round` route**:
  - Validate params with `roomCodeParamsSchema`.
  - Validate body with `startGameBodySchema` (reuse — it has `participantId: string`).
  - Call `endRound(code.toUpperCase(), participantId)`.
  - On `!result.ok`: throw `HttpError(result.status, result.message)`.
  - On success: `response.json({ room: toRoomSnapshot(result.room, participantId) })`.

- **Add `POST /:code/restart` route**:
  - Validate params with `roomCodeParamsSchema`.
  - Validate body with `startGameBodySchema` (reuse).
  - Call `restartGame(code.toUpperCase(), participantId)`.
  - On `!result.ok`: throw `HttpError(result.status, result.message)`.
  - On success: `response.json({ room: toRoomSnapshot(result.room, participantId) })`.

### Schemas (`src/api/schemas.ts`)

- No new schemas needed. Both new endpoints reuse `startGameBodySchema` and `roomCodeParamsSchema`.

---

## 3. Frontend Changes

### API Service (`src/services/api.ts`)

- Update `RoomSnapshot.status` union: `"lobby" | "playing"` → `"lobby" | "playing" | "result"`.
- Add `endRound` method:
  ```typescript
  endRound(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/end-round`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
  ```
- Add `restartGame` method:
  ```typescript
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
  ```

### Room Store (`src/state/roomStore.ts`)

- Add `endRound()` action:
  - Guard: return null if no room or no participantId.
  - Call `api.endRound(room.code, participantId)` via `withLoading`.
  - On success: call `setRoomSnapshot(response.room)` to update state.

- Add `restartGame()` action:
  - Guard: return null if no room or no participantId.
  - Call `api.restartGame(room.code, participantId)` via `withLoading`.
  - On success: call `setRoomSnapshot(response.room)` to update state.
  - Return the response so the page can navigate to lobby.

### GamePage (`src/pages/GamePage.tsx`)

- **Add result state view**: When `room.status === "result"`, render a result layout instead of the game layout:
  - Show the revealed secret word prominently (to all participants).
  - Show the Scoreboard with final scores.
  - Show the ResultPanel with full guess history.
  - Show a "Restart Game" button (host only).
  - Show a "Waiting for host to restart..." message (non-hosts).
  - Hide canvas, GuessForm, and secret word card (no gameplay in result state).

- **Add navigation on restart**: When polling detects status changed to `"lobby"` while on the game page, navigate to `/lobby`. Implement via `useEffect` watching `room?.status`.

- **Add end-round trigger**: Provide an "End Round" button for the host while in playing state. This is the manual mechanism to enter the result state.

### LobbyPage (`src/pages/LobbyPage.tsx`)

- No changes needed. The existing `useEffect` already navigates to `/game` when `room?.status === "playing"`. The lobby also already polls. After restart, the room status is `"lobby"`, and the lobby page renders normally with all participants preserved.

---

## 4. API Changes

### New Endpoints

| Method | Path | Request Body | Success Response | Error Responses |
|---|---|---|---|---|
| POST | `/rooms/:code/end-round` | `{ participantId: string }` | `200` `{ room: RoomSnapshot }` (status: "result", secretWord revealed) | `404` room not found, `403` not host, `400` not playing |
| POST | `/rooms/:code/restart` | `{ participantId: string }` | `200` `{ room: RoomSnapshot }` (status: "lobby", all round state cleared) | `404` room not found, `403` not host, `400` not result |

### Modified Endpoints

| Method | Path | Change |
|---|---|---|
| GET | `/rooms/:code` | When status is `"result"`, the `secretWord` field is always included in the snapshot (regardless of viewer identity). |
| POST | `/rooms/:code/join` | Joining during result state reveals the secret word, existing scores, and full guess history. |

### Response Shape Change

The `RoomSnapshot` type is unchanged at the field level. The behavioral change is:
- During `"result"` status: `secretWord` is always present for all viewers.
- During `"lobby"` and `"playing"` statuses: `secretWord` behavior is unchanged from FG2/FG3.

---

## 5. Data Flow

### End Round (Host)

```
[Host clicks "End Round" on game page]
  ↓
[GamePage] calls roomStore.endRound()
  ↓
[RoomStore.endRound]
  ↓ POST /rooms/:code/end-round { participantId }
[Backend] validate: room exists? status === "playing"? requester is host?
  updateRoomStatus(room, "result")
  ↓ return toRoomSnapshot(room, participantId)
    → status: "result"
    → secretWord: "rocket"  (revealed to all)
    → participants: [{ score: 100 }, { score: 0 }]
    → guesses: [...full history...]
[RoomStore] setRoomSnapshot(snapshot)
  ↓ re-render
[GamePage] shows result view: word, scores, history, restart button
```

### Restart (Host)

```
[Host clicks "Restart Game" on result view]
  ↓
[GamePage] calls roomStore.restartGame()
  ↓
[RoomStore.restartGame]
  ↓ POST /rooms/:code/restart { participantId }
[Backend] validate: room exists? status === "result"? requester is host?
  room.secretWord = ""
  room.guesses = []
  room.drawerId = ""
  reset all participant scores to 0
  updateRoomStatus(room, "lobby")
  ↓ return toRoomSnapshot(room, participantId)
    → status: "lobby"
    → secretWord: undefined
    → participants: [{ score: 0 }, { score: 0 }]  (preserved IDs, names)
    → guesses: []
[RoomStore] setRoomSnapshot(snapshot)
  ↓
[GamePage] navigates to "/lobby"
```

### Other Participant Sees Restart (via Polling)

```
[Other participant's GamePage — still showing result view]
  ↓ polling interval fires (every 2s)
[RoomStore.fetchRoom]
  ↓ GET /rooms/:code?participantId=xxx
[Backend] toRoomSnapshot(room, participantId)
  → status: "lobby", lobby-state snapshot
[RoomStore] setRoomSnapshot(snapshot)
  ↓ GamePage detects status === "lobby"
[GamePage] navigates to "/lobby"
[LobbyPage] renders with preserved participants, ready for new game
```

---

## 6. File-Level Impact Analysis

### Files to Modify

| File | Change Type | Summary |
|---|---|---|
| `backend/src/models/game.ts` | **Extend** | Add `"result"` to `RoomStatus` union |
| `backend/src/services/roomStore.ts` | **Extend** | Add `endRound` and `restartGame` functions; update `toRoomSnapshot` to always reveal secret word when status is `"result"` |
| `backend/src/api/rooms.ts` | **Extend** | Add `POST /:code/end-round` and `POST /:code/restart` routes |
| `frontend/src/services/api.ts` | **Extend** | Add `"result"` to status union; add `endRound` and `restartGame` API methods |
| `frontend/src/state/roomStore.ts` | **Extend** | Add `endRound` and `restartGame` actions |
| `frontend/src/pages/GamePage.tsx` | **Rework** | Add result state view with revealed word, scores, history; add end-round button; add restart button; add auto-navigation to lobby on status change |

### Files to Extend (Tests)

| File | Change Type | Summary |
|---|---|---|
| `backend/src/services/roomStore.test.ts` | **Extend** | Tests for `endRound`: valid transition, host-only, wrong status, unknown room. Tests for `restartGame`: valid restart, host-only, wrong status, state cleared, participants preserved. Tests for `toRoomSnapshot`: secret word revealed in result state. |
| `backend/src/api/schemas.test.ts` | **No change** | Both new routes reuse existing `startGameBodySchema` and `roomCodeParamsSchema` |
| `frontend/src/services/api.test.ts` | **Extend** | Test `endRound` sends POST to correct endpoint; test `restartGame` sends POST to correct endpoint |
| `frontend/src/state/roomStore.test.ts` | **Extend** | Test `endRound` calls API and updates snapshot; test `restartGame` calls API and updates snapshot |

### Files Unchanged

| File | Rationale |
|---|---|
| `backend/src/api/schemas.ts` | No new validation schemas needed |
| `backend/src/api/router.ts` | No routing changes |
| `backend/src/app.ts` | No app-level configuration changes |
| `backend/src/server.ts` | No server configuration changes |
| `backend/src/seed/starterData.ts` | Word list unchanged |
| `frontend/src/pages/LobbyPage.tsx` | Already navigates to game on status change; after restart it simply renders lobby |
| `frontend/src/pages/CreateRoomPage.tsx` | No changes needed |
| `frontend/src/pages/JoinRoomPage.tsx` | No changes needed |
| `frontend/src/pages/StartPage.tsx` | No changes needed |
| `frontend/src/components/Card.tsx` | No changes needed |
| `frontend/src/components/PageHeader.tsx` | No changes needed |
| `frontend/src/components/RoomCodeBadge.tsx` | No changes needed |
| `frontend/src/components/GuessForm.tsx` | Hidden in result state via GamePage conditional rendering |
| `frontend/src/components/Scoreboard.tsx` | Already renders real scores from participants prop — no changes needed |
| `frontend/src/components/ResultPanel.tsx` | Already renders guess history from guesses prop — no changes needed |
| `frontend/src/styles/app.css` | Existing styles sufficient; minor additions possible for result view |

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Race condition: end round and guess simultaneously** | Low | End round clears state; guess after end returns 400 | Node.js single-threaded; Map operations are synchronous. Guess arriving before end-round processes normally; guess arriving after returns "not playing" error. Acceptable. |
| **Stale client shows result UI while another client has already restarted** | Low | Brief UI inconsistency until next poll | Polling interval handles this within ~2s. The GamePage's status watcher (useEffect on room.status) will navigate to lobby on next poll after restart. |
| **Result view canvas not cleared** | Low | Drawer still sees drawing marks in result state | Canvas state is browser-local. Clearing canvas on transition to result or on restart is a frontend concern. The GamePage can clear the canvas via `clearCanvas` when transitioning to result view. |
| **Non-host sees restart button before backend confirms** | Low | Non-host clicks disabled button | The restart button is gated by `isHost` check. The backend also enforces host-only via 403. Double-gated. |
| **End round without a round in progress** | Low | 400 error; result not shown | Backend validates `status === "playing"` before transitioning. Frontend should only show the end-round button when `status === "playing"` and `isHost`. |
| **Multiple restarts from rapid clicks** | Low | First succeeds, rest fail (400 not in result state) | Frontend should disable restart button during loading. Backend enforces single-use via status check. |

---

## 8. Validation Strategy

### Automated Tests

| Area | What to Test | Tool |
|---|---|---|
| Room store — endRound | Valid transition from playing to result; host-only; wrong status; unknown room | Vitest (backend) |
| Room store — restartGame | Valid restart from result to lobby; host-only; wrong status; unknown room | Vitest (backend) |
| Room store — restartGame | Secret word cleared after restart; guesses cleared; scores reset to 0; drawer ID cleared | Vitest (backend) |
| Room store — restartGame | Participants preserved after restart (same count, same IDs, same names) | Vitest (backend) |
| Room store — toRoomSnapshot | Secret word revealed to all viewers when status is "result" | Vitest (backend) |
| Room store — toRoomSnapshot | Secret word hidden from non-drawer when status is not "result" (regression) | Vitest (backend) |
| API client — endRound | Sends POST to /rooms/:code/end-round with correct body | Vitest (frontend) |
| API client — restartGame | Sends POST to /rooms/:code/restart with correct body | Vitest (frontend) |
| Room store — endRound | Calls API and updates snapshot on success | Vitest (frontend) |
| Room store — restartGame | Calls API and updates snapshot on success | Vitest (frontend) |
| FG1 + FG2 + FG3 regression | All existing tests continue to pass | Vitest (both) |

### Manual Validation (Two Browser Tabs)

| Scenario | Steps | Expected |
|---|---|---|
| Host ends round | Tab A (host) clicks "End Round" after gameplay | Both tabs show result view: secret word revealed, same final scores, same guess history. Tab B sees the word within ~3s via polling. |
| Host restarts | Tab A clicks "Restart Game" from result view | Both tabs navigate to lobby within ~3s. Participant list is identical. No secret word, no guesses, scores at 0. |
| Non-host cannot restart | Tab B clicks "Restart Game" (if visible) | Error message; room stays in result state. |
| Non-host cannot end round | Tab B clicks "End Round" (if visible) | Error message; room stays in playing state. |
| Second game works | Host starts a new game from lobby after restart | New game begins normally. Drawer assigned, secret word selected, guessing/scoring work. |
| Room isolation | Two separate rooms both in result state | Secret words, scores, and guesses from Room A not visible in Room B. |
| Polling during result | Observe both tabs during result state | Both tabs show identical result state without manual refresh. |

### Validation Gate

All acceptance criteria AC-001 through AC-014 must pass before Feature Group 4 is considered complete.
