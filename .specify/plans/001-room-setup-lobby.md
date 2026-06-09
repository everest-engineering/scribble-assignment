# Implementation Plan: Room Setup & Lobby

**Feature Group**: 001 — Room Setup & Lobby
**Date**: 2026-06-09
**Spec**: `.specify/specs/001-room-setup-lobby.md`
**Input**: Discovery notes + spec + constitution

---

## Summary

Add host tracking, input validation, automatic lobby polling, and host-gated
game start to the existing room creation/joining scaffold. The backend needs a
new start-game endpoint and schema changes. The frontend needs polling logic in
the store and host-aware UI in the lobby.

---

## Constitution Check

| Principle | Relevance | Status |
|---|---|---|
| I. Spec-Driven Development | All work must trace to spec requirements | ✅ Plan maps to spec FRs and ACs |
| II. TypeScript Quality & Validation | Input validation, no `any` | ✅ Zod schemas for all inputs |
| III. Incremental Delivery | One feature group at a time | ✅ Only lobby scope |
| IV. Traceability & Documentation | Tasks traceable to spec | ✅ FR/AC references throughout |
| V. Review Discipline | Edge cases, isolation, no out-of-scope | ✅ Non-goals section in spec |

No gates violated. No complexity justification needed.

---

## 1. State Model Changes

### Backend — `src/models/game.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `hostId: string` to `Room` | Identifies the room creator | FR-001, AC-001 |
| Add `hostId: string` to `RoomSnapshot` | Exposes host identity to all participants | FR-009, AC-023 |
| Extend `RoomStatus` to include `"playing"` | Required for start-game transition | FR-007, FR-008, AC-020 |

**No changes to `Participant`**. Host identity is a room-level attribute, not a
participant-level flag. This avoids redundant data and keeps host promotion
logic centralized.

### Frontend — `src/services/api.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `hostId: string` to `RoomSnapshot` | Mirrors backend type | FR-009 |
| Add `startGame` method to API client | Calls new POST /rooms/:code/start | FR-007, FR-008 |
| Add `RoomStatus` type with `"lobby" | "playing"` | Mirrors backend type | FR-007 |

### Frontend — `src/state/roomStore.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `startGame` action | Calls API and updates room state | FR-007, FR-008 |
| Add polling mechanism (`startPolling`, `stopPolling`) | Drives automatic lobby refresh | FR-006, AC-016 |
| Track polling state (interval ID, in-flight flag) | Prevent duplicate concurrent requests | AC-019 |

---

## 2. Backend Changes

### Schemas (`src/api/schemas.ts`)

- Make `playerName` required and non-empty in both `createRoomSchema` and
  `joinRoomSchema` (with `.min(1)` after trim).
- Add `startGameSchema` (empty body — all state is in params).
- Add `startGameParamsSchema` validating room code parameter.
- Update `HttpError` usage to support 400 (validation) and 403 (forbidden)
  status codes in addition to 404.

### Room Store (`src/services/roomStore.ts`)

- Modify `createRoom` to accept the new required `playerName`, set
  `hostId` on the created room.
- Modify `createParticipant` to accept and pass through a required `name`
  parameter (no default fallback to `"Player"`).
- Modify `joinRoom` to accept required `playerName`, validate room exists,
  trim and validate name before creating participant.
- Add `startGame(code: string, requesterId: string)` function:
  - Look up room by code.
  - Return typed error if room not found (404).
  - Return typed error if requester is not the host (403).
  - Return typed error if fewer than 2 participants (400).
  - Transition room status to `"playing"`.
  - Return updated room snapshot.
- Modify `toRoomSnapshot` to include `hostId` from the room.
- Add `updateRoomStatus` internal helper.

**Existing functions to preserve**: `listWords`, `getRoom`, `saveRoom`.
**Existing functions to remove/replace**: `displayName` (no longer needed with
required validation at the schema layer).

### Routes (`src/api/rooms.ts`)

- Add `POST /:code/start` route:
  - Validate params with `roomCodeParamsSchema`.
  - Parse requester identity from request (via `participantId` in body).
  - Call `startGame` from roomStore.
  - Return room snapshot on success.
  - Return appropriate HTTP errors on failure.
- Update existing `POST /` route: `playerName` is now required.
- Update existing `POST /:code/join` route: `playerName` is now required,
  room code trimming before lookup.

### Router (`src/api/router.ts`)

No changes needed. The rooms router already mounts at `/rooms`.

---

## 3. Frontend Changes

### API Service (`src/services/api.ts`)

- Update `RoomSnapshot` interface: add `hostId: string`.
- Update `RoomStatus` type: add `"playing"`.
- Add `startGame(code: string, participantId: string)` function:
  `POST /rooms/{code}/start` with `{ participantId }` in body.
- Return type: `{ room: RoomSnapshot }`.
- Update `createRoom` and `joinRoom` to pass `playerName` as required
  (no change to signature, but backend will reject empty).

### Room Store (`src/state/roomStore.ts`)

- Add `startGame()` action method:
  - Calls `api.startGame(room.code, participantId)`.
  - Updates room snapshot from response.
  - On error, sets error state (host-only, too-few-players).
- Add polling infrastructure:
  - `startPolling(intervalMs: number)` method that sets up a
    `setInterval` calling `fetchRoom`.
  - `stopPolling()` method that clears the interval.
  - Internal `isPollingInFlight` flag to prevent overlapping requests.
- Track `pollingIntervalId` in store (internal, not exposed in state).
- Error handling: polling errors set error state but do not stop polling.

### Lobby Page (`frontend/src/pages/LobbyPage.tsx`)

- Start polling on mount via `useEffect` (call `roomStore.startPolling(2000)`).
- Stop polling on unmount (call `roomStore.stopPolling()`).
- Replace unconditional `navigate("/game")` call with `roomStore.startGame()`,
  then navigate to `/game` only on success.
- Show host badge next to the host participant in the list.
- Disable "Start Game" button for non-host participants (or remove it).
- Show "Start Game" as disabled with a tooltip/message when fewer than 2
  players are present (host view).
- Display validation errors from failed start-game attempts inline.
- Remove manual "Refresh Room" button (now automatic via polling).

### Create Room Page (`frontend/src/pages/CreateRoomPage.tsx`)

- Add client-side name validation (trim, non-empty) before submitting.
- Display validation error inline.
- The backend will also validate — this is a UX enhancement.

### Join Room Page (`frontend/src/pages/JoinRoomPage.tsx`)

- Add client-side name validation (trim, non-empty) before submitting.
- Add room code validation (non-empty) before submitting.
- Trim room code on submission (remove accidental spaces).
- Display validation errors inline for both fields.

---

## 4. API Changes

### New Endpoint

| Method | Path | Request Body | Success Response | Error Responses |
|---|---|---|---|---|
| POST | `/rooms/:code/start` | `{ participantId: string }` | `200` `{ room: RoomSnapshot }` | `404` room not found, `403` not host, `400` < 2 players |

### Modified Endpoints

| Method | Path | Change |
|---|---|---|
| POST | `/rooms` | `playerName` now required (non-empty string). Returns snapshot with `hostId`. |
| POST | `/rooms/:code/join` | `playerName` now required (non-empty string). Room code trimmed. Returns snapshot with `hostId`. |
| GET | `/rooms/:code` | Response now includes `hostId` in snapshot. |

### Response Shape Change

Current `RoomSnapshot`:
```typescript
{ code, status, participants, availableWords, roles }
```

New `RoomSnapshot`:
```typescript
{ code, status, participants, availableWords, roles, hostId }
```

---

## 5. Data Flow

### Room Creation

```
[CreateRoomPage]
  ↓ POST /rooms { playerName }
[Backend] generate unique code
  ↓ create participant, set hostId, store room
  ↓ return { participantId, room: { ..., hostId } }
[RoomStore] set participantId + room
  ↓ navigate to /lobby
[LobbyPage] mount → startPolling(2000)
```

### Room Joining

```
[JoinRoomPage]
  ↓ POST /rooms/:code/join { playerName }
[Backend] validate code exists, validate name
  ↓ create participant, add to room
  ↓ return { participantId, room: { ..., hostId } }
[RoomStore] set participantId + room
  ↓ navigate to /lobby
[LobbyPage] mount → startPolling(2000)
```

### Lobby Polling Cycle

```
[LobbyPage] mounted
  ↓
[startPolling(2000)]
  ↓ every 2s (skip if in-flight)
[RoomStore.fetchRoom]
  ↓ GET /rooms/:code?participantId=xxx
[Backend] return current snapshot
  ↓
[RoomStore.setRoomSnapshot]
  ↓ triggers re-render via useSyncExternalStore
[LobbyPage] updates participant list, host indicator
```

### Start Game (Host Action)

```
[Host clicks "Start Game"]
  ↓
[LobbyPage] calls roomStore.startGame()
  ↓
[RoomStore.startGame]
  ↓ POST /rooms/:code/start { participantId }
[Backend] validate: is host? has 2+ players?
  ↓ if valid: status → "playing", return snapshot
  ↓ if invalid: return 403/400 with message
[RoomStore]
  ↓ on success: setRoomSnapshot, stopPolling()
  ↓ on error: set error state (displayed inline)
[LobbyPage]
  ↓ on success: navigate("/game")
  ↓ on error: show error message, continues polling
```

---

## 6. File-Level Impact Analysis

### Files to Modify

| File | Change Type | Summary |
|---|---|---|
| `backend/src/models/game.ts` | **Extend** | Add `hostId` to `Room`/`RoomSnapshot`, extend `RoomStatus` |
| `backend/src/api/schemas.ts` | **Extend** | Required `playerName`, add `startGameSchema`, add start params |
| `backend/src/api/rooms.ts` | **Extend** | Add POST /:code/start route, update existing to use required names |
| `backend/src/services/roomStore.ts` | **Extend** | Add `startGame`, update create/join for host tracking + required names |
| `frontend/src/services/api.ts` | **Extend** | Add `hostId`, `startGame`, `RoomStatus` update |
| `frontend/src/state/roomStore.ts` | **Extend** | Add `startGame`, polling lifecycle (`startPolling`, `stopPolling`) |
| `frontend/src/pages/LobbyPage.tsx` | **Rework** | Auto-polling on mount, host-gated start, host badge |
| `frontend/src/pages/CreateRoomPage.tsx` | **Minor** | Client-side name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | **Minor** | Client-side name + code validation |

### Files to Add

| File | Change Type | Summary |
|---|---|---|
| `backend/src/services/roomStore.test.ts` | **Extend** | Tests for `startGame`, host validation, player count validation |
| `backend/src/api/schemas.test.ts` | **Extend** | Tests for required name, empty name rejection |
| `frontend/src/services/api.test.ts` | **Extend** | Tests for `startGame` request shape |
| `frontend/src/state/roomStore.test.ts` | **New** | Tests for store actions (startGame, polling lifecycle) |

### Files Unchanged

| File | Rationale |
|---|---|
| `backend/src/api/router.ts` | Rooms router already mounted at `/rooms`; no routing changes needed |
| `backend/src/app.ts` | No app-level configuration changes |
| `backend/src/server.ts` | No server configuration changes |
| `backend/src/seed/starterData.ts` | Word list and roles unchanged |
| `frontend/src/pages/StartPage.tsx` | No changes to landing page |
| `frontend/src/pages/GamePage.tsx` | Game page changes deferred to Feature Group 2 |
| `frontend/src/components/GuessForm.tsx` | Not yet in scope |
| `frontend/src/components/Scoreboard.tsx` | Not yet in scope |
| `frontend/src/components/ResultPanel.tsx` | Not yet in scope |
| `frontend/src/styles/app.css` | Existing styles sufficient; minor additions possible |

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Race condition: two players create rooms with same generated code | Very low | Room creation fails | Existing retry loop in `generateUniqueCode` handles collision |
| Race condition: host clicks start while another player joins | Low | Snapshot shows 2 players but start request sees 1 | `startGame` reads room atomically from the Map; participant is visible immediately after join completes |
| Polling continues after navigating away from lobby | Medium | Unnecessary network requests | `stopPolling` called in `useEffect` cleanup on unmount |
| Polling in-flight flag not reset on error | Medium | Polling stops permanently | Ensure `finally` block resets flag regardless of outcome |
| Backend error message format differs across endpoints | Low | Frontend shows generic messages | Standardize error response shape across all endpoints |
| Browser tab goes to background, polling is throttled | Low | Delayed participant list updates | Background tab throttling is browser-controlled; polling will resume on focus. Acceptable. |

---

## 8. Validation Strategy

### Automated Tests

| Area | What to Test | Tool |
|---|---|---|
| Schema validation | Required name, empty name, empty code, valid code | Vitest (backend) |
| Room creation | Host ID set, unique code, name trimmed | Vitest (backend) |
| Room joining | Valid join, invalid code, duplicate names allowed | Vitest (backend) |
| Start game | Host-only, 2-player minimum, room status transition | Vitest (backend) |
| API client | `startGame` sends correct request shape | Vitest (frontend) |
| Room store | `startGame` action, polling start/stop lifecycle | Vitest (frontend) |

### Manual Validation (Two Browser Tabs)

| Scenario | Steps | Expected |
|---|---|---|
| Room creation + host badge | Tab A creates room. | Tab A sees host badge next to their name. |
| Join + auto-refresh | Tab B joins with Tab A's code. | Tab A sees Tab B appear within ~3s without manual refresh. |
| Host-only start | Tab B clicks Start Game. | Tab B sees error message. Tab A sees enabled button. |
| 2-player minimum | Tab A clicks Start Game with only self in room. | Tab A sees error message. |
| Successful start | Tab A (host) clicks Start Game with 2+ players. | Both tabs navigate to /game (or receive playing status). |
| Invalid code join | Enter non-existent code. | Clear error message: room not found. |
| Empty code join | Submit with blank code field. | Clear error message: code required. |
| Empty name join | Submit with blank name. | Clear error message: name required. |
| Room isolation | Create Room A and Room B in separate sessions. | Room A participants never see Room B data. |
| Polling resilience | Disconnect network during polling. | Error shown, polling continues when network returns. |

### Validation Gate

All acceptance criteria AC-001 through AC-023 must pass before Feature Group 1
is considered complete. Progression to Feature Group 2 (Game Start & Drawer
Flow) is not permitted until this gate passes.
