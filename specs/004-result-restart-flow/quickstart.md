# Quickstart: Result, Restart & Final Validation

## Setup
1. Backend: `cd backend && npm run dev`
2. Frontend: `cd frontend && npm run dev`

## Verification Flow
1. **Tab A (Host)**:
   - Create room, start game.
2. **Tab B (Guesser)**:
   - Join room, guess the word.
3. **Finish Round**:
   - In Tab A, click "Finish Round".
   - Verify both tabs see the secret word and final scoreboard.
   - Verify Tab B cannot submit any more guesses.
4. **Restart**:
   - In Tab A, click "Restart Game".
   - Verify both tabs return to the Lobby.
   - Verify scores from the previous round are preserved.
5. **Rotation**:
   - In Tab A, click "Start Game" again.
   - Verify **Tab B** is now the drawer (Roles rotated).
