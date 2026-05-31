# Reflection Report — Scribble Assignment

## What did the starter app already have?

The starter provided a working shell for a multiplayer drawing game:

- **Routing:** Full app shell with navigation between Start, Create Room, Join Room, Lobby, and Game screens
- **Room management:** Backend with POST /rooms, POST /rooms/:code/join, GET /rooms/:code endpoints and in-memory storage using `Map<string, Room>`
- **Frontend state management:** Custom class-based store using `useSyncExternalStore` with React Context
- **API client:** Typed fetch wrapper for backend communication
- **Seed data:** 5 starter words and 2 roles (drawer, guesser)
- **UI styling:** Complete CSS design system with custom properties, layout grids, and component styles

## What did you add?

### Spec Kit Artifacts
- **Discovery notes** (`discovery.md`): 7 incomplete behaviors, 3 assumptions, file map
- **Constitution** (`speckit.constitution`): engineering principles, AI usage rules, review discipline, game rule constraints
- **Specification** (`speckit.specify`): 4 scenario groups with acceptance criteria and edge cases
- **Plan** (`speckit.plan`): state model changes, data flow, file-level changes per scenario
- **Tasks** (`speckit.tasks`): ordered task list with dependencies and status tracking

### Implementation by Scenario

**Scenario 1 — Room Setup & Lobby:**
- Host tracking (hostId stored on room creation, host badge in lobby)
- Client-side name/code validation on create and join forms
- Auto-polling (2s interval) in lobby using `setInterval`
- Host-only start button, disabled until 2+ players present
- Fixed `/bug` suffix bug in API base URL

**Scenario 2 — Game Start & Drawer Flow:**
- Drawer assignment (host becomes drawer on game start)
- Deterministic word selection (`STARTER_WORDS[participantCount % 5]`)
- Role-based word visibility (only drawer sees secret word during play)
- Auto-polling on game page

**Scenario 3 — Gameplay Interaction:**
- Interactive HTML5 `<canvas>` with mouse drawing (mousedown/mousemove/mouseup)
- Debounced stroke serialization and sync via POST /rooms/:code/draw
- Clear canvas functionality with backend sync
- Guess submission with validation (trim, reject empty, case-insensitive comparison)
- Deterministic scoring (100 points for correct, 0 otherwise)
- Correct guess ends the round (status → "finished")
- Real-time scoreboard and guess history via polling

**Scenario 4 — Result, Restart & Final Validation:**
- Result state reveals secret word to all players
- Host-only restart button, non-hosts see "Waiting for host to restart..."
- Full state reset on restart (scores, drawing, guesses, round) while preserving participants and host
- Redirect to lobby after restart

## Key Decisions and Tradeoffs

1. **Drawing serialization:** Strokes are stored as JSON arrays of points rather than image data. This keeps the data small and makes it easy to replay strokes, but means the backend does no image processing.

2. **Debounced save (300ms):** The drawing is not sent on every mousemove event. This reduces API calls while keeping the canvas responsive locally. The tradeoff is a slight delay in syncing to other players.

3. **No drawer rotation:** Per the spec (out of scope), only one round is supported. The host is always the drawer.

4. **Deterministic word selection:** Using `participantCount % wordList.length` ensures the same room with the same participants always gets the same word, making behavior predictable.

## AI-Assisted Workflow

The Spec Kit workflow (specify → plan → tasks → implement) provided clear structure. Working incrementally by scenario and committing after each one kept changes manageable and traceable.

Key patterns:
- Starting with artifact creation forced upfront thinking about edge cases
- The task list in `speckit.tasks` served as a reliable checklist
- Building and testing after each scenario prevented regressions
- The constitution's "brownfield, not greenfield" rule prevented unnecessary refactoring

## AI Usage

- AI assisted with generating Spec Kit artifacts based on codebase exploration
- AI generated implementation code following the plan's file-level changes
- All AI output was reviewed before committing
- Adjustments were made when types didn't match between frontend and backend (e.g., missing `score` field on Participant)
