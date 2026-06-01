# Reflection — Scribble Assignment

## What did the starter app already have?
The starter provided a working room creation/join flow with in-memory storage, a branded UI with routing across 5 pages (Start, Create Room, Join Room, Lobby, Game), and placeholder components for canvas, guess form, scoreboard, and results. The backend had 3 endpoints (POST /rooms, POST /rooms/:code/join, GET /rooms/:code) and seed data with 5 words and 2 roles.

## What did you add?
All game logic: host tracking with host-only permissions, name/code validation, auto-polling lobby, start-game flow with drawer assignment and deterministic word selection, per-viewer word visibility filtering, an interactive HTML5 Canvas with drawing and clear, guess submission with case-insensitive comparison and scoring (100pts for correct), round-end transition, synced guess history, result display with correct word/scores/history, and host-only restart with full state reset while preserving participants. Added the full Spec Kit artifact set: constitution, 4 feature specs with plans and tasks.

## AI usage
The AI handled the majority of code generation, spec writing, and test creation. Review discipline was maintained by reading every diff before committing and running build + tests after each feature group.

## Tradeoffs
Canvas synced via polling (data URL on backend) — simple but not efficient for frequent updates. Single round only per game scope constraints. No canvas sync to guessers would break the game, so it was included despite not being explicitly required by the spec.
