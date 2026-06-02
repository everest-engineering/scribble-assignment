# Reflection: Scribble — Multiplayer Drawing Game

## What I Built

Scribble is a browser-based multiplayer drawing game (Pictionary-style) built as a full-stack TypeScript application. Players create or join rooms via a 4-character code, take turns as the "drawer" illustrating a secret word while "guessers" submit text guesses, earn points for correct answers, view the final result when the round ends, and restart for another game — all synchronized through HTTP polling without WebSockets.

The project spans four feature groups delivered incrementally across distinct specs:

### Feature Group 1 — Room Setup & Lobby (001)
The foundation of the multiplayer experience. Players create rooms and receive a unique 4-character alphanumeric code (drawn from an unambiguous alphabet excluding I/O/0/1). Other players join by entering that code. The lobby page shows the room code, player list, host badge, and start-readiness state. A 2-second polling loop keeps all players synchronized. Host-only start is enforced, and rooms are fully isolated in an in-memory `Map`.

**Key deliverables**: Room creation/joining with code normalization, lobby polling, host identification, player list display, start validation (min 2 players, host-only).

### Feature Group 2 — Game Start & Drawer Assignment (002)
Transitions the room from lobby to active gameplay. The host (or earliest-joined player) becomes the drawer. A secret word is deterministically selected by hashing the room code, ensuring consistency without extra state. The drawer sees the word; guessers do not — enforced server-side in a single snapshot function. Player names are validated (trimmed, non-empty) via Zod schemas.

**Key deliverables**: Deterministic word selection, drawer assignment, role-based secret-word privacy, player name validation, status transition (`lobby` → `inGame`).

### Feature Group 3 — Gameplay Interaction (003)
The core playable loop. The drawer uses an HTML5 Canvas with pointer-event-based stroke drawing (normalized 0-1 coordinates). Guessers submit text guesses that are trimmed, case-insensitively compared, and scored (100 points for first correct guess per player, no double-scoring). Canvas strokes, guess history, and scores propagate through the same polling channel. All gameplay mutations are role-enforced and validated server-side.

**Key deliverables**: Canvas drawing/clearing, guess submission with scoring, guess history, scoreboard, role enforcement (drawer cannot guess, guesser cannot draw), room isolation during gameplay.

### Feature Group 4 — Result & Restart Flow (004)
Closes the game lifecycle. An explicit end-round action freezes the outcome into a `CompletedRound` snapshot — revealing the secret word, final scores, and complete guess history to all players. From this result state, only the host can restart, which returns the room to the lobby with the same code and players while atomically clearing all round-specific state (canvas, guesses, scores, word, drawer). Polling continues seamlessly across `playing` → `result` → `lobby` transitions.

**Key deliverables**: End-round transition, result snapshot with revealed word, host-only restart, atomic state reset, polling continuity, mutation rejection in result state.

---

## Engineering Approach

### Architecture

**Backend** (`backend/src/`):
- Express server with CORS and JSON body parsing
- A single `/rooms` router dispatching to Zod-validated route handlers
- An in-memory `Map<string, Room>` as the sole persistence layer
- A single `toRoomSnapshot()` function that builds role-filtered API responses

**Frontend** (`frontend/src/`):
- React 18 with React Router v6 for SPA navigation
- A custom `RoomStore` class (Context + `useSyncExternalStore`) for state management — no external libraries
- Fetch-based API client with typed methods matching every endpoint
- 2-second polling intervals in `LobbyPage` and `GamePage` for synchronization

**Testing**:
- Vitest throughout (backend and frontend)
- Service tests for all business logic paths (room operations, game rules, validation)
- API tests for schema correctness and response shapes
- Frontend API client tests for request/response handling

### Data Flow

Every player action follows the same path: component calls room store method → fetch to Express route → Zod validation → service function mutates in-memory room → `toRoomSnapshot()` builds response → store updates → `useSyncExternalStore` re-renders subscribed components. Polling repeats `GET /rooms/:code?participantId=` on a 2-second interval, and polling errors are non-destructive (last known snapshot stays visible).

### Incremental Delivery

Each feature group was designed to be independently testable. The lobby works without a game. Gameplay works without result/restart. State transitions follow strict paths: `lobby` → `inGame` → `result` → `lobby`. No feature depends on a future feature's implementation.

---

## Validation and Quality

### Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| Backend service tests | 72 | ✓ Pass |
| Backend API tests | 39 | ✓ Pass |
| Backend schema tests | 38 | ✓ Pass |
| **Backend total** | **149** | **✓ Pass** |
| Frontend API tests | 21 | ✓ Pass |
| **Total** | **170** | **✓ Pass** |

Both TypeScript compilations (`backend/tsc`, `frontend/tsc -b`) and both Vite production builds succeed with zero errors.

### What the Tests Cover

| Area | Coverage |
|------|----------|
| Room creation/joining | Code generation, normalization, host assignment, duplicate prevention, null returns |
| Game start | 2-player minimum, host-only, drawer assignment, round initialization |
| Drawing/clearing | Stroke append, canvas clear, drawer-only enforcement, domain validation |
| Guessing/scoring | Empty rejection, case-insensitive matching, 100-point award, no double-scoring |
| End round | Playing→result transition, secret word, scores, ordered guesses |
| Restart | Host-only, status precondition, code/player preservation, state clearing |
| Mutation rejection | Draw/guess/clear rejected in result and lobby states |
| Secret word privacy | Drawer sees it, guesser/unknown do not; revealed to all in result |
| Room isolation | Operations in one room never affect another |
| Schema validation | All payloads and params validated at API boundary |

### Gaps

The following require manual validation with two browser tabs and a running dev server: multi-tab result display and restart convergence, multi-room isolation verification, and final acceptance against the specification.

---

## Spec Kit and Process Reflection

### What Worked Well

- **Spec → Plan → Data Model → Tasks pipeline**: The phased spec-driven workflow produced a clear dependency graph. Foundational types were always completed before business logic, and business logic before UI wiring.
- **Task granularity**: Tasks mapped to single-file changes or focused test suites. The `[P]` parallel markers enabled efficient batching of independent work (e.g., schema tests alongside type definitions).
- **Polling-only constraint**: The constitution's prohibition on WebSockets forced a simpler architecture. Instead of managing a push channel, synchronization falls out naturally from the existing polling loop — fewer moving parts, easier to reason about.
- **Single source of truth for snapshots**: `toRoomSnapshot()` as the sole response builder eliminated an entire class of bugs where one endpoint might accidentally leak the secret word.

### Friction Points

- **Branch naming in tooling**: The check-prerequisites script required a feature-branch naming convention (`001-feature-name`) but the repo used an `assignment` branch. The `SPECIFY_FEATURE` env var workaround was needed.
- **Empty contracts/ directory**: The plan referenced API contracts but the directory was empty, meaning API specification existed only in prose rather than machine-readable form.
- **Tests spread across files**: Some tests in `rooms.test.ts` duplicate logic from `roomStore.test.ts` (both test the same service operations). A more focused restructuring would reduce overlap.

---

## Tradeoffs and Constraints

### Deliberate Decisions

| Decision | Rationale |
|----------|-----------|
| In-memory state only | Assignment constraint — no database, auth, or persistence |
| HTTP polling at 2s | Synchronization without WebSockets, simple to implement and reason about |
| Custom RoomStore (no Zustand/Redux) | Keeps dependency count minimal — the app has one piece of shared state |
| Normalized canvas coordinates (0-1) | Resolution-independent drawing; strokes render correctly at any canvas size |
| Deterministic word selection via hash | No need to store word-to-room mapping; same code always produces same word |
| Host-only start and restart | Simple ownership model — there is always exactly one authoritative player |
| Frozen CompletedRound snapshot | Prevents accidental mutation of result data during the result display phase |
| Atomic restart (single state update) | Ensures polling clients never observe a partially-cleared room |
| Explicit end-round action | Avoids timers (out of scope) and gives players control over when the round ends |

### What Was Not Built (By Design)

- **Multiple rounds or round progression**: Scope limited to a single round per game cycle. Round counters remain at 1.
- **Timers, countdowns, or automatic transitions**: All explicitly out of scope per the spec and constitution.
- **WebSockets, SSE, long polling**: Polling-only synchronization is an assignment constraint.
- **Databases, authentication, sessions**: The constitution prohibits these to keep the focus on gameplay behavior.
- **Persistent score history**: Scores reset on restart; no carryover or session accumulation.
- **Drawer rotation**: Restart returns to lobby with no automatic drawer reassignment.
- **Canvas color picker or brush size selector**: The canvas uses a single hardcoded black stroke — sufficient for the lab scope.

---

## Improvements

### If I Had More Time

1. **Frontend component tests**: The current frontend tests cover only the API client. I would add rendering tests for `LobbyPage` (player list, start button visibility), `GamePage` (gameplay vs result layout branching), `ResultPanel` (revealed word, host restart button, non-host waiting state), and `CanvasBoard` (stroke rendering, drawer vs viewer mode).

2. **End-to-end flow test**: A Playwright test automating the full lifecycle — create room, join from second tab, start game, draw, guess, end round, verify result in both tabs, restart, verify lobby convergence. This would replace the manual validation steps.

3. **Performance and memory guards**: The in-memory store has no eviction policy. For long-lived deployments, I would add a maximum room count, idle-room TTL, and periodic cleanup of rooms with zero participants.

4. **Canvas UX improvements**: Undo support, color selection, variable brush sizes — straightforward additions that the normalized coordinate model supports.

5. **Better error recovery**: Polling failures currently keep the last snapshot silently. I would add a "connection lost" banner that auto-clears on reconnection.

### Production Considerations

- **Polling at 2s per room**: With N active rooms, the backend handles N/2 requests per second from each player. Not a problem at lab scale, but a production deployment would want configurable intervals and perhaps exponential backoff.
- **In-memory state vs. process restart**: All rooms are lost on server restart. A simple JSON-file persistence (saving/loading the rooms map) would be a minimal safety net without introducing a database.
- **No rate limiting**: A malicious client could flood the API with requests. Adding request rate limiting per IP or per room would be prudent.

---

## Outcome

The finished application delivers a complete, playable game loop:

1. **Create or join** a room with a shareable code
2. **Wait in the lobby** with other players; host starts when ready
3. **Draw or guess** — the drawer illustrates a secret word while guessers submit text guesses
4. **Score** — correct guesses earn 100 points, visible in real time
5. **Review the result** — when the round ends, everyone sees the revealed word, final scores, and full guess history
6. **Restart** — the host returns the room to the lobby with the same players, ready for another round

All 170 tests pass. Both TypeScript compilations and both production builds succeed. The implementation follows the constitution's constraints: polling-only synchronization, no databases, no authentication, no WebSockets, in-memory state, and full-stack input validation.

The 49 implementation tasks across 4 feature groups are complete. The remaining work is manual multi-tab validation against the acceptance criteria in the specification.
