# Feature Specification: Scribble Multiplayer Drawing Game

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Implement Scribble drawing game with Express backend, React frontend, in-memory room store, HTTP polling synchronization, host-only game start and restart, player name trimming, deterministic secret word selection, masked word visibility, interactive canvas, case-insensitive guess submission, scoring, and lobby redirection."

## Scenario Index

Implementation is split into independent scenario specifications. Each scenario has its own `spec.md`, `plan.md`, and `tasks.md`.

| Priority | Scenario | Folder |
|----------|----------|--------|
| P1 | Room Setup & Lobby | [specs/001-room-setup-lobby/spec.md](../001-room-setup-lobby/spec.md) |
| P2 | Game Start & Drawer Flow | [specs/002-game-start-drawer/spec.md](../002-game-start-drawer/spec.md) |
| P3 | Gameplay Interaction | [specs/003-gameplay-interaction/spec.md](../003-gameplay-interaction/spec.md) |
| P4 | Result, Restart & Final Validation | [specs/004-result-restart/spec.md](../004-result-restart/spec.md) |

Shared design artifacts for all scenarios live in this folder: [contracts/](./contracts/), [research.md](./research.md), [quickstart.md](./quickstart.md), [checklists/](./checklists/).

## Cross-Cutting Requirements

These apply across all scenarios (details per scenario in linked specs):

- **FR-001**: Backend MUST trim and validate `playerName` on room creation and joining.
- **FR-004**: Frontend MUST poll backend room state every 2 seconds on lobby and gameplay pages.
- **FR-005**: Frontend MUST restrict "Start Game" and "Restart Game" buttons to the host.
- **FR-012**: Frontend MUST redirect based on room status (`lobby` ↔ `playing` ↔ `result`).

See [contracts/api.md](./contracts/api.md) and [contracts/data-model.md](./contracts/data-model.md) for full API and entity definitions.

## Key Entities

- **Room**: `code`, `status`, `hostId`, `participants`, `drawerId`, `secretWord`, `canvasData`, `guesses`, `scores`
- **Participant**: `id`, `name`, `joinedAt`
- **Guess**: `participantId`, `participantName`, `text`, `isCorrect`, `timestamp`
- **Line**: `color`, `width`, `points`

## Success Criteria (Program-Level)

- **SC-001**: 2 players can connect, join the same lobby, and start a game in under 1 minute.
- **SC-002**: Drawings update on guesser screens within 2.5 seconds of the drawer painting.
- **SC-003**: 100% of empty or whitespace player names and guesses are rejected.
- **SC-004**: 100% of non-host players are restricted from starting or restarting a game.

## Assumptions

- **A-001**: Users have stable internet capable of HTTP requests every 2 seconds.
- **A-002**: Backend is in-memory only; service restart clears all rooms.
- **A-003**: Single round per session; drawer rotation and multi-round play are out of scope.

## Edge Cases (Shared)

- **Empty Inputs**: Create, join, and guess with whitespace-only text must be rejected.
- **Room Code Case Sensitivity**: Join codes are case-insensitive (normalized to uppercase).
- **Multi-room Isolation**: Actions in one room must not affect other rooms.
- **Viewer Role**: Snapshot `viewerRole` must resolve as `"drawer"` or `"guesser"` per participant.
