# Tasks: Result, Restart & Final Validation

| # | Task | Dependencies | Status |
|---|------|-------------|--------|
| 1 | Backend: Add `"result"` status to Room model | S3 Complete | Done |
| 2 | Backend: Auto-end round on correct guess, reveal correctWord to all in result | 1 | Done |
| 3 | Backend: Add `restartGame()` -- reset round state, keep players | 1 | Done |
| 4 | Backend: Add `POST /:code/restart` route | 3 | Done |
| 5 | Backend: Write tests for result and restart flows | 1-4 | Done |
| 6 | Frontend: Add restartGame to API service and room store | 4 | Done |
| 7 | Frontend: Add result state UI to GamePage (scores, history, word) | 2 | Done |
| 8 | Frontend: Add host-only restart button | 6 | Done |
| 9 | Frontend: Auto-redirect to lobby on restart (polling detects status change) | 8 | Done |
| 10 | Validate Scenario 4 with two browser tabs | 1-9 | Done |
