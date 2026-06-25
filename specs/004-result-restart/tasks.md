# Tasks: Result, Restart & Final Validation

## Dependencies

- 003-gameplay (correct guess → result status)

## Ordered Tasks

1. [ ] Update toRoomSnapshot: expose secretWord to all when status is result
2. [ ] Implement restartGame in roomStore (host check, status check, reset)
3. [ ] Add restart route and schema
4. [ ] Extend frontend API and roomStore with restartGame
5. [ ] Update GamePage: result view (word, scores, history)
6. [ ] Add host-only Restart button on result screen
7. [ ] Auto-navigate to /lobby when polled status returns to lobby
8. [ ] Add backend tests for restart reset behavior
9. [ ] Run full two-tab end-to-end validation
10. [ ] Run backend/frontend build and test
11. [ ] Write reflection.md
