# Reflection Report — Scribble Lab

## What the Starter App Already Had

The starter repository (`main` branch) was a runnable but intentionally incomplete scaffold for a Scribble-style drawing-and-guessing game. It included:

- **Frontend**: A Vite + React + TypeScript client with page routing via React Router v6, a branded landing/start screen, and placeholder pages for Create Room, Join Room, Lobby, and Game.
- **Backend**: An Express + TypeScript service with a minimal in-memory room store and four starter endpoints: `GET /health`, `POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code`.
- **Seed Data**: A fixed word list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and basic role constants (`drawer`, `guesser`).
- **UI Shell**: Canvas, guess input, scoreboard, and result areas were present in the Game page but non-functional — they were visual placeholders only.
- **Styling**: Light-themed CSS with Scribble branding and presentational copy.

Notably, the starter **did not** implement: host tracking, automatic polling, game-start logic, drawer assignment, secret-word visibility rules, drawing interaction, guess validation, scoring, result state, or restart flow. It also contained a small bug in `frontend/src/services/api.ts` where the default `API_BASE_URL` had an erroneous `/bug` suffix, causing all API calls to 404.

## What We Added in the `scribble-lab` Branch

We implemented the full game loop across four incremental feature branches, each producing Spec Kit artifacts (`spec.md`, `plan.md`, `tasks.md`) and corresponding code changes. All work was done via HTTP polling (no WebSockets), in-memory storage only (no database), and without any authentication layer, per the lab constraints.

### Feature 001 — Room Creation, Join, and Lobby

This was the foundation layer.

- **Host tracking**: The room creator is automatically designated as the host via a `hostParticipantId` field.
- **Player name validation**: Names are trimmed on the backend; empty or whitespace-only names are rejected with a `400 Bad Request` and a clear error message.
- **Join validation**: Invalid, empty, or non-existent room codes are rejected with clear feedback.
- **Room isolation**: Each room is a completely separate in-memory object; there is no cross-room leakage.
- **Lobby auto-polling**: The lobby refreshes automatically every ~2 seconds via `GET /rooms/:code`, removing the need for a manual refresh button.
- **Host-only start**: Only the host can start the game, and only when at least 2 players are present.
- **Host transfer**: If the host leaves before the game starts, the next earliest-joined participant becomes the new host.
- **Idle cleanup**: Empty rooms are deleted immediately; idle rooms (no activity for 10 minutes) are also cleaned up.
- **API identity**: A unique opaque `playerId` is returned on join/create and used in subsequent requests to verify identity.

### Feature 002 — Game Start, Drawer, and Secret Word

This transitioned the room from lobby to active gameplay.

- **Game start flow**: `POST /rooms/:code/start` transitions the room status from `lobby` to `playing`. Rejected for non-hosts and when fewer than 2 players are present.
- **Drawer assignment**: The host is automatically designated as the drawer for the first (and only) round via a `drawerId` field.
- **Secret word selection**: The word is chosen deterministically — always the first word (`rocket`) from the fixed starter list for the first round.
- **Drawer-only word visibility**: The `GET /rooms/:code` endpoint returns `currentWord` only when the requesting `participantId` matches `drawerId`; guessers receive `currentWord: null`.
- **Guesser placeholder**: Guessers see underscore placeholders matching the secret word length (e.g., `_ _ _ _ _` for `rocket`).
- **Drawer identification UI**: The drawer sees "You are the drawer"; guessers see "[Name] is drawing".
- **Game page polling**: The Game page includes the same ~2-second polling loop as the Lobby to keep all clients synchronized.
- **Host-leave mid-round**: If the host (who is also the drawer) leaves during the round, the room immediately resets to `lobby` and clears `drawerId` and `currentWord`.

### Feature 003 — Drawing, Guessing, and Scoring

This added the core gameplay interaction.

- **Interactive canvas**: The drawer can draw freehand strokes on an HTML5 canvas. Coordinates are normalized to a fixed logical size (0–1000 units) and scaled on render so drawings look consistent across different viewport sizes.
- **Clear canvas**: A "Clear Canvas" button removes all strokes for the drawer, and the blank state syncs to all clients on the next poll.
- **Guess submission**: `POST /rooms/:code/guess` accepts text guesses. Submissions are trimmed and compared case-insensitively against the secret word.
- **Empty guess rejection**: Whitespace-only guesses are rejected with a `400` and a clear message; no points are awarded.
- **Drawer guess blocking**: The drawer cannot submit guesses; the API rejects such attempts.
- **Scoring**: Correct guesses award exactly 100 points. Incorrect guesses award 0. The round ends immediately on the first correct guess, so only one player can receive 100 points per round.
- **Guess history**: An ordered `guessHistory` array tracks every submission with the participant ID, trimmed guess text, correctness flag, and timestamp. It syncs to all clients via polling.
- **Scoreboard**: A live scoreboard displays every participant's current score and updates in sync with the guess history.
- **State guards**: Guess submissions are rejected if the room is not in `playing` state or if the secret word is null.
- **Drawer-leave handling**: If the drawer leaves mid-round, the room resets to `lobby`, clearing all round state (scores, history, canvas, word, drawer).

### Feature 004 — Round Results and Game Restart

This closed the gameplay loop with a results screen and replayability.

- **`results` state**: A new `RoomStatus` value `"results"` represents the end-of-round phase.
- **Automatic round end**: When the first correct guess is submitted, the room auto-transitions to `results`.
- **Manual round end**: The host can manually end the round at any time via `POST /rooms/:code/end`.
- **Result reveal**: In `results` state, `currentWord` is revealed to all participants (not just the drawer), alongside the final scoreboard and full chronological guess history.
- **Results UI**: The Game page conditionally renders a results panel showing the secret word, scores, guess history, and the final canvas drawing.
- **Host-only controls**: "End Round" and "Restart Game" buttons are visible only to the host.
- **Restart flow**: `POST /rooms/:code/restart` transitions the room back to `lobby`, preserves the participant list and host identity, and clears all round-specific state (word, scores, history, canvas strokes, drawer assignment).
- **Join restrictions**: New players cannot join a room in `results` state; they receive a `409 Conflict`.
- **Idle cleanup extended**: `results` rooms are also subject to the same 10-minute idle cleanup as lobby rooms.

## AI-Assisted Workflow Reflection

We used a Spec Kit-compatible workflow (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`) to drive implementation. Each feature began with a specification, followed by a technical plan, then ordered tasks, and finally incremental implementation commits. This structure prevented scope drift and kept every commit traceable to an acceptance criterion.

Key tradeoffs and decisions:
- **Polling over WebSockets**: Although less responsive, HTTP polling keeps the architecture simple, avoids forbidden-technology violations, and works reliably across browser tabs without connection management.
- **Normalized canvas coordinates**: Storing strokes in logical units (0–1000) instead of raw pixels decouples the drawing data from screen resolution, making the canvas behave consistently for all players.
- **In-memory only**: All state lives in a single `roomStore.ts` service. This satisfies the no-database constraint but means data is lost on backend restart. For a lab context this is acceptable.
- **Host as drawer**: Fixing the host as the drawer for the single round simplifies the flow and avoids unrequested rotation logic.
- **Reusing `currentWord` for results**: Rather than introducing a new `secretWord` field, we populated `currentWord` for all viewers when `status === "results"`. This kept the data model minimal and avoided redundant fields.

## Validation

Before committing each feature, we verified acceptance criteria with two browser tabs:
1. Create a room in Tab A and join it in Tab B.
2. Confirm lobby polling syncs the player list.
3. Start the game as the host; confirm drawer word visibility and guesser placeholders.
4. Draw on the canvas, submit correct/incorrect guesses from Tab B, and confirm history + scoreboard update.
5. End the round and confirm results reveal the word and scores to both tabs.
6. Restart and confirm both tabs return to the lobby with the original player list and cleared round state.

All builds and tests pass (`npm run build` and `npm test` in both `backend/` and `frontend/`).
