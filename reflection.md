# Reflection — Scribble Brownfield Assignment

## 1. What the Starter Application Provided

The starter was a functional but incomplete scaffold for a Scribble-style drawing and guessing game. It included:

- A React 18 + Vite + TypeScript frontend with five page routes: Start, Create Room, Join Room, Lobby, and Game.
- A Node.js + Express + TypeScript backend with three API endpoints: `POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code`.
- In-memory room storage using a `Map` on the backend, with unique 4-character room codes.
- A `RoomStore` class on the frontend using React Context and `useSyncExternalStore` for state management.
- A lobby screen with a manual refresh button that fetched the latest participant list.
- A game screen with static placeholders for the canvas, guess form, scoreboard, and activity panel.
- Seed data: five words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and two roles (`drawer`, `guesser`).
- Zod validation on the backend and a global error handler.
- Vitest configured for both frontend and backend.
- GitHub Actions workflows for CI and PR validation.

The starter established the routing, state architecture, and API patterns. All gameplay behavior was absent.

---

## 2. Scenario 1 — Room Setup & Lobby

**Implemented:**

- **Host tracking** — the room creator is assigned as host at creation time. `Room.hostId` is stored on the backend and included in every snapshot via `toRoomSnapshot`.
- **Room join validation** — empty and whitespace-only room codes are rejected client-side before any API call. Unknown room codes return a user-friendly "Room not found" error from the backend.
- **Lobby polling** — replaced the manual refresh button with a `setInterval` (2-second cadence) in a `useEffect` on `LobbyPage`. The interval is cleaned up on unmount.
- **Host-only start** — the "Start Game" button is rendered only for the host. It is disabled when fewer than 2 players are present and shows an explanatory message. Non-host players see a waiting message.
- **Minimum player guard** — `POST /rooms/:code/start` enforces the 2-player minimum on the backend, returning 422 if not met.

---

## 3. Scenario 2 — Game Start & Drawer Flow

**Implemented:**

- **Player name validation** — both `createRoomSchema` and `joinRoomSchema` now use `z.string().trim().min(1)`, rejecting empty and whitespace-only names with a 400 error. Both forms also validate client-side before calling the API.
- **Drawer assignment** — `startGame` sets `room.drawerId = room.hostId` when the game begins. The drawer id is included in every snapshot and visible to all players.
- **Deterministic word selection** — `selectWord` derives a stable index by summing the char codes of the room code characters and taking the modulo of the word list length. The same room code always produces the same word.
- **Secret word visibility** — `toRoomSnapshot` uses `viewerParticipantId` to conditionally return `currentWord`. Non-drawers and unauthenticated callers receive `null`.
- **Role-aware game screen** — `GamePage` derives `isDrawer` and renders different content per role: the drawer sees the secret word and a drawing placeholder, guessers see who is drawing.

---

## 4. Scenario 3 — Gameplay Interaction

**Implemented:**

- **Drawing canvas** — an HTML `<canvas>` element with mouse event handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`) renders for the drawer. Drawing state is local to the browser.
- **Clear canvas** — a "Clear Canvas" button calls `clearRect` on the canvas context. It is only visible to the drawer.
- **Guess submission** — `POST /rooms/:code/guess` stores guesses on the backend. The `GuessForm` component now accepts an `onSubmit` prop, validates and trims the input client-side before calling the store action, clears on success, and displays API errors inline.
- **Guess validation** — empty and whitespace-only guesses are rejected both client-side and via the backend schema. The drawer is blocked from guessing (403).
- **Case-insensitive comparison** — the backend trims and lowercases both the submission and `currentWord` before comparing. The frontend applies no comparison logic.
- **Scoring** — participants initialise with `score: 0`. A correct guess awards 100 points, capped at 100 per player regardless of subsequent correct guesses. Scores are stored on `Participant` and included in every snapshot.
- **Guess history synchronisation** — `GamePage` uses the same 2-second polling pattern as `LobbyPage`. The `ResultPanel` and `Scoreboard` components were updated to render real data from the snapshot.

---

## 5. Scenario 4 — Result, Restart & Final Validation

**Implemented:**

- **End-of-round state** — `POST /rooms/:code/end` transitions the room from `"playing"` to `"finished"`. Only the host can trigger this. Once finished, `submitGuess` rejects further attempts with 422.
- **Correct word reveal** — `toRoomSnapshot` was updated to return `currentWord` to all viewers when `room.status === "finished"`, removing the per-viewer filter applied during play.
- **Result view** — `GamePage` renders a dedicated result layout when `room.status === "finished"`, showing the correct word, final scores, and the complete guess history.
- **Restart flow** — `POST /rooms/:code/restart` resets the room: `status = "lobby"`, `drawerId = null`, `currentWord = null`, `guesses = []`, and all participant scores reset to zero. Participant identities and the room code are preserved.
- **Status-driven navigation** — `GamePage` now includes a `useEffect` that navigates all players to `/lobby` when `room.status` becomes `"lobby"` (driven by polling). `LobbyPage` includes a matching effect that navigates to `/game` when status becomes `"playing"`, closing the gap where non-host players were not auto-routed after game start.

---

## 6. How AI Was Used

AI assistance (Claude Code) was used throughout the assignment in a structured, spec-first manner:

- **Specification generation** — the `speckit.specify`, `speckit.plan`, and `speckit.tasks` artifacts were drafted iteratively with AI, scenario by scenario, before any code was written. This forced ambiguity to surface before implementation.
- **Discovery** — the `docs/discovery.md` file was generated by analysing the full repository and cataloguing gaps against the spec, rather than writing code immediately.
- **Code implementation** — each scenario was implemented feature by feature following the task list. AI generated the code; each output was reviewed before committing.
- **Review discipline** — AI-generated code was checked against the spec rather than accepted on appearance. Several cases required correcting output that was structurally plausible but misaligned with the acceptance criteria (e.g. `toRoomSnapshot` filtering logic, polling cleanup patterns).
- **Build verification** — every implementation step was verified with `npm run build` before proceeding. The build served as the primary gate, not the AI's confidence.

AI was not used to make architectural decisions autonomously. All decisions about state model shape, endpoint design, and navigation patterns were reasoned through in the plan before any code was produced.

---

## 7. Challenges Encountered

- **Cascading type errors** — adding fields to `Room` and `RoomSnapshot` on the backend caused type errors in `toRoomSnapshot`, `createRoom`, and any caller that returned a snapshot. The fix was to update all sites in the same logical step rather than committing intermediate broken states.
- **IDE diagnostic timing** — the VS Code extension reported stale type errors immediately after edits because the hook fires before the TypeScript server has processed the full file write. This required using `npm run build` as the authoritative check rather than relying on inline hints.
- **Per-viewer snapshot filtering** — the `viewerParticipantId` parameter on `toRoomSnapshot` existed from the scaffold but was voided. Threading the correct id through all five endpoints and handling the `"finished"` status exception required care to avoid regressions.
- **Polling cleanup** — ensuring `clearInterval` fires correctly on unmount, particularly when navigating between pages, required explicit dependency arrays. A missed cleanup would cause stale fetch calls after the component was gone.
- **Status-driven navigation** — the gap where non-host players were never auto-navigated to the game screen was only discovered during Scenario 4 planning. The fix (a `useEffect` on `room.status` in `LobbyPage`) addressed both the initial game start flow and the post-restart flow simultaneously.

---

## 8. Key Learnings from Spec Kit and Specification-Driven Development

- **Spec before code removes ambiguity at the right time.** Writing acceptance criteria before planning forced decisions about edge cases (e.g. what counts as an empty name, who can see the secret word) that would otherwise have been discovered mid-implementation and resolved inconsistently.
- **The plan is a contract, not a suggestion.** Having a file-level implementation sequence meant each change had a clear scope. Changes that felt like they "belonged together" were often best kept separate to keep each commit independently reviewable.
- **Small commits expose reasoning.** Each commit covering one logical change made it straightforward to trace why a line exists. A commit touching six files simultaneously obscures intent and makes rollback harder.
- **Artifacts must stay in sync with the code.** When the implementation deviated from the plan (e.g. the non-host navigation gap discovered late), updating the plan and spec before committing kept the artifacts traceable. Artifacts that lag behind code become noise rather than documentation.
- **AI assistance amplifies the value of a good spec.** Prompting AI with a detailed plan produced more accurate output than prompting with a vague description. The spec was effectively the prompt — the more precise the acceptance criteria, the less the AI output needed correction.
- **Review is not optional.** The constitution's rule to read AI-generated code line by line prevented several issues: invented fields, silent error suppression, and logic that matched the description but not the spec. The build caught type errors; careful reading caught semantic ones.
