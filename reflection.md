# Reflection Report — Scribble Lab

**Author**: Pravallika | **Email**: pravallika.p@everest.engineering
**Branch**: `assignment` | **Date**: 2026-05-31

---

## What the Starter App Already Had

The starter was a runnable but intentionally hollow scaffold. Concretely:

**Backend** (`backend/src/`)
- Three working endpoints: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`
- In-memory `Map<string, Room>` store with `createRoom`, `joinRoom`, `getRoom`, `saveRoom`
- `toRoomSnapshot()` existed but ignored `viewerParticipantId` entirely (`void viewerParticipantId` placeholder)
- `STARTER_WORDS` and `STARTER_ROLES` seed data present but never applied to game state
- Zod schemas for create/join existed but with no validation (`z.string().optional()` — whitespace names were accepted)
- Centralised `HttpError` class and error middleware already wired

**Frontend** (`frontend/src/`)
- Full routing: `/`, `/create-room`, `/join-room`, `/lobby`, `/game`
- `RoomStore` (custom Context + `useSyncExternalStore`) already storing `room` and `participantId`
- `LobbyPage` with a manual "Refresh Room" button and participant list
- `GamePage` with layout placeholders: canvas div, `GuessForm` (no-op submit), static `Scoreboard`, static `ResultPanel`
- All API calls correctly routed through `services/api.ts`

**What was not working at all**: host tracking, automatic polling, start game, drawer assignment, word visibility, canvas drawing, guess submission, scoring, results screen, restart.

---

## What I Added

### Spec Kit Artifacts
- `constitution.md` — 8 engineering principles covering TypeScript strictness, polling contract, validation boundaries, API layer discipline, dependency control, and AI usage rules
- `specs/01-room-setup/` — spec, plan, tasks for Scenario 1
- `specs/02-game-start/` — spec, plan, tasks for Scenario 2
- `specs/03-gameplay/` — spec, plan, tasks for Scenario 3
- `specs/04-results-restart/` — spec, plan, tasks for Scenario 4

### Group 1 — Room Setup & Lobby
- `hostId: string` added to `Room` and `RoomSnapshot` interfaces; set to the creator's `participantId` on room creation
- `toRoomSnapshot()` now surfaces `hostId`
- `LobbyPage`: replaced manual refresh button with `setInterval` polling every 2 s with `clearInterval` cleanup on unmount
- Host gate: `participantId === room.hostId` drives who sees "Start Game" vs "Waiting for host to start..."
- Start Game button disabled when `participants.length < 2`
- **Discovery gap caught during implementation**: `frontend/src/services/api.ts` owns its own local copy of `RoomSnapshot` — it does not import from the backend. The spec initially said no frontend changes were needed; corrected and a new task (T005a) was added.

### Group 2 — Game Start & Drawer Flow
- `RoomStatus` widened to `"lobby" | "playing"`
- `Room` and `RoomSnapshot` gained `drawerParticipantId`, `currentWord`, `viewerRole`
- `startGame()` service function with discriminated result object (NOT_FOUND / FORBIDDEN / CONFLICT / BAD_REQUEST / OK)
- `POST /rooms/:code/start` endpoint
- `toRoomSnapshot()` now gates `currentWord` by viewer identity and derives `viewerRole`
- `LobbyPage`: Start Game button calls `api.startGame()` instead of navigating directly; status watcher navigates non-host participants to `/game` when `room.status === "playing"` (bug found during verification — spec was missing this AC)
- `GamePage`: role banners, drawer name, `GuessForm` disabled for drawer, 2 s polling

### Group 3 — Gameplay Interaction
- `Guess` interface; `guesses[]` and `scores` added to `Room` and `RoomSnapshot`
- `submitGuess()` service: trims input, case-insensitive compare, 100/0 scoring, one-correct-guess-per-participant guard, drawer-cannot-guess guard
- `POST /rooms/:code/guess` endpoint
- `GuessForm`: wired to `api.submitGuess`; clears input on success; shows error on failure
- `ResultPanel`: renders live guess history with ✓/✗ and score
- `Scoreboard`: renders participant scores sorted descending
- `GamePage`: `<canvas>` with `mousedown/mousemove/mouseup/mouseleave` handlers and event listener cleanup; Clear button; all component props wired

### Group 4 — Results & Restart
- `RoomStatus` widened to `"lobby" | "playing" | "results"`
- `endGame()` and `restartGame()` service functions
- `POST /rooms/:code/end` and `POST /rooms/:code/restart` endpoints
- `toRoomSnapshot()` reveals `currentWord` unconditionally when `status === "results"`
- `GamePage`: End Game button (host only); status watcher for `"results"`
- `ResultsPage` (new file): word reveal, `Scoreboard`, `ResultPanel`, Play Again / "Waiting for host to restart..." gate, 2 s polling, status watcher for `"lobby"` (restart propagation)
- `/results` route registered

---

## Discovery: Gaps and Assumptions

### Gaps Found (≥3)

1. **`hostId` did not exist**: `Room` had no concept of creator identity. The `participants[0]` was implicitly the creator but nothing enforced or exposed this. Every feature that needed host-gating (start, end, restart) depended on this field not yet existing.

2. **`toRoomSnapshot()` was a stub**: `viewerParticipantId` was `void`-ed. The function always returned static seed data for `availableWords` and `roles` regardless of game state. Word visibility, role derivation, and results reveal all required this function to be substantively rewritten.

3. **`frontend/src/services/api.ts` owns its own type definitions**: It does not import from the backend. Every time the backend model gained a new field (`hostId`, `drawerParticipantId`, `currentWord`, `viewerRole`, `guesses`, `scores`, `status: "results"`), the frontend's local `RoomSnapshot` interface also had to be updated manually. The spec for Group 1 initially missed this — caught and corrected before implementation.

4. **`GuessForm.handleSubmit` was a no-op**: The component existed with a controlled input and submit button, but the handler only called `event.preventDefault()`. No API call, no prop interface for submission.

5. **The "Start Game" button navigated directly to `/game` with no API call**: There was no backend state change on game start. Every Group 2 feature (drawer assignment, word selection, role-aware snapshots) depended on a real `POST /rooms/:code/start` that did not exist.

### Assumptions Made (≥2)

1. **Drawer is always `participants[0]`** (the room creator / host) — no rotation. The spec notes this explicitly. A future multi-round game would need an index or rotation mechanism; this implementation intentionally omits it.

2. **Word selection is always `STARTER_WORDS[0]` ("rocket")** — deterministic, no randomness. This simplifies testing (the correct answer is always known) and avoids `Math.random()` which would complicate verification.

3. **Canvas drawing is local-only** — strokes are not synced to other participants. The constitution forbids WebSockets and binary polling is not practical over HTTP at 2 s intervals without a canvas diff protocol. Guessers see a placeholder; only the drawer sees their own strokes.

4. **`currentWord` is revealed unconditionally on the results screen** — no viewer-identity gating once status is `"results"`. The round is over; hiding the word from non-drawers serves no purpose.

### Relevant Files
- `backend/src/models/game.ts` — all type definitions
- `backend/src/services/roomStore.ts` — all business logic and state mutations
- `backend/src/api/rooms.ts` — all HTTP route handlers
- `backend/src/api/schemas.ts` — all Zod validation schemas
- `frontend/src/services/api.ts` — all HTTP calls and frontend type definitions
- `frontend/src/state/roomStore.ts` — client-side state store
- `frontend/src/pages/LobbyPage.tsx`, `GamePage.tsx`, `ResultsPage.tsx` — page components
- `frontend/src/components/GuessForm.tsx`, `Scoreboard.tsx`, `ResultPanel.tsx` — game UI components

---

## Decisions Made and Why

### 1. Discriminated result objects in service functions instead of throwing

`startGame()`, `submitGuess()`, `endGame()`, and `restartGame()` all return `{ code: "OK" | "NOT_FOUND" | "FORBIDDEN" | ... }` rather than throwing `HttpError` directly.

**Why**: The service layer should not know about HTTP. HTTP status code decisions belong in the route handler. This makes the service functions unit-testable without an HTTP context and keeps the mapping (`NOT_FOUND → 404`) explicit and reviewable in one place.

### 2. Status-driven navigation via `useEffect` watching `room?.status`

Non-host participants navigate to `/game` (when status becomes `"playing"`), to `/results` (when `"results"`), and back to `/lobby` (when `"lobby"` after restart) via `useEffect` watchers on `room?.status`, not via any explicit message or redirect from the server.

**Why**: The existing 2 s polling loop already delivers the updated snapshot to all clients. Watching the status field costs nothing and eliminates the need for any push mechanism. The pattern is consistent across `LobbyPage`, `GamePage`, and `ResultsPage`.

### 3. `guessSchema.guess` accepts empty strings; rejection happens in the service

The Zod schema for guess submission uses `z.string()` (no `.min(1)`). The service trims and rejects post-trim empty strings with a meaningful message ("Guess cannot be empty").

**Why**: If the schema rejects before the service sees the value, the error message is a generic Zod validation message. Trimming in the service allows the rejection message to explain what happened ("your whitespace-only input trimmed to empty") rather than just "string too short".

### 4. `ResultsPage` is the only new file created

The constitution requires justification for new files. `ResultsPage` could not reuse `GamePage` or `LobbyPage` because the navigation guards, polling behaviour, and UI controls are all materially different (word reveal, Play Again / waiting gate, status watching for `"lobby"`).

### 5. `scores` seeded to zero for all participants in `startGame()`

When a game starts, `room.scores` is set to `Object.fromEntries(room.participants.map(p => [p.id, 0]))`. This means every participant appears in the scoreboard immediately, even before any guesses are submitted.

**Why**: A scoreboard that only shows participants who have guessed is confusing. Pre-seeding guarantees all players are always visible and sorted.

---

## How I Used AI Assistance

AI (Claude) was used throughout this lab as a structured collaborator, not as an autonomous implementer.

**Codebase audit**: Before writing any spec, I asked AI to explore the full codebase — models, services, routes, frontend state, components — and produce a structured overview. This surfaced the `void viewerParticipantId` placeholder and the `GuessForm` no-op before a single line of spec was written.

**Spec drafting**: I provided the business scenario text, the exact current model state (confirmed by reading the files), and the acceptance criteria. AI drafted the spec in the project's template format. I reviewed every AC against the actual codebase state before accepting.

**Implementation**: AI proposed and executed file edits task-by-task following the tasks.md ordering. I reviewed each change before it was committed. Several AI suggestions required correction:
- The Group 1 spec stated `api.ts` needed no changes — caught during implementation because `room.hostId` was `undefined` at runtime. The spec was corrected and a new task added.
- The Group 2 spec initially only described the host navigating to `/game` after clicking Start Game. After verification with two browser tabs, the bug was identified (guesser stays in lobby forever), the root cause diagnosed (`room.status` change was not being watched), and the fix was implemented and the spec updated.

**Review discipline**: No AI-generated code was committed that used `any`, added an unlisted dependency, introduced WebSockets, or implemented behaviour with no corresponding task in tasks.md. When AI output deviated from the plan (e.g., suggesting `Math.random()` for word selection), I overrode it with the deterministic approach specified.

---

## Tradeoffs Encountered

### Polling latency vs. resource use

All sync happens via 2 s `setInterval` polling. This means a state change (join, start, guess, end, restart) is visible to other participants within up to 4 seconds (worst case: the poll fires 1 ms after the change, then the next poll is 2 s later). A WebSocket connection would be instantaneous, but is forbidden by the constitution. The 2 s interval was chosen as a reasonable UX tradeoff — fast enough to feel live, slow enough not to hammer the backend.

### Canvas drawing is not synced

Drawer strokes are local-only. Guessers see a static placeholder while the drawer draws. Syncing canvas state over HTTP polling at 2 s intervals would require either full canvas image data (large, lossy) or a stroke delta protocol (complex). Neither is feasible within the constraints. The tradeoff is that guessers are essentially guessing blind — they see the word in the guess input placeholder but not on a canvas. This is a known gap accepted by the spec.

### `playerName` validation tightening is a breaking change

Group 1 tightened `createRoomSchema.playerName` from `z.string().optional()` to required + trim + min(1). This means the starter's behaviour (anonymous "Player" names) is no longer supported. The spec notes this assumption explicitly. The frontend forms already collected names, so the practical impact was zero, but it was a deliberate decision to document.

### One-correct-guess-per-participant

After a participant guesses correctly, further guesses are rejected with `400`. This prevents score accumulation from repeated correct submissions. The tradeoff is that a participant who guesses correctly cannot continue participating in the guess flow — but since the round ends (Group 4 implements manual end), this window is short in practice.

### `ResultsPage` as a new file vs. conditional rendering on `GamePage`

An alternative design was to render the results UI conditionally within `GamePage` when `room.status === "results"`. This was rejected because it would have muddled the navigation guards (GamePage redirects to `/` when room is null — ResultsPage needs the same guard), the polling cleanup behaviour, and the host/non-host button logic. A clean `/results` route with its own component made each page's responsibilities explicit and independently testable.

---

## Verification Against Rubric

| Area | Status | Evidence |
|---|---|---|
| Discovery ≥3 gaps, ≥2 assumptions, relevant files | ✅ | 5 gaps, 4 assumptions, 9 files listed above |
| Spec Kit artifacts committed | ✅ | `constitution.md`, `specs/01–04/spec.md`, `plan.md`, `tasks.md` all committed |
| Working game flow (two browsers, one round, results, restart) | ✅ | All four acceptance test sequences verified during implementation |
| Edge cases: empty inputs, case-insensitive guess, multi-room isolation | ✅ | Whitespace → 400; "ROCKET"/"rocket"/"  rocket  " all score 100; each room is an isolated `Map` entry |
| Implementation alignment — code matches spec, deviations documented | ✅ | Two deviations documented (api.ts type gap in Group 1; guesser navigation in Group 2), both corrected in spec before commit |
| Reflection: decisions, AI usage, tradeoffs | ✅ | This document |
