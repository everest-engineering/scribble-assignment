# Tasks — Scenario 3: Gameplay Interaction

## Backend
- [x] T3.1 Add `guesses[]`, `scores{}`, `canvasData` to Room model
- [x] T3.2 Add `POST /rooms/:code/guess` endpoint with validation and scoring
- [x] T3.3 Add `PUT /rooms/:code/draw` endpoint for canvas data
- [x] T3.4 Add `POST /rooms/:code/clear-canvas` endpoint

## Frontend
- [x] T3.5 Implement interactive drawing canvas (mouse/touch in DrawingCanvas)
- [x] T3.6 Implement clear canvas button
- [x] T3.7 Connect GuessForm to API with validation
- [x] T3.8 Display guess history in ResultPanel
- [x] T3.9 Display scores in Scoreboard
- [x] T3.10 Poll game state for canvas and guess updates (usePolling in GamePage)
