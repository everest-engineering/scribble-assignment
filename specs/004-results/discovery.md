# Scenario 4 Discovery: Result State & Restart

## Gaps (Incomplete Behaviors)

- There is no backend transition from `"game"` to `"results"`.
- The correct word remains masked from guessers even after game completion.
- The UI does not render a read-only result state with final scores and guess history.
- There is no host-only restart operation from result state.
- There is no round-state reset while preserving room participants.
- The frontend does not redirect polling participants back to lobby after restart.

## Assumptions

- The host is responsible for restarting the room after results.
- The first correct guess may also transition the room into `results`; host restart remains the mechanism for moving players back to `lobby`.
- The result screen appears on the same game route.
- Restart preserves participants, host ID, and room code, while clearing round state.
- All clients should converge back to the lobby status via polling.
