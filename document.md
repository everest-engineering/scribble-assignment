# Discovery Document — Branded Scribble

## App Overview

| Field | Details |
|---|---|
| **App Name** | Branded Scribble |
| **Type** | Brownfield — multiplayer drawing & guessing game |
| **Discovery Date** | 31 May 2026 |
| **Reviewed By** | Divya Sai Pagidipally |
| **Stack** | React frontend, Node/Express backend, in-memory store |

---

## What the Starter Includes

### ✅ Already Works (Happy Path Only)

| Area | Detail |
|---|---|
| App shell | Routing between all screens is wired up |
| Landing page | Branded Scribble page with game-themed marketing copy and starter UI styling |
| Create Room | Generates a unique room code, adds creator as participant, navigates to lobby |
| Join Room | Accepts a room code, adds the player to that room, navigates to lobby |
| Lobby | Displays room code and participant list (manual refresh only, no auto-polling) |
| Backend endpoints | `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` all functional |
| In-memory store | Correctly isolates rooms per room code |

### 🔶 Scaffolded but Non-Functional

| Area | Detail |
|---|---|
| Game screen | Placeholder areas for canvas, guess input, scoreboard, results — nothing works |
| Canvas | Styled `<div>` with text only, not an interactive drawing surface |
| Guess form | Renders input and button but submission does nothing |
| Scoreboard | Displays placeholder text only |
| Result panel | Displays placeholder text only |
| Landing page copy | Describes intended game experience but does not reflect implemented gameplay |

### ❌ Missing Entirely

| Area | Detail |
|---|---|
| Host tracking | No concept of who created the room or who can start the game |
| Player name validation | Empty names silently default to "Player" |
| Auto lobby polling | Only a manual refresh button exists |
| Start-game flow | No endpoint, no gating, no transition out of lobby |
| Drawer assignment | Roles exist as seed data but are never assigned |
| Secret word selection | Word list exists but is never used |
| Viewer-specific responses | Everyone sees the same room snapshot regardless of role |
| Drawing interaction | No canvas drawing capability |
| Guess handling | No guess submission, comparison, or scoring |
| Result state | No round end, result display, or restart flow |

### 📦 Provided Data

| Data | Values |
|---|---|
| Word list | `rocket`, `pizza`, `castle`, `guitar`, `sunflower` |
| Roles | `drawer`, `guesser` |

---

## Gaps

> Things confirmed missing, incomplete, or broken after reviewing the app.

| # | Gap | File / Location |
|---|-----|-----------------|
| G1 | Branded Scribble landing page and starter UI styling is not working | `frontend/src/pages/StartPage.tsx`, `frontend/src/styles/app.css` |
| G2 | Create Room — generates a unique room code, adds the creator as a participant, navigates to the lobby — not working | `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/services/api.ts`, `backend/src/services/roomStore.ts` |
| G3 | Join Room — accepts a room code, adds the player to that room, navigates to the lobby — not working | `frontend/src/pages/JoinRoomPage.tsx`, `frontend/src/services/api.ts`, `backend/src/api/rooms.ts` |
| G4 | Lobby — displays the room code and participant list (manual refresh button only, no auto-polling) — not working | `frontend/src/pages/LobbyPage.tsx`, `frontend/src/state/roomStore.ts` |
| G5 | Player name is being sent as "Player" instead of the entered name | `backend/src/services/roomStore.ts` (`displayName` function at line 32) |

> **Root cause for G1–G3**: The API base URL in `frontend/src/services/api.ts` (line 22) has a `/bug` suffix in its fallback value, sending all requests to non-existent endpoints and returning 404 errors.

---

## Assumptions

> Things treated as working while focus is elsewhere. Not yet fully verified.

| # | Assumption | File / Location |
|---|-----------|-----------------|
| A1 | Room joining and room creation pretend to work fine | `frontend/src/services/api.ts` (broken `/bug` suffix in `API_BASE_URL`) |
| A2 | Unable to see participants in the lobby | `frontend/src/pages/LobbyPage.tsx` (no auto-polling; manual refresh required) |
| A3 | Unable to see Scribble branding and game-themed marketing copy | `frontend/src/pages/StartPage.tsx` (renders correctly when app loads without errors) |

---

## Relevant Files

> Key files identified during discovery.

### Frontend

- `frontend/src/App.tsx` — app entry point, wraps routes with `RoomStoreProvider`
- `frontend/src/routes/index.tsx` — routing between `/`, `/create-room`, `/join-room`, `/lobby`, `/game`
- `frontend/src/pages/StartPage.tsx` — landing page and marketing copy
- `frontend/src/pages/CreateRoomPage.tsx` — create room flow
- `frontend/src/pages/JoinRoomPage.tsx` — join room flow, player name input
- `frontend/src/pages/LobbyPage.tsx` — lobby, participant list, refresh, start button
- `frontend/src/pages/GamePage.tsx` — game screen, canvas, guess form, scoreboard, results
- `frontend/src/services/api.ts` — all frontend API calls (contains the `/bug` base URL issue)
- `frontend/src/state/roomStore.ts` — player name, room state, and identity state
- `frontend/src/components/GuessForm.tsx` — guess input form (non-functional)
- `frontend/src/components/Scoreboard.tsx` — scoreboard placeholder
- `frontend/src/components/ResultPanel.tsx` — result panel placeholder

### Backend

- `backend/src/server.ts` — server entry, listens on port 3001
- `backend/src/app.ts` — Express app setup with CORS and JSON middleware
- `backend/src/api/router.ts` — top-level API router, mounts rooms
- `backend/src/api/rooms.ts` — room endpoints (`POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`)
- `backend/src/api/schemas.ts` — Zod validation schemas for room payloads
- `backend/src/services/roomStore.ts` — in-memory room and game state store
- `backend/src/models/game.ts` — TypeScript interfaces for Room, Participant, RoomSnapshot
- `backend/src/seed/starterData.ts` — seed word list and roles

---

## What We Are Building — Feature Groups

> Four feature groups to be built in order. Each group maps to a business scenario.

### Group 1 — Room Setup & Lobby
**Scenario:** A player wants to host or join a drawing game via a unique code.

| # | Feature | Acceptance Criteria |
|---|---------|---------------------|
| F1 | Host tracking on room creation | Creator is automatically marked as host in the room store |
| F2 | Join validation with clear error feedback | Invalid or empty room codes are rejected with a visible error message |
| F3 | Multi-room isolation verified | Two separate rooms do not share participants or state |
| F4 | Auto-polling in lobby (~2s interval) | Participant list updates automatically without manual refresh |
| F5 | Host-only start with 2-player minimum | Start button visible only to host; disabled until ≥2 players are present |

### Group 2 — Game Start & Drawer Flow
**Scenario:** A game is starting and the first round begins.

| # | Feature | Acceptance Criteria |
|---|---------|---------------------|
| F6 | Player name validation | Empty or whitespace-only names are rejected with a clear message; names are trimmed |
| F7 | Drawer assignment | First player (host) is assigned the `drawer` role; others are `guesser` |
| F8 | Deterministic secret word selection | Word selected from starter list in a consistent, repeatable way |
| F9 | Drawer-only word visibility | Secret word is visible only to the drawer, not to guessers |

### Group 3 — Gameplay Interaction
**Scenario:** A round is active with a drawer and guessers.

| # | Feature | Acceptance Criteria |
|---|---------|---------------------|
| F10 | Interactive drawing canvas | Drawer can draw freehand; drawing is visible on drawer's screen |
| F11 | Clear canvas | Drawer can clear the canvas at any time |
| F12 | Guess submission with validation | Empty guesses are rejected; guesses are trimmed and compared case-insensitively |
| F13 | Synced guess history via polling | All players see the same guess history; correct guesses score 100, incorrect score 0 |

### Group 4 — Result, Restart & Final Validation
**Scenario:** A round has ended and the host restarts.

| # | Feature | Acceptance Criteria |
|---|---------|---------------------|
| F14 | Shared result state | All players see the correct word, final scores, and full guess history |
| F15 | Clean restart to lobby | On restart, all players return to lobby; players preserved, all round state cleared |

---

## Explicitly Out of Scope

> Do not build, spec, plan, or task any of the following.

### Technical
- WebSockets or real-time sync
- Databases or persistent storage
- Authentication, accounts, or sessions
- Deployment, hosting, or CI pipelines
- Docker or containerisation
- New state-management or routing libraries beyond what the starter ships

### Game Features
- Multiple rounds
- Drawer rotation
- Round timers or countdowns
- Speed or drawer bonuses
- Custom or random word packs
- Spectator mode
- Room moderation (kick/mute)
- Room passwords or invite links

### Process
- Rewriting the starter from scratch — extend, do not replace
- Adding top-level dependencies not justified by the spec
- Refactoring unrelated code

---

## Phased Checkpoints

| Phase | Group | Checkpoint Goal |
|---|---|---|
| 1 | Room Setup & Lobby | Host tracking, join validation, multi-room isolation, auto-polling, host-only start |
| 2 | Game Start & Drawer Flow | Name validation, drawer assignment, word selection, drawer-only visibility |
| 3 | Gameplay Interaction | Interactive canvas, clear, guess validation, scoring, synced history |
| 4 | Result & Restart | Shared result state, clean restart, players preserved |

---

## Spec Kit Artifacts

> Required files to maintain throughout the lab alongside this discovery document.

| Artifact | File | Purpose |
|---|---|---|
| Discovery | `document.md` | Gaps, assumptions, relevant files (this document) |
| Constitution | `/speckit.constitution` | Engineering principles, AI usage rules, review discipline |
| Spec | `/speckit.specify` | Spec files with acceptance criteria, updated per feature group |
| Plan | `/speckit.plan` | State model, data flow, file-level plan, updated per feature group |
| Tasks | `/speckit.tasks` | Ordered task list with dependencies, updated per feature group |

---

## Evaluation Rubric

| Area | What Good Looks Like |
|---|---|
| Discovery | ≥3 gaps + ≥2 assumptions documented; relevant files listed |
| Spec Kit artifacts | Constitution, spec, plan, tasks committed and internally consistent |
| Working game flow | Two browsers can join a room, play one round, see synced result, restart |
| Edge cases & validation | Empty/invalid inputs, case-insensitive guess, multi-room isolation handled |
| Implementation alignment | Code behavior matches the spec; deviations are documented |
| Reflection | Reflection explains decisions, AI usage, tradeoffs |
| Submission clarity | Submission is easy to review |

---

## Notes

- Assumptions A1–A3 should be re-verified once the `/bug` suffix in `api.ts` is fixed.
- Gap G4 (auto-polling) must be resolved in Group 1 before moving to Group 2.
- Spec, plan, and tasks must stay internally consistent — deviations should be documented.
