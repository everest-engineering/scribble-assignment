## What the Starter App Already Had

The starter was a **skeleton** with room setup infrastructure and stub pages:

**Backend:**
- In-memory `Room` store with `createRoom`, `joinRoom`, `getRoom`, `saveRoom`
- `RoomSnapshot` + `Participant` data models (no `hostId`, no game state)
- API routes: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`
- Zod validation for basic schemas
- `STARTER_WORDS` and `STARTER_ROLES` seed data

**Frontend:**
- Custom class-based `RoomStore` with `useSyncExternalStore` + Context
- API client with `createRoom`, `joinRoom`, `fetchRoom`
- Pages: `StartPage`, `CreateRoomPage`, `JoinRoomPage`, `LobbyPage` (stub), `GamePage` (stub)
- Components: `Card`, `GuessForm` (stub), `Scoreboard` (stub), `ResultPanel` (stub)
- React Router v6 routing, CSS styling

**What was missing:** No game mechanics — no drawing, guessing, scoring, rounds, disconnect detection, skip, restart, or leave. No polling, session persistence, or host-only controls.

---

## Phase 1 — Room Setup & Lobby (Spec 001)

### What it does

Players create rooms and share a 4-character code. The room creator becomes the host. Others join by code. Everyone sees the participant list update in real time. The host sees a "Start Game" button that stays disabled until 2+ players have joined. The game starts when the host clicks it.

### Technical additions

- **Data model:** `hostId` added to `Room` and `RoomSnapshot`; `joinRoom` now rejects non-lobby rooms
- **API:** `POST /rooms/:code/start` — host-only, validates 2+ participants, transitions status to `"playing"`, initializes first round/drawer/word/scores
- **Frontend:** Auto-polling (2s with exponential backoff to 8s), session persistence via `sessionStorage`, host-only "Start Game" button with dynamic label, auto-navigate to `/game` on status change
- **Store:** `startGame()`, `startPolling()`, `stopPolling()`, `clearSession()`, `getSavedSession()`, `restoreSession()` methods added
- **Tests:** 10 backend tests (room lifecycle, host validation, join rejection, start game), 2 frontend tests (API client)

---

## Phase 2 — Game Start & Drawer Flow (Spec 002)

### What it does

When the game starts, one player is assigned as the drawer and sees the secret word. Everyone else sees a "waiting for drawer" view. The drawer's identity is visible to all. The secret word is never revealed to guessers.

### Technical additions

- **Data model:** `drawerId` and `secretWord` on `Room`; `secretWord` only included in snapshots when `viewerParticipantId === drawerId`
- **Frontend:** Session restoration on page load, navigation guard (`/game` → `/lobby` if status reverts), `CanvasPlaceholder` for non-drawers
- **No new API routes** — reuses existing `GET /rooms/:code` with conditional `secretWord`

---

## Phase 3 — Drawing, Guessing, Scoring & Rounds (Spec 003)

### What it does

The drawer draws freehand on a canvas with a color picker and clear button. Guessers type guesses and get instant correct/incorrect feedback. A correct guess awards 100 points and immediately advances the round. Scores (round + cumulative) are visible to everyone. The drawer rotates each round, cycling through all participants. When a round ends, a persistent overlay shows the correct word, drawer name, full guess history (timestamps + correct/incorrect badges), and final scores. Each player clicks "Continue" individually to dismiss it — no auto-dismiss timer.

### Technical additions

- **Data model:** `Point`, `DrawingStroke`, `GuessEntry`, `ParticipantScore`, `RoundResult` types added; `strokes`, `guessHistory`, `scores`, `lastRoundResult`, `lastRoundResultSetAt` on `Room`
- **API:** `POST /rooms/:code/guess` — case-insensitive, 100pts, auto-advances on correct; `POST /rooms/:code/draw` — drawer-only stroke addition; `DELETE /rooms/:code/draw` — drawer-only canvas clear
- **Frontend:** `Canvas.tsx` (pen, color picker, clear, survives poll redraws), `GuessHistory.tsx` (timestamped list), `Scoreboard.tsx` (round + cumulative), `RoundResultCard.tsx` (overlay with Continue/Restart/Exit)
- **Store:** `addStrokes()`, `clearCanvas()`, `submitGuess()`, `dismissLastRoundResult()` methods; local tracking of `lastRoundResult`/`resultDismissed`/`dismissedRoundNumber`
- **Tests:** 13 backend tests (guess validation, scoring, round advancement, stroke add/clear), 8 frontend tests (Canvas, GuessForm, GuessHistory, Scoreboard, RoundResultCard)

---

## Phase 4 — Disconnect Handling, Skip, Restart, Exit & Game Over (Spec 004)

### What it does

**Host disconnect** — If the host's browser goes idle for 30+ seconds, all remaining players see a "Host disconnected" popup with a "Claim Host" button. Whoever clicks it becomes the new host.

**Drawer disconnect & skip** — If the drawer disconnects, non-host players see a "Notify Host" button. Clicking it sets a flag that the host sees as a badge on their "Skip Round" button. The host can advance the round without a correct guess.

**Restart** — From the result overlay, the host can restart the game. Everyone returns to the lobby with participants preserved and all game state cleared.

**Exit & game over** — Any player can leave a game in progress. If all remaining participants have disconnected browsers (stale beyond 30 seconds), the game auto-ends with a final result card showing just an "Exit Game" button. The last player to leave deletes the room entirely.

**Name validation** — Player names are capped at 20 characters on both API and UI.

### Technical additions

- **Data model:** `lastSeenAt` on `Participant` (heartbeat timestamp); `skipSuggested`, `hostDisconnected`, `drawerDisconnected` on `Room`/`RoomSnapshot`; `"finished"` status variant
- **API:** `POST /rooms/:code/restart` — host-only, resets to lobby; `POST /rooms/:code/skip-round` — host-only, checks no correct guess exists; `POST /rooms/:code/suggest-skip` — any participant sets flag; `POST /rooms/:code/claim-host` — any participant; `DELETE /rooms/:code/leave` — removes participant, triggers game-over logic
- **Disconnect detection:** `touchParticipant()` called on every poll updates `lastSeenAt`; `isDisconnected()` checks 30-second threshold server-side; computed in `toRoomSnapshot()`
- **Frontend:** `HostDisconnectedBanner.tsx`, `DrawerDisconnectedBanner.tsx`; "Skip Round" button with pulse badge on `skipSuggested`; `leaveRoom()` method; finished status shows RoundResultCard with Exit only
- **Design decisions:** End game when host leaves and no active participants remain (prevents false "Host Disconnected" popup). `HostDisconnectedBanner` guarded with `room.status !== "finished"` in LobbyPage.
- **Tests:** 21 backend tests (skip round, suggest skip, claim host, remove participant, disconnect flags in snapshot), 8 frontend tests (banners, round result card, API client)

---

## Growth Summary

- Backend tests: **0 → 54**
- Frontend tests: **0 → 18**
- API routes: **3 → 12**
- Frontend components: **4 stubs → 10 working**
