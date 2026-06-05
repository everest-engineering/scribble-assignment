# Scribble Constitution

## Engineering Principles

1. Preserve the starter architecture: Express backend, React frontend, TypeScript, ES modules, REST APIs, and in-memory room state.
2. Keep room and gameplay logic deterministic where the assignment requires it, especially drawer selection, starter word selection, scoring, and restart reset behavior.
3. Implement behavior incrementally by scenario order: room setup and lobby, game start and drawer flow, gameplay interaction, then result and restart.
4. Prefer small, focused changes that fit the existing file structure over broad rewrites or new abstractions.
5. Keep all new code fully typed. Avoid `any`; use precise types or `unknown` when data is truly dynamic.
6. Validate backend request payloads with Zod and return clear API errors through the existing centralized error handling path.
7. Keep frontend UI resilient to API failures with visible, user-friendly error messages and no render crashes.

## Project Constraints

1. Do not add WebSockets, Socket.io, server-sent events, or any real-time push protocol. Synchronization must use HTTP polling.
2. Do not add databases, persistence services, local storage persistence for game state, or external storage. Rooms remain in memory only.
3. Do not add authentication, sessions, JWTs, OAuth, accounts, or user identity systems.
4. Do not introduce deployment, Docker, CI, hosting, or infrastructure work.
5. Do not add new state-management or routing libraries beyond the starter stack.
6. Do not expand scope into multiple rounds, drawer rotation, timers, speed bonuses, custom word packs, spectator mode, or moderation features.

## Game Rule Principles

1. Creating a room makes the creator the host.
2. Rooms are isolated by unique room code.
3. Player names are trimmed; empty or whitespace-only names are rejected with clear feedback.
4. Lobby state refreshes through polling at approximately a two-second cadence.
5. Only the host can start a game, and only when at least two players are present.
6. The first round assigns the host or first player as drawer, according to the final feature specification.
7. The secret word is visible only to the drawer before result state.
8. Guess text is trimmed, empty guesses are rejected, and matching is case-insensitive.
9. Correct guesses score 100 points; incorrect guesses score 0.
10. Restart preserves players and returns everyone to lobby while clearing round-specific state.

## AI Usage Rules

1. Inspect existing code before changing it and record assumptions when behavior is ambiguous.
2. Use AI output as a draft, not as authority; verify it against README scenarios, AGENTS.md constraints, and tests.
3. Do not invent features outside the assignment scope to make the app feel more complete.
4. Prefer explicit acceptance criteria and small validation steps before moving to the next scenario.
5. Keep generated artifacts concise, traceable to real files, and updated as implementation decisions change.

## Review Discipline

1. Review every change for scope creep, type safety, validation coverage, and frontend/backend contract consistency.
2. Add or update tests for backend room logic, API validation, and frontend API/store behavior when those surfaces change.
3. Manually validate multiplayer flows with at least two browser tabs for scenario-level acceptance checks.
4. Check that polling remains bounded and does not create unnecessary memory or network load.
5. Before committing, confirm no forbidden technologies or out-of-scope features were introduced.
