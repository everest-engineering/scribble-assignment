# Research: Game Room Lobby

**Branch**: `002-game-room-lobby` | **Date**: 2026-05-30

## Host Designation

**Decision**: Store `hostId` as the `id` of the first participant added to a room (i.e. the creator). Expose `hostId` on both the server-side `Room` model and the `RoomSnapshot` returned to clients.

**Rationale**: The spec mandates "the creator is automatically the host" with no host-promotion mechanic. Capturing `hostId` at room creation time is the simplest deterministic rule: whoever calls `createRoom()` supplies the first `Participant`; that `participant.id` becomes `room.hostId`. No additional bookkeeping is required.

**Alternatives considered**: Deriving host from `participants[0]` at read time — rejected because it breaks if participant order ever changes (sort, de-dup). An explicit `isHost` flag per participant — rejected as redundant when a single scalar on `Room` suffices.

---

## Room Code Validation

**Decision**: Validate the room code format (4 uppercase alphanumeric characters from the generation alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) at the API layer using a Zod regex refinement on `roomCodeParamsSchema`. Client-side: the `JoinRoomPage` validates non-empty and trims whitespace before sending.

**Rationale**: The generator already produces 4-char codes. Rejecting malformed codes at the schema level means invalid lookups never hit `rooms.get()` and the error message can reference the expected format. Client-side validation catches the empty-field case before a network round-trip.

**Alternatives considered**: Length check only (no character-set check) — rejected because it allows codes that can never exist (lowercase, special chars) through to the 404 path, giving a misleading "room not found" instead of "invalid code format".

---

## Player Name Validation

**Decision**: Make `playerName` required and non-whitespace-only on both `createRoomSchema` and `joinRoomSchema` using `z.string().min(1).trim()`. The frontend forms also validate client-side before submission.

**Rationale**: The constitution (Principle III) explicitly prohibits empty/whitespace-only player names. The current schema marks `playerName` as `optional()`, which silently falls back to `"Player"` — this hides the validation gap. Making it required server-side is the authoritative gate; client-side validation is a UX convenience.

**Alternatives considered**: Keep `optional()` and enforce only client-side — rejected because the API would remain permissive, violating the constitution.

---

## Auto-Polling Strategy

**Decision**: In `LobbyPage`, use a `useEffect` with `setInterval` at a 2000ms interval calling `roomStore.fetchRoom()`. Clear the interval on component unmount.

**Rationale**: The spec requires ~2s lobby refresh. `setInterval` inside a `useEffect` is the idiomatic React pattern for polling without introducing new libraries (respecting constitution Principle V: no new state-management or routing libraries). The existing `roomStore.fetchRoom()` method already calls `GET /rooms/:code` and updates state — no new plumbing needed.

**Alternatives considered**: Short-circuit polling on polling error — deferred; the spec says errors should not crash the lobby, so polling failures are swallowed silently (the displayed list may be briefly stale, which is acceptable per spec assumption).

---

## Start Game Flow

**Decision**: Add `POST /rooms/:code/start` backend endpoint that sets `room.status` to `"active"`. Extend `RoomStatus` to include `"active"`. The frontend calls this endpoint from the host's "Start Game" button, then navigates to `/game`. Non-host players have no actionable "Start Game" control; the lobby polls and the frontend detects `status === "active"` to auto-navigate guests to `/game`.

**Rationale**: The spec requires the host to explicitly start the game, and all players must transition together. A status field on `Room` is the minimal shared signal (in-memory, no WebSockets needed). Guests detecting the status change via the existing poll is consistent with the ~2s polling mechanism already defined for player list refresh.

**Alternatives considered**: Host pushes a separate "start" signal to guests — rejected as it requires WebSockets or a second polling endpoint (out of scope per constitution). Having the frontend navigate guests based on a timer — rejected as non-deterministic.

---

## API Base URL Bug

**Decision**: The `API_BASE_URL` in `frontend/src/services/api.ts` is currently `http://localhost:3001/bug`. The correct value is `http://localhost:3001` (the Express app mounts `/rooms` directly at the root via `router.use("/rooms", createRoomsRouter())`). This is a known starter bug and must be fixed as part of this feature.

**Rationale**: Without this fix, all API calls fail with 404. Fixing it is a prerequisite for any lobby feature to work.
