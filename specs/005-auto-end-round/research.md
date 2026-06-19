# Phase 0 Research: Auto-end Round on Correct Guess

Small refinement; decisions below (with rationale and rejected alternatives).

## D1 — End on the first correct guess

**Decision**: When `submitGuess` records a correct guess, after awarding 100 points set `room.status = "result"`.

**Rationale**: Matches the assignment's expectation (a correct guess ends the round and moves everyone to the
result state). Reuses the Group 4 `result` state, which already reveals the word to all and shows final
scores + history — so nothing new is needed downstream.

**Alternatives considered**: Wait for all guessers to solve before ending — more complex, and the lab is a
single round; "first correct ends it" is the simplest behavior that satisfies the requirement.

## D2 — Only accept guesses while the round is active

**Decision**: Guard `submitGuess` to reject when `room.status !== "active"` (e.g. 409 "The round is not
active."), so once the round ends (by correct guess or host) no further guesses are recorded.

**Rationale**: Implements FR-004 and prevents a late guess from landing after the round is over. Cheap and
consistent with the server-authoritative pattern used elsewhere.

**Alternatives considered**: Rely on the UI hiding the guess box at result — bypassable; the server should enforce it.

## D3 — No frontend change

**Decision**: Leave the frontend as-is.

**Rationale**: The client `submitGuess` action already applies the snapshot returned by the API, and
`GamePage` already shows the result view / navigates on status changes (Group 4). So the correct guesser sees
the result immediately and others on their next poll — no UI change required.

**Alternatives considered**: Add a special "you guessed it, round over" message — nice-to-have, out of scope;
the shared result view already conveys the outcome.

## D4 — Keep host End Round

**Decision**: Leave the host End Round endpoint/button unchanged as a fallback.

**Rationale**: If no one guesses correctly, the host still needs a way to end the round. The increment only
*adds* the automatic path; it doesn't remove the manual one.

## Summary of resulting changes

| Decision | Backend | Frontend | FRs |
|----------|---------|----------|-----|
| D1 auto-end on correct | `roomStore.ts` (`submitGuess`) | — (reuses existing result handling) | FR-001, FR-002 |
| D2 active-only guesses | `roomStore.ts` (`submitGuess`) | — | FR-004 |
| D3 no UI change | — | — | FR-002, FR-006 |
| D4 keep End Round | (unchanged) | (unchanged) | FR-005 |
