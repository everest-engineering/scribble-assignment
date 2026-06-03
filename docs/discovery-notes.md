# Discovery Notes

Findings from inspecting the starter **before** writing any spec or code. The goal
here is to understand what runs, what is faked, and what is genuinely missing, so
the spec can be grounded in the real codebase rather than guesses.

## How I verified the starter

- Installed and built both apps (`npm install`, `npm run build`) in `backend/` and
  `frontend/` — both succeed.
- Ran the existing test suites — backend 4 tests pass, frontend 2 tests pass.
- Read every file under `backend/src` and `frontend/src`.
- Traced the happy path: create room → join room → fetch snapshot → render lobby.

## What already works (happy path only)

- App shell + routing across Start / Create / Join / Lobby / Game
  ([frontend/src/routes/index.tsx](../frontend/src/routes/index.tsx)).
- Create room: generates a unique 4-char code, adds creator as a participant
  ([backend/src/services/roomStore.ts](../backend/src/services/roomStore.ts)).
- Join room by code, fetch room snapshot, in-memory room map.
- Lobby renders the last fetched participant list with a **manual** refresh button
  ([frontend/src/pages/LobbyPage.tsx](../frontend/src/pages/LobbyPage.tsx)).

## Incomplete / missing behaviors (≥3)

1. **No host concept.** `Room` has no `hostId`; nobody "owns" the room and nothing
   gates "start game". `Start Game` in the lobby is just a router link to `/game`
   ([LobbyPage.tsx](../frontend/src/pages/LobbyPage.tsx)) — no precondition, no
   2-player minimum, no host-only rule.
2. **No automatic polling.** The lobby only updates when the user clicks
   *Refresh Room*; a second player never appears on their own. Polling (~2s) is
   required by Scenario 1.
3. **No player-name validation.** `displayName()` silently rewrites empty input to
   `"Player"` ([roomStore.ts](../backend/src/services/roomStore.ts)) and
   `createRoomSchema`/`joinRoomSchema` mark `playerName` as `.optional()` with no
   trim/non-empty rule ([backend/src/api/schemas.ts](../backend/src/api/schemas.ts)).
4. **No gameplay at all.** `RoomStatus` is the single literal `"lobby"`
   ([backend/src/models/game.ts](../backend/src/models/game.ts)). There is no
   drawer assignment, no secret word selection, no canvas interaction, no guess
   handling, no scoring, no result state, and no restart. The canvas, scoreboard,
   guess form, and result panel are static placeholders
   ([GamePage.tsx](../frontend/src/pages/GamePage.tsx),
   [GuessForm.tsx](../frontend/src/components/GuessForm.tsx),
   [Scoreboard.tsx](../frontend/src/components/Scoreboard.tsx),
   [ResultPanel.tsx](../frontend/src/components/ResultPanel.tsx)).
5. **Viewer-agnostic snapshot.** `toRoomSnapshot()` ignores `viewerParticipantId`
   (`void viewerParticipantId;`) so every viewer gets an identical payload — there
   is no way to show the secret word only to the drawer.

## Bugs found in the starter

1. **Wrong default API base URL.** `frontend/src/services/api.ts` defaults to
   `http://localhost:3001/bug` when `VITE_API_URL` is unset, so every request 404s
   out of the box. Must be `http://localhost:3001`.

## Assumptions (≥2)

1. **Single round only.** Multiple rounds and drawer rotation are out of scope, so
   the round ends as soon as one guesser is correct; the round transitions to a
   shared `results` state. The host then restarts back to the lobby.
2. **Drawer = host.** Scenario 2 says "host (or first player)" — since the creator
   is the host and the first participant, the host is the drawer for the single
   round. No rotation.
3. **Deterministic word = function of room code.** "Deterministically selected"
   means reproducible, not random: the word index is derived from the room code's
   character codes, so the same room always gets the same word and it is testable.
4. **Client identity lives in memory.** Because auth/sessions are out of scope, the
   `participantId` returned at create/join time is the player's identity for the
   session; a full page reload starts over (documented limitation, not fixed).
5. **Canvas strokes are synced via polling** (same channel as the rest of the
   snapshot) so guessers can see the drawing without WebSockets.

## Relevant files

Backend:
- `backend/src/models/game.ts` — entity/snapshot types (must grow with the game state)
- `backend/src/services/roomStore.ts` — in-memory store + all game-rule logic
- `backend/src/api/rooms.ts` — REST handlers
- `backend/src/api/schemas.ts` — Zod request validation + `HttpError`
- `backend/src/api/router.ts` — error handler (currently flattens Zod messages)
- `backend/src/seed/starterData.ts` — words + roles

Frontend:
- `frontend/src/services/api.ts` — HTTP client (+ the `/bug` base-URL defect)
- `frontend/src/state/roomStore.ts` — external store + actions (needs polling + game actions)
- `frontend/src/pages/{Create,Join,Lobby,Game}Page.tsx` — screens
- `frontend/src/components/{GuessForm,Scoreboard,ResultPanel}.tsx` — placeholders to wire up
