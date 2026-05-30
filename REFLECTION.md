# Reflection Report

## What did the starter app already have?

The starter app already had a TypeScript Express backend and a TypeScript React/Vite frontend. It included the basic project structure for room APIs, room state, frontend routing, and pages for creating a room, joining a room, viewing the lobby, and entering a placeholder game page.

The backend already used an in-memory room store with room code generation, participant creation, room join, room lookup, and room snapshots. The frontend already had an API client, a `RoomStore`, lobby rendering, basic form handling, and simple components such as cards, room code display, scoreboard placeholders, and guess form placeholders.

## What did you add?

I expanded the room and game flow into four feature groups:

- Room setup and lobby: host tracking, trimmed player-name validation, clear error messages, multi-room isolation, automatic HTTP lobby polling, and host-only game start with a two-player minimum.
- Game start and drawer flow: deterministic drawer assignment, deterministic secret word selection, and drawer-only secret word visibility.
- Gameplay interaction: an interactive drawing canvas, drawer-only canvas clearing, validated guess submission, synced guess history through polling, and deterministic scoring for correct guesses.
- Results and restart: shared results state, correct word and winner display, full score list, and host-only restart back to the lobby while preserving players and clearing round state.

I also updated the feature specification, implementation plan, data model, API contract, and task checklist so the documentation matches the implementation. Finally, I added and updated backend/frontend tests and verified the app with backend tests, frontend tests, backend build, frontend build, and a backend health smoke test.

## AI-assistance discipline

I used AI assistance as a structured implementation partner, not as a replacement for review. The work was broken into the required feature groups, and each group was reflected in the spec artifacts before or alongside implementation. I checked generated changes against the project constraints: TypeScript first, in-memory state only, HTTP polling only, no WebSockets, no database, and no authentication.

I also validated behavior with automated tests and builds instead of relying only on generated code. When the spec changed, I updated the supporting artifacts so the implementation, contracts, tasks, and reflection stayed traceable.

## Trade-offs

The biggest trade-off was using HTTP polling instead of real-time push. Polling is less immediate and can make drawing synchronization feel coarse, but it follows the assignment constraints and keeps the architecture simple.

I also chose deterministic drawer selection, word selection, and scoring. This makes the game less varied than a production Scribble game, but it makes the lab easier to test, explain, and validate. Restart returns players to the lobby instead of starting another round because multiple rounds and drawer rotation were out of scope.

## Risks and limitations

The app stores all rooms in memory, so rooms disappear when the backend restarts. Browser refresh also loses frontend room session state. Those are intentional scope limits, but they would be risks in a production game.

Drawing sync is based on snapshot polling rather than live collaboration, so fast drawing may not feel real-time to other players. There is also no cleanup policy for inactive rooms beyond the in-memory process lifetime, which could matter if many rooms were created during a long-running server session.
