# Plan: Result, Restart & Final Validation (Scenario 4)

## Backend

- `restartGame(code, participantId)` — host only, reset round fields, status lobby
- `toRoomSnapshot` includes `secretWord` for all viewers when status is "result"

## Frontend

- `ResultPanel` shows word, scores, guesses when status is "result"
- GamePage polls during "result", host restart button
- Auto-navigate to lobby when status returns to "lobby" after restart

## File Changes

| File | Change |
|------|--------|
| `roomStore.ts` | restartGame, snapshot reveals word on result |
| `rooms.ts` | POST restart route |
| `ResultPanel.tsx` | real result UI |
| `GamePage.tsx` | restart button, result polling |
