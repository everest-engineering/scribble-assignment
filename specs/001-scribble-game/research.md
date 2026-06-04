# Research: Scribble Drawing Game

**Branch**: `001-scribble-game` | **Date**: 2026-06-04

## Decisions

### D-001: Name validation approach

**Decision**: Tighten Zod schemas — `z.string().trim().min(1, "Name cannot be empty")` — and
remove the `displayName()` fallback in `createParticipant`.

**Rationale**: Current `createRoomSchema` / `joinRoomSchema` use `.optional()`, which lets
empty strings through to `displayName()`. Spec FR-002 requires rejection at both boundaries.
Zod's `.trim().min(1)` handles trimming server-side; client guard added in `CreateRoomPage`
and `JoinRoomPage` before the API call.

**Alternatives considered**: Custom validator middleware — rejected as Zod already handles
this with one extra chained call.

---

### D-002: Secret word visibility in `toRoomSnapshot`

**Decision**: Replace `void viewerParticipantId` with conditional inclusion:
`secretWord: (viewerParticipantId === room.drawer || room.status === "result") ? room.secretWord : undefined`.

**Rationale**: The stub deliberately voided the parameter. Spec FR-008 requires role-aware
projection. The pattern of passing `participantId` via query string (`GET /rooms/:code?participantId=`)
is already wired in `roomViewerQuerySchema` and `GET /:code` route handler.

**Alternatives considered**: Separate endpoint for drawer — rejected as over-engineering;
the existing snapshot approach is sufficient.

---

### D-003: Canvas sync strategy

**Decision**: Store base64 `toDataURL()` string in `room.canvasData` on every `mouseup`
(stroke end) or clear action. Guessers retrieve it via the existing polling cycle.

**Rationale**: WebSockets are out of scope (constitution §Technology Constraints). Base64
canvas data fits the polling model. `mouseup` throttles writes to once-per-stroke rather
than every pixel. Canvas size is fixed 600×450; base64 data is ~50-100 KB per image —
acceptable for in-memory storage and polling over localhost.

**Alternatives considered**: Delta/stroke streaming — too complex; incremental SVG paths —
no canvas API support; pixel diff — unnecessary complexity.

---

### D-004: Polling implementation

**Decision**: `setInterval` in `useEffect` with a cleanup return. Interval: 2000ms.
Polling stops on component unmount via `clearInterval` in the cleanup function.

**Rationale**: Established React pattern. Spec FR-004, FR-011 require ~2s cadence.
`useEffect` cleanup guarantees no memory leaks. Existing `roomStore.fetchRoom()` already
handles the API call; polling just wraps it in `setInterval`.

**Alternatives considered**: `setInterval` outside React (global) — harder to clean up;
`setTimeout` recursion — equivalent but more complex.

---

### D-005: Store action pattern

**Decision**: All new store methods follow the existing `withLoading` pattern: wrap the
API call, call `setRoomSnapshot(response.room)` on success, let errors propagate.

**Rationale**: `RoomStore` class in `frontend/src/state/roomStore.ts` already defines
`withLoading`, `setRoomSnapshot`, and `setState`. Consistency prevents listeners from
missing state updates.

**Alternatives considered**: React Query / SWR — constitution prohibits new state-management
libraries beyond the starter.

---

### D-006: HTTP error handling

**Decision**: Use the existing `HttpError` class from `api/schemas.ts`. New route handlers
wrap logic in try/catch and call `next(error)`. The existing Express error middleware
handles `HttpError` instances by returning the appropriate status code.

**Rationale**: Pattern already established in all three existing route handlers.

---

### D-007: `RoomStatus` type expansion

**Decision**: Expand `RoomStatus` in `backend/src/models/game.ts` to
`"lobby" | "playing" | "result"`. Mirror in `frontend/src/services/api.ts` `RoomSnapshot`
interface. Both files must be updated together.

**Rationale**: Currently typed as the string literal `"lobby"` only. TypeScript will catch
any handler that forgets to handle the new states. Frontend components gate on `room.status`
to drive navigation and role display.
