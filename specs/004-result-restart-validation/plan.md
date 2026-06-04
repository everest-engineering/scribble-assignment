# Plan: Result, Restart & Final Validation

## Data Flow

```
End Round:
  Triggered by correct guess in submitGuess()
    -> Set status = "result"
    -> Reveal correctWord to all (in snapshot)

Restart:
  POST /rooms/:code/restart { participantId }
    -> Validate participant is host (403 if not)
    -> Reset: drawerId="", secretWord="", round=0, guesses=[], scores={}
    -> Set status = "lobby"
    -> Participants preserved
    -> 200 { room: RoomSnapshot with status="lobby" }
```

## File-Level Implementation Sequence

| Order | Files | Purpose |
|-------|-------|---------|
| 1 | `backend/src/models/game.ts` | Add "result" status, correctWord to RoomSnapshot |
| 2 | `backend/src/api/schemas.ts` | Add restartGame schema |
| 3 | `backend/src/services/roomStore.ts` | Auto-end round on correct guess, restartGame() |
| 4 | `backend/src/api/rooms.ts` | POST restart route |
| 5 | `frontend/src/services/api.ts` | restartGame method, result status type |
| 6 | `frontend/src/state/roomStore.ts` | restartGame store method |
| 7 | `frontend/src/pages/GamePage.tsx` | Result state UI, lobby redirect on restart |
| 8 | `frontend/src/styles/app.css` | Correct word reveal styles |
| 9 | Tests | S4 API and behavior tests |
