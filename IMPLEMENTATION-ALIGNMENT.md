# Implementation Alignment (Spec ↔ Code)

Documents how the running app maps to Spec Kit specs and notes **intentional deviations**.

**Last verified**: 2026-06-01 — `cd backend && npm test` (42 tests), `npm run build` in backend and frontend.

---

## Lifecycle (constitution + README)

| Transition | Spec | Implementation |
|------------|------|----------------|
| Create/join → lobby | 001 | `createRoom`, `joinRoom`; status `lobby` |
| Host start → drawing | 002 | `startGame`; roles + `secretWord` |
| Correct guess → result | 004 | `submitGuess` → `endRound` |
| Host restart → lobby | 004 | `restartGame` clears round fields, scores `0` |

---

## Feature 001 — Host / join / lobby

| Requirement | Status | Notes |
|-------------|--------|-------|
| Host on create | ✅ | `hostParticipantId` set in `createRoom` |
| Trim/reject empty names | ✅ | Server + client forms |
| Lobby poll ~2s | ✅ | `LobbyPage` + `LOBBY_POLL_MS` |
| Host-only start, ≥2 players | ✅ | `startGame` + UI |
| No join during drawing | ✅ | `GAME_STARTED` |
| Join during result | ✅ | 004 — see below |
| Room cap 10 | ✅ | `MAX_PARTICIPANTS` |
| Presence prune / empty room delete | ✅ | `pruneStaleParticipants` on read |
| Multi-room isolation | ✅ | Separate `Map` keys; test `rooms are isolated` |

---

## Feature 002 — Drawer / secret word

| Requirement | Status | Notes |
|-------------|--------|-------|
| Host (or earliest) drawer round 1 | ✅ | `assignRoundOneRoles` |
| Deterministic word | ✅ | `wordSelection.ts` |
| Secret word drawer-only during drawing | ✅ | `toRoomSnapshot` viewer field |

---

## Feature 003 — Draw / guess / score

| Requirement | Status | Notes |
|-------------|--------|-------|
| Drawer canvas PUT / clear | ✅ | `updateCanvas`, `DrawingCanvas` |
| Guesser read-only canvas | ✅ | Poll + read-only mode |
| Trim guesses, reject empty | ✅ | `guessLogic` + `EMPTY_GUESS` |
| Case-insensitive compare | ✅ | `compareGuessToSecret` |
| +100 / +0 scoring | ✅ | `CORRECT_GUESS_POINTS` |
| Drawer cannot guess | ✅ | `DRAWER_CANNOT_GUESS` |
| Guess history + scores in snapshot | ✅ | `toRoomSnapshot` |
| Game poll ~2s | ✅ | `GamePage` + `GAME_POLL_MS` |

**Deviation (003 scope)**: Round does **not** stay in `drawing` after first correct guess — **004** ends the round on first correct guess (documented in `specs/003-round-draw-guess/research.md` R5).

**Deviation (spec edge case)**: Multiple correct guesses in one round could each award +100 per 003 spec; after 004, only guesses while `drawing` are accepted, so only one “winning” guess per round in practice.

---

## Feature 004 — Result / restart

| Requirement | Status | Notes |
|-------------|--------|-------|
| `revealedWord` for all in result | ✅ | Snapshot field |
| Further guesses rejected | ✅ | `ROUND_ENDED` → 409 |
| Auto-navigate to results | ✅ | `GamePage` poll + effect |
| Result poll + sync | ✅ | `ResultPage` |
| Host-only restart | ✅ | `restartGame` |
| Auto-navigate to lobby after restart | ✅ | `ResultPage` + `LobbyPage` status effects |
| Late join in result sees summary | ✅ | `joinRoom` allows `result` |

---

## Edge cases (rubric)

| Case | Handling |
|------|----------|
| Empty/whitespace player name | 400 `"Name is required"` |
| Empty guess | 400 `"Guess cannot be empty"` |
| Case-insensitive guess | `toLowerCase` after trim |
| Unknown room / full room / game started | 404 / 409 with distinct messages |
| Multi-room isolation | Separate room codes in `Map`; unit test |
| Non-host start/restart | 403 |

---

## UI / non-spec changes (documented)

- **Game page layout**: Sidebar overflow, card sizing, and status-line wrapping — UX fixes not in functional specs.
- **`ResultPanel` on game screen**: Shows “round in progress” hint; full results live on `/results`.

---

## Out of scope (confirmed not implemented)

WebSockets, databases, authentication, drawer rotation, timers, deployment/Docker additions beyond existing CI scaffold.
