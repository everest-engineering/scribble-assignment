# Feature Group 4: Result, Restart & Final Validation

## Scenario

Given a round has ended, when the result state is displayed and the host restarts, then all players see the correct word, final scores, and complete guess history; the same players are preserved; all round-specific state is cleared; and everyone returns to the lobby through HTTP polling.

## Acceptance Criteria

1. Given a round has ended, when any participant views the result state, then the correct word is displayed.
2. Given a round has ended, when any participant views the result state, then final scores for all participants are displayed.
3. Given a round has ended, when any participant views the result state, then the complete guess history is displayed.
4. Given a round has ended, then the result state is visible to drawer and guessers through room snapshots.
5. Given the host is viewing the result state, then the host can restart the room.
6. Given a non-host is viewing the result state, then restart controls are unavailable or disabled.
7. Given a non-host calls the restart API directly, then the backend rejects the request.
8. Given the host restarts the room, then the room status returns to lobby.
9. Given the host restarts the room, then all existing participants remain in the room.
10. Given the host restarts the room, then host identity is preserved.
11. Given the host restarts the room, then drawer assignment is cleared.
12. Given the host restarts the room, then secret word and correct word state are cleared.
13. Given the host restarts the room, then drawing state is cleared.
14. Given the host restarts the room, then guess history is cleared.
15. Given the host restarts the room, then scores are reset or removed so the next game can start from 0.
16. Given non-host participants are polling, when the host restarts, then they return to the lobby on their next poll.
17. Given the room is in lobby after restart, then no participant can see the previous correct word or previous guess history in the room snapshot.

## Restart Rules

1. Only the host can restart a room.
2. Restart is only valid from a completed/result state.
3. Restart must preserve room code.
4. Restart must preserve all current participants.
5. Restart must preserve the original `hostParticipantId`.
6. Restart must set room status back to `lobby`.
7. Restart must clear `drawerParticipantId`.
8. Restart must clear the selected word and any result/correct-word exposure.
9. Restart must clear drawing state.
10. Restart must clear guess history.
11. Restart must clear round scores so a future game starts every participant at 0.
12. Restart must update the room timestamp so polling clients receive the changed snapshot.
13. Restart must not create a new room.
14. Restart must not remove participants.
15. Restart must not start the next round automatically.
16. Restart must not introduce WebSockets, persistence, authentication, multiple rounds, timers, or drawer rotation.

## Edge Cases

1. Non-host attempts restart through UI or direct API call.
2. Unknown participant attempts restart.
3. Restart is requested for an unknown room code.
4. Restart is requested while the room is still in lobby.
5. Restart is requested while a round is active but not yet in result state.
6. Host restarts after no guesses were submitted.
7. Host restarts after only incorrect guesses were submitted.
8. Host restarts after one or more correct guesses were submitted.
9. A participant polls while restart is in flight.
10. A participant refreshes after restart and has no local participant id.
11. Previous drawing state must not appear after restart.
12. Previous guess history must not appear after restart.
13. Previous correct word must not appear after restart.
14. Players must remain in original join order after restart.
