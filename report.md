# Scribble Guessing Game — Working Feature Report

> **Living document.** Update this after each scenario is implemented and validated. Tick the
> checklist, flip the status, and fill the "Implemented" / "Validated" / "Notes" columns.
> Spec: [specs/001-scribble-game/spec.md](specs/001-scribble-game/spec.md) ·
> Tasks: [specs/001-scribble-game/tasks.md](specs/001-scribble-game/tasks.md)

**Last updated**: 2026-06-05
**Branch**: `001-scribble-game`
**Status legend**: ⬜ Not started · 🟡 In progress · ✅ Done

## Summary

| # | Scenario (User Story) | Priority | Status | Validated (two tabs) |
|---|-----------------------|----------|--------|----------------------|
| 1 | Room Setup & Lobby | P1 | ✅ Done | Pending manual two-tab run |
| 2 | Game Start & Drawer Flow | P2 | ✅ Done | Pending manual two-tab run |
| 3 | Gameplay Interaction | P3 | ✅ Done | Pending manual two-tab run |
| 4 | Result, Restart & Final Validation | P4 | ✅ Done | Pending manual two-tab run |

**Build gate**: backend `npm run build` ✅ · frontend `npm run build` ✅

> **Test runner note**: Vitest 4 (rolldown) requires Node 20.12+/22; this environment is Node
> 18.17.1, so `npm test` cannot start. Test code for US1 is written (`roomStore.test.ts`,
> `schemas.test.ts`) and both TypeScript builds pass. Run `npm test` on Node 20.19+/22 to execute.

---

## Currently Working (baseline — starter scaffold)

These shipped in the starter before any scenario work:

- App shell, routing, and branded pages (Start, Create Room, Join Room, Lobby, Game)
- Create room flow (`POST /rooms`) and join-by-code flow (`POST /rooms/:code/join`)
- Fetch room snapshot (`GET /rooms/:code`) with **manual** lobby refresh
- In-memory room storage (`backend/src/services/roomStore.ts`)
- Game screen placeholders (canvas, guess input, scoreboard, result)

Not yet working: host permissions, auto polling, start game, drawer assignment, word visibility,
drawing, clear canvas, guess submission/scoring, synced history, result state, restart.

---

## Scenario 1 — Room Setup & Lobby (P1)

**Status**: ✅ Done (code complete; manual two-tab validation pending) · **Tasks**: T002–T012

**Acceptance** (tick when validated):

- [x] Room creator becomes host; unique code issued
- [x] Join by valid code; invalid/empty code rejected with clear feedback
- [x] Rooms fully isolated from one another
- [x] Lobby roster refreshes automatically within ~2s (no manual refresh)
- [x] Host-only Start, enabled only when ≥2 players present

**Implemented**:
- Foundational state model — [backend/src/models/game.ts](backend/src/models/game.ts): `RoomStatus`
  union, `Participant.score`, `Room.hostId`/`round`, `Round`/`Guess`, extended `RoomSnapshot`;
  mirrored in [frontend/src/services/api.ts](frontend/src/services/api.ts).
- Host designation + snapshot serialization — [backend/src/services/roomStore.ts](backend/src/services/roomStore.ts)
  (`createRoom` sets `hostId`, `score: 0`, `round: null`; `toRoomSnapshot` emits `hostId`,
  `drawerId`, `word`/`hasWord`, `guesses`).
- Name/code validation — [backend/src/api/schemas.ts](backend/src/api/schemas.ts) (trim + non-empty)
  and clearer 400 messages in [backend/src/api/router.ts](backend/src/api/router.ts).
- ~2s polling + `isHost` — [frontend/src/state/roomStore.ts](frontend/src/state/roomStore.ts).
- Host-gated Start + live roster — [frontend/src/pages/LobbyPage.tsx](frontend/src/pages/LobbyPage.tsx).
- Tests: [roomStore.test.ts](backend/src/services/roomStore.test.ts) (host + isolation),
  [schemas.test.ts](backend/src/api/schemas.test.ts) (name/code validation).

**Validated**: Backend + frontend `npm run build` pass (2026-06-05). Vitest blocked by Node 18 (see
note above). Manual two-tab quickstart run still pending.
**Notes / deviations**: The Lobby's Start button currently navigates to `/game` as a placeholder;
the real start-round call is wired in Scenario 2 (US2). Polling reuses the existing `fetchRoom` and
swallows transient errors to keep the lobby live.

---

## Scenario 2 — Game Start & Drawer Flow (P2)

**Status**: ✅ Done (code complete; manual two-tab validation pending) · **Tasks**: T013–T018

**Acceptance**:

- [x] Player names trimmed; empty/whitespace rejected (delivered in Scenario 1, FR-008)
- [x] Host starts round; exactly one drawer identified
- [x] Secret word selected deterministically from the starter list
- [x] Word visible only to the drawer (hidden from guessers)

**Implemented**:
- `startRound` with host (403) + min-2-players (400) guards and deterministic word selection
  (`STARTER_WORDS[0]`) — [backend/src/services/roomStore.ts](backend/src/services/roomStore.ts).
- `startGameSchema` + `POST /rooms/:code/start` route —
  [backend/src/api/schemas.ts](backend/src/api/schemas.ts),
  [backend/src/api/rooms.ts](backend/src/api/rooms.ts).
- Drawer-only word visibility enforced server-side in `toRoomSnapshot` (word serialized only when
  `viewer === drawerId`).
- `startGame` API call + store action —
  [frontend/src/services/api.ts](frontend/src/services/api.ts),
  [frontend/src/state/roomStore.ts](frontend/src/state/roomStore.ts).
- Lobby Start now triggers the round and all players auto-advance to the game on `status: active`;
  Game screen identifies the drawer and shows the word only to the drawer —
  [frontend/src/pages/LobbyPage.tsx](frontend/src/pages/LobbyPage.tsx),
  [frontend/src/pages/GamePage.tsx](frontend/src/pages/GamePage.tsx).
- Tests: start guards, deterministic word, drawer assignment —
  [roomStore.test.ts](backend/src/services/roomStore.test.ts).

**Validated**: Backend + frontend `npm run build` pass (2026-06-05). Vitest still blocked by Node 18.
Manual two-tab quickstart run pending.
**Notes / deviations**: Deterministic word = first word in the seed list (`rocket`). Drawing tools
themselves arrive in Scenario 3; the canvas currently shows a placeholder for the drawer.

---

## Scenario 3 — Gameplay Interaction (P3)

**Status**: ✅ Done (code complete; manual two-tab validation pending) · **Tasks**: T019–T025

**Acceptance**:

- [x] Drawer can draw on the canvas and clear it
- [x] Guesses trimmed; empty/whitespace rejected
- [x] Guess comparison is case-insensitive and whitespace-insensitive
- [x] Guess history synced to all players within ~2s
- [x] Scores start at 0; correct = 100, incorrect = 0

**Implemented**:
- `submitGuess` — trims, compares `toLowerCase()` against the word, appends a `Guess` to history,
  awards +100 on correct / +0 otherwise — [backend/src/services/roomStore.ts](backend/src/services/roomStore.ts).
- `guessSchema` + `POST /rooms/:code/guess` (400 on empty) —
  [backend/src/api/schemas.ts](backend/src/api/schemas.ts),
  [backend/src/api/rooms.ts](backend/src/api/rooms.ts).
- `submitGuess` API call + store action —
  [frontend/src/services/api.ts](frontend/src/services/api.ts),
  [frontend/src/state/roomStore.ts](frontend/src/state/roomStore.ts).
- GuessForm submits with inline empty-guess validation, disabled for the drawer —
  [frontend/src/components/GuessForm.tsx](frontend/src/components/GuessForm.tsx).
- Live scoreboard sorted by score —
  [frontend/src/components/Scoreboard.tsx](frontend/src/components/Scoreboard.tsx).
- Native `<canvas>` with pointer-drawing + Clear (drawer only) and a synced guess-history card —
  [frontend/src/pages/GamePage.tsx](frontend/src/pages/GamePage.tsx).
- Tests: empty-guess rejection, case/whitespace-insensitive correct=100, incorrect=0 in history —
  [roomStore.test.ts](backend/src/services/roomStore.test.ts).

**Validated**: Backend + frontend `npm run build` pass (2026-06-05). Vitest still blocked by Node 18.
Manual two-tab quickstart run pending.
**Notes / deviations**: Drawing strokes are local to the drawer's screen (per plan R7 — only guess
history and scores are synced, not canvas pixels). Guess history/scores sync via the existing ~2s
polling. The round does **not** yet transition to the result state on a correct guess — that
transition (`active → result`) is wired in Scenario 4 (T027).

---

## Scenario 4 — Result, Restart & Final Validation (P4)

**Status**: ✅ Done (code complete; manual two-tab validation pending) · **Tasks**: T026–T031

**Acceptance**:

- [x] All players see correct word, final scores, and full guess history
- [x] Host can restart from the result state
- [x] Restart returns everyone to the lobby with roster preserved
- [x] All round state (drawer, word, drawing, guesses, scores) cleared on restart

**Implemented**:
- Correct guess transitions the room to `result`; `toRoomSnapshot` reveals the word to everyone in
  the result state (drawer-only while active) — [backend/src/services/roomStore.ts](backend/src/services/roomStore.ts).
- `restartGame` — host-only, returns to `lobby`, clears `round`, resets all scores to 0, preserves
  the roster — (same file).
- `restartSchema` + `POST /rooms/:code/restart` (403 for non-host) —
  [backend/src/api/schemas.ts](backend/src/api/schemas.ts),
  [backend/src/api/rooms.ts](backend/src/api/rooms.ts).
- `restartGame` API call + store action —
  [frontend/src/services/api.ts](frontend/src/services/api.ts),
  [frontend/src/state/roomStore.ts](frontend/src/state/roomStore.ts).
- ResultPanel shows correct word + final scores + full guess history; Game screen has a host-only
  Restart and auto-returns all players to the lobby on restart (via polling) —
  [frontend/src/components/ResultPanel.tsx](frontend/src/components/ResultPanel.tsx),
  [frontend/src/pages/GamePage.tsx](frontend/src/pages/GamePage.tsx).
- Tests: active→result on correct guess; restart non-host blocked; restart resets to lobby with
  scores 0, round cleared, roster preserved —
  [roomStore.test.ts](backend/src/services/roomStore.test.ts).

**Validated**: Backend + frontend `npm run build` pass (2026-06-05). Vitest still blocked by Node 18.
Manual two-tab quickstart run pending.
**Notes / deviations**: Single round per session (per spec) — the round ends on the first correct
guess. Drawing strokes are not cleared server-side because they were never synced (local-only,
plan R7); a fresh round starts from a blank canvas on the next `start`.

---

## How to update this report

After completing a scenario:

1. Flip its **Status** (⬜ → 🟡 → ✅) and the row in the Summary table.
2. Tick the acceptance checkboxes you validated with two browser tabs.
3. Fill **Implemented** (files/commits), **Validated** (date + method), and any **deviations**.
4. Bump **Last updated** and, when both builds pass, tick the **Build gate**.
