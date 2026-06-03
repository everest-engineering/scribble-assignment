# Scribble Assignment Design

**Date**: 2026-06-03
**Status**: Approved for Spec Kit artifact creation
**Branch**: `sdd-scribble-assignment`

## Goal

Complete the Scribble brownfield assignment using Spec-Driven Development discipline. The game is the implementation vehicle; the primary deliverable is a traceable workflow from discovery through constitution, specification, plan, tasks, implementation, validation, and reflection.

## Recommended Approach

Use one feature directory with four scenario-driven specification iterations:

1. Room setup and lobby
2. Game start and drawer flow
3. Gameplay interaction
4. Result, restart, and final validation

This keeps the assignment reviewable as one PR while preserving the required incremental Spec Kit process.

## Architecture

The existing React + Express structure should remain. The backend in-memory `roomStore` will be extended rather than replaced. The frontend `RoomStore`, pages, components, and CSS will be extended in place without adding new state-management or routing libraries.

Room lifecycle states will expand from `lobby` to:

- `lobby`
- `active`
- `result`

The room model will track host, participants, drawer, deterministic secret word, drawing data, guesses, scores, and result state. Snapshots will be viewer-specific so the drawer can see the word while guessers cannot.

## Backend Design

Backend work will add game-rule operations to `roomStore` and route them through REST endpoints. Expected operations include:

- create room with creator as host
- join room with trimmed, validated player name
- start game with host-only and two-player minimum checks
- update drawing and clear drawing
- submit guess with trimming, empty rejection, case-insensitive comparison, and deterministic scoring
- end round into shared result state
- restart to lobby while preserving participants and clearing round state

All state remains in memory. No database, auth, WebSockets, deployment, Docker, or new top-level dependencies are planned.

## Frontend Design

The frontend will keep the current page structure:

- Create and Join forms will show clear validation errors for empty names and invalid room codes.
- Lobby will poll room snapshots around every 2 seconds, show host status, and enable Start only for the host when at least two players are present.
- Game will poll snapshots, display role-specific content, provide drawer-only drawing controls, provide guesser guess submission, show synced guess history, and show scores.
- Result will show the correct word, final scores, full guess history, and a host-only restart action.

The drawing surface can be simple and assignment-focused: a canvas or equivalent interactive drawing area whose drawing state is serialized to the backend and displayed to all players through polling.

## Data Flow

The frontend sends mutations through REST endpoints. After each mutation, the client stores the returned viewer-specific snapshot. Polling refreshes the same snapshot using the room code and participant id. Backend snapshots are responsible for hiding the secret word from non-drawers.

## Error Handling

Errors should be user-visible and tied to the spec:

- empty or whitespace player names
- missing or unknown room code
- non-host attempting to start or restart
- start attempt with fewer than two players
- empty guesses
- drawing or guessing outside an active round
- restart outside result state

## Testing And Validation

Automated tests should cover backend game rules and key frontend state/UI behavior where practical. Manual validation should cover the full two-browser assignment flow:

1. Host creates a room.
2. Second player joins.
3. Lobby polling updates both tabs.
4. Host starts once two players are present.
5. Drawer sees the secret word; guesser does not.
6. Drawer draws and clears.
7. Guesser submits incorrect and correct guesses.
8. Scores and guess history sync.
9. Result displays shared final state.
10. Host restarts and both players return to lobby.

## Commit Strategy

Use granular commits:

- discovery notes
- constitution
- scenario specification iterations
- plan
- tasks
- implementation by feature group
- validation and reflection

Each implementation commit should remain traceable to a scenario and task range.

