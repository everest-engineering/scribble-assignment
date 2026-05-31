# Tasks

## Legend
- `[D]` = Discovery / documentation
- `[A]` = Artifact creation
- `[B]` = Backend implementation
- `[F]` = Frontend implementation
- `[T]` = Tests
- `[V]` = Validation

---

## Group 0 — Foundation (Spec Kit Artifacts)

| ID | Phase | Task | Depends On | AC |
|----|-------|------|------------|----|
| 0.1 | `[D]` | Read all starter files, document gaps and assumptions | — | — |
| 0.2 | `[A]` | Write `speckit.constitution.md` | 0.1 | — |
| 0.3 | `[A]` | Write `speckit.specify.1-room-setup.md` | 0.1 | — |
| 0.4 | `[A]` | Write `speckit.specify.2-game-start.md` | 0.1 | — |
| 0.5 | `[A]` | Write `speckit.specify.3-gameplay.md` | 0.1 | — |
| 0.6 | `[A]` | Write `speckit.specify.4-result-restart.md` | 0.1 | — |
| 0.7 | `[A]` | Write `speckit.plan.md` | 0.2–0.6 | — |
| 0.8 | `[A]` | Write `speckit.tasks.md` | 0.7 | — |
| 0.9 | `[V]` | Run `npm test` in both directories to confirm starter passes | 0.1 | — |

---

## Group 1 — Room Setup & Lobby (Scenario 1)

| ID | Phase | Task | Depends On | AC |
|----|-------|------|------------|----|
| 1.1 | `[B]` | Add `hostId` to `Room`; extend `RoomStatus` with `"playing"` and `"finished"` | 0.9 | AC1.1 |
| 1.2 | `[B]` | Set `hostId` in `createRoom()`; expose `hostId` in `RoomSnapshot` | 1.1 | AC1.1 |
| 1.3 | `[B]` | Validate `playerName` is non-empty after trim in schemas | 1.1 | AC2.2 |
| 1.4 | `[B]` | Update join-room error message to `"Room not found"` for missing codes | 1.1 | AC1.2 |
| 1.5 | `[B]` | Add `POST /rooms/:code/start` with host guard + min-2-players check | 1.1 | AC1.6, AC1.7, AC1.8 |
| 1.6 | `[T]` | Write tests for host assignment, join validation, start-game guards | 1.2–1.5 | AC1.1–AC1.8 |
| 1.7 | `[V]` | Run `npm test` in backend | 1.6 | — |
| 1.8 | `[F]` | Add `hostId` to frontend `RoomSnapshot` type; add `api.startGame()` | 1.2, 1.5 | AC1.1 |
| 1.9 | `[F]` | Add `RoomStore.startGame()` method | 1.8 | AC1.1 |
| 1.10| `[F]` | Add lobby auto-polling (`setInterval` 2000ms + cleanup) in `LobbyPage` | 1.8 | AC1.5 |
| 1.11| `[F]` | Disable Start Game for non-host + <2 players; show host badge in participant list | 1.9 | AC1.6, AC1.7 |
| 1.12| `[F]` | Add client-side name trimming on Create+Join forms | 1.8 | AC2.1 |
| 1.13| `[F]` | Add client-side room code validation (non-empty) on Join form | 1.8 | AC1.3 |
| 1.14| `[T]` | Write/update frontend tests for API methods and new fields | 1.8 | — |
| 1.15| `[V]` | Manual test: two browser tabs → create + join → verify host badge, polling, start-guest gate | 1.10–1.13 | AC1.1–AC1.8 |

**Commit: `feat: add host tracking, start-game endpoint, and lobby polling (Scenario 1)`**

---

## Group 2 — Game Start & Drawer Flow (Scenario 2)

| ID | Phase | Task | Depends On | AC |
|----|-------|------|------------|----|
| 2.1 | `[B]` | Add `Guess`, `Stroke` types to `game.ts`; extend `Room` with game-round fields (`drawerId`, `secretWord`, `guesses`, `scores`, `strokes`) | 1.5 | AC2.3 |
| 2.2 | `[B]` | Implement `startGame()` in store: assign drawer=host, pick word deterministically, init scores | 2.1 | AC2.3, AC2.4, AC2.5 |
| 2.3 | `[B]` | Update `toRoomSnapshot()` to filter `secretWord` — only visible to drawer (or when finished) | 2.2 | AC2.6 |
| 2.4 | `[B]` | Add duplicate-start guard: return 400 if already playing | 2.2 | Edge case |
| 2.5 | `[T]` | Write tests for drawer assignment, word determinism, viewer visibility | 2.2–2.4 | AC2.3–AC2.6 |
| 2.6 | `[V]` | Run `npm test` in backend | 2.5 | — |
| 2.7 | `[F]` | Extend frontend `RoomSnapshot` with all game-round fields | 2.1 | AC2.3 |
| 2.8 | `[F]` | Update `LobbyPage` start to call `startGame()` and navigate to `/game` on success | 2.2 | AC2.3 |
| 2.9 | `[F]` | Update `GamePage`: show role badge, conditionally show word/guess form | 2.7 | AC2.4, AC2.6, AC2.7 |
| 2.10| `[F]` | Add name validation to CreateRoomPage and JoinRoomPage (disable submit for empty) | 1.12 | AC2.2 |
| 2.11| `[V]` | Manual test: create room, start game → drawer sees word, guesser doesn't → empty name rejected | 2.8–2.10 | AC2.1–AC2.7 |

**Commit: `feat: add game start flow with drawer assignment and word visibility (Scenario 2)`**

---

## Group 3 — Gameplay Interaction (Scenario 3)

| ID | Phase | Task | Depends On | AC |
|----|-------|------|------------|----|
| 3.1 | `[B]` | Implement `submitGuess()` in store: trim, case-insensitive compare, score 100, record | 2.1 | AC3.4–AC3.8 |
| 3.2 | `[B]` | Implement `saveStrokes()` in store: append stroke array to room | 2.1 | AC3.3 |
| 3.3 | `[B]` | Add guess + stroke schemas to `schemas.ts`; add POST endpoints to `rooms.ts` | 3.1, 3.2 | AC3.4, AC3.5 |
| 3.4 | `[B]` | Reject guesses from drawer (check participantId === drawerId) | 3.1 | AC3.11 |
| 3.5 | `[B]` | Reject duplicate correct guesses (score only first) | 3.1 | Edge case |
| 3.6 | `[T]` | Write tests for guess validation, scoring, stroke saving | 3.1–3.5 | AC3.4–AC3.11 |
| 3.7 | `[V]` | Run `npm test` in backend | 3.6 | — |
| 3.8 | `[F]` | Add `api.submitGuess()`, `api.saveStrokes()` to API service | 3.3 | AC3.4 |
| 3.9 | `[F]` | Add `submitGuess()`, `saveStrokes()` to RoomStore | 3.8 | AC3.4 |
| 3.10| `[F]` | Add game-state polling loop to GamePage | 2.7 | AC3.3, AC3.9 |
| 3.11| `[F]` | Replace canvas placeholder with HTML5 Canvas component: drawer can draw (mouse events), guessers see read-only rendered strokes, Clear Canvas button for drawer | 3.9 | AC3.1, AC3.2, AC3.3 |
| 3.12| `[F]` | Wire GuessForm submit to `roomStore.submitGuess()`; add client-side empty-guess guard | 3.9 | AC3.4, AC3.5 |
| 3.13| `[F]` | Update Scoreboard to render `room.scores` | 3.10 | AC3.10 |
| 3.14| `[F]` | Hide/disable guess input for drawer | 2.9 | AC3.11 |
| 3.15| `[V]` | Manual test: drawer draws, guesser guesses correct → score 100 + history syncs | 3.10–3.14 | AC3.1–AC3.11 |

**Commit: `feat: add drawing canvas, guess submission, scoring, and sync (Scenario 3)`**

---

## Group 4 — Result, Restart & Final Validation (Scenario 4)

| ID | Phase | Task | Depends On | AC |
|----|-------|------|------------|----|
| 4.1 | `[B]` | Auto-transition to `"finished"` when all guessers have guessed correctly | 3.1 | AC4.1 |
| 4.2 | `[B]` | Implement `restartGame()`: reset round state, keep participants, set status to `"lobby"` | 2.1 | AC4.6, AC4.7 |
| 4.3 | `[B]` | Add `POST /rooms/:code/restart` endpoint (host-only guard) | 4.2 | AC4.5 |
| 4.4 | `[B]` | Reject guesses when status is `"finished"` | 4.1 | AC4.9 |
| 4.5 | `[T]` | Write tests for auto-finish, restart state reset, finished-guess rejection | 4.1–4.4 | AC4.1–AC4.9 |
| 4.6 | `[V]` | Run `npm test` in backend | 4.5 | — |
| 4.7 | `[F]` | Add `api.restartGame()`, `RoomStore.restartGame()` | 4.3 | AC4.5 |
| 4.8 | `[F]` | Update `ResultPanel` to render final word, scores, full guess history | 4.1 | AC4.2, AC4.3, AC4.4 |
| 4.9 | `[F]` | Update `GamePage` to detect `"finished"` status, show ResultPanel, show Restart button for host | 4.7, 4.8 | AC4.2, AC4.5 |
| 4.10| `[F]` | On restart success, navigate all players to `/lobby` (detect via polling) | 4.7 | AC4.6, AC4.7, AC4.8 |
| 4.11| `[F]` | Disable GuessForm when room status is `"finished"` | 4.7 | AC4.9 |
| 4.12| `[V]` | Full manual E2E test: two tabs → create → join → start → draw → guess correct → see result → restart → lobby preserved → start again | 4.8–4.11 | AC4.1–AC4.9 |
| 4.13| `[V]` | Run `npm run build` in both backend and frontend — no errors | 4.12 | — |

**Commit: `feat: add result display, restart flow, and final validation (Scenario 4)`**

---

## Group 5 — Reflection & Submission

| ID | Phase | Task | Depends On |
|----|-------|------|------------|
| 5.1 | `[A]` | Write `REFLECTION.md` with decisions, AI usage, tradeoffs | 4.13 |
| 5.2 | `[A]` | Final review: ensure all spec artifacts committed, implementation matches spec | 5.1 |
| 5.3 | `[V]` | Create PR from branch to main | 5.2 |
