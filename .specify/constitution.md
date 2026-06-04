# Constitution

## Architecture Decisions

1. **Host tracking via `hostId`**: A `hostId` field is added to `Room`, set to the creator's `participantId`. The host is the only participant allowed to start or restart the game.

2. **Game state machine**: Room transitions through `lobby → playing → finished → lobby`. Each status determines what participants see and can do.

3. **Drawing as stroke array on server**: Drawing data is stored as an array of `{x, y, color, lineWidth}` stroke point arrays plus optional clear commands. The drawer POSTs strokes to the server; all clients fetch them via the room polling endpoint and replay them on `<canvas>`.

4. **Single-round games**: Each game has exactly one round. When the correct word is guessed, the round ends (status → `finished`). The host can restart, which returns to lobby with players preserved.

5. **Polling for all sync**: All state synchronization (room data, drawing, guesses) uses HTTP polling at ~2 second intervals. No WebSockets, SSE, or push mechanisms.

6. **Viewer-aware snapshots**: `toRoomSnapshot` uses `viewerParticipantId` to tailor responses: the secret word is included only if the viewer is the drawer; `isHost` flag informs the frontend about host capabilities.

## Constraints

- No WebSockets, Socket.io, or real-time push protocols
- No databases (SQL, NoSQL, SQLite, etc.)
- No authentication, sessions, JWT, or OAuth
- No external drawing libraries — use native Canvas API only

## Patterns

- **Validation**: All request payloads validated with Zod in the route handler
- **Error handling**: Route handlers use `try/catch` with `next(error)`; `errorHandler` middleware handles `HttpError` and `ZodError`
- **State management**: Custom class-based store via React Context + `useSyncExternalStore`
- **Testing**: Vitest for both backend (node environment) and frontend (jsdom environment)
