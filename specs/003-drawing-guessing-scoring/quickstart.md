# Quickstart: Drawing, Guessing, and Scoring

## Setup
1. Backend: `cd backend && npm run dev`
2. Frontend: `cd frontend && npm install react-sketch-canvas && npm run dev`

## Verification Flow
1. **Tab A (Drawer)**:
   - Create room, start game.
   - Select a color (e.g., Red) and draw a line.
   - Click "Clear Canvas" and verify it wipes for everyone.
2. **Tab B (Guesser)**:
   - Join room.
   - Observe Tab A's drawings appear within 2 seconds.
   - Type `"  RoCkEt  "` in the guess box and submit.
   - Observe 100 points added to Bob's score on the scoreboard.
   - Observe the guess appear in the history log with a "Correct!" label.
3. **Cheating Verification**:
   - In Tab B, try to draw on the canvas (should be locked).
   - In Tab B, submit the correct word again (score should NOT increase).
4. **Validation**:
   - In Tab B, submit an empty guess (nothing should happen).
