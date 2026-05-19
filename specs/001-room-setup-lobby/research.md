# Research: Room Setup and Lobby

## Current State Analysis

### Backend: Existing Patterns

- **Room code generation**: 4-char alphanumeric using explicit alphabet excluding
  ambiguous chars (0/O/1/I). Uses `generateUniqueCode()` with collision retry.
- **Room storage**: `Map<string, Room>` in `roomStore.ts`. No persistence.
- **Room model**: `Room` has `code`, `status` ("lobby"), `participants[]`,
  `createdAt`, `updatedAt`. No host field.
- **API endpoints**: `POST /rooms` (create), `POST /rooms/:code/join` (join),
  `GET /rooms/:code` (fetch). No start-game endpoint.
- **Error handling**: Custom `HttpError` class with `statusCode`. Centralized
  error handler in `app.ts` maps `ZodError` to 400, `HttpError` to its status,
  others to 500.
- **Validation**: Zod schemas for all request inputs.

### Frontend: Existing Patterns

- **State management**: Custom `RoomStore` class (Context + `useSyncExternalStore`).
  Methods: `createRoom`, `joinRoom`, `fetchRoom`. No polling mechanism.
- **API client**: `api.ts` with typed methods wrapping `fetch`.
- **Lobby page**: Displays participant list from latest snapshot. Has a "Refresh
  Room" button (manual only). "Start Game" button exists but does nothing on the
  backend yet.
- **Create/Join pages**: Forms that call store methods and navigate to `/lobby`
  on success. No client-side validation for empty/whitespace names.

### Identified Gaps

| Gap | Detail |
|-----|--------|
| No host tracking | Room model lacks `hostId`. First participant should be recorded as host. |
| No start-game API | No endpoint to transition room from "lobby" to "active" |
| No capacity enforcement | No limit on participants per room or rooms total |
| Generic join errors | Backend returns "Unable to join room" for invalid codes — needs specific messaging |
| No auto-polling | Frontend lobby uses manual refresh only |
| No host gating | Any player can attempt to start the game (button visible to all) |
| No name validation | Names accepted as-is without length/character constraints |
| Inactive room cleanup | No mechanism to remove rooms when all players leave |

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Room code format | Keep existing 4-char alphanumeric | Already implemented, unambiguous alphabet |
| Host tracking | Add `hostId` field to Room model | Minimal change, deterministic host identification |
| Start game API | New `POST /rooms/:code/start` endpoint | Follows existing route pattern (rooms.ts) |
| Polling mechanism | `setInterval` in RoomStore with ~2s cadence | No new dependencies; follows constitution constraint |
| Name validation | Zod schema enforcing 1-16 alphanumeric chars | Consistent with existing Zod validation pattern |
| Room cleanup | Remove room from Map when last participant leaves | Matches spec requirement (FR-013) |
| HTTP error codes | 400 for validation errors, 403 for non-host start attempt, 404 for not found | Consistent with existing patterns |
| Room capacity | Check in `joinRoom` service before adding participant | Single responsibility principle |

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| WebSocket for real-time lobby sync | Constitution explicitly forbids WebSockets |
| External state management (Zustand) | Constitution forbids new state-management libraries |
| Room cleanup via TTL timeout | Spec clarified no timeout-based cleanup (FR-013) |
| Transfer host on disconnect | Spec clarified no host role transfer |
