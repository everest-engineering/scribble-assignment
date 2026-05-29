# Reflection Report

## What did the starter app already have?

The starter repository provided a runnable but intentionally incomplete scaffold for a Scribble-style multiplayer drawing game. Specifically, it shipped with:

- **Frontend**: A Vite + React + TypeScript client with an app shell, page routing (React Router v6), and branded UI screens — Start, Create Room, Join Room, Lobby, and Game.
- **Backend**: A Node.js + Express + TypeScript service with in-memory room storage and starter API endpoints (`GET /health`, `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`).
- **Seed data**: A small word list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and two roles (`drawer`, `guesser`).
- **Basic flows**: Creating a room, joining a room by code, fetching a room snapshot, and displaying participants in the lobby via a manual refresh button.
- **Placeholder UI**: The game screen had placeholder areas for the canvas, guess input, scoreboard, and results — but none of these were functional.

What it deliberately did _not_ have: host behavior, automatic lobby polling, game start logic, drawer assignment, word visibility rules, drawing/canvas interaction, guess submission, scoring, result display, or restart flow.

## What did I add?

Work was completed across all four business scenarios, following the Spec Kit workflow of discover → specify → clarify → plan → task → implement → validate for each phase.

### Phase 1 — Room Setup & Lobby (Scenario 1)

- Host tracking on room creation — the player who creates the room is automatically the host.
- Join validation with clear error messages (invalid codes, full rooms, games already in progress).
- Automatic lobby polling (~2 seconds) so all participants see updates without a manual refresh.
- Host-only "Start Game" button that enforces a minimum of 2 players.
- Room isolation verified across multiple concurrent rooms.

### Phase 2 — Game Start & Drawer Flow (Scenario 2)

- Player name validation (trimmed, alphanumeric-only, 1–16 characters; empty/whitespace rejected).
- Drawer assignment — the host becomes the drawer for the first round.
- Secret word selection from the starter word list, visible only to the drawer.
- Auto-redirect for non-host players from the lobby to the game page when the room becomes active.
- "Drawer" badge visible to all participants identifying who is drawing.

### Phase 3 — Gameplay Interaction (Scenario 3)

- Interactive drawing canvas (`Canvas.tsx`) where the drawer can draw freehand strokes.
- Clear canvas action that resets all strokes.
- Guess submission with validation — guesses are trimmed, compared case-insensitively, and empty submissions are rejected.
- Synced guess history via polling — all players see guesses update within one polling cycle.
- Deterministic scoring: correct guesses award 100 points; incorrect guesses add 0.
- Session persistence via `sessionStorage` so game state survives page refreshes.

### Phase 4 — Result, Restart & Final Validation (Scenario 4)

- Round-end detection with two triggers: all guessers have guessed correctly ("Everyone Guessed It!") or the round timer expires ("Time's Up!").
- A configurable `timerDuration` setting (default 300 seconds) with a live countdown timer (`TimerDisplay.tsx`).
- Result state (`ResultView.tsx`) showing the correct word, final scores, full guess history, and the canvas from the completed round — visible to all players.
- Round-end reason displayed in the result view.
- Host-only restart button that clears round state, accumulates scores into `cumulativeScores`, and returns all players to the lobby with the participant list preserved.

### Spec Kit Artifacts

For each phase, the following artifacts were produced and committed:

- **Specification** (`spec.md`): Acceptance scenarios with Given/When/Then criteria, edge cases, and clarification sessions.
- **Implementation plan** (`plan.md`): Technical context, state model changes, data flow, file-level modifications, and risk assessment.
- **Tasks** (`tasks.md`): Ordered, testable work items with dependencies.
- **Checklists**: Requirements and API checklists to validate completeness.
- **Manual test scripts**: Step-by-step multi-tab testing procedures for each phase.

### Cross-cutting changes

- `AGENTS.md` updated with Git policy, game-specific constraints, and Spec Kit integration.
- Backend data model (`game.ts`) expanded with `Round`, `Guess`, `CanvasStroke`, `RoomSnapshot`, cumulative scores, and timer fields.
- `roomStore.ts` grew from basic CRUD to a full game engine — start, draw, guess, score, round-end detection, restart, and snapshot projection (hiding the secret word from guessers).
- Frontend state management (`roomStore.ts`) expanded with polling, session persistence, and game lifecycle handling.
- `api.ts` expanded from 4 endpoints to cover drawing, guessing, game start, and restart.
- All backend and frontend tests pass; both projects build cleanly with `tsc` and `vite build`.
