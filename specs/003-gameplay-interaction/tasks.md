# Tasks: Gameplay Interaction

| # | Task | Dependencies | Status |
|---|------|-------------|--------|
| 1 | Backend: Add Guess type, guesses[], scores{} to Room model | S2 Complete | Done |
| 2 | Backend: Add guess validation schema (trim, non-empty) | S2 Complete | Done |
| 3 | Backend: Add `submitGuess()` -- case-insensitive compare, award 100 | 1, 2 | Done |
| 4 | Backend: Add `POST /:code/guess` route | 3 | Done |
| 5 | Backend: Write tests for guess submission, scoring, validation | 1-4 | Done |
| 6 | Frontend: Add submitGuess and Guess type to API service | 1, 4 | Done |
| 7 | Frontend: Add submitGuess to room store | 6 | Done |
| 8 | Frontend: Create interactive canvas component for drawer | None | Done |
| 9 | Frontend: Wire GuessForm to submit via API | 7 | Done |
| 10 | Frontend: Update Scoreboard to show live scores from snapshot | 6 | Done |
| 11 | Frontend: Add guess history display to GamePage | 6 | Done |
| 12 | Validate Scenario 3 with two browser tabs | 1-11 | Done |
