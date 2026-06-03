# Quickstart: Gameplay Interaction

## Starting the Game
1. Run backend: `cd backend && npm run dev`
2. Run frontend: `cd frontend && npm run dev`

## Testing the Flow
1. Open two browser tabs to the game room.
2. The designated Drawer draws on the canvas (changes appear instantly).
3. The Guesser submits a guess (<= 50 chars).
4. Both screens update with the new guess within 1 second via polling.
5. If the Guesser enters the correct word, their score increases by 100.
6. To test drawer timeout, close the Drawer's tab. The game should end after 10 seconds.
