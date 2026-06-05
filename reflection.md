# Reflection Report

## What the Starter App Already Had

The starter provided a runnable scaffold with:

- **App shell and routing**: Five pages (Start, Create Room, Join Room, Lobby, Game) wired
  with React Router. Navigation between pages worked.
- **Create/join room flow**: `POST /rooms` and `POST /rooms/:code/join` endpoints, Zod
  validation schemas, and an in-memory `Map<string, Room>` store. The frontend called these
  and navigated to `/lobby`.
- **Room snapshot fetch**: `GET /rooms/:code` existed and returned participant lists.
  The Lobby page had a manual Refresh button that called it once.
- **Lobby participant display**: Players who joined appeared in the list after a manual
  refresh.
- **Game screen placeholders**: `GamePage` rendered labelled placeholder divs for the
  canvas, scoreboard, and activity panel. `GuessForm.handleSubmit` was an empty function.
- **Starter seed data**: Five words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`)
  and roles (`drawer`, `guesser`) were in place but unused by any game logic.
- **TypeScript build pipeline**: Both `backend` (`tsc`) and `frontend` (`vite build`)
  built cleanly from the start.

## What Was Added

### Scenario 1 — Room Setup & Lobby
- **Host tracking**: `hostId` added to the `Room` model and `RoomSnapshot`. The creator is
  always the host; derived as `isHost = participantId === room.hostId` on the frontend.
- **Name validation**: Backend schemas now trim and reject whitespace-only names. Frontend
  forms validate before calling the API.
- **Lobby polling**: Replaced the one-shot Refresh button with a `setInterval` (2 000 ms)
  that auto-refreshes participants and navigates to `/game` when `status === "active"`.
- **Host-only Start Game**: Button is only visible and enabled for the host when ≥ 2
  players are present.
- **Start game endpoint**: `POST /rooms/:code/start` — validates host + player count,
  transitions room to `"active"`.
- **Late-joiner guard**: `POST /rooms/:code/join` rejects with 400 "Game already started"
  when `room.status === "active"`.

### Scenario 2 — Game Start & Drawer Flow
- **Drawer assignment**: `startRoom()` sets `drawerId = hostId` (deterministic, no rotation).
- **Word selection**: `currentWord = STARTER_WORDS[0]` ("rocket") — positional, always the
  same.
- **Server-side word filtering**: `toRoomSnapshot()` includes `currentWord` only when the
  viewer is the drawer (active state) or when the round has ended (result state).
- **Game screen role display**: `GamePage` shows the drawer's name, the drawer's word, and
  the player's own role.

### Scenario 3 — Gameplay Interaction
- **HTML5 Canvas**: Drawer mouse events accumulate stroke points; `mouseUp` sends a stroke
  to `POST /rooms/:code/stroke`. The canvas is cleared and all strokes replayed on every
  poll — simple, no library needed.
- **Clear canvas**: `POST /rooms/:code/clear` empties `canvasStrokes`; propagates via
  polling. Button is drawer-only.
- **Guess submission**: `POST /rooms/:code/guess` — trims text, rejects empty, compares
  case-insensitively, records `isCorrect`, awards 100 pts for correct guesses.
- **Scores initialised to 0**: Set in `startRoom()` for all participants.
- **Game screen polling**: Added a `setInterval` in `GamePage` mirroring the lobby pattern.
  Canvas, guesses, and scores all arrive in the same snapshot poll.
- **Live scoreboard and guess history**: `Scoreboard` and `ResultPanel` replaced hardcoded
  placeholders with live data from `room.scores` and `room.guesses`.

### Scenario 4 — Result, Restart & Final Validation
- **End round**: `POST /rooms/:code/end` (host only) transitions status to `"result"` and
  reveals `currentWord` to all viewers in the snapshot.
- **Result screen**: `ResultPage` — dedicated route showing secret word, final scores, full
  guess history; host gets a Restart button; all players poll and navigate back to `/lobby`
  on restart.
- **Restart**: `POST /rooms/:code/restart` (host only) — clears `canvasStrokes`, `guesses`,
  `scores`, `currentWord`, `drawerId`; sets status back to `"lobby"`; preserves
  `participants` and `hostId`.
- **Status-driven navigation**: `GamePage` navigates to `/result` when polling detects
  `status === "result"`. `ResultPage` navigates to `/lobby` when polling detects
  `status === "lobby"`. Navigation is always poll-driven, never imperative on the host side
  only.

## Decisions, AI Usage, and Tradeoffs

### Using Spec Kit

Spec Kit was used to drive every feature from spec to implementation:

1. `/speckit-constitution` — set governance principles before writing any code.
2. `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement` → `/speckit-analyze` — run for all four scenarios in sequence.

The workflow enforced the right order. Clarification questions caught two non-obvious gaps
before planning: polling error behaviour and late-joiner rejection. The analysis pass caught
a button-label mismatch (spec said "Restart", implementation said "Play Again") that would
have failed a spec-traceability check.

### AI-Generated Code — Review Practice

Every generated code block was reviewed before being accepted:

- The Zod `.transform().pipe()` pattern for name validation was a deliberate choice over
  `.min(1)` alone — it trims *before* checking length, matching the spec's intent.
- The `toRoomSnapshot` word-filtering condition (`viewerParticipantId === room.drawerId ||
  room.status === "result"`) was reasoned through explicitly; a simpler but incorrect version
  would have revealed the word to all players during the active round.
- The `delete room.scores` approach in `restartRoom()` was chosen over `room.scores = undefined`
  to keep the optional-field contract clean.

### Tradeoffs Accepted

| Decision | Alternative | Why accepted |
|----------|------------|--------------|
| Polling at ~2 s for all sync | WebSockets | Explicitly out of scope; polling is simple and testable with two browser tabs |
| HTML5 Canvas API directly | Canvas library (Fabric.js) | No new dependency; full replay on each poll is correct and simple |
| Server-side word filtering in snapshot | Client-side filtering | Client-side filtering is insecure; DevTools would expose the word |
| Stroke append model (send on mouseUp) | Send every mouse-move event | Reduces API call frequency without losing visual fidelity on replay |
| Host = drawer (no rotation) | Round-robin drawer | Out of scope per README; makes drawer assignment deterministic and spec-traceable |
| `endRound` as explicit host action | Auto-end when correct guess received | README has no auto-end trigger; explicit action is simpler and more controllable |

### Deviations from Spec

One deviation was found and fixed during the post-implementation analysis pass:

- **Button label**: `ResultPage` initially rendered "Play Again"; the spec said "Restart".
  Fixed before submission.

No other behavioural deviations from the spec were identified.
