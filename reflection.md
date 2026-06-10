# Reflection: Scribble Assignment

## What the Starter App Already Had

### Backend
- Express server with TypeScript in strict mode
- In-memory `Map<string, Room>` store with a `saveRoom()` helper
- Basic room model (`Room`, `RoomSnapshot`, `RoomStatus: "lobby" | "playing"`) in `game.ts`
- Zod validation plumbing in `schemas.ts`
- Route skeleton in `rooms.ts` (stubs for create/join; no game or result endpoints)
- `roomStore.ts` service with `createRoom()`, `joinRoom()`, and `toRoomSnapshot()` (minimal fields)

### Frontend
- Vite + React 18 + React Router setup
- Page stubs: `StartPage`, `CreateRoomPage`, `JoinRoomPage`, `LobbyPage`, `GamePage`
- `ResultPanel` as a sidebar placeholder inside `GamePage` (not a real page)
- `api.ts` service with HTTP helpers; `state/roomStore.ts` Zustand store (minimal state)
- `DrawingCanvas` component as a static `<div>` placeholder
- `AppShell`, `Card`, `PageHeader`, `RoomCodeBadge` UI components
- No polling, no canvas drawing, no guess logic, no result screen

---

## What Was Added — Breakdown by Scenario

### Spec 001 — Room Setup & Lobby
- Host flag (`isHost`) on participant records; server marks the creator `isHost: true`
- Name trimming and blank-name rejection (Zod, backend + inline errors on frontend)
- 404 on unknown room code for `JOIN`
- Automatic 2-second polling in `LobbyPage` via `setInterval` with cleanup on unmount
- "Start Game" button visible only to the host, disabled until ≥ 2 players are present
- Room isolation verified (separate `Map` entries, no shared state)

### Spec 002 — Game Start & Drawer
- `POST /rooms/:code/start` endpoint: host-only, transitions room to `"playing"`, assigns `secretWord` and `drawerName`
- Seed word list (`seed/words.ts`) for random word selection
- `LobbyPage` polling detects `"playing"` state and navigates all clients to `/game`
- `GamePage` shows the secret word only to the drawer; guessers see a masked view
- Drawer/guesser role split on the frontend using `viewerName === room.drawerName`

### Spec 003 — Gameplay Interaction
- `DrawingCanvas` upgraded from a placeholder `<div>` to a real `<canvas>` with freehand mouse-event drawing and a "Clear" button
- Stroke sync: drawer's strokes stored in `room.strokes`; all clients replay strokes from the poll snapshot every 2 seconds
- `POST /rooms/:code/guess` endpoint: trims guess, rejects empty with 400, case-insensitive comparison to `secretWord`, awards 100 points for correct / 0 for incorrect, appends to `room.guesses`
- Scoreboard and guess history synced to all clients via the existing 2-second poll

### Spec 004 — Result, Restart & Final Validation
- Extended `RoomStatus` union to `"lobby" | "playing" | "result"` (backend model + frontend type)
- `POST /rooms/:code/end`: host-only (validated via `playerName` body field), transitions to `"result"`; `toRoomSnapshot` exposes `secretWord`, `drawerName`, `guesses`, and `scores` unconditionally in result state
- `POST /rooms/:code/restart`: host-only, clears `secretWord`, `drawerName`, `guesses`, `scores`, and `strokes`; preserves participants; transitions to `"lobby"`
- "End Game" button in `GamePage` (host-only)
- New `ResultPage`: displays secret word prominently, per-player scores (0 for players with no guesses), full ordered guess history with guesser name / text / points, empty-state message when no guesses exist
- "Play Again" button in `ResultPage` (host-only)
- Polling updated in `GamePage`, `LobbyPage`, and `ResultPage` to handle all three states and navigate accordingly
- `ResultPanel` placeholder removed from `GamePage` sidebar

---

## AI Usage

Claude Code (this session) was used throughout via the Spec Kit workflow:

- **`/speckit-specify`** — converted natural-language feature descriptions into structured specs with user stories, acceptance criteria, functional requirements, and edge cases for all four specs
- **`/speckit-clarify`** — surfaced ambiguous decisions (e.g., who validates host identity, what gets cleared on restart) and encoded answers back into the spec before any code was written
- **`/speckit-plan`** — produced `plan.md`, `research.md`, `data-model.md`, `contracts/api.md`, and `quickstart.md` for each feature; each plan includes a constitution check gate before implementation
- **`/speckit-tasks`** — generated dependency-ordered `tasks.md` with parallel opportunities flagged (`[P]`), user story grouping, and explicit checkpoints
- **`/speckit-implement`** — executed tasks in order, reading existing files before editing, running `npm run build` to gate each phase

AI was not used to write or run tests beyond TypeScript build verification; manual browser testing via `quickstart.md` scenarios covered end-to-end validation.

---

## Tradeoffs

| Decision | Choice Made | Alternatives | Reason |
|---|---|---|---|
| Host identity | `playerName` in request body matched against `room.participants[0].name` | Session tokens / cookies; a dedicated `hostToken` issued on room creation | Consistent with the existing guess and stroke identity pattern already in the codebase; no new auth infrastructure needed for a local-only in-memory app |
| State machine | Additive `"result"` state value in the existing `RoomStatus` union | Separate `phase` field; a dedicated result document | Minimal change to existing snapshot contract; all consumers already switch on `status` |
| Result data visibility | `toRoomSnapshot` always includes full result data when `status === "result"` | Viewer-filtered snapshot (hide word from guessers until result) | Round is over when state is `"result"` — no information is hidden post-game; simpler snapshot logic |
| Score persistence across rounds | Scores reset to zero on restart | Cumulative scores across rounds | Keeps the data model simple; spec explicitly listed cross-round scoring as out of scope |
| Polling vs WebSockets | 2-second `setInterval` polling (unchanged) | WebSockets for push-based updates | No new dependencies; acceptable latency for a local dev game; consistent with prior features |
| Canvas sync strategy | Full stroke replay from snapshot on each poll | Incremental delta sync; server-side canvas rasterisation | Simplest approach that works for small player counts; no persistence layer needed |
| Navigation after restart | Polling detects `"lobby"` state in `ResultPage` and navigates to `/lobby` | Server-sent event or redirect header | Mirrors the established polling-navigation pattern used in `LobbyPage` and `GamePage`; no special-casing |

---

## Spec-Driven Development: What Went Well and What Was Hard

### What Went Well

**Clarity before code.** Writing acceptance criteria and edge cases in the spec before touching any file surfaced decisions that would otherwise have become mid-implementation surprises — e.g., what exactly gets cleared on restart, and whether scores accumulate across rounds. Answering those questions in `/speckit-clarify` took minutes; discovering them during coding would have taken much longer.

**Dependency ordering.** The `tasks.md` phase structure (Setup → Foundational type extensions → US1 → US2 → US3 → US4 → Polish) made it obvious that extending `RoomStatus` had to come first. Without an explicit task graph, it would be easy to start wiring the `ResultPage` before the type was ready and hit cryptic TypeScript errors.

**Constitution checks as a checklist.** The brownfield discipline gate ("read existing code before extending") forced reading `game.ts`, `roomStore.ts`, `GamePage.tsx`, etc. upfront. That reading revealed the `ResultPanel` placeholder and the existing identity pattern (`playerName` in body), both of which directly shaped the implementation.

**Independent testability per story.** Each spec user story had an independent test described alongside it. This made it easy to validate US1 (end-game + stub result route) completely before building US2 (full result screen), avoiding the temptation to wire everything at once and debug a tangle.

### What Was Hard

**Keeping the spec lean.** The spec template encourages thoroughness, but for a small brownfield app many sections (performance goals, scale considerations) added ceremony without adding insight. Trimming them without discarding genuinely useful constraints required judgment each time.

**The gap between spec and code.** The spec described what to build; the tasks described how. But the gap between a task like "add polling to `ResultPage`" and the actual correct React pattern (`useEffect` with `setInterval`, ref cleanup, navigate hook) still required knowing the codebase. The spec process doesn't replace reading the code — it just ensures you read it at the right time.

**Parallel task coordination.** Several tasks were marked `[P]` (parallel, different files), but in practice implementing them sequentially in a single context is fine. The parallel markers are most useful when multiple engineers are working together; for a solo session they mostly signal "these can be done in any order" rather than "do these simultaneously."
