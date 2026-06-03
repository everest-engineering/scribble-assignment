# Scribble Assignment Reflection

## What The Starter Already Had

The starter provided a React/Vite frontend, an Express/TypeScript backend, routing for the main screens, room creation, room joining, room snapshots, and placeholder game UI.

## What I Added

- Completed the one-round Scribble game flow across the existing React/Vite frontend and Express/TypeScript backend.
- Added host tracking, validated player names and room codes, lobby polling, room isolation, and host-only start preconditions.
- Added active round state with deterministic starter word selection, host-as-drawer assignment, initialized scores, drawing state, guess history, and viewer-specific snapshots.
- Added drawer-only drawing and clear actions, guesser-only guess submission, empty guess rejection, case-insensitive correct guess matching, incorrect/correct guess history, 100-point scoring, and result transition.
- Added result state with final word visibility, scores, full guess history, and host-only restart back to lobby while preserving participants.
- Added backend, frontend service/store, and render-level tests for the assignment scenarios.

## AI-Assisted Workflow

Work followed the Spec Kit flow: discovery, constitution, specification, plan, tasks, implementation, validation, and reflection. The feature was implemented in granular scenario commits after the spec, plan, and task artifacts were created and reviewed.

## Tradeoffs

- Polling was kept at the assignment-approved 2-second cadence instead of introducing WebSockets.
- Game state remains in the backend in-memory room store, matching the starter scope and avoiding persistence, authentication, or deployment changes.
- The drawing surface uses simple SVG stroke synchronization. This keeps the implementation testable and dependency-free, but it is intentionally not a full drawing tool with colors, widths, undo, or smoothing.
- The first round assigns the host as drawer and selects the first starter word deterministically, matching the single-round assignment constraints.
- Tests focus on service behavior, API/store request handling, and render output rather than E2E automation.

## Validation Summary

- Backend `npm run test` passed with 21 tests.
- Backend `npm run build` passed.
- Frontend `npm run test` passed with 21 tests.
- Frontend `npm run build` passed.
- Manual two-browser validation passed for create, join, start, role visibility, drawing sync, clear sync, invalid/incorrect/correct guesses, result view, scoring, and host restart.

## Remaining Limitations

- No WebSocket live updates; all synchronization uses polling.
- No persistent storage; rooms reset when the backend process restarts.
- No authentication or session recovery beyond the current in-memory participant id held by the frontend store.
- Only a single round is implemented; drawer rotation and timers are out of scope for this assignment.
