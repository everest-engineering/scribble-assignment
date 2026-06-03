# Discovery Notes

Findings from inspecting the starter before writing new code. These anchor the
constitution, specs, plans, and tasks that follow.

## How I inspected

- Read every source file under `backend/src` and `frontend/src`.
- Ran both apps (`npm run dev`) and exercised the API with `curl`.
- Confirmed baseline `npm run build` and `npm test` pass on both sides.

## Incomplete behaviors (gaps)

1. **No host concept.** `Room` (`backend/src/models/game.ts`) has no host field,
   and `createRoom` (`backend/src/services/roomStore.ts`) does not mark the
   creator as host. On the client, the Lobby's "Start Game" button is an
   unguarded `navigate("/game")` (`frontend/src/pages/LobbyPage.tsx`) — there is
   no host-only restriction and no 2-player minimum.

2. **No automatic lobby polling.** `LobbyPage` only refreshes when the user
   clicks "Refresh Room" (`handleRefresh`). Participants who join after another
   player loaded the lobby are never seen until a manual refresh. Scenario 1
   requires ~2s polling.

3. **Weak input validation.** `createRoomSchema` / `joinRoomSchema`
   (`backend/src/api/schemas.ts`) accept any optional string; `displayName`
   silently substitutes `"Player"` for empty names, so whitespace-only names are
   accepted. `roomCodeParamsSchema` does not constrain code shape, and `joinRoom`
   gives no clear, specific feedback for an empty/invalid code beyond a generic
   404. Scenarios 1–2 require trimming, rejecting empty/whitespace names, and
   clear feedback for invalid codes.

4. **No gameplay state at all.** `RoomStatus` is only `"lobby"`. There is no
   round, drawer assignment, secret word selection, word-visibility rule
   (`toRoomSnapshot` ignores its `viewerParticipantId` argument), drawing/clear
   action, guess submission (`GuessForm.handleSubmit` is a no-op), guess history,
   scoring, result state, or restart. `Scoreboard` and `ResultPanel` render
   static placeholders. This covers Scenarios 2–4.

5. **(Fixed) Broken API base URL.** `frontend/src/services/api.ts` defaulted to
   `http://localhost:3001/bug`, so every request 404'd and Create/Join failed in
   the browser. Corrected to `http://localhost:3001` as the first commit.

## Assumptions

1. **Single round, no rotation.** Per the out-of-scope list (no multiple rounds,
   no drawer rotation, no timers), the game is exactly one round. The drawer is
   the host / first participant and does not rotate.

2. **Deterministic word selection.** The secret word is chosen by a pure function
   of stable room data (e.g. derived from the room code) so every client agrees
   without extra persistence or randomness. No custom/random word packs.

3. **Polling-only sync over an in-memory store.** All multi-client sync is HTTP
   polling (~2s); no WebSockets, no database. Backend state is in memory, so
   restarting the backend clears all rooms — acceptable for this lab.

4. **Drawing is local to the drawer.** Scenario 3 requires the drawing to be
   "visible on the drawer's screen." We therefore do not transmit canvas pixels
   to guessers. Polling syncs the shared game facts — status, drawer, guess
   history, scores, and the revealed word — not raw strokes. This keeps us within
   scope and avoids heavy canvas-state transfer.

## Relevant files

Backend
- `backend/src/models/game.ts` — room/participant/snapshot types (needs game state)
- `backend/src/services/roomStore.ts` — in-memory store and snapshot mapping
- `backend/src/api/rooms.ts` — room routes (create/join/get; needs start/draw/guess/restart)
- `backend/src/api/schemas.ts` — Zod request validation
- `backend/src/seed/starterData.ts` — starter words and roles

Frontend
- `frontend/src/services/api.ts` — API client
- `frontend/src/state/roomStore.ts` — external store + actions (needs polling)
- `frontend/src/pages/LobbyPage.tsx` — lobby + start gate
- `frontend/src/pages/GamePage.tsx` — game shell
- `frontend/src/components/GuessForm.tsx` — guess input (no-op submit)
- `frontend/src/components/Scoreboard.tsx`, `ResultPanel.tsx` — static placeholders
