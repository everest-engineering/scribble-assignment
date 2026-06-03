# Quickstart: Testing Gameplay Interaction

## Prerequisites
- Backend and frontend running
- Game started with at least 2 players (host as drawer, one guesser)

## Steps

1. **Test drawing as drawer**:
   - As the host/drawer, draw on the canvas in the GamePage
   - Verify strokes appear on your screen immediately
   - In a second browser tab (guesser), verify strokes appear within ~2 seconds

2. **Test canvas clear**:
   - As the drawer, click "Clear Canvas" button
   - Verify canvas is emptied on both drawer and guesser screens

3. **Test guess submission (incorrect)**:
   - As a guesser, type "car" in the guess input and submit
   - Verify the guess appears in the guess history
   - Verify score remains 0

4. **Test guess submission (correct)**:
   - As a guesser, type "ROCKET" in the guess input
   - Verify the guess is marked as correct in history
   - Verify score increases to 100

5. **Test guess validation**:
   - Submit an empty guess → error message shown
   - Submit whitespace-only guess "   " → error message shown
   - Submit "  rocket  " → trimmed and matches correctly

6. **Test drawer cannot guess**:
   - As the drawer, verify no guess input is shown

7. **Test guess history visibility**:
   - Verify all players (drawer and guessers) see the same guess history
