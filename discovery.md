# Discovery Notes — Scribble Starter

**Branch:** `discovery`  
**Date:** 2026-05-30  
**Base:** `main` (scaffold-only)

## Summary

The repo is a runnable brownfield scaffold: Express in-memory rooms, React routes for lobby/game, and three REST room endpoints. Business scenarios in `README.md` (host, polling, gameplay, scoring, restart) are **not** implemented. The UI presents game flows, but behavior stops at create/join/fetch snapshot and manual lobby refresh.

---

## Incomplete Behaviors

### 1. Lobby has no host, polling, or gated start

- Room creator is not tracked as host; all participants look the same in the lobby list.
- `LobbyPage` only updates participants when the user clicks **Refresh Room** — no ~2s automatic polling.
- **Start Game** is available to every client and only navigates to `/game`; it does not call the backend or enforce a 2-player minimum.

**Evidence:** `frontend/src/pages/LobbyPage.tsx` (manual `handleRefresh`, unrestricted `navigate("/game")`); `backend/src/models/game.ts` (`Room` has no `hostId`); `backend/src/api/rooms.ts` (no start-game route).

### 2. Game start, drawer, and secret word are missing

- `Room.status` is only `"lobby"`; there is no playing/result phase in the model.
- `toRoomSnapshot` accepts `viewerParticipantId` but ignores it (`void viewerParticipantId`), so per-viewer fields (secret word, drawer role) cannot be delivered.
- `GamePage` shows a static canvas placeholder (“Waiting for drawer…”) and hard-coded “Round 1”; no drawer assignment or word selection from `STARTER_WORDS`.

**Evidence:** `backend/src/services/roomStore.ts`; `backend/src/models/game.ts`; `frontend/src/pages/GamePage.tsx`.

### 3. Gameplay, scoring, and synced state are UI-only placeholders

- `GuessForm` prevents default on submit but does not POST guesses or update history.
- `Scoreboard` and `ResultPanel` render static placeholder copy (scores always `0`, no guess activity).
- No drawing canvas logic, clear-canvas action, stroke sync, or game polling endpoints exist on the backend.

**Evidence:** `frontend/src/components/GuessForm.tsx`, `Scoreboard.tsx`, `ResultPanel.tsx`; `backend/src/api/rooms.ts` (only create/join/get).

### 4. Result and restart flows are absent

- No round-end state, correct-word reveal, final scoreboard, or host-driven restart back to lobby with cleared round data.
- Exiting game via **Exit Game** only routes to `/lobby` client-side without resetting server round state (none exists yet).

**Evidence:** `README.md` “Not implemented yet”; no result/restart routes or status values beyond `lobby`.

### 5. Input validation gaps (starter vs spec)

- Backend `createParticipant` uses `displayName(name || "Player")` without trim or empty-name rejection.
- Join/create pages do not trim names client-side before submit.
- Invalid room codes surface a generic API error (“Unable to join room”) rather than structured validation feedback.

**Evidence:** `backend/src/services/roomStore.ts` (`displayName`); `frontend/src/pages/JoinRoomPage.tsx`, `CreateRoomPage.tsx`.

---

## Assumptions

1. **HTTP polling only** — All multi-player sync (lobby, canvas, guesses, scores, results) will use repeated `GET` (and new `POST`/`PATCH` routes as needed); WebSockets and persistent storage remain out of scope per `README.md` and `AGENTS.md`.

2. **Starter word list and roles are canonical** — Round words come from `backend/src/seed/starterData.ts` (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`); roles are `drawer` | `guesser`. Selection should be deterministic (same room state → same word), not random per poll.

3. **Viewer-scoped snapshots** — The existing `participantId` query on `GET /rooms/:code` is the intended hook for hiding the secret word from guessers and exposing drawer-only data; implementation will extend `toRoomSnapshot(room, viewerParticipantId)` rather than adding auth.

4. **Frontend state stays in `RoomStore`** — New flows (polling timers, game actions) should extend `frontend/src/state/roomStore.ts` and `frontend/src/services/api.ts` instead of introducing new global state libraries.

5. **Default API URL may be wrong in dev** — `frontend/src/services/api.ts` defaults to `http://localhost:3001/bug` when `VITE_API_URL` is unset; local dev likely needs `VITE_API_URL=http://localhost:3001` or a code fix to match README port `3001`.

---

## Relevant Files

### Documentation & constraints

| File | Role |
|------|------|
| `README.md` | Business scenarios, build order, explicit out-of-scope rules |
| `AGENTS.md` | Agent coding rules (no WebSockets, DB, auth) |

### Backend

| File | Role |
|------|------|
| `backend/src/api/rooms.ts` | Room HTTP routes (create, join, get) |
| `backend/src/api/schemas.ts` | Zod request/query validation |
| `backend/src/api/router.ts` | API mount |
| `backend/src/services/roomStore.ts` | In-memory room CRUD and snapshots |
| `backend/src/services/roomStore.test.ts` | Room store unit tests |
| `backend/src/models/game.ts` | `Room`, `Participant`, `RoomSnapshot` types |
| `backend/src/seed/starterData.ts` | Words and roles seed data |
| `backend/src/app.ts` / `backend/src/server.ts` | Express app entry |

### Frontend

| File | Role |
|------|------|
| `frontend/src/routes/index.tsx` | Route map (`/`, `/lobby`, `/game`, …) |
| `frontend/src/state/roomStore.ts` | Client room session and fetch |
| `frontend/src/services/api.ts` | REST client |
| `frontend/src/services/api.test.ts` | API client tests |
| `frontend/src/pages/LobbyPage.tsx` | Lobby UI and manual refresh |
| `frontend/src/pages/GamePage.tsx` | Game shell and placeholders |
| `frontend/src/pages/CreateRoomPage.tsx` | Host create flow |
| `frontend/src/pages/JoinRoomPage.tsx` | Join-by-code flow |
| `frontend/src/pages/StartPage.tsx` | Landing |
| `frontend/src/components/GuessForm.tsx` | Guess input (non-functional submit) |
| `frontend/src/components/Scoreboard.tsx` | Score placeholder |
| `frontend/src/components/ResultPanel.tsx` | Activity placeholder |
| `frontend/src/styles/app.css` | Shared styles |

### Recommended build order (from README)

1. Scenario 1 — Room setup & lobby (host, polling, start gate)  
2. Scenario 2 — Game start & drawer flow  
3. Scenario 3 — Drawing, guesses, scoring, sync  
4. Scenario 4 — Result, restart, validation  

---

## Next Steps

1. Run `/speckit.constitution` and Scenario 1 `/speckit.specify` with acceptance criteria from `README.md`.  
2. Fix or document `VITE_API_URL` / default API base before multi-tab testing.  
3. Extend backend `Room` model and routes before wiring automatic lobby polling on the client.
