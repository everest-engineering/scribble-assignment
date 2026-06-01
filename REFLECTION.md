# Scribble Reflection Report

## What the Starter App Already Had

The starter app already provided a working full-stack scaffold for a Scribble-style game. The frontend included page routing, a branded start flow, create-room and join-room screens, a lobby view, and placeholder game components for the canvas, guessing, scoreboard, and results. The backend already exposed basic REST endpoints for health checks, room creation, joining a room, and fetching a room snapshot.

The app also had a useful in-memory room store, starter word and role data, TypeScript configuration, Vite/React frontend tooling, Express backend tooling, and initial Vitest coverage around room storage, schemas, frontend API calls, and room state.

## What I Added

I expanded the starter into a playable single-round multiplayer flow. The room and lobby work now supports host tracking, trimmed player names, invalid input handling, room isolation, automatic polling, and host-only game start with a two-player minimum.

For the game flow, I added a shared start transition, deterministic first-drawer assignment, deterministic secret-word selection from the starter list, and drawer-only secret word visibility. I also added guess submission with trimming, empty-guess rejection, case-insensitive correctness checks, synced guess history through polling, and simple deterministic scoring.

For the final lifecycle, I added a finished result state and host-only restart behavior. The result view now shows the correct word, final score information, and full guess history. Restart returns all players to the lobby, preserves the participant list and host identity, and clears round-specific state.

## Spec Kit and AI Workflow

I used Spec Kit artifacts to keep the work traceable: specifications, plans, task lists, contracts, data models, quickstarts, and checklists were created across the feature scenarios. This helped keep the implementation tied to acceptance criteria instead of drifting into unrelated features.

AI assistance was most useful for decomposing the work, identifying gaps between the README scenarios and the actual UI behavior, and keeping tests aligned with expected user flows. I still had to inspect the code directly, validate behavior with tests and builds, and correct gaps such as the game screen not polling during the result/restart phase.

## Tradeoffs and Remaining Notes

The implementation intentionally stays within the assignment constraints: no WebSockets, no database, no authentication, and no persistent storage. All synchronization uses polling and all game state remains in memory, so restarting the backend clears rooms.

The drawing experience is intentionally simple and local to the drawer screen. This matches the scoped lab behavior, but a production game would need shared drawing state, richer score presentation, player disconnect handling, and more robust lifecycle cleanup.

## Validation

The backend and frontend test suites pass, and both builds complete successfully. The final flow is designed to support the README expectation that two browser tabs can create or join a room, play one round, view a synced result, and return to the lobby through host restart.
