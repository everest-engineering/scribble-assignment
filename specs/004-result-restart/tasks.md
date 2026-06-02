# Tasks: Result, Restart & Final Validation

1. **Update toRoomSnapshot for result** — Include revealedWord when status is result
   - Depends on: Feature 003 complete

2. **Implement restartGame** — Host + result checks; clear round fields; preserve participants
   - Depends on: task 1

3. **Add POST /rooms/:code/restart route** — Schema and handler
   - Depends on: task 2

4. **Update ResultPanel** — Revealed word, scores, guess history, host restart button
   - Depends on: task 1

5. **Update GamePage** — Result UI, disable inputs during result, lobby redirect on poll
   - Depends on: tasks 4, 3

6. **Frontend restartGame API + store** — api.restartGame, roomStore.restartGame
   - Depends on: task 3

7. **Unit tests for restartGame**
   - Depends on: task 2

8. **End-to-end validation** — Two browsers, builds, precheck script
   - Depends on: tasks 5, 6, 7

9. **Write reflection.md**
   - Depends on: task 8
