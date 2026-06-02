# Quickstart: Gameplay Interaction

## Prerequisites

- Backend and frontend dependencies are installed.
- Feature Group 2 behavior is present: creating a room, joining, host-only start, drawer assignment, deterministic word selection, and drawer-only word visibility.

## Implementation Checklist

1. Extend backend game models with canvas, guess history, score, and scoring-tracker fields.
2. Initialize blank gameplay state when `startRoom` creates the active round.
3. Add room service operations for drawer stroke append, drawer clear, and guess submission.
4. Add Zod schemas and routes for drawing, clearing, and guessing.
5. Extend room snapshots so polling returns canvas, guess history, and scores while preserving guesser-safe secret-word visibility.
6. Extend frontend API service and room store with gameplay mutation methods.
7. Replace placeholder canvas, guess, score, and activity UI with active gameplay components.
8. Add gameplay polling to `GamePage` using the existing 2-second lifecycle pattern.
9. Add focused backend and frontend tests.
10. Run human review against the spec and constitution before accepting the implementation.

## Validation Commands

Run from the repository root:

```sh
cd backend && npm test && npm run build
```

```sh
cd frontend && npm test && npm run build
```

## Manual Two-Tab Flow

1. Start the backend and frontend dev servers.
2. Create a room as Alice in one tab.
3. Join the same room as Bob in a second tab.
4. Start the game as Alice.
5. Confirm Alice is the drawer and sees the secret word.
6. Confirm Bob is a guesser and does not see the secret word.
7. Draw on Alice's canvas and confirm Alice sees the marks.
8. Clear the canvas and confirm the canvas returns to blank.
9. Submit a whitespace guess as Bob and confirm user feedback appears with no history or score change.
10. Submit an incorrect guess as Bob and confirm it appears in history with 0 points.
11. Submit the correct word with different capitalization and surrounding spaces; confirm Bob receives exactly 100 points.
12. Submit the same correct word again and confirm Bob's score does not increase again.
13. Keep both tabs open and confirm guess history and scores synchronize through polling without refresh.

## Room Isolation Flow

1. Create and start Room A with two players.
2. Create and start Room B with two different players.
3. Draw, clear, and guess in Room A.
4. Confirm Room B's canvas, guess history, scores, drawer, and participants remain unchanged.

## Review Notes

- Verify no WebSockets, server-sent events, long polling, databases, authentication, timers, multiple rounds, or drawer rotation were added.
- Verify backend validation rejects invalid room, participant, role, drawing, and guess payloads before mutation.
- Verify frontend validation gives immediate empty-guess feedback and still relies on backend validation for shared state.
- Verify polling intervals are cleaned up when leaving the gameplay page.
