# Research: Room Setup and Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-05-29
**Source**: Codebase exploration of existing starter

## Findings

### Decision: Language / Runtime
- **Decision**: TypeScript 5.6, Node.js 22 (backend); TypeScript 5.6, React 18, Vite 5 (frontend)
- **Rationale**: Already in use; no changes to toolchain required.
- **Alternatives considered**: N/A (brownfield constraint).

### Decision: State management
- **Decision**: Extend the existing in-memory `Map<string, Room>` in `backend/src/services/roomStore.ts`; extend the existing `RoomStore` class in `frontend/src/state/roomStore.ts`.
- **Rationale**: Both patterns are already established and working. Introducing parallel mechanisms is explicitly forbidden by Principle 1.
- **Alternatives considered**: N/A.

### Decision: Polling implementation
- **Decision**: `setInterval` inside a `useEffect` in `LobbyPage.tsx`, calling `store.fetchRoom()` every 2000 ms. Interval is cleared on component unmount.
- **Rationale**: Simplest approach that satisfies FR-009 without any new library. The existing `fetchRoom` method in `RoomStore` already calls `api.fetchRoom` and updates store state.
- **Alternatives considered**: React Query (adds a library, forbidden by Principle 3); long polling (more complex, same result).

### Decision: Client-side code format validation
- **Decision**: Validate that the trimmed input is non-empty and matches `/^[a-zA-Z0-9]+$/` before making a server request.
- **Rationale**: Satisfies FR-006 (client owns format validation) without leaking specific code length from server. Fast feedback for the user.
- **Alternatives considered**: Full 4-char check (couples client to server implementation detail); no client validation (extra server round-trip for obvious typos).

### Decision: Host identity mechanism
- **Decision**: Add `hostId: string` to the `Room` model and `RoomSnapshot`. On `createRoom`, the first participant's `id` is stored as `hostId`. No session or token required.
- **Rationale**: Matches Principle 7 (explicit hostId). Identity is ephemeral and participant-ID-based — consistent with the no-auth model.
- **Alternatives considered**: First-participant-is-always-host heuristic without storing `hostId` (breaks after join order changes, not explicit).

### Decision: Game-start endpoint
- **Decision**: New `POST /rooms/:code/start` route. Request body carries `{ participantId }`. Server checks `room.hostId === participantId` and `room.participants.length >= 2`, then sets `status = "active"`. Returns updated `RoomSnapshot`.
- **Rationale**: Cleanest mapping from FR-010–FR-012. Reuses existing `HttpError` pattern and router structure.
- **Alternatives considered**: Piggybacking on the existing GET room endpoint with a query flag (semantically wrong, conflicts with REST conventions).

### Decision: RoomStatus type expansion
- **Decision**: Expand `RoomStatus` from `"lobby"` to `"lobby" | "active" | "ended"`. This is required to implement FR-015 (reject joins on active rooms) and US4 (game start). Only `"lobby"` and `"active"` are used in this scenario; `"ended"` is added now for type completeness.
- **Rationale**: Doing it now avoids a breaking model change in Scenario 002. The type system should reflect all valid states even if transition logic is phased.
- **Alternatives considered**: Add only `"active"` now (minor, defensible, but `"ended"` is equally low-cost to add at the type level).

### Decision: API URL bug fix
- **Decision**: Fix `frontend/src/services/api.ts` `API_BASE_URL` from `"http://localhost:3001/bug"` to `"http://localhost:3001"`.
- **Rationale**: The existing create/join flows are completely broken without this fix; it is a pre-existing bug that blocks all scenarios.
- **Alternatives considered**: N/A (it is simply a typo).

### Decision: playerName validation
- **Decision**: Change `playerName` from `z.string().optional()` to `z.string().trim().min(1, "Name is required").max(20)` in both `createRoomSchema` and `joinRoomSchema`. The `displayName` fallback (`"Player"`) in `roomStore.ts` is removed.
- **Rationale**: FR-001 and FR-014 both require rejection of empty/whitespace names with a clear message. Zod's `.trim().min(1)` handles this precisely and the error message flows through the existing `errorHandler`.
- **Alternatives considered**: Manual trim/check in route handler (duplicates logic, bypasses Zod pipeline).

### Existing gaps identified
| Gap | File | Action |
|-----|------|--------|
| `Room` has no `hostId` | `backend/src/models/game.ts` | Add `hostId: string` |
| `RoomStatus` is only `"lobby"` | `backend/src/models/game.ts` | Expand to union |
| `RoomSnapshot` has no `hostId` | `backend/src/models/game.ts` | Add `hostId: string` |
| `playerName` is optional in schemas | `backend/src/api/schemas.ts` | Make required + validated |
| `createRoom` accepts empty name silently | `backend/src/services/roomStore.ts` | Remove `displayName` fallback |
| `joinRoom` doesn't check room status | `backend/src/services/roomStore.ts` | Add status gate |
| `toRoomSnapshot` omits `hostId` | `backend/src/services/roomStore.ts` | Include `hostId` in output |
| No start-game endpoint | `backend/src/api/rooms.ts` | Add `POST /:code/start` |
| Frontend types missing `hostId` | `frontend/src/services/api.ts` | Mirror backend model |
| API URL typo (`/bug`) | `frontend/src/services/api.ts` | Fix to `/api` |
| No code format validation | `frontend/src/pages/JoinRoomPage.tsx` | Add alphanumeric check |
| No lobby polling | `frontend/src/pages/LobbyPage.tsx` | Add 2 s `setInterval` |
| No host indicator in lobby | `frontend/src/pages/LobbyPage.tsx` | Show badge for `hostId` |
| No Start Game button | `frontend/src/pages/LobbyPage.tsx` | Render for host only |
| No `startGame` in frontend store | `frontend/src/state/roomStore.ts` | Add method |
