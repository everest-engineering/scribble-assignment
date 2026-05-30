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
