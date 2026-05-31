# Discovery Notes

## Codebase Overview

Monolithic repo with `backend/` (Express + TypeScript + Zod, in-memory store) and `frontend/` (Vite + React 18 + React Router v6). HTTP polling only (no WebSockets). Tests use Vitest in both directories.

---

## Incomplete Behaviours (≥3)

### 1. No Host Tracking
- `Room` model (`backend/src/models/game.ts:10-16`) has no `hostId` field.
- `createRoom()` in `roomStore.ts` never marks the creator as host.
- LobbyPage "Start Game" button (`frontend/src/pages/LobbyPage.tsx:72`) is always enabled regardless of who is viewing it.
- **Impact**: Any player can start the game; host permissions are impossible to enforce.

### 2. No Game Loop
- `RoomStatus` only defines `"lobby"` (`game.ts:2`). No `"playing"` or `"finished"` states.
- No `GameRound`, `Guess`, `Score`, or `Drawing` models exist.
- `POST /rooms/:code/start`, guess submission, scoring, and restart endpoints are all absent.
- **Impact**: The entire drawing/guessing/scoring/result lifecycle is missing.

### 3. No Lobby Polling
- LobbyPage only has a manual "Refresh Room" button (`LobbyPage.tsx:68-71`).
- No `setInterval` or auto-fetch mechanism exists anywhere in the frontend.
- GET `/rooms/:code` only returns static data; no server-side events or push.
- **Impact**: Players must manually click refresh to see new participants; game state would never sync without polling.

### 4. Viewer-Agnostic Snapshots
- `toRoomSnapshot()` (`roomStore.ts:99-108`) ignores `viewerParticipantId` entirely — everyone receives the same snapshot.
- `availableWords` is always the full word list regardless of who the viewer is.
- **Impact**: Drawers and guessers would both see the secret word, breaking the game.

### 5. No Input Validation
- `displayName()` (`roomStore.ts:32-34`) silently falls back to `"Player"` for empty/undefined names.
- Join room accepts any room code format; backend returns generic 404 for missing rooms.
- GuessForm submits to nowhere — no validation exists for guess input.
- **Impact**: Empty names pollute the lobby; invalid codes get vague errors; guesses are never processed.

---

## Assumptions (≥2)

### A1. Drawer = Host (First Player)
- The spec says "the host (or first player) becomes the clearly-identified drawer" (Scenarios 1-2).
- We assume the room creator (host) is always the drawer for the single round.
- This is deterministic and avoids needing drawer-rotation logic (which is out of scope).

### A2. Polling Interval ~2s
- The spec says "~2s" for lobby polling refresh.
- We assume a hardcoded `setInterval` of 2000ms is acceptable.
- No configurable interval, no back-off strategy needed.

### A3. Word Selection: Deterministic by Room Code
- The spec says "deterministically selected from the starter list."
- We assume `wordIndex = charCodeSum(roomCode) % words.length` — reproducible across clients.
- Avoids needing a separate "pick word" endpoint or server-side RNG state.

### A4. Single Round Only
- Per out-of-scope rules: no multiple rounds, no drawer rotation, no timers.
- We assume one round per game; restart returns to lobby for a fresh round.

---

## Relevant Files

### Backend
| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Core types: `Room`, `Participant`, `RoomSnapshot`, `RoomStatus` |
| `backend/src/services/roomStore.ts` | In-memory store: CRUD, `toRoomSnapshot()`, `displayName()` |
| `backend/src/api/rooms.ts` | Route handlers for POST/GET rooms |
| `backend/src/api/schemas.ts` | Zod schemas for request validation |
| `backend/src/api/router.ts` | Express router + error/not-found handlers |
| `backend/src/seed/starterData.ts` | `STARTER_WORDS` (5 items), `STARTER_ROLES` (2 roles) |
| `backend/src/app.ts` | Express app factory |
| `backend/src/services/roomStore.test.ts` | Existing store tests |
| `backend/src/api/schemas.test.ts` | Existing schema tests |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/services/api.ts` | HTTP client, `RoomSnapshot` type definitions |
| `frontend/src/state/roomStore.ts` | `RoomStore` class with `useSyncExternalStore` |
| `frontend/src/pages/LobbyPage.tsx` | Lobby UI, manual refresh, placeholder Start Game |
| `frontend/src/pages/GamePage.tsx` | Game UI — all components are placeholders |
| `frontend/src/pages/CreateRoomPage.tsx` | Create-room form, no name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Join-room form, no code/name validation |
| `frontend/src/components/GuessForm.tsx` | Guess input — submits to nowhere |
| `frontend/src/components/Scoreboard.tsx` | Static scoreboard placeholder |
| `frontend/src/components/ResultPanel.tsx` | Static activity placeholder |
| `frontend/src/styles/app.css` | All application styles |
| `frontend/src/services/api.test.ts` | Existing API service tests |

### Root
| File | Purpose |
|------|---------|
| `README.md` | Lab instructions and current-scope documentation |
| `AGENTS.md` | AI coding agent instructions |
| `.github/pull_request_template.md` | PR submission template |
