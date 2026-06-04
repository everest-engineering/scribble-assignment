# Reflection

## What Went Well

The implementation covers all four scenarios with a clean separation of concerns. The backend room store handles the full game lifecycle (lobby → playing → finished → lobby) with proper validation at each transition. Host tracking, drawer assignment, deterministic word selection, case-insensitive guessing, and scoring all work correctly. Polling at 2-second intervals keeps all clients synchronized without violating the no-WebSockets constraint.

The frontend components follow the existing patterns (class-based store with Context + useSyncExternalStore, functional components, React Router v6). The DrawingCanvas component uses native HTML Canvas API with Pointer Events, avoiding external dependencies.

Tests cover name validation, host permissions, participant count checks, guess comparison, and restart behavior — 29 tests total across backend and frontend.

## Challenges

The canvas drawing synchronization was the most complex part. Since WebSockets are forbidden, all drawing data must be stored on the server and fetched via polling. Strokes are sent immediately on completion (pointerup), and all clients redraw the full stroke list on each poll. This introduces a minor visual delay for non-drawers but stays within the requirements.

## What Could Be Improved

The secret word selection could be more varied — currently it always selects the first word for determinism. A more engaging approach would use a seeded pseudo-random generator based on room state, maintaining determinism while providing variety.

The drawing experience is basic (single color, fixed line width). Future iterations could add color selection, brush size, and undo support.

## Spec Artifact Structure

- `.specify/discovery.md` — Initial analysis of incomplete behaviors and assumptions
- `.specify/memory/constitution.md` — Architecture decisions and constraints
- `specs/001-room-setup/` — Room creation, joining, lobby polling, host controls
- `specs/002-game-start/` — Drawer assignment, word selection, name validation
- `specs/003-gameplay/` — Canvas drawing, guess submission, scoring, guess history
- `specs/004-result-restart/` — Results display, game restart
- `reflection.md` — This file
