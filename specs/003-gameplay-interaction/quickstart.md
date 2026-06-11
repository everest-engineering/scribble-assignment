# Quickstart: Gameplay Interaction Validation

## Prerequisites

- Backend running: `cd backend && npm run dev` (port 3001)
- Frontend running: `cd frontend && npm run dev` (port 5173)
- Two browser tabs open at `http://localhost:5173`

## Scenario 1: Drawing Sync

1. **Tab A** (host): Create room → enter display name → share room code
2. **Tab B** (joiner): Join room using code → enter display name
3. **Tab A**: Click "Start Game" → see canvas with drawing tools
4. **Tab B**: See canvas area with "{drawer name} is drawing..." placeholder
5. **Tab A**: Draw a line on the canvas using the default black brush
6. **Tab B**: Within 3 seconds, see the same line appear on their canvas
7. **Tab A**: Switch to red color, draw another line
8. **Tab B**: Within 3 seconds, see the red line appear

**Expected**: Tab B's canvas mirrors Tab A's strokes incrementally (stroke by stroke, not full-page refresh).

**Validation command** (backend-only):
```bash
# Get initial canvas state
curl -s http://localhost:3001/api/rooms/ABCD/canvas?participantId=... | jq '.strokes | length'
```

## Scenario 2: Guess Submission

1. **Tab B (guesser)**: Type a word into the guess input and click "Submit Guess"
2. **Tab B**: See feedback immediately (correct = green highlight, incorrect = red/grey)
3. **Both tabs**: See the guess appear in the Activity panel within 3 seconds

**Expected**: Incorrect guess shows in guess log as incorrect. Guesser can continue guessing.

## Scenario 3: Correct Guess & Scoring

1. **Tab B (guesser)**: Type the exact secret word (case-insensitive) and submit
2. **Tab B**: See green highlight confirming correct guess, score increases by 100
3. **Both tabs**: See the correct guess in the Activity/guess log, visually distinguished
4. **Tab B**: Try submitting another guess → see notification "Already guessed correctly" or score unchanged

**Expected**: Exactly 100 points awarded. No additional points for subsequent guesses.

## Scenario 4: Round End (all guessed)

1. If multiple guessers exist: all guessers submit the correct word
2. After the last guesser guesses correctly → all participants see results screen within 2 seconds
3. Results screen shows: secret word revealed, final scores, full guess log

**Expected**: Room status is "finished". Canvas is cleared. Word visible to everyone.

## Scenario 5: Host Ends Round Early

1. Start a new game (reload frontend or restart backend)
2. **Tab A (host)**: Draw a few lines
3. **Tab A**: Click "End Round" button
4. Both tabs: See results screen within 2 seconds
5. Non-guessing guessers: No points awarded (they didn't guess correctly)

**Expected**: Host-only "End Round" visible. Drawer who is not host cannot end round.

## Scenario 6: Error Handling

1. **Tab B (guesser)**: Submit an empty guess → see validation message
2. **Tab B**: Submit whitespace-only guess → see validation message
3. **Tab B**: Guess the same incorrect word twice → both appear in guess log
4. **Tab A (drawer)**: Check that guess form is disabled/hidden
5. **Both tabs**: Refresh browser mid-round → see current canvas state and guess history on reload

**Expected**: No crashes. Error messages clear and actionable.

## API Contract References

- Canvas endpoints: [contracts/api-v1.md](contracts/api-v1.md#post-roomscodedraw)
- Guess endpoint: [contracts/api-v1.md#post-roomscodeguess)
- Round end endpoint: [contracts/api-v1.md#post-roomscodeend-round)
- Extended room snapshot: [contracts/api-v1.md#get-roomscode-extended)

## Data Model References

- Stroke, CanvasState, Guess types: [data-model.md](data-model.md)
- Validation rules table: [data-model.md](data-model.md#validation-rules)
