# Discovery Notes

*Updated per scenario. Last updated: Scenario 4 (complete)*

---

## Incomplete Behaviors

**B1 — No host tracking** *(found: pre-implementation | resolved: Scenario 1)*
The `Participant` model had no `isHost` flag and the backend had no concept of who created a room.
Resolution: Added `hostId: string` to the `Room` model and surfaced it in `RoomSnapshot`. The frontend derives `isHost = participantId === room.hostId` as a computed value.
Relevant: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx`

**B2 — No lobby polling** *(found: pre-implementation | resolved: Scenario 1)*
The lobby only refreshed on manual button click. No polling interval existed.
Resolution: Replaced the manual Refresh button with a `setInterval` (2 000 ms) in `LobbyPage` calling `roomStore.fetchRoom()`. Status changes (`"active"`) trigger automatic navigation to `/game`.
Relevant: `frontend/src/pages/LobbyPage.tsx`

**B3 — Game screen is entirely placeholder** *(found: pre-implementation | resolved: Scenarios 2–4)*
`GamePage` rendered static divs. `GuessForm.handleSubmit` was a no-op. Scoreboard and ResultPanel showed hardcoded text.
Resolution: `GamePage` now has an HTML5 canvas with drawing/replay, `GuessForm` submits real guesses, `Scoreboard` renders live scores, `ResultPanel` renders live guess history. A dedicated `ResultPage` handles the post-round view.
Relevant: `frontend/src/pages/GamePage.tsx`, `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`, `frontend/src/pages/ResultPage.tsx`

**B4 — Room never transitions out of "lobby" status** *(found: pre-implementation | resolved: Scenarios 1–4)*
The `Room.status` type only had `"lobby"`. No start, guess, end-round, or restart endpoints existed.
Resolution: Extended `RoomStatus` to `"lobby" | "active" | "result"`. Added `POST /rooms/:code/start`, `/stroke`, `/clear`, `/guess`, `/end`, and `/restart` endpoints with appropriate host/role guards.
Relevant: `backend/src/models/game.ts`, `backend/src/api/rooms.ts`, `backend/src/services/roomStore.ts`

**B5 — Player name not validated for empty/whitespace** *(found: pre-implementation | resolved: Scenario 1)*
The backend accepted missing `playerName` and defaulted to `"Player"`. Whitespace-only names were not rejected.
Resolution: Zod schemas now use `.transform(s => s.trim()).pipe(z.string().min(1, ...))`. Frontend forms validate inline before calling the API.
Relevant: `backend/src/api/schemas.ts`, `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`

**B6 — No drawer assignment or word visibility rules** *(found: Scenario 2 | resolved: Scenario 2)*
When the game started, no drawer was assigned. The `currentWord` was not set or filtered.
Resolution: `startRoom()` sets `drawerId = hostId` and `currentWord = STARTER_WORDS[0]`. `toRoomSnapshot()` filters `currentWord` to the drawer only during `"active"` state; reveals it to everyone in `"result"` state.
Relevant: `backend/src/services/roomStore.ts`

**B7 — No canvas, no guess submission, no scoring** *(found: Scenario 3 | resolved: Scenario 3)*
The game screen had placeholder content with no interactive drawing, guess logic, or score tracking.
Resolution: HTML5 Canvas API used for drawing (no new library). Stroke append/clear endpoints added. `submitGuess()` handles trimmed case-insensitive comparison, records `isCorrect`, and adds 100 pts for correct guesses.
Relevant: `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`, `frontend/src/pages/GamePage.tsx`, `frontend/src/components/GuessForm.tsx`

**B8 — No result state or restart flow** *(found: Scenario 4 | resolved: Scenario 4)*
There was no post-round state, no way to reveal the word to all players, and no restart mechanism.
Resolution: `endRound()` sets status `"result"` (revealing `currentWord` to all); `restartRoom()` resets round state while preserving participants. `ResultPage` shows final results and the host's Restart button.
Relevant: `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`, `frontend/src/pages/ResultPage.tsx`

---

## Assumptions

**A1 — First participant to create a room is the host** *(confirmed: Scenario 1)*
Confirmed: `hostId` is set to the first participant's `id` in `createRoom()`. The host is always participants[0].

**A2 — Word selection is positional, not random** *(confirmed: Scenario 2)*
Confirmed: `room.currentWord = STARTER_WORDS[0]` hardcoded in `startRoom()`. Always `"rocket"` for every round, including after restart.

**A3 — Guess history sync uses the same polling loop as lobby** *(confirmed: Scenario 3)*
Confirmed: `GET /rooms/:code` returns `canvasStrokes`, `guesses`, and `scores` in the snapshot. The game screen's existing polling loop picks these up automatically.

**A4 — `participantId` stored client-side determines role/word visibility** *(confirmed: Scenarios 2–4)*
Confirmed: All role-conditional rendering (drawer word, End Round button, Restart button) is derived client-side by comparing stored `participantId` against `room.drawerId` or `room.hostId`. The server enforces the same rules independently.

**A5 — Drawer is the host (not rotated)** *(added: Scenario 2)*
Multi-round rotation is out of scope. The drawer is always `hostId`. After restart, the same player is the drawer again.

**A6 — Round ends only when host explicitly triggers it** *(added: Scenario 4)*
No timer or auto-end trigger exists. The host must click "End Round". This was the simplest approach consistent with the README's scope constraints.

---

## Relevant Files (final state)

| File | Role |
|------|------|
| `backend/src/models/game.ts` | Room/Participant/Guess/Point types; `RoomStatus` union |
| `backend/src/services/roomStore.ts` | All in-memory mutations: createRoom, joinRoom, startRoom, addStroke, clearCanvas, submitGuess, endRound, restartRoom; snapshot builder |
| `backend/src/api/rooms.ts` | Route handlers for all 8 endpoints |
| `backend/src/api/schemas.ts` | Zod validation schemas for all request bodies |
| `backend/src/seed/starterData.ts` | Starter words (rocket, pizza, castle, guitar, sunflower) |
| `frontend/src/services/api.ts` | HTTP client — all API methods and TypeScript types |
| `frontend/src/state/roomStore.ts` | Client-side store — all actions backed by API calls |
| `frontend/src/pages/LobbyPage.tsx` | Lobby with polling, host guard, start-game |
| `frontend/src/pages/GamePage.tsx` | Canvas drawing, guess form, polling, end-round button |
| `frontend/src/pages/ResultPage.tsx` | Post-round results, restart button (host only) |
| `frontend/src/components/GuessForm.tsx` | Validated guess submission; hidden for drawer |
| `frontend/src/components/Scoreboard.tsx` | Live scores from room snapshot |
| `frontend/src/components/ResultPanel.tsx` | Live guess history with correct/incorrect styling |
