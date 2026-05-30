# Quickstart: Round Result & Restart

## What This Feature Does

1. **Round end**: When all guessers guess correctly (or the host ends the round), the room transitions from `"playing"` to `"result"` state.
2. **Result screen**: All players see the secret word, final ranked scores, and full guess history. The correct/winning guess is highlighted.
3. **Restart**: The host clicks "Restart" → all players return to lobby → host manually clicks "Start Game" for the next round.

## Key Implementation Steps

### Backend (in order)

1. **`game.ts`** — Add `"result"` to `RoomStatus` type
2. **`schemas.ts`** — Add `roundEndBodySchema`, `restartBodySchema`
3. **`roomStore.ts`** —
   - Add `endRound(code, participantId)` — sets `room.status = "result"`; only host can call
   - Add `restartGame(code, participantId)` — sets `status = "lobby"`, clears `currentRound`, resets `scores`, preserves participants; only host can call
   - Modify `toRoomSnapshot` — when `status === "result"`, include `currentWord` for ALL viewers; when `status === "lobby"` after restart, exclude round data
   - Modify `submitGuess` — after processing a correct guess, check if all guessers have scored. If so, auto-transition to `"result"` and return updated status
4. **`rooms.ts`** — Add routes for `POST /:code/round/end` and `POST /:code/restart`

### Frontend (in order)

1. **`api.ts`** — Add `endRound(code, participantId)` and `restartGame(code, participantId)` API functions; export `RoomStatus` with `"result"` value
2. **`roomStore.ts`** — Add `endRound()` and `restartGame()` methods; polling loop already handles any room status
3. **`ResultPage.tsx`** — New page: display word (all players see it), ranked scores, full guess history. Host sees "Restart / Play Again" button. Non-host sees "Waiting for host..." message. Navigate to `/lobby` when `room.status` changes back to `"lobby"`
4. **`App.tsx`** — Add `/result` route pointing to `ResultPage`
5. **`GamePage.tsx`** — Navigate to `/result` when `room.status === "result"`; hide guess input for guessers who already guessed correctly

## Verification

```text
Two-browser test:
1. Host creates room, player joins
2. Host starts game → navigated to /game
3. Player submits correct guesses → round ends → both see /result
4. Word, scores, and guess history visible to both
5. Host clicks Restart → both in lobby, same players, no round data
6. Host clicks Start Game → new round begins
```

## Edge Cases to Test

- Round ends with zero guesses submitted (empty guess history, all scores 0)
- Non-host tries to restart (403)
- Host opens a second tab during result screen (sees same result data)
- Host restarts while a player has slow polling (late player lands in lobby)
- Player joins during result screen (sees result data)
- Host disconnects during result screen (host transfers to next player)
- 10 consecutive restart → start → play → result cycles (no data contamination)
