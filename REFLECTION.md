# Reflection Report

## What did the starter app already have?

The starter provided a solid foundation: a working Express backend with room CRUD (create, join, fetch), Zod validation, an in-memory store, seed data (5 words, 2 roles), and a React frontend with routing, a custom observer-pattern state store, branded UI, and typed API service. The create-room → join-room → lobby flow worked on the happy path. Backend and frontend each had basic test suites.

## What did you add?

**Backend:**
- Extended the data model with `hostId`, `drawerId`, `secretWord`, `guesses`, `scores`, and full room status state machine (`lobby` → `playing` → `finished`)
- Implemented game logic: start game (host validation, deterministic word selection, drawer assignment), guess submission (case-insensitive comparison, scoring, round end), and restart (state reset, participant preservation)
- Added 3 new API endpoints: `POST /rooms/:code/start`, `POST /rooms/:code/guess`, `POST /rooms/:code/restart`
- Implemented role-based snapshot filtering (secret word visible only to drawer)
- Added player name validation (reject empty/whitespace-only names)
- Added 14 new tests covering all game scenarios

**Frontend:**
- Fixed the broken `API_BASE_URL` (had `/bug` suffix)
- Updated types to match new backend model
- Added store methods for `startGame`, `submitGuess`, `restartGame`, `clearError`
- Implemented lobby auto-polling (2s interval) with automatic navigation to game
- Added host-only start button with 2-player minimum enforcement
- Added client-side name validation on create and join forms
- Built an interactive drawing canvas component with mouse support and clear button
- Wired guess form to API with empty-guess validation
- Built scoreboard showing live scores with role badges
- Built result panel showing final scores, correct word, and full guess history
- Implemented restart flow (host button → lobby return with state preserved)
- Added CSS for all new components (canvas, guess history, host badge, secret word, etc.)

## Spec Kit Process

Following the Spec Kit discipline (constitution → specify → plan → tasks → implement → validate) kept the work focused and traceable. Each acceptance criterion in the spec maps directly to specific code paths. The constitution's rule to "extend, don't replace" prevented unnecessary rewrites.

## AI-Assisted Workflow

The AI was used for exploration (discovering the full codebase structure), generating spec kit artifacts, and implementing the code changes. Key observations:
- The AI was effective at understanding existing code conventions and extending them consistently
- TypeScript type errors were caught by the compiler and fixed iteratively (e.g., discriminated union return types needed explicit annotations)
- The polling logic required careful thought about React effect cleanup and navigation guards — the AI's initial attempt had a subtle bug where polling wouldn't restart after navigation, which was caught during review
- The spec kit artifacts were generated from the exploration findings and refined as implementation revealed gaps

## Tradeoffs and Decisions

1. **Polling vs WebSockets**: Used HTTP polling (2s interval) as specified. This is simpler but less responsive than WebSockets, which is explicitly out of scope.

2. **Word selection**: Used `charCodeAt(0) % 5` for deterministic word selection from the 5-word list. This means the same room code always gets the same word, satisfying the "deterministic" requirement.

3. **Canvas sync**: Drawing only works on the drawer's screen. True canvas sync would require WebSockets or sending draw commands as API calls, both out of scope.

4. **No drawer scoring**: The spec only awards 100 points to guessers. The drawer's score remains 0 throughout, which matches the spec's "all scores start at 0" requirement.

5. **Single round**: Multiple rounds and drawer rotation are out of scope. The restart flow returns everyone to the lobby to begin fresh.
