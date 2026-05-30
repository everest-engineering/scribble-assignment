# Reflection Report — Scribble Assignment

**Branch**: `assignment` | **Author**: Swarup Mahapatra | **Date**: 2026-05-30

---

## What the Starter App Already Had

The starter provided a working application shell with routing, branding, and five page components: Start, Create Room, Join Room, Lobby, and Game. The backend exposed four REST endpoints (`GET /health`, `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`) backed by an in-memory store. Room creation, joining by code, and basic snapshot fetching all worked. The frontend showed placeholders for the canvas, guess input, scoreboard, and results panel, but none of those placeholders had any real behavior. The Lobby had a manual refresh button rather than polling.

## What I Added

I built out the four business scenarios incrementally across four feature branches, each with a complete set of Spec Kit artifacts before any code was written.

**Scenario 1 — Room Setup & Lobby**: Added host tracking on room creation, join validation with clear error feedback, automatic lobby polling at 2-second intervals, and a host-only Start button guarded by a 2-player minimum.

**Scenario 2 — Game Start & Drawer Flow**: Added player name validation (trim, reject whitespace-only), a start-game endpoint, drawer assignment, deterministic secret word selection (`availableWords[0]`), and a word visibility rule that shows the secret word only to the drawer.

**Scenario 3 — Gameplay Interaction**: Added an interactive drawing canvas with clear-canvas support, guess submission with trim and case-insensitive comparison, synced guess history via polling, and scoring (100 points per correct guess, 0 for incorrect).

**Scenario 4 — Round End & Restart**: Added an "End Round" button visible only to the host during an active round, a new `"ended"` room status, a result screen (correct word, sorted scoreboard, full guess history) rendered conditionally inside `GamePage.tsx`, a "Play Again" button for the host, and a lobby-redirect effect that fires for all players within one polling cycle after restart.

Total source change across all four features: seven files modified for the final feature alone, zero new files, zero new npm dependencies.

## Spec Kit Artifacts

Each feature began with a `spec.md` written from the business scenario description, followed by a `research.md` that logged key decisions before touching any code, a `plan.md` that named specific files, functions, and type changes, and a `tasks.md` that sequenced the work. The constitution defined five engineering principles — brownfield-first, spec-driven development, deterministic game rules, incremental validation, and simplicity — and every plan was checked against them before implementation started.

Writing the spec before the plan forced me to think about edge cases (no guesses submitted, host closes browser during results) before getting into implementation details. The research phase was particularly useful for decisions like where to render the result screen — the constitution's brownfield-first principle made it clear the right answer was a conditional branch in the existing `GamePage.tsx` rather than a new page file and route.

## AI Usage

I used Claude Code throughout: to generate initial spec drafts, to draft implementation plans, and to write the code changes themselves. The workflow was:

1. Provide the business scenario and ask Spec Kit to draft the spec.
2. Review the spec, correct any misread requirements, and confirm acceptance criteria.
3. Ask Spec Kit to produce the research, plan, and tasks — reviewing each before moving on.
4. Let Claude implement the tasks, then verify the feature manually with two browser tabs.

The AI-generated artifacts were generally good at breadth but needed pruning for scope. Early drafts included ideas (separate result page, WebSocket event for results) that contradicted the constitution. Reviewing against the principles before committing kept the codebase clean. Code generation was reliable for boilerplate (Zod schemas, store methods) but I reviewed every `GamePage.tsx` change carefully since conditional rendering and `useEffect` ordering are easy to get subtly wrong.

## Decisions and Tradeoffs

**Polling vs push**: The starter was already polling-based and the out-of-scope list explicitly excluded WebSockets. Keeping polling was the right call — the 2-second response window was acceptable for all four scenarios, and it avoided introducing a new dependency or architecture layer.

**In-memory store**: No database was used. This kept setup simple and made the state reset on restart (`room.guesses = []`) trivial. The tradeoff is that a backend restart loses all rooms, which is fine for local development but would be unacceptable in production.

**Result screen as conditional render**: Rendering the result screen inside `GamePage.tsx` rather than a dedicated `ResultPage.tsx` kept the file count flat and avoided a route change. The screen is under 30 lines of JSX. If the result screen grew significantly (multiple tabs, charts), extracting it to its own component file would become worth it.

**Deterministic word selection**: Using `availableWords[0]` ("rocket") every round is obviously not how a real game works, but it matches the constitution's Principle III (no randomness that breaks replay verification) and kept test scenarios predictable — both browser tabs always knew what word to expect.

## What I Would Do Differently

The spec for features 002–004 could have been tighter on polling edge cases (what happens if a player loads the page mid-round, what the game page renders when there is no room snapshot yet). I discovered these during implementation rather than spec review, which meant the plan needed small corrections. Tighter edge-case enumeration in the spec would catch this earlier.

I would also write the tasks with more explicit "Definition of Done" lines per task — the current tasks.md has good ordering and dependencies, but the acceptance language is sometimes looser than the spec's acceptance scenarios. Linking each task back to a specific FR would make self-review faster.

## Summary

The lab's constraint — spec first, then plan, then code — changed how I approached the work. The constitution acted as a tie-breaker on design decisions and prevented scope creep. The polling architecture and in-memory store were deliberate simplifications that fit the lab scope. The result is a working four-scenario game loop that matches the spec's acceptance criteria, implemented in a codebase that stayed as close as possible to what the starter provided.
