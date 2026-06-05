# Reflection Report

## What the starter app already had

The starter is a runnable but intentionally incomplete Scribble-style scaffold. Before writing any new code, I inspected both apps to map exactly what was already in place.

### Backend (`backend/` — Node.js + Express + TypeScript)

- **App + server bootstrap** — `app.ts` wires up Express with JSON parsing, the API router, a `notFoundHandler`, and a centralized `errorHandler` (including Zod validation → `400`). `server.ts` boots it on port `3001` (override via `PORT`).
- **Health/root route** — `GET /` returns `{ ok: true, service: "scribble-api" }`.
- **Room REST API** (`api/rooms.ts`) with three working endpoints:
  - `POST /rooms` — creates a room, returns `participantId` + room snapshot (`201`).
  - `POST /rooms/:code/join` — adds a participant to an existing room (`404` if unknown).
  - `GET /rooms/:code` — returns the current room snapshot.
- **Request validation** — `api/schemas.ts` uses Zod (`createRoomSchema`, `joinRoomSchema`, `roomCodeParamsSchema`, `roomViewerQuerySchema`) plus an `HttpError` helper.
- **In-memory room store** (`services/roomStore.ts`) — a `Map<string, Room>` holding all state. Provides `createRoom`, `joinRoom`, `getRoom`, `saveRoom`, and `toRoomSnapshot`. Generates unique 4-char room codes (ambiguity-free alphabet), assigns participant UUIDs and `joinedAt` timestamps, and deep-clones rooms on the way in/out. Restarting the backend wipes all rooms.
- **Domain model** (`models/game.ts`) — `Participant`, `Room` (`status: "lobby"`), and `RoomSnapshot` types.
- **Seed data** (`seed/starterData.ts`) — `STARTER_WORDS` (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and `STARTER_ROLES` (`drawer`, `guesser`).
- **Tests** — starter unit tests for the room store and schemas.

### Frontend (`frontend/` — Vite + React + TypeScript)

- **App shell & routing** (`routes/index.tsx`) — `react-router-dom` routes for Start (`/`), Create Room, Join Room, Lobby, and Game, with a catch-all redirect to `/`. Wrapped in a shared `AppShell`.
- **Pages** — `StartPage`, `CreateRoomPage`, `JoinRoomPage`, `LobbyPage`, `GamePage` (the game screen ships as static placeholders for canvas, guess input, scoreboard, and results).
- **Presentational components** — `Card`, `PageHeader`, `RoomCodeBadge`, `GuessForm`, `Scoreboard`, `ResultPanel`, plus branded Scribble styling in `styles/app.css`.
- **API client** (`services/api.ts`) — typed wrappers (`createRoom`, `joinRoom`, `fetchRoom`) over `fetch`, with a configurable base URL via `VITE_API_URL`.
- **Client state store** (`state/roomStore.ts`) — a small external store consumed via `useSyncExternalStore`, tracking `room`, `participantId`, `error`, and `isLoading`. Handles create/join sessions and a manual `fetchRoom` refresh.

### Behavior that worked end-to-end out of the box

- Create a room and land on the Lobby.
- Join an existing room by code from another tab.
- Manually refresh the lobby to pull the latest participant snapshot.

### What was explicitly **not** implemented in the starter

Host tracking / host-only permissions, automatic lobby polling, start-game flow, drawer assignment, secret-word visibility rules, drawing + clear-canvas interaction, guess submission with synced history, scoring, result state, and restart. The `toRoomSnapshot` function even ignores the viewer's `participantId` today — a clear seam where per-viewer rules (like drawer-only word visibility) will plug in.

> One real defect surfaced immediately: the frontend API base URL defaulted to `http://localhost:3001/bug`, so every request 404'd with "Route not found." Fixing that stray `/bug` suffix in `services/api.ts` was the prerequisite to verifying the starter flows above.

## What I added

Driven through the Spec Kit workflow (constitution → specify → plan → analyze → tasks →
implement) under `specs/001-room-setup-lobby/`.

### Scenario 1 — Room Setup & Lobby

**Backend**
- **Host tracking** — added `hostId` to the `Room` model, set to the creator's participant id
  at creation (`roomStore.ts`).
- **Host-aware snapshots** — `toRoomSnapshot` now honors the viewer's `participantId` (it
  previously discarded it) to derive `isHost` and `canStart` (`isHost && participants ≥ 2`),
  surfaced on `RoomSnapshot`.
- **Robust code handling** — `getRoom`/`joinRoom` normalize codes (trim + upper-case), making
  lookups case-insensitive as a property of the store; tightened `roomCodeParamsSchema` to
  `z.string().trim().min(1)`; join/fetch now return a distinct `404 "Room not found"`.

**Frontend**
- **Automatic lobby polling** — added `startPolling`/`stopPolling` to `roomStore.ts` (~2s,
  in-flight guard, soft-fail that preserves the last snapshot); `LobbyPage` starts it on mount
  and clears it on unmount, replacing the manual-only refresh.
- **Host & start gating** — the lobby marks the host in the participant list and shows the
  Start control only to the host, disabled with a clear message until two players are present.
- **Join validation** — empty/whitespace codes are blocked client-side with a clear message;
  backend not-found messages are surfaced without navigating.

**Tests & validation**
- Extended `roomStore.test.ts` (host assignment, non-host joiner, case-insensitive lookup,
  multi-room isolation, `canStart` gating) and `schemas.test.ts` (empty/whitespace/trim);
  added a frontend `api.test.ts` case for the new snapshot fields. 14 backend + 3 frontend
  tests pass; both builds green; backend API smoke-tested for every Scenario 1 acceptance path.

### Starter bug fixed

- Frontend API base URL defaulted to `http://localhost:3001/bug`, causing every request to
  404 with "Route not found". Corrected to `http://localhost:3001` (`services/api.ts`).

### Scenario 2 — Game Start & Drawer Flow

Specced and planned under `specs/002-game-start-drawer/`.

**Backend**
- **Active-round status** — extended `RoomStatus` to `"lobby" | "playing"`; added `drawerId` and
  `secretWord` to the `Room` model.
- **Start action** — new `POST /rooms/:code/start` + `startRound(code, participantId)` that
  verifies the requester is the host and ≥2 players are present, then assigns the drawer, selects
  the word, and flips the room to `playing`. Distinct errors: `403` (not host), `409` (too few
  players), `404` (no room).
- **Deterministic word** — `selectWord(code)` derives a stable index from the room code, so the
  same room always yields the same starter word; chosen once at start and stored on the room.
- **Drawer-only visibility** — `toRoomSnapshot` now derives `isDrawer` and returns `secretWord`
  **only** to the drawer (`null` for guessers), so the word is stripped server-side, never just
  hidden in the UI.
- **Name validation** — `createRoomSchema`/`joinRoomSchema` now require `z.string().trim().min(1)`;
  removed the blank-name "Player" default so trimmed names are stored as-is.

**Frontend**
- **Synced transition** — the existing ~2s poll now carries every player into the game: when a
  poll reports `status === "playing"`, `LobbyPage` navigates to `/game`, so guessers enter
  automatically (closing the Scenario 1 gap). The host's Start button calls the new `startRoom`.
- **Game view** — `GamePage` now polls, shows the drawer's name and each viewer's own role, and
  reveals the secret word only to the drawer; it falls back to the lobby if the round isn't active.
- **Name guards** — Create/Join forms reject empty/whitespace names with a clear message.

**Tests & validation**
- Added backend tests for start/drawer assignment, deterministic word, drawer-only word
  visibility, host/player-count guards, and name validation. 21 backend + 3 frontend tests pass;
  both builds green; the start/role/word paths were API smoke-tested (guesser snapshot confirmed
  to contain `secretWord: null`).

### Scenario 3 — Gameplay Interaction

Specced and planned under `specs/003-gameplay-interaction/`.

**Backend**
- **Guess history & scores** — added a `Guess` type and `guesses`/`scores` to the `Room` model;
  scores are zeroed for all participants when the round starts.
- **Submit-guess action** — new `POST /rooms/:code/guess` + `submitGuess(...)` that requires the
  room to be `playing`, the requester to be a guesser (not the drawer, an existing participant),
  and non-empty trimmed text; compares `trim().toLowerCase()` to the secret word; records the
  guess; awards **100 for a first correct guess** (capped once per round, 0 otherwise). Errors:
  `400` (empty), `403` (drawer/non-participant), `404` (no room), `409` (round not active).
- **Word secrecy in history** — `toRoomSnapshot` returns each guess's `text` only when the guess
  is incorrect, or the viewer is the drawer or the guess's own author; otherwise a correct guess's
  text is `null`, so the secret word never leaks to other guessers. Scores are exposed per
  participant.

**Frontend**
- **Guess flow** — `api.submitGuess` + `store.submitGuess`; the `GuessForm` validates empty input
  and submits; `GamePage` shows the form to guessers only (the drawer sees a note).
- **Synced history & scoreboard** — `GamePage` renders the polled guess history (with hidden text
  for others' correct guesses) and a live `Scoreboard` from the snapshot scores.
- **Shared drawing via polling** — new `DrawingCanvas` component (HTML5 canvas freehand + Clear).
  After a `/speckit-clarify` decision (2026-06-05), the drawing is shared with guessers: the drawer
  serializes the canvas (`toDataURL`) and `PUT`s it to `POST /rooms/:code/drawing` on a ~2s cadence
  and on clear; the room snapshot gains a `drawing` field that guessers render read-only from the
  poll they already run. This is HTTP polling only (a whole-canvas image, not stroke deltas), so it
  honors the no-real-time-push constraint. Drawing/clear controls remain drawer-only.

**Tests & validation**
- Added backend tests for guess validation (empty/drawer/not-playing), case-insensitive matching,
  history order, drawer-only/author-only correct-guess text, and scoring (0 → 100, capped once).
  26 backend + 3 frontend tests pass; both builds green; the gameplay paths were API smoke-tested
  (guesser's view confirmed to hide a correct guess's text while the drawer sees it).

### Scenario 4 — Result, Restart & Final Validation

Specced and planned under `specs/004-result-restart/`.

**Backend**
- **Result status** — extended `RoomStatus` to `"lobby" | "playing" | "result"`.
- **End / restart actions** — `endRound` (host-only, `playing → result`) and `restartRound`
  (host-only, `result → lobby`). Restart clears the drawer, secret word, guesses, and drawing and
  resets every score to 0, while **preserving participants and the host** — leaving a fresh,
  re-startable lobby. New endpoints `POST /rooms/:code/end` and `POST /rooms/:code/restart`
  (`403` non-host, `409` wrong status, `404` no room).
- **Result-time reveal** — `toRoomSnapshot` reveals the `secretWord` and correct-guess text to
  **everyone** once `status === "result"`, while keeping the Scenario 2/3 secrecy during play.
  Added `canEndRound`/`canRestart` flags mirroring `canStart`.

**Frontend**
- **Result screen** — new `ResultPage` (added `/result` route) that polls, shows the revealed word,
  the final `Scoreboard`, and the full guess history, and offers the host a Restart control.
- **Synced lifecycle** — `GamePage` gives the host an End-Round control and navigates everyone to
  `/result` when the round ends; `ResultPage` navigates everyone back to `/lobby` on restart — both
  via the existing ~2s poll, so non-hosts move automatically.

**Tests & validation**
- Added backend tests for end/restart (host-only, wrong-status rejection), result-time word/text
  reveal, full state clearing + score reset + participant preservation, and host-only gating flags.
  34 backend + 3 frontend tests pass; both builds green; the full lifecycle was API smoke-tested
  (host end → result with word revealed → host restart → fresh lobby, players preserved, scores 0).

---

## Workflow, AI usage & tradeoffs

**How the work was driven.** Every scenario went through the same Spec Kit loop —
`constitution → specify → (clarify) → plan → tasks → analyze → implement` — and each command's
output was committed as a discrete artifact under `specs/00X-*/`. Writing the constitution first
paid off repeatedly: the "no WebSockets / no DB / no auth / deterministic rules" principles became
a checklist that every plan's Constitution Check had to pass, which kept later decisions honest
rather than ad hoc.

**Decisions that shaped the implementation.**
- **One snapshot, many views.** The biggest leverage point was making `toRoomSnapshot` per-viewer.
  Host identity, drawer-only word secrecy, hidden correct-guess text, and the result-time reveal
  are all derived from the viewer's `participantId` in one place — so secrecy is enforced
  server-side (the word is never sent to a guesser) instead of hidden in the UI.
- **Polling as the only transport.** Because real-time push is forbidden, the ~2s poll added in
  Scenario 1 became the backbone for every later cross-client transition: lobby→game on start,
  game→result on end, result→lobby on restart, and synced guesses/scores. Reusing it kept each
  scenario small.
- **Determinism over realism.** Word selection is a pure function of the room code, scoring is
  exactly 100/0 and capped once per player, and the drawer is always the host — all chosen so the
  rules are reproducible and unit-testable, per the constitution.

**The one real tradeoff — drawing sync.** The README says the drawing is "visible on the drawer's
screen," which I first read literally and built as drawer-local. In play-testing that made the game
unplayable (guessers guess blind). Rather than silently change scope, I ran `/speckit-clarify`,
recorded the decision, and amended spec → plan → tasks → code in order: the drawer now `PUT`s a
serialized canvas image and guessers render it from the poll. It costs a heavier payload and ~2s
lag, but it stays inside "HTTP polling only." This was the clearest example of the spec-driven loop
catching a scope question *before* it became untraceable drift.

**Where AI helped vs. where judgment was needed.** AI was strong at the mechanical, repetitive
parts — scaffolding endpoints, mirroring types across backend/frontend, and generating tests from
acceptance criteria. The parts that needed human judgment were the genuine product decisions the
spec left open (host-controlled round end vs. auto-end, score-once vs. per-correct, hiding correct
guesses to protect the word, and the drawing-sync tradeoff). I surfaced those as explicit
assumptions or `/speckit-clarify` questions instead of letting the generator pick — which is the
discipline the constitution's "review AI output, document deviations" principle is meant to enforce.

## Lab status

All four business scenarios are implemented through the Spec Kit workflow, each with its own
`specs/00X-*/` artifacts and a matching commit (Scenario 1 `ccae82c`, 2 `39a466c`, 3 `02e98cd`,
4 `d807a31`). Final quality gates: **34 backend + 3 frontend unit tests pass, both builds are
green, and the two-browser full-loop walkthrough was manually validated for all four scenarios** —
join a room, play a round (draw, guess, score), see the synced result, and restart back to the
lobby — entirely over HTTP polling, with no WebSockets, database, or authentication, per the
project constitution.
