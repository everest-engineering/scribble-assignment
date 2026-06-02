# Research: Gameplay Interaction

No NEEDS CLARIFICATION items remain after the clarify session. All decisions are documented in the spec's Clarifications section and summarized below.

## Confirmed Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Canvas sync | HTTP polling (separate endpoint at 1s) | Constitution forbids WebSockets (Q2) |
| Drawer sees guesses | Yes | Increased engagement (Q1) |
| Round on correct guess | Continues; correct guesser locked out from further scoring | More participation (Q3) |
| Guess input | Free text, case-insensitive exact match | Simple, deterministic (Q4) |
| Scoring | Flat 100 pts per first correct guess per round | Simple, no time-pressure advantage (Q5) |
| Max guess length | 100 chars, reject with error | Prevents abuse (A3 remediation) |
| Error messages | Empty: "Guess cannot be empty". Too long: "Guess is too long (max 100 characters)" | Clear, actionable (A3 remediation) |

## Key Constraints

- No WebSockets, no databases, no authentication, no new top-level dependencies
- All state in-memory; game logic pure and deterministic
- TypeScript strict mode; no `any`

## Gaps & Assumptions

### Gaps (deferred or out of scope)
- **No canvas tools**: Only a single black 3px stroke is available. No color picker, brush size selector, eraser, undo/redo, or shape tools.
- **No round timer**: Rounds have no duration limit. If a guesser cannot guess the word, the round continues indefinitely until the drawer manually ends it.
- **No fuzzy matching**: Guesses are compared case-insensitively via exact string equality. Typos, pluralization, or close-but-not-exact matches are marked incorrect.
- **No hints system**: There is no mechanism to reveal letters or provide hints to guessers.
- **No spectator mode**: The drawer sees all guesses during the round. There is no way for a guesser to hide their guess from other guessers (though the spec considers this acceptable).
- **No guess editing or retraction**: Once submitted, a guess is permanent in the history. Guesses cannot be deleted or edited.
- **Canvas resolution/fit**: The canvas element uses CSS `max-height: 500px` but does not account for device pixel ratio or responsive scaling beyond CSS. Drawing coordinates may not map precisely across different screen sizes.

### Assumptions
- **1s canvas poll is adequate**: The 1-second polling interval provides a "near real-time" experience. Fast drawing may appear as a series of discrete snapshots rather than fluid strokes, but this is acceptable per the HTTP polling constraint.
- **All guessers have equal drawing visibility**: Canvas state is fetched from a single shared endpoint. There is no per-viewer rendering or progressive stroke loading.
- **Single-threaded request processing**: Node.js processes requests sequentially per room. Concurrent scoring and canvas updates are safe without locking — the `rooms.get()` + mutate + `rooms.set()` pattern works because Express handles one request at a time per event-loop tick.
- **Correct guessers cannot accidentally re-guess**: The "already correct" lock is checked server-side via the `correctGuessers` array. The GuessForm button is disabled client-side when `isAlreadyCorrect`, but the server also rejects.
- **Drawer does not need drawing tools**: A single black brush is sufficient for the demo. No participant requested color or brush size customization.
