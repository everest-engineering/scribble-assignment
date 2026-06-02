# Reflection Report

## What did the starter app already have?

The starter provided a working but minimal scaffold for a Scribble-style drawing game. It included:

- **App shell with routing** — React Router v6 with Start, Create Room, Join Room, Lobby, and Game screens
- **Create/Join room flow** — `POST /rooms` and `POST /rooms/:code/join` endpoints with unique 4-character room codes
- **Room snapshot** — `GET /rooms/:code` returning participants, available words, and roles
- **In-memory store** — `Map<string, Room>` on the backend with basic CRUD operations
- **Lobby display** — Room code badge, participant list with a manual "Refresh Room" button
- **Seed data** — 5 words (rocket, pizza, castle, guitar, sunflower) and 2 roles (drawer, guesser)
- **Game screen placeholders** — Canvas area, guess input, scoreboard, and result panel were all styled but non-functional
- **Tests** — 2 backend tests, 2 frontend tests for the API service

Everything beyond room creation/join was either placeholder or missing entirely.

## What did you add?

### Spec Kit Artifacts
- `discovery.md` — Documented 4 gaps, 3 assumptions, 1 bug, and 15 relevant files
- `speckit.constitution` — Engineering principles, AI usage rules, review discipline
- `speckit.specify` — 4 iterations of specification with numbered acceptance criteria and edge cases
- `speckit.plan` — State model, data flow, file-level implementation plan
- `speckit.tasks` — 40+ ordered tasks across 4 phases with dependencies

### Phase 1 — Room Setup & Lobby (Scenario 1)
- Fixed the `/bug` URL suffix bug in the API base URL
- Added `hostId` to Room and RoomSnapshot types
- Expanded `RoomStatus` from just `"lobby"` to `"lobby" | "playing" | "finished"`
- Added name validation (trim, reject empty/whitespace-only) via Zod schemas
- Set `hostId` on room creation (creator is host)
- Exposed hostId and status in snapshots
- Added host indicator in lobby participant list
- Gated "Start Game" button (visible only to host, enabled only with ≥2 players)
- Added auto-polling (2s interval) to lobby

### Phase 2 — Game Start & Drawer Flow (Scenario 2)
- Added `Stroke` and `Guess` data types
- Added game state fields to Room (drawerId, secretWord, scores, canvasStrokes, guesses)
- Added viewer-specific role filtering (`myRole`, hidden secretWord for guessers)
- Implemented `startGame()` with validation (host-only, ≥2 players, lobby status)
- Added `POST /rooms/:code/start` endpoint
- Wired frontend Start Game button to call API before navigating

### Phase 3 — Gameplay Interaction (Scenario 3)
- Created `DrawingCanvas.tsx` component with HTML5 Canvas mouse drawing
- Auto-sends strokes to backend on mouseup
- Added `addStroke()`, `clearDrawing()`, and `addGuess()` to backend store
- Added draw, clear-drawing, and guess API endpoints
- Updated `GuessForm` to submit guesses with validation (trim, reject empty)
- Updated `Scoreboard` to display live scores from snapshot
- Updated `ResultPanel` to display guess history
- Wired GamePage with polling, role-based UI, and all components

### Phase 4 — Result, Restart & Final Validation (Scenario 4)
- Correct guess ends the round (status → "finished")
- Secret word revealed to all players when round ends
- Added `restartGame()` to reset round state while preserving participants
- Added restart endpoint and frontend wiring
- "Play Again" button visible only to host when finished
- Auto-navigate from game to lobby on restart (detected via polling)

### Bug Fixes During Development
- Fixed polling infinite loop (room object in useEffect deps caused interval reset on every render)
- Fixed Zod error handler to pass through specific validation messages instead of a generic "Invalid request payload"

## Spec Kit Discipline

The Spec Kit was the backbone of this implementation. Each code change traced back to a spec ID. The ordered task list prevented scope creep and kept work focused on the 4 required scenarios. The constitution's rule to "extend, don't replace" kept changes minimal and aligned with existing patterns.

## AI-Assisted Workflow

Key observations from working with an AI assistant:

- **Spec-first is effective** — Writing the spec, plan, and tasks before coding caught design issues early
- **Bug discovery was serendipitous** — The `/bug` URL and polling loop were found during implementation, not in the spec. The review discipline (build + test) caught the Zod error message issue
- **AI excels at implementation but misses context** — The AI initially proposed a polling loop that would crash; human review caught the infinite re-render
- **Commit discipline matters** — The granular commit plan kept changes organized and easy to review

## Tradeoffs

- **Polling vs WebSockets** — Polling at 2s intervals means ~0.5s average latency for canvas updates. Acceptable for the lab but wouldn't work for a production real-time game
- **Canvas as point arrays** — Storing raw points is simple but inefficient. Could use SVG paths or compressed formats for larger drawings
- **Single round** — No drawer rotation means the host is always the drawer. Simplifies the state model but limits replayability

## What I'd Do Differently

- Add more backend unit tests for the game logic (addGuess, startGame, restartGame edge cases)
- Add frontend component tests for DrawingCanvas and GuessForm
- Handle the canvas resizing more gracefully on different screen sizes
