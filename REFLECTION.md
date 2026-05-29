# Reflection Report

## What the Starter App Already Had

- App shell with routing between Start, Create Room, Join Room, Lobby, and Game screens
- Branded Scribble landing page and basic UI styling
- Create Room flow: generates a unique 4-char room code, adds creator as participant, navigates to lobby
- Join Room flow: accepts a room code, adds the player, navigates to lobby
- Lobby: displays room code and participant list with a manual Refresh button
- In-memory room store on the backend (`Map<string, Room>`)
- `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` endpoints
- Seed data: words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and roles (`drawer`, `guesser`)
- Placeholder Game screen with non-functional canvas, guess form, scoreboard, and result panel
- A deliberate bug: API base URL pointed to `http://localhost:3001/bug` instead of `http://localhost:3001`

## What Was Added

### Spec Kit Artifacts

Produced and committed four sets of Spec Kit artifacts — one per feature group — each following the full loop: specify → clarify → plan → tasks → implement → commit.

- **Constitution** (`/.specify/memory/constitution.md`): six principles covering brownfield-first development, spec-driven workflow, deterministic game rules, strict scope discipline, incremental validation, and AI-assisted human-reviewed development
- **4 spec files** with user stories, acceptance criteria, edge cases, functional requirements, success criteria, and assumptions
- **4 plan files** with constitution checks, data model changes, API contracts, data flow, and implementation sequences
- **4 task files** with phase-ordered, dependency-aware task lists mapped to user stories
- **Clarification session** on Group 1 resolving two ambiguities: host-navigates-immediately vs. non-hosts-via-polling, and auto-navigate vs. manual action on status change

### Feature Group 1 — Room Setup & Lobby

- `hostId` added to `Room` and `RoomSnapshot` (first participant = host)
- Name validation: trim + `min(1)` via Zod on backend; client-side trim + empty-check on frontend
- Room code normalised to uppercase on join
- `POST /rooms/:code/start`: host-only, requires ≥2 players, transitions to `"playing"`
- Lobby auto-polling every 2s via `setInterval` / `clearInterval` in `useEffect`
- Non-hosts auto-navigate to `/game` when poll detects `status === "playing"`
- Host-only Start Game button (enabled only when `isHost && participants.length >= 2`)
- Fixed starter bug: `/bug` suffix in API base URL removed

### Feature Group 2 — Game Start & Drawer Flow

- `drawerId` and `secretWord` set on `startGame()`: drawer = host, word = `STARTER_WORDS[0]` ("rocket")
- `toRoomSnapshot()` made viewer-aware: `secretWord` included only when viewer === drawer
- Game screen shows role label (Drawer / Guesser) and secret word card for drawer only

### Feature Group 3 — Gameplay Interaction

- `guesses[]` and `scores` map added to `Room`; initialised on `startGame()`
- `POST /rooms/:code/guess`: trim, empty-check (400), case-insensitive comparison, correct = 100 / incorrect = 0
- `GET /rooms/:code` returns guesses and scores in snapshot for all viewers
- `DrawingCanvas` component: freehand HTML5 canvas with Clear button (drawer only)
- `GuessForm` wired with validation and `onSubmit` prop
- `Scoreboard` and `ResultPanel` (guess history) rendered from live snapshot
- Game screen polls every 2s to sync history and scores

### Feature Group 4 — Result, Restart & Final Validation

- `POST /rooms/:code/end`: host-only, `playing → result`
- `POST /rooms/:code/restart`: host-only, `result → lobby`; clears guesses, scores, drawerId, secretWord; preserves participants
- `secretWord` revealed to all viewers when `status === "result"` (round over)
- `ResultPage`: shows correct word, final scores, full guess history; host-only Restart button; polls every 2s; auto-navigates to `/lobby` on restart
- Game screen poll auto-navigates to `/result` on status change
- Host-only End Round button on game screen
- `/result` route added

## Tradeoffs and Decisions

**Polling over WebSockets**: The lab mandated polling (~2s). The approach is simple and sufficient — a fixed `setInterval` with `clearInterval` cleanup on unmount prevents stale background requests.

**Deterministic word selection**: `STARTER_WORDS[0]` ("rocket") is used for the single round rather than any index formula, keeping the implementation as minimal as the spec requires.

**Server-side `secretWord` visibility**: Enforced in `toRoomSnapshot()` rather than on the client, so a guesser cannot see the word by inspecting the API response. This is the correct defence layer.

**Restart preserves participants**: A deliberate design choice per spec — participants are not cleared on restart, only round state (guesses, scores, drawer, word). This allows the same group to play again without rejoining.

**Canvas is local-only**: Drawing is not synced to guessers (WebSockets are out of scope). The guesser sees a static placeholder. This is explicitly documented in the spec assumptions.

## AI Usage Notes

Claude Code generated all spec, plan, task, and implementation artifacts. Each artifact was reviewed for spec alignment and scope before committing. The key human decisions were:

- Confirming the recommended clarification answers (host navigates immediately; non-hosts via polling; auto-navigate on status change)
- Approving each phase of implementation after visual testing in the browser before committing
- Catching that the Zod error handler needed to surface the field-level message rather than a generic string
- Deciding to reveal `secretWord` to all viewers in `result` status (not just the drawer) — a natural extension of the spec's requirement that "all players see the correct word"

Every commit is traceable to a specific set of functional requirements in the corresponding spec file.
