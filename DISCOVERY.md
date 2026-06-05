# Discovery Notes

A read-before-write audit of the Scribble starter, completed before any Spec Kit
artifacts or implementation. The goal is to document what the scaffold actually
does today, the gaps between it and the four business scenarios, and the
assumptions made to fill those gaps.

## Method

Inspected the running starter and read the source end to end:

- Backend: `app.ts`, `server.ts`, `api/*`, `services/roomStore.ts`,
  `models/game.ts`, `seed/starterData.ts`.
- Frontend: `routes/index.tsx`, `state/roomStore.ts`, `services/api.ts`,
  `pages/*`, `components/*`.

The starter compiles and runs. Create/join/fetch-room work end to end against the
in-memory store. Everything past the lobby snapshot is presentational only.

## Relevant files

### Backend (`backend/src`)

| File | Role today |
|------|-----------|
| `models/game.ts` | `Room`, `Participant`, `RoomSnapshot`. `RoomStatus = "lobby"` only. No host, no game/round state. |
| `services/roomStore.ts` | In-memory `Map<string, Room>` + all business logic. `createRoom`/`joinRoom`/`getRoom`/`saveRoom`/`toRoomSnapshot`. |
| `api/rooms.ts` | Route handlers: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`. |
| `api/router.ts` | Route registration + central error handler (maps `ZodError` → 400, `HttpError` → status). |
| `api/schemas.ts` | Zod schemas. `playerName` is `z.string().optional()` — no trim, no non-empty check. |
| `seed/starterData.ts` | `STARTER_WORDS` (5 words), `STARTER_ROLES` (`drawer`, `guesser`). |

### Frontend (`frontend/src`)

| File | Role today |
|------|-----------|
| `services/api.ts` | Fetch client + mirrored TS types. **Has a planted base-URL bug (see below).** |
| `state/roomStore.ts` | Class store via `useSyncExternalStore`. `createRoom`/`joinRoom`/`fetchRoom`. No polling loop. |
| `pages/LobbyPage.tsx` | Lobby UI. Manual "Refresh Room" button; "Start Game" navigates unconditionally. |
| `pages/GamePage.tsx` | Game UI. Canvas, scoreboard, result, guess are all static placeholders. |
| `components/GuessForm.tsx` | Guess input (not wired to a real submit endpoint). |
| `components/Scoreboard.tsx` | Score display placeholder. |
| `components/ResultPanel.tsx` | Result / history placeholder. |

## Incomplete behaviors (gaps vs. the four scenarios)

1. **No host concept.** `Room` (`models/game.ts:11`) has no `hostId`; `createRoom`
   (`services/roomStore.ts:54`) never records who created the room. Scenario 1
   requires the creator to be host and host-only start.

2. **Lobby does not poll.** `LobbyPage.tsx` only refreshes via a manual button
   (`handleRefresh`); there is no `setInterval`. The frontend store has no polling
   loop. Scenario 1 requires automatic ~2s polling.

3. **Start Game is ungated.** `LobbyPage.tsx` "Start Game" calls
   `navigate("/game")` for everyone with no host check and no 2-player minimum.
   Scenario 1 requires host-only start, enabled only at ≥2 players.

4. **No game lifecycle.** `RoomStatus` is `"lobby"` only (`models/game.ts:2`).
   There is no `playing`/`finished`, no start/clear/guess/restart endpoints, no
   drawer assignment, no word selection, no scores, no guess history, no strokes.
   Scenarios 2–4 require all of these.

5. **No drawer-only word visibility.** `toRoomSnapshot` (`services/roomStore.ts:99`)
   takes `viewerParticipantId` but discards it (`void viewerParticipantId`) and
   returns the full `availableWords` list to everyone. Scenario 2 requires the
   secret word to be visible only to the drawer.

6. **Name/code validation is missing.** `createRoomSchema`/`joinRoomSchema`
   (`api/schemas.ts`) accept any optional string and `displayName`
   (`services/roomStore.ts:35`) silently substitutes `"Player"`. Whitespace-only
   names pass; empty/invalid room codes return a generic 404
   (`"Unable to join room"`). Scenarios 1–2 require trimmed names, rejected empty
   input, and clear, specific error messages.

## Known starter bugs

- **`frontend/src/services/api.ts:22` — base URL has a stray `/bug` suffix:**
  `import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug"`. Every request is
  prefixed with `/bug`, so the client cannot reach the real backend routes from a
  clean clone. **Fix:** default to `http://localhost:3001`. Justified under the
  constitution's brownfield rule because it blocks delivery of every scenario.

## Assumptions

1. **Single round only.** Multiple rounds, drawer rotation, and timers are
   explicitly out of scope, so "start game" begins exactly one round and the game
   reaches a terminal `finished` state.

2. **Deterministic word selection is index-based.** Per the constitution, the
   secret word is chosen as `STARTER_WORDS[roomCreationCount % STARTER_WORDS.length]`
   (or equivalent room-derived index), never `Math.random()`, so behavior is
   reproducible and testable.

3. **Drawer = host.** With one round and no rotation, the host (first player /
   `hostId`) is the drawer; all other participants are guessers.

4. **A round ends on the first correct guess.** With fixed scoring (correct = 100,
   incorrect = 0) and no timer, the natural terminal condition for a single round
   is the first correct guess, which flips the room to `finished`.

5. **Polling is the only sync mechanism.** All cross-tab state (lobby roster,
   game status, strokes, guess history, scores) propagates via ~2s `GET /rooms/:code`
   polling; no WebSockets, no push.
