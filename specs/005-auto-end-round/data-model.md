# Phase 1 Data Model: Auto-end Round on Correct Guess

**No schema change.** This increment changes one behavior; it adds no fields, entities, or endpoints.

## Affected state

- `Room.status` — already `"lobby" | "active" | "result"` (Group 4). A correct guess now drives the
  `active → result` transition automatically (previously only the host's End Round did).
- `Participant.score`, `Room.secretWord`, `Room.guesses`, `RoomSnapshot.word` — unchanged. The word is already
  revealed to all at `result` (Group 4), so the auto-end inherits that.

## Behavior delta — `submitGuess(code, participantId, text)`

```text
submitGuess(code, participantId, text):
    room ← rooms.get(code)                  else 404
    if room.status != "active"              → 409 "The round is not active."   (FR-004)   ← NEW guard
    if participantId == room.drawerId       → 403 "The drawer cannot guess."    (unchanged)
    trimmed = text.trim(); if empty         → 400 "Enter a guess."              (unchanged)
    if guesser.score == 100                 → 409 "You already guessed the word." (unchanged)
    correct = trimmed.toLowerCase() == secretWord.toLowerCase()                 (unchanged)
    append guess to room.guesses                                                (unchanged)
    if correct and guesser.score == 0:
        guesser.score = 100                                                     (unchanged)
        room.status   = "result"                                               (FR-001)    ← NEW
    return snapshot
```

## Validation rules (traced to FRs)

| Rule | Where | FR |
|------|-------|----|
| Correct guess scores then ends round (→ result) | `submitGuess` sets `status="result"` | FR-001 |
| Auto-end produces the same result reveal as host End Round | reuses Group 4 `result` + `toRoomSnapshot` | FR-002 |
| Incorrect guess does not end the round | only set `result` when `correct` | FR-003 |
| No guesses accepted once the round isn't active | `submitGuess` active-guard | FR-004 |
| Host End Round remains as a fallback | `endRound` unchanged | FR-005 |
| Groups 1–4 behaviors preserved | additive guard + transition only | FR-006 |
