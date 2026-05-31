# Feature Specification: Group 1 — Room Setup & Lobby

**Feature Branch**: `group-1-room-setup-lobby`

**Created**: 2026-05-31

**Status**: Draft

---

## User Scenarios & Testing

### User Story 1 — Host Creates a Room and Waits in Lobby (Priority: P1)

A player opens the app, enters their name, creates a room, and lands in the Lobby. The room code is displayed so they can share it. The creator is recognised as the host. The lobby refreshes automatically every 2 seconds so new joiners appear without manual action. The Start Game button is visible to the host but disabled until at least one other player has joined.

**Why this priority**: Everything else depends on a room existing. This is the first thing any player does and covers the most critical path (create → lobby → see participants).

**Independent Test**: Open the app, create a room, observe the lobby auto-refresh and the disabled Start Game button. Confirm Start Game is enabled only after a second player joins in a separate tab.

**Acceptance Scenarios**:

1. **Given** the Create Room form, **When** a player submits a valid name, **Then** `POST /rooms` returns `{ participantId, room: RoomSnapshot }` where `room.hostId === participantId`.
2. **Given** the lobby, **When** it mounts, **Then** `GET /rooms/:code` is called immediately and then every 2 seconds via `setInterval`.
3. **Given** the lobby, **When** it unmounts (navigation away), **Then** `clearInterval` is called and polling stops.
4. **Given** the lobby with only the host present (`participants.length === 1`), **When** the host views the page, **Then** the Start Game button is visible but `disabled`.
5. **Given** the lobby with 2+ participants, **When** the host views the page, **Then** the Start Game button is enabled.
6. **Given** the lobby, **When** a non-host participant views it, **Then** no Start Game button is rendered; instead the text "Waiting for host to start..." is shown.

---

### User Story 2 — Player Joins an Existing Room (Priority: P1)

A second player enters the room code shared by the host and their own name, then joins the room. They land in the same lobby and see the participant list. Their presence is reflected on the host's screen within the next polling interval.

**Why this priority**: A room with one participant is unplayable. Join is the second mandatory action in every game session.

**Independent Test**: Open two tabs. Tab A creates a room. Tab B joins using the code. Within ≤4 seconds, Tab A's lobby shows both names.

**Acceptance Scenarios**:

1. **Given** a valid room code and player name, **When** `POST /rooms/:code/join` is called, **Then** a `{ participantId, room: RoomSnapshot }` is returned where the new participant appears in `room.participants`.
2. **Given** an existing room with 1 participant, **When** a second player joins, **Then** `room.participants.length === 2`.
3. **Given** a joining player, **When** they land on the lobby, **Then** their `participantId !== room.hostId` so they see "Waiting for host to start..." instead of Start Game.
4. **Given** the host's lobby is polling, **When** a second player joins, **Then** within ≤4 seconds the host's participant list updates without a manual refresh.

---

### User Story 3 — Input Validation Rejects Bad Data (Priority: P2)

The backend rejects malformed requests before they touch business logic. Whitespace-only names are treated as empty. Unknown room codes return 404, not 500.

**Why this priority**: Without validation, the in-memory store can be poisoned with nameless participants or silent errors. Validation is required for a clean lobby experience.

**Independent Test**: Use `curl` or a REST client to send `{ "playerName": "   " }` to `POST /rooms` and expect `400`. Send a non-existent code to `GET /rooms/ZZZZ` and expect `404`.

**Acceptance Scenarios**:

1. **Given** `POST /rooms` with body `{ "playerName": "   " }`, **When** the request is processed, **Then** the response is `400` with a message indicating the name is required.
2. **Given** `POST /rooms/:code/join` with body `{ "playerName": "" }`, **When** the request is processed, **Then** the response is `400` with a message indicating the name is required.
3. **Given** `POST /rooms/:code/join` with a code that does not exist, **When** the request is processed, **Then** the response is `404` (not `500`).
4. **Given** `GET /rooms/:code` with a code that does not exist, **When** the request is processed, **Then** the response is `404`.
5. **Given** `POST /rooms/:code/join` with an empty string code in the body (malformed path param not applicable, but empty-string body code), **When** the Zod schema runs, **Then** a `400` is returned.

---

### Edge Cases

- **Whitespace-only name** (`"   "`): must be rejected with `400`. The schema must use `.trim().min(1)` — a name that trims to empty is not optional, it is invalid.
- **Host page refresh**: navigating away and returning re-fetches the room from the backend; `hostId` is stored on the `Room` object in-memory and is not lost on frontend reload (only lost if the backend restarts, which is acceptable).
- **Two concurrent rooms**: joining room `AAAA` must not affect room `BBBB`. Each room's participant list is isolated in the `Map<string, Room>` store.
- **Empty room code on GET /rooms/:code**: returns 400 (roomCodeParamsSchema uses .min(1, "Room code is required"))
- **Polling during navigation**: if the user navigates from lobby to another page, the `useEffect` cleanup must call `clearInterval`. No orphaned intervals.
- **Lobby with 0 participants**: cannot happen in practice (creator is always first participant), but `GET /rooms/:code` always returns at least 1 participant if the room exists.

---

## Requirements

### Functional Requirements

- **FR-001**: `Room` interface MUST include `hostId: string` (the `id` of the first participant).
- **FR-002**: `RoomSnapshot` interface MUST include `hostId: string`.
- **FR-003**: `createRoom()` in `roomStore.ts` MUST set `room.hostId = participant.id` at creation time.
- **FR-004**: `toRoomSnapshot()` MUST include `hostId` in the returned snapshot (remove the `void viewerParticipantId` placeholder; the field is not needed for this group but `hostId` must be mapped from the room).
- **FR-005**: `createRoomSchema` MUST validate `playerName` as a non-empty, non-whitespace-only string when provided — use `z.string().trim().min(1, "Player name is required")` and make it required (not optional).
- **FR-006**: `joinRoomSchema` MUST apply the same trim/min(1) validation as `createRoomSchema`.
- **FR-007**: `roomCodeParamsSchema` MUST validate `code` as a non-empty string.
- **FR-008**: `LobbyPage` MUST replace the manual Refresh Room button's `handleRefresh` with a `setInterval`-based polling loop that fires every 2000 ms.
- **FR-009**: The `useEffect` that sets up polling MUST return a cleanup function that calls `clearInterval`.
- **FR-010**: `LobbyPage` MUST derive `isHost` by comparing `roomStore.getSnapshot().participantId` against `room.hostId`.
- **FR-011**: When `isHost` is `true`, a Start Game button MUST render; it MUST be `disabled` when `room.participants.length < 2`.
- **FR-012**: When `isHost` is `false`, the Start Game button MUST NOT render; the text "Waiting for host to start..." MUST appear in its place.
- **FR-013**: The manual Refresh Room button MAY be removed or retained; if retained it must not conflict with auto-polling.

### Key Entities

- **Room** (`backend/src/models/game.ts`): adds `hostId: string`. All other fields unchanged.
- **RoomSnapshot** (`backend/src/models/game.ts`): adds `hostId: string`. All other fields unchanged.
- **Participant** (`backend/src/models/game.ts`): no changes.
- **RoomState** (`frontend/src/state/roomStore.ts`): `participantId: string | null` already exists — no change needed. `isHost` is derived at render time, not stored.

---

## Implementation Notes (per file)

### `backend/src/models/game.ts`
Add `hostId: string` to both `Room` and `RoomSnapshot`. No other changes.

```typescript
// Room — add after updatedAt:
hostId: string;

// RoomSnapshot — add after roles:
hostId: string;
```

### `backend/src/services/roomStore.ts`
In `createRoom()`, set `hostId: participant.id` on the room literal.
In `toRoomSnapshot()`, replace `void viewerParticipantId` with `hostId: room.hostId` in the returned object.

### `backend/src/api/schemas.ts`
Replace the current loose schemas with validated ones:

```typescript
// Before:
playerName: z.string().optional()

// After:
playerName: z.string().trim().min(1, "Player name is required")
// (required, not optional — empty string or whitespace → 400)
```

`roomCodeParamsSchema.code` can remain `z.string()` — the `.toUpperCase()` call in the route handler covers normalisation. Adding `.min(1)` is acceptable.

### `backend/src/api/rooms.ts`
No structural changes. Validation already runs via `.parse()`. Once schemas are tightened, bad input automatically yields a Zod error that the existing error handler converts to a 400.

### `frontend/src/pages/LobbyPage.tsx`
Replace `handleRefresh` + manual button with a polling `useEffect`:

```typescript
useEffect(() => {
  const id = setInterval(() => {
    roomStore.fetchRoom().catch(() => {/* error already stored in roomStore state */});
  }, 2000);
  return () => clearInterval(id);
}, [roomStore]);
```

Derive `isHost` from store state:
```typescript
const { room, participantId } = useRoomState();
const isHost = participantId !== null && room !== null && participantId === room.hostId;
```

Render host gate:
```tsx
{isHost ? (
  <button
    className="button button--primary"
    disabled={room.participants.length < 2}
    onClick={() => navigate("/game")}
  >
    Start Game
  </button>
) : (
  <p>Waiting for host to start...</p>
)}
```

### `frontend/src/services/api.ts`
No new API functions needed for this group. `fetchRoom`, `createRoom`, and `joinRoom` are already present. However, `api.ts` defines its **own local copy** of `RoomSnapshot` and `RoomSessionResponse` — it does not import from the backend. `hostId: string` must be added to the local `RoomSnapshot` interface here so the frontend TypeScript build passes and `room.hostId` is accessible in components.

### `frontend/src/state/roomStore.ts`
No behavioural changes. `participantId` is already stored on `RoomState`. `fetchRoom()` already calls the API and updates the snapshot. TypeScript will surface the `hostId` field automatically once the model is updated.

---

## Success Criteria

- **SC-001**: `POST /rooms` response body always contains `room.hostId` equal to the returned `participantId`.
- **SC-002**: `POST /rooms` or `POST /rooms/:code/join` with a whitespace-only player name returns HTTP 400.
- **SC-003**: `GET /rooms/NOTEXIST` returns HTTP 404 (not 500).
- **SC-004**: LobbyPage participant list updates within ≤4 seconds of a new player joining, without any manual user action.
- **SC-005**: No `setInterval` timer survives navigation away from LobbyPage (verified by checking no network calls fire after unmount).
- **SC-006**: Host sees a Start Game button; non-host sees "Waiting for host to start..." — confirmed in the same room session with two different browser tabs.
- **SC-007**: Start Game button is disabled with 1 participant and enabled with 2+.
- **SC-008**: `npm run build` passes with zero TypeScript errors on both frontend and backend after all changes.
- **SC-009**: `npm test` passes with no regressions on both frontend and backend.

---

## Assumptions

- `playerName` is now **required** on both create and join. The previous `optional()` schema allowed anonymous "Player" names — this spec tightens that. If the product decision is to keep names optional, FR-005 and FR-006 must be revised before implementation begins.
- The Start Game button navigating to `/game` is a placeholder for Group 2's `POST /rooms/:code/start` endpoint. For this group, clicking Start Game may navigate immediately (as it does today) — Group 2 will replace that with a real API call.
- Host status is not re-assigned if the host leaves. There is no leave mechanism in scope. If the backend restarts, all room state is lost — this is acceptable per the constitution.
- `RoomSnapshot.roles` and `RoomSnapshot.availableWords` are unchanged static values. They are out of scope for this group.

---

## Out of Scope for This Group

- `POST /rooms/:code/start` endpoint (Group 2)
- Drawer assignment and secret word selection (Group 2)
- Canvas drawing interaction (Group 3)
- Guess submission, guess history, scoring (Group 3–4)
- Results panel and restart flow (Group 4)
