# Quickstart: Result Restart Flow

## Prerequisites

- Backend and frontend dependencies are installed.
- Feature Group 3 behavior is present: drawing, clearing, guess submission, guess history, scoring, and gameplay polling.
- The room can reach an ended result state through the planned end-round transition.

## Implementation Checklist

1. Extend backend game models with result status and completed-round result data.
2. Add room service operation for ending a playing round and producing result state.
3. Add room service operation for host-only restart from result to lobby.
4. Ensure restart preserves room code, host, and participants while clearing active/completed round data, scores, canvas, guesses, secret word, drawer assignment, and correctness tracking.
5. Add Zod schemas and routes for end-round and restart mutations.
6. Extend room snapshots so polling returns result data in result state and clean lobby data after restart.
7. Update frontend API service and room store with end-round and restart methods.
8. Update `GamePage` status branching to render result state and return to lobby after polling sees restart.
9. Update `ResultPanel` to show revealed word, final scores, complete guess history, empty-history state, host restart control, and non-host waiting copy.
10. Add focused backend and frontend tests.
11. Run human review against the spec and constitution before accepting the implementation.

## Validation Commands

Run from the repository root:

```sh
cd backend && npm test && npm run build
```

```sh
cd frontend && npm test && npm run build
```

## Manual Result and Restart Flow

1. Start the backend and frontend dev servers.
2. Create a room as Alice in one tab.
3. Join the same room as Bob in a second tab.
4. Start the game as Alice.
5. Draw on Alice's canvas and submit at least one incorrect and one correct guess from Bob.
6. End the round.
7. Confirm both tabs show result state with the same revealed secret word.
8. Confirm both tabs show final scores for all players.
9. Confirm both tabs show complete guess history in submission order.
10. Confirm only Alice, the host, sees a restart control.
11. Restart from Alice's tab.
12. Confirm Alice returns immediately to the lobby with the same room code.
13. Confirm Bob returns to the lobby through polling without refreshing.
14. Confirm the player list is preserved.
15. Confirm previous canvas, guesses, scores, secret word, and drawer assignment are no longer visible.
16. Start another game using the existing start flow and confirm the new game receives fresh word and drawer assignment.

## Validation Edge Cases

1. End a round with no guesses and confirm result shows the secret word, final scores, and an empty guess-history state.
2. Attempt restart as a non-host and confirm shared state remains unchanged.
3. Attempt restart before the room reaches result state and confirm active gameplay state remains unchanged.
4. Attempt drawing, clearing, or guessing after result state and confirm the action is rejected.
5. Restart a room that has already returned to lobby and confirm old result data is not recreated.

## Room Isolation Flow

1. Create and start Room A with two players.
2. Create and start Room B with two different players.
3. End Room A and restart it.
4. Confirm Room B's status, room code, participants, canvas, guess history, scores, word, and drawer remain unchanged.
5. Confirm Room A remains accessible by the same room code with its original players in the lobby.

## Review Notes

- Verify no WebSockets, server-sent events, long polling, databases, authentication, timers, multiple rounds, or persistent result history were added.
- Verify restart does not start a new round automatically.
- Verify backend validation rejects missing room, unknown participant, non-host restart, invalid status, and gameplay mutation after result.
- Verify frontend validation hides or disables restart for non-hosts and handles restart errors without crashing.
- Verify polling intervals continue across result and restart transitions without duplicate timers and are cleaned up when leaving the room page.
- Verify late joiners after restart do not receive the previous secret word, guesses, canvas, scores, or drawer assignment.
