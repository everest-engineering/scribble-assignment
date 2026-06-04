# Discovery Notes — Scribble

## Incomplete Behaviors

1. **hostId not set on room creation** — The `Room` interface declares `hostId: string`, but `createRoom()` in `roomStore.ts` never assigns it. The room creator should automatically become the host, but `hostId` is `undefined` at runtime.

2. **toRoomSnapshot omits hostId** — The `RoomSnapshot` interface includes `hostId`, but `toRoomSnapshot()` does not copy it from the Room. The viewer parameter is accepted but completely ignored (`void viewerParticipantId`). This means the frontend never receives host information and cannot enforce host-only actions.

3. **No start game validation** — The lobby's "Start Game" button unconditionally navigates to `/game` without checking host status, minimum player count, or calling any API. There is no `startGame` endpoint on the backend.

4. **API_BASE_URL fallback has `/bug` suffix** — `api.ts` line 22: `const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug"`. The `/bug` path segment causes all fallback API requests to hit non-existent routes.

5. **Player name validation missing** — Both `createRoomSchema` and `joinRoomSchema` accept `playerName: z.string().optional()`. Empty/whitespace-only names silently default to `"Player"` instead of being rejected, and names are never trimmed.

6. **roomCodeParamsSchema lacks min-length check** — `roomCodeParamsSchema` uses `z.string()` without `.min(1)`, so empty room codes are not rejected at the schema level before reaching business logic.

7. **No auto-polling in lobby** — `LobbyPage` has a manual "Refresh Room" button but no automatic polling interval. The acceptance criteria require lobby auto-refresh at ~2 second intervals.

8. **No drawer assignment or game state** — `RoomStatus` only includes `"lobby"`. There is no mechanism to start a game, assign a drawer, select a secret word, or transition game state. GamePage shows only static placeholders.

9. **No drawing, guessing, or scoring** — `GamePage` shows a `CanvasPlaceholder`, `GuessForm` (submit handler is empty), `ResultPanel` (placeholder), and `Scoreboard` (placeholder). No functional drawing, guess submission, guess comparison, or scoring exists.

10. **No game end or restart** — There is no result display, no way to end a round, and no restart mechanism. Players remain stuck on the game page once navigated there.

## Assumptions

1. **Word list is static** — The 5 words in `starterData.ts` (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) are the complete word pool. No dynamic word loading, custom words, or word packs are needed.

2. **In-memory state is sufficient** — Single-server, no database means all room/round state lives in a `Map<string, Room>`. At most a few dozen concurrent rooms are expected. No persistence, no failover.

3. **Drawing is stored as serializable stroke data** — Since WebSockets are forbidden, drawing must be synced via HTTP polling. This implies storing strokes as JSON-serializable data (point arrays) in the room object rather than using canvas image snapshots.

## Relevant Files

| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Room, Participant, RoomSnapshot types |
| `backend/src/services/roomStore.ts` | Core room CRUD, snapshot derivation |
| `backend/src/services/roomStore.test.ts` | Room store unit tests |
| `backend/src/api/rooms.ts` | Express routes for rooms |
| `backend/src/api/schemas.ts` | Zod validation schemas |
| `backend/src/api/schemas.test.ts` | Schema tests |
| `backend/src/seed/starterData.ts` | Word list and role definitions |
| `backend/src/api/router.ts` | Router setup, error handler |
| `frontend/src/services/api.ts` | Frontend API client |
| `frontend/src/services/api.test.ts` | API client tests |
| `frontend/src/state/roomStore.ts` | Client-side room state store |
| `frontend/src/pages/LobbyPage.tsx` | Lobby page with participant list |
| `frontend/src/pages/GamePage.tsx` | Game page (drawing, guessing) |
| `frontend/src/pages/CreateRoomPage.tsx` | Room creation form |
| `frontend/src/pages/JoinRoomPage.tsx` | Room join form |
| `frontend/src/components/GuessForm.tsx` | Guess input component |
| `frontend/src/components/ResultPanel.tsx` | Activity/result display component |
| `frontend/src/components/Scoreboard.tsx` | Score display component |
| `frontend/src/styles/app.css` | All application styles |
