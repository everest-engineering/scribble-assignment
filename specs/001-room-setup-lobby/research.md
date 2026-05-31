# Research: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-31

## Findings

### Decision: Host tracking via `hostId` on the Room model
- **Decision**: Add `hostId: string` to the `Room` interface in `backend/src/models/game.ts`. Set it to the creator's `participantId` inside `createRoom()`. Include it in `RoomSnapshot` so the frontend can compare it against its stored `participantId`.
- **Rationale**: Single source of truth on the room object. The frontend already receives `participantId` from the create/join response and stores it in `RoomStore` React state.
- **Alternatives considered**: `isHost` flag on each `Participant` — rejected because it duplicates data and requires updating every participant record on the room rather than one field.

### Decision: Input validation via Zod `.trim().min(1)`
- **Decision**: Update `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` to use `z.string().trim().min(1, "Player name is required")`. Remove the `displayName()` fallback in `roomStore.ts` that silently substituted "Player" for an empty name.
- **Rationale**: Constitution Principle II requires all inputs trimmed and validated on both client and server. Zod is already in use — no new dependency needed.
- **Alternatives considered**: Manual `if (!name.trim())` checks — rejected; Zod is already the validation layer and doing it there keeps it consistent.

### Decision: `RoomStatus` extended with `"game"`
- **Decision**: Update `RoomStatus = "lobby" | "game"` in `backend/src/models/game.ts`. The `POST /rooms/:code/start` handler sets `room.status = "game"` via `saveRoom()`.
- **Rationale**: All clients poll `GET /rooms/:code`. When they detect `status === "game"` they navigate to `/game`. No new sync mechanism required.
- **Alternatives considered**: A separate `started: boolean` field — rejected; `status` is already the correct state discriminant and will be needed for future scenarios.

### Decision: `POST /rooms/:code/start` — new endpoint, minimal implementation
- **Decision**: Add `router.post("/:code/start", ...)` in `backend/src/api/rooms.ts`. Validate `participantId` from request body, check it matches `room.hostId`, check `room.participants.length >= 2`, then call `saveRoom({ ...room, status: "game" })`.
- **Rationale**: Minimal REST extension. Uses existing `HttpError` for `403`/`400` responses. Uses existing `saveRoom()` utility.
- **Alternatives considered**: Putting start logic in `roomStore.ts` service function `startRoom()` — preferred; keeps handler thin.

### Decision: Lobby polling via `setInterval` in `useEffect`
- **Decision**: In `LobbyPage.tsx`, replace the manual "Refresh Room" button with a `setInterval(..., 2000)` inside a `useEffect`. Clean up with `clearInterval` on unmount. Keep manual refresh button as a secondary action (constitution Principle III requires pre-existing manual refresh to remain functional).
- **Rationale**: No new library needed. React `useEffect` cleanup is the standard pattern for interval teardown. `RoomStore.fetchRoom()` is already set up to use the stored `participantId`.
- **Alternatives considered**: Custom `usePolling` hook — acceptable but adds abstraction for a single usage; inline `useEffect` is simpler per Principle V.

### Decision: Client-side validation before submission
- **Decision**: In `CreateRoomPage.tsx` and `JoinRoomPage.tsx`, trim the input value and check `.length === 0` before calling the store. Show an inline error message. Same pattern already used for server error display.
- **Rationale**: Constitution Principle II requires both client and server validation. Immediate feedback improves UX. The server remains the authoritative gate.
- **Alternatives considered**: HTML `required` attribute only — insufficient; doesn't handle whitespace-only names.

## Existing Code Reused Without Change
- `frontend/src/state/roomStore.ts` — `participantId` already stored in React state ✅
- `backend/src/services/roomStore.ts` — `saveRoom()`, `getRoom()`, `generateUniqueCode()` ✅
- `backend/src/api/schemas.ts` — `HttpError`, `roomCodeParamsSchema` ✅
- Room isolation — each room keyed by unique code in `Map<string, Room>` ✅
