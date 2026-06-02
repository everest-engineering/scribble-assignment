# Tasks: Gameplay Interaction

1. **Add Stroke and Guess models** — Extend backend models and frontend types
   - Depends on: Feature 002 complete

2. **Implement addStroke and clearCanvas** — Service functions with drawer authorization
   - Depends on: task 1

3. **Implement submitGuess** — Trim, case-insensitive match, scoring, result transition
   - Depends on: task 1

4. **Add stroke/guess/clear routes** — Schemas and handlers in rooms.ts
   - Depends on: tasks 2, 3

5. **Create DrawingCanvas component** — Canvas with draw/clear for drawer, read-only for guessers
   - Depends on: task 1

6. **Wire GuessForm** — Connect to roomStore.submitGuess; disable for drawer
   - Depends on: task 3

7. **Update Scoreboard** — Live scores from snapshot
   - Depends on: task 1

8. **Update GamePage** — Canvas, guess history, polling during playing
   - Depends on: tasks 5, 6, 7

9. **Frontend API methods** — addStroke, clearCanvas, submitGuess in api.ts and roomStore
   - Depends on: task 4

10. **Unit tests + two-browser validation**
    - Depends on: tasks 8, 9
