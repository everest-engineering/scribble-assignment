# Reflection

## Summary

The Scribble assignment was implemented across 4 scenarios, adding multiplayer drawing game functionality to an Express + React TypeScript starter. All 26 files were modified/created with 45 backend tests and 4 frontend tests passing, and both projects building cleanly.

## What Went Well

- The deterministic word selection (char-code sum modulo word count) made testing reproducible and behavior predictable.
- The spec-first approach with acceptance criteria kept each scenario focused and testable.
- HTTP polling at 2s intervals was simple to implement and debug compared to WebSockets.
- Server-side gating of `secretWord` (only drawer sees it) was the right architectural choice -- enforced at the snapshot level rather than relying on frontend logic.
- The `structuredClone` approach for room snapshots prevented accidental mutation bugs.

## Challenges

- The Spec Kit directory structure was initially created incorrectly (flat files at root instead of `specs/NNN-*/` subdirectories with `spec.md`/`plan.md`/`tasks.md`). This required a restructuring pass to match the required convention.
- The auto-transition to "result" state on correct guess broke one existing test (duplicate correct guess), requiring a test update since the second call now correctly rejects with "Game is not in progress".
- Balancing the polling approach meant ensuring the lobby redirect on restart was triggered by polling detecting `status === "lobby"`, which required a `useEffect` watching `room.status` in `GamePage`.

## Deviations from Spec

- No manual end-round endpoint was implemented. The spec mentioned "or manually ended" but we chose auto-end on first correct guess as the primary mechanism, since no UI was specified for manual ending.
- The `submitGuess()` service both records the guess and transitions state, rather than having a separate `endRound()` function. This kept the flow simple -- the correct guess is the single trigger.

## Key Decisions

- **Auto-end round on correct guess**: Keeps the game loop tight. No need for an explicit "end round" action.
- **Host always first drawer**: Simplest interpretation that matches spec wording.
- **No canvas sync to guessers**: Explicitly out of scope (client-side only).
- **Restart preserves participants**: Players don't need to rejoin after a round ends.
- **100 points per correct guess**: Simple scoring that's easy to verify.
