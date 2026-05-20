# Quickstart: Result, Restart & Final Validation

## Implementation Order

1. **Backend: Add `"result"` to RoomStatus + `timerDuration` to Room** — `game.ts`
2. **Backend: Add `endRound()` service** — detect triggers (allGuessersCorrect, timerExpiry), set status → `"result"`
3. **Backend: Add `restartGame()` service** — host-only, clears round, status → `"lobby"`
4. **Backend: Add `POST /:code/restart` route** — `rooms.ts`
5. **Backend: Integrate `endRound()` check into `submitGuess()` and `getRoom()`** — auto-detect round end
6. **Frontend: Create `ResultView` component** — shows correct word, scores, history, canvas, restart button
7. **Frontend: Update `GamePage`** — detect `"result"` status → render `ResultView`; detect `"lobby"` status → navigate to `/lobby`
8. **Frontend: Add `restartGame()` to roomStore** — calls `POST /:code/restart`
9. **Build & test**: `npm run build` both backend and frontend; two-tab manual test

## Verification Checklist

- [ ] Round ends when all guessers guess correctly → result state visible to all
- [ ] Round ends when timer expires → result state visible to all
- [ ] Result state shows correct word, final scores, guess history, canvas
- [ ] Non-host players do NOT see restart button
- [ ] Host clicks restart → all players return to lobby
- [ ] Player list preserved after restart
- [ ] Round state (canvas, guesses) cleared after restart
- [ ] Cumulative scores preserved after restart
- [ ] Host can start a new game from lobby after restart
- [ ] Backend `npm run build` passes
- [ ] Frontend `npm run build` passes
