# Reflection Report — Scribble Lab

## What the Starter App Already Had

The starter was a TypeScript monorepo (Express 4 backend, React 18 + Vite frontend) with
the following working pieces:

**Backend**
- In-memory `rooms` Map as the sole data store
- `createRoom` and `joinRoom` functions, plus `GET /rooms/:code`
- `RoomStatus` typed as `"lobby"` only; `Room` held just `code`, `status`, `participants`,
  `createdAt`, `updatedAt` — no host identity, no game state
- Zod schemas for create/join, an `HttpError` class, and an Express error handler
- Two seed Vitest tests (room creation and join)

**Frontend**
- React Router with all five pages wired (`Start`, `CreateRoom`, `JoinRoom`, `Lobby`, `Game`)
- `RoomStoreProvider` and `useRoomState` / `useRoomStore` hooks connected to the backend
- `GamePage` rendered the two-column layout shell but contained no canvas, no polling, and
  no interactive components
- `GuessForm`, `Scoreboard`, and `ResultPanel` were stub components — form had no submit
  handler; Scoreboard showed static placeholder text; ResultPanel was empty
- `LobbyPage` displayed participants from the initial join response but had no polling and
  no "Start Game" button

---

## What Was Added (Scenarios 1–4)

### Scenario 1 — Room Setup & Lobby
- `hostId` added to `Room`; `participantId` threaded through all store methods
- Lobby 2-second polling with inline error display and 404 redirect
- "Start Game" button: host-only, disabled until ≥ 2 players, navigates to `/game`
- Input validation feedback for empty/whitespace player names

### Scenario 2 — Game Start & Drawer
- `RoomStatus` extended to `"lobby" | "playing"`
- `startRoom` service function + `POST /rooms/:code/start` route (host-only, 403 guard,
  ≥ 2 player check)
- `drawerId` and `secretWord` added to `Room`; `secretWord` redacted from non-drawer viewers
  in `toRoomSnapshot`
- Word banner visible only to the drawer; guesser sees a canvas placeholder

### Scenario 3 — Gameplay Interaction
- `Guess` entity (`participantId`, `participantName`, `text`, `correct`, `submittedAt`)
- `guesses[]`, `scores{}`, `canvasData` added to `Room` and `RoomSnapshot`
- `POST /rooms/:code/guess` — trims input, case-insensitive comparison, awards 100 pts
- `PUT /rooms/:code/canvas` — validates base64 PNG, caps at 400 KB
- Freehand canvas drawing (mousedown/mousemove/mouseup) for the drawer
- Canvas snapshot synced to guessers via polling
- `GuessForm` wired: submit, trim, empty-guess rejection with retained input, error display
- `Scoreboard` and `ResultPanel` live-rendered from room snapshot; `ResultPanel` colour-codes
  correct (green) vs incorrect (red) guesses

### Scenario 4 — Result, Restart & Final Validation
- `RoomStatus` extended to `"lobby" | "playing" | "result"`
- `endRoom` function + `POST /rooms/:code/end` route: host-only, transitions to `"result"`,
  `secretWord` now exposed to all viewers in that status
- `restartRoom` function + `POST /rooms/:code/restart` route: host-only, resets `guesses`,
  `scores`, `canvasData`, `drawerId`, `secretWord` to initial values; preserves participants
- New `RoundResultsView` component: word reveal, scores sorted descending (ties by join
  order), colour-coded guess history, "Restart" button for host, personalised
  "Waiting for [host name] to restart…" for non-host players
- `GamePage` early return to `RoundResultsView` on `status === "result"`;
  polling extended to detect `status === "lobby"` (restart) and navigate accordingly
- Host-only "End Round" button rendered only during `"playing"` status

---

## AI Usage and Decisions

This project used Claude Code with Spec Kit to drive the full spec → plan → tasks →
implement cycle for each scenario.

**Where AI output was accepted without change**

The data model extensions were straightforward brownfield additions (new fields on existing
interfaces) and the AI generated them correctly on the first pass. The `toRoomSnapshot`
redaction logic — a one-line condition change — was applied exactly as designed.

**Where AI output was corrected or rejected**

The most significant rejection came during the `/speckit-clarify` session for Scenario 4.
The user requested a 60-second automatic round timer. The AI incorporated it into the spec
(FR-015, FR-016, `roundEndsAt` field, countdown display). When `/speckit-plan` ran, it
detected that the constitution's Out-of-Scope Constraints explicitly listed
"timers, countdowns" as forbidden. The timer was fully reverted from the spec before
implementation proceeded. This is the clearest example of an AI-generated requirement being
stopped by governance tooling before it reached the codebase.

A smaller correction: during Phase 3 implementation, `restartRoom` was prematurely imported
into `rooms.ts` before the function existed in `roomStore.ts`, causing a TypeScript error.
The import was split across two tasks (T005 and T011) to match the actual execution order.

**Tradeoffs**

| Decision | Choice made | Alternative | Why |
|----------|-------------|-------------|-----|
| Real-time sync | HTTP polling (2 s) | WebSockets | Constitution and AGENTS.md forbid WebSockets |
| Results view | In-place render in `GamePage` | Separate `/game/results` route | Spec said "in place of gameplay view"; avoids new route and state threading |
| Polling in `"result"` status | Continue polling | Stop on result (per constitution Principle IV) | Non-host players need polling to detect restart; justified deviation documented in plan |
| Score sort | Descending on results screen | Join order | Decided in clarification — highest score first is the natural "winner on top" outcome |
| Waiting message | Personalised with host name | Generic "Waiting for host…" | Decided in clarification — host's name is already in the snapshot at no extra cost |
| `status` field | Kept as `status`, added `"result"` | Renamed to `phase` | Decided in clarification — renaming would have touched every line that reads `status` in prior scenarios |
| `restartRoom` score reset | Empty object `{}` | Zero-filled map | Consistent with `startRoom` which rebuilds the zero-filled map from participants at game start |

**What worked well with the spec-driven approach**

Running `/speckit-clarify` before `/speckit-plan` surfaced four decisions (field naming,
score sort order, minimum player check after restart, waiting message text) that would
otherwise have required rework mid-implementation. The constitution check in `/speckit-plan`
caught the timer violation before a single line of timer code was written.

**What was harder than expected**

The `"result"` status creates a transitional polling state that sits in mild tension with the
constitution's "stop polling on result" rule. The plan documents this as a justified
deviation, but it highlights that the constitution was written with Scenario 3 as the terminal
state and did not anticipate Scenario 4's restart loop.
