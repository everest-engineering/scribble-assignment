# Reflection Report

**Project**: Scribble Lab — AI-Assisted Brownfield Enhancement
**Branch**: `assignment`
**Date**: 2026-05-31

---

## What did the starter app already have?

The starter provided a runnable but intentionally hollow scaffold:

**Working infrastructure:**
- Vite + React + TypeScript frontend with page routing (`react-router-dom`)
- Node.js + Express + TypeScript backend with Zod validation
- In-memory `Map<string, Room>` store with `createRoom()`, `joinRoom()`, `getRoom()`
- Three live API endpoints: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`
- Page shells for Start, Create Room, Join Room, Lobby, and Game
- UI components: `AppShell`, `Card`, `PageHeader`, `RoomCodeBadge`, basic styling
- Stub components: `GuessForm`, `Scoreboard`, `ResultPanel` (non-functional)
- Seed data: 5 words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and roles

**Intentionally broken or incomplete (documented in `discovery.md`):**
- A `/bug` typo in `frontend/src/services/api.ts` line 22 — the default base URL was `http://localhost:3001/bug`, making every API call silently fail
- No `hostId` on the `Room` model — host identity was untracked
- Lobby refresh was manual button-click only — no polling
- Start Game button had no host gate and no 2-player minimum
- `GamePage.tsx` had a `<div>` placeholder where a canvas should be
- `GuessForm.tsx` called `event.preventDefault()` and returned — no API call made
- `Scoreboard` and `ResultPanel` were hardcoded stubs with no live state
- No drawer assignment, secret word visibility, scoring, result state, or restart flow

---

## What did I add?

All four scenarios were implemented incrementally, each following the full Spec Kit loop: specify → clarify → plan → tasks → implement → validate.

### Scenario 1 — Room Setup & Lobby
- Fixed the `/bug` typo in `api.ts`
- Added `hostId` to `Room` and `RoomSnapshot`, set to the first participant's ID on creation
- Player name validation on both client and backend: trim, reject empty/whitespace-only
- Room code validation: trim, uppercase, reject empty and unknown codes
- 2-second `setInterval` polling in `LobbyPage` with `clearInterval` cleanup
- Start Game gated to host-only with minimum 2 players

### Scenario 2 — Game Start & Drawer Flow
- Added `drawerId: string | null` and `secretWord: string | null` to `Room` and `RoomSnapshot`
- New `POST /rooms/:code/start` endpoint — host-only, 2-player minimum guards
- `startRoom()`: sets `drawerId = hostId`, picks `STARTER_WORDS[0]` deterministically, initialises empty guesses and zero scores
- `toRoomSnapshot()`: conditionally includes `secretWord` for the drawer only
- `GamePage`: 2s polling, drawer banner, role badge ("You are drawing / You are guessing"), secret word display for the drawer

### Scenario 3 — Gameplay Interaction
- Added `Guess` interface; extended `Room` and `RoomSnapshot` with `guesses[]` and `scores{}`
- New `POST /rooms/:code/guesses` endpoint with `submitGuessSchema`
- `submitGuess()`: trims input, case-insensitive compare to secret word, 100 pts correct / 0 incorrect, appends to guess history
- `GuessForm`: wired submit with client-side empty validation, inline error display, clears input on success, disabled for the drawer
- `Scoreboard`: activated to read live scores from `useRoomState()`
- `ResultPanel`: activated to render guess history in reverse order from `useRoomState()`
- `GamePage`: replaced canvas placeholder with a real `<canvas>` using `useRef`, mouse handlers (`mousedown`, `mousemove`, `mouseup`, `mouseleave`), and a Clear Canvas button — drawer only; guessers see a "Waiting for drawer…" placeholder (canvas sync was explicitly descoped in the spec clarification)

### Scenario 4 — Result, Restart & Final Validation
- Extended `RoomStatus` from `"lobby" | "game"` to `"lobby" | "game" | "result"`
- `submitGuess()` atomically transitions `status → "result"` on the first correct guess
- `toRoomSnapshot()` reveals `secretWord` to all viewers when `status === "result"`
- New `restartRoom()`: resets to lobby state, clears all round data, preserves participants and host
- New `POST /rooms/:code/restart` endpoint: 403 for non-host, 404 for missing room
- New `ResultPage.tsx`: shows secret word, final scoreboard, full guess history, host-only Play Again button, 2s polling, auto-navigates to `/lobby` when status changes back
- `GamePage`: added `useEffect` to navigate to `/result` when `status === "result"`
- Registered `/result` route in `routes/index.tsx`

---

## How did I use AI assistance?

I used **Claude Code with Spec Kit** throughout the lab. The workflow for every scenario was:

1. **`/speckit-specify`** — describe the scenario in natural language; Claude generates a structured spec with user stories, acceptance criteria, edge cases, and measurable success criteria
2. **`/speckit-clarify`** — Claude asks targeted questions about ambiguities and records the answers directly in the spec (e.g., "does the canvas sync to guessers?" — answered "no, deferred" during Scenario 3 clarification)
3. **`/speckit-plan`** — Claude reads the spec and existing codebase, produces `research.md` (decisions + rationale), `data-model.md` (model changes), `contracts/rooms.md` (exact API request/response shapes), and `plan.md` (file-level implementation plan)
4. **`/speckit-tasks`** — Claude decomposes the plan into an ordered, numbered checklist with parallel markers and user story labels
5. **Analyze** — before implementing, Claude reads the existing codebase files identified in `plan.md` to understand the current state of each file: what is already there, what needs to change, and where the extension points are. This step prevented blind edits — Claude knew the exact shape of `roomStore.ts` or `GamePage.tsx` before touching them, so changes were minimal and targeted rather than rewrites
6. **`/speckit-implement`** — Claude executes tasks in order, stopping after each user story for manual verification in two browser tabs

**What worked well:**

- **Persistent context across compaction.** In typical AI-assisted coding, a full context window means re-explaining the entire codebase from scratch. With Spec Kit, after the conversation compacted, Claude could read `spec.md`, `plan.md`, and `tasks.md` and continue correctly — the artifacts acted as durable external memory.

- **The constitution prevented scope creep.** The constitution file (`specs/.specify/memory/constitution.md`) explicitly banned WebSockets, databases, new npm dependencies, and rewrites. Claude never proposed any of those. Without the constitution, an AI assistant will often suggest "improvements" that add dependencies or complexity beyond the brief.

- **Contract files made implementation mechanical.** The `contracts/rooms.md` files specified exact request and response shapes before a line of code was written. This meant Claude was filling in a known template rather than inventing API shapes, which reduced inconsistency between what the spec said and what the code did.

- **Task IDs created traceability.** Every task had an ID (T001, T002, …) and a file path. This made it easy to see exactly which code change corresponded to which spec requirement, and to mark tasks complete incrementally in `tasks.md`.

**Where I had to correct Claude or make judgment calls:**

- **Assumed working behavior during discovery.** When creating `discovery.md`, Claude read the code and initially described some stub components as if they were functional. I had to redirect it: it could read code but could not run the app. The lesson was to run the starter yourself first, then bring AI in with a ground-truth baseline rather than asking AI to discover the gaps cold.

- **Canvas sync confusion at review.** Because the spec clarification explicitly descoped canvas sync ("guessers see a placeholder"), the implementation is correct. However, at review time this looked like a missing feature. The spec should have more prominently stated what is *not* built, not just what is. Explicit out-of-scope notes inside User Story 3 would have avoided the ambiguity.

- **Occasional over-helpful additions.** Claude occasionally added console logging, extra validation layers, or inline comments that weren't in the spec. The constitution's "extend not rewrite" and "no gold-plating" rules were the right tool to push back — when the constitution was explicit, Claude's output matched the spec tightly. Early scenarios (before the constitution was fully written) had slightly more drift than later ones.

---

## Observations

### Claude Code assumed working behavior without verifying

During discovery, when I asked Claude Code to create `discovery.md`, it assumed the lobby and join flows were working as documented in the README. It described stub components as if they were functional because it read the code, not ran it. I had to explicitly correct it with the actual observed behavior from running the app manually. This highlighted the importance of running the starter yourself before involving the AI — it cannot verify runtime behavior, only read source code.

### Spec Kit eliminated the context problem

In typical AI-assisted coding, when the context window fills up you have to re-explain everything to the AI from scratch. With Spec Kit, even after the conversation compacted (`/compact`), Claude Code could continue working correctly because it read the `spec.md`, `plan.md`, and `tasks.md` files directly. The artifacts acted as persistent memory across context resets — the AI picked up exactly where it left off without any re-briefing.

### The clarification step prevented implementation arguments

During Scenario 3, the question of whether canvas drawing syncs to guessers could have caused a significant detour mid-implementation. Because `/speckit-clarify` ran before planning, the answer ("no, guessers see a placeholder") was recorded in the spec and became a constraint the AI worked within. Without that step, the same question would have surfaced during implementation — at a point where changing direction is far more expensive.

### Word selection needed a reality check against the README

The initial assumption in `discovery.md` was "index 0 for the first round" — which was implemented as always using `STARTER_WORDS[0]`, meaning every game used the word "rocket." Testing revealed this immediately, and re-reading the README confirmed "deterministically selected from the starter list" means cycling through the list, not locking to one word. This was a case where a reasonable assumption in the spec turned into a gameplay bug. Manual testing caught it; a more careful read of the README during the planning phase would have prevented it.

### Stopping after each user story enforced real validation

The instruction to stop after every user story and wait for confirmation forced a two-tab verification check at each increment rather than deferring all testing to the end. This caught the `toRoomSnapshot()` bug in Scenario 2 (the secret word not appearing for the drawer) mid-session, before it could be buried under three more scenarios of changes. The stopping pattern made the AI's output accountable at each slice, not just at the final handoff.

---

## What tradeoffs did I make?

**Polling over real-time sync**
All state sync uses 2-second `setInterval` polling. Real-time WebSocket sync would give instant updates but requires a persistent connection model the starter was not built for, and the constitution explicitly banned it. The tradeoff is a ≤2 second lag on state changes. For a turn-based guessing game this is acceptable.

**Canvas is local, not synced**
The drawer's canvas is purely client-side. Syncing strokes via polling would require periodically serialising canvas state to the backend and fetching it on guessers' screens. This was explicitly descoped during the Scenario 3 clarification — the spec records the answer: "canvas sync is out of scope; guessers see a placeholder." Adding it would require a new `canvasData` field on `Room`, a new `POST /rooms/:code/canvas` endpoint, and rendering logic on the guesser side. That is a valid Scenario 5.

**Deterministic word selection (always index 0)**
The spec required deterministic word selection. Using `STARTER_WORDS[0]` every round means every game uses the word "rocket." A seed-based or round-counter approach would give variety, but neither was in scope. The tradeoff is repetitive gameplay in exchange for predictable, testable behaviour.

**In-memory store, no persistence**
All room state lives in a `Map<string, Room>`. Restarting the backend wipes everything. A database would give persistence across restarts and support horizontal scaling, but the lab explicitly excluded it. For a local demo game this is fine.

**Host is always the drawer**
The host becomes the drawer on every `startRoom()` call. Rotating the drawer role between rounds would require a round counter and a rotation index, both out of scope. The same person draws every round, which limits the social dynamic but keeps the state model minimal.

---

## What would I do differently?

**Run the starter before involving AI.** My first instinct was to ask Claude to discover the gaps. It was overconfident — it described stub components as if they were functional because it could only read code, not run it. Starting with a manual smoke test (the README's Quick Verification steps) gives a ground-truth baseline. AI can then be directed at confirmed gaps rather than asked to find them.

**Write the constitution before the first spec.** The constitution was written partway through Scenario 1. By Scenario 2 it was actively constraining Claude's output well. But early in Scenario 1 there were a few moments where Claude added things that were outside scope — extras that the constitution would have automatically filtered out. Writing the constitution first, before any spec work, would make even the first scenario output tighter.

**Make out-of-scope decisions explicit in the spec.** Every time a clarification resulted in "no, that's out of scope," I should have added a sentence to the relevant user story: "Note: X is intentionally not implemented in this scenario." The canvas sync decision was recorded in the clarifications section but not in the user story body where a reviewer would see it first. Explicit "not in scope" notes at the story level prevent implementation gaps from looking like bugs at review time.

**Commit after each task, not each scenario.** I committed in larger batches. Smaller commits — one per task ID — would make the PR diff easier to review and would create a clean record mapping each code change to a spec requirement. The task IDs (T001, T002, …) were designed for exactly this traceability, but the value is only realised if each commit references a task.

**Validate TypeScript builds after every task, not just at the end.** A few times I made a change that caused a downstream type error that only surfaced when I ran the full build later. Running `tsc --noEmit` after each file change catches those immediately, when the context is fresh, rather than at a checkpoint when multiple changes are in flight.
