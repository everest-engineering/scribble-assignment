# Research: Gameplay Interaction

## Current State Analysis

### Backend: Existing Patterns

- **Room model**: Has `currentRound` with `drawerId`, `secretWord`, `status`, `number`.
- **toRoomSnapshot()**: Already supports viewer-scoped filtering of `secretWord`. Returns `participants`, `currentRound`, etc.
- **No drawing support**: No canvas strokes, no drawing endpoints, no drawing data model.
- **No guess support**: No guess storage, no guess validation, no guess evaluation logic.
- **No score tracking**: Scores are not tracked per participant or per round.
- **Polling**: Room state fetched via `GET /rooms/:code?participantId=...`.

### Frontend: Existing Patterns

- **GamePage.tsx**: Already distinguishes drawer vs guesser view. Drawer sees secret word, guesser sees placeholder.
- **Canvas.tsx**: Scaffolded component, does nothing yet.
- **roomStore.ts**: Polls room state on interval, updates local snapshot. Has `startGame()`.
- **api.ts**: `RoomSnapshot` type with `currentRound`, `participants`, etc.

### Identified Gaps

| Gap | Detail |
|-----|--------|
| No canvas stroke model | Need serializable data structure for drawing lines |
| No drawing endpoints | Need API to save/clear canvas state |
| No guess model | Need Guess entity with text, author, timestamp, correctness |
| No guess submission endpoint | Need POST endpoint with validation |
| No guess evaluation | Need server-side comparison logic (case-insensitive, trimmed) |
| No score tracking | Need per-participant cumulative score across rounds |
| No guess highlight | Correct guesses need visual distinction in history |
| No input disable | Correct guesser's input must be disabled server-side |
| No drawer guess prevention | Drawer must not see guess input at all |
| Canvas on guesser screen | Guessers need to see the drawing via polling |

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canvas stroke representation | Array of `{points: {x,y}[], color: string, width: number}` | Simple JSON-serializable; each stroke is a separate object; supports future color/width |
| Drawing API pattern | `POST /rooms/:code/draw` with full strokes array | Client sends the complete strokes array each time; server replaces; simple and race-condition-tolerant for polling |
| Canvas clear mechanism | `POST /rooms/:code/draw` with empty strokes array | Same endpoint; server replaces strokes with `[]` |
| Guess submission endpoint | `POST /rooms/:code/guess` with `{participantId, text}` | Separate endpoint for clear separation of concerns |
| Guess server-side validation | Zod schema: trim, max 50 chars, reject empty, reject if drawer, reject if already guessed correctly | Centralized validation in one Zod schema; all error paths return 400 |
| Guess comparison | `guess.trim().toLowerCase() === secretWord.trim().toLowerCase()` | Simple, handles whitespace and case per spec |
| Score storage | `Map<participantId, number>` on the Round entity | Per-round cumulative score; simple and in-memory |
| Score initialization | All participants start at 0 when round is created | Scores created atomically with room start |
| Canvas sync via polling | Canvas strokes array included in `RoomSnapshot` response | No new polling mechanism needed; existing polling delivers strokes |
| Guess history in snapshot | Ordered array of `GuessSnapshot` objects in `RoomSnapshot` | Append-only; each guess added server-side; polled by all clients |
| Correct guess detection | Boolean `isCorrect` field on Guess; `correctGuessers: string[]` on Round for quick lookup | Fast server-side check without scanning all guesses |
| Highlight mechanism | Frontend renders correct guesses with green background / "Correct!" badge | Pure CSS; no additional API surface needed |
| Input disable (server) | `startGame()` initializes `correctGuessers` set; `submitGuess()` checks set before accepting | Prevents any client-side bypass |
| Input disable (client) | Frontend checks `room.currentRound.correctGuessers.includes(myId)` to disable input | Responsive UI; falls back to server rejection |
| Drawer guess prevention | Frontend hides guess input when `participantId === currentRound.drawerId` | No need for server-side reject since drawer never sends guesses |
| Score snapshot | Flat map `scores: Record<string, number>` in `RoomSnapshot` | Simple, no nested structure |

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Stroke-by-stroke API calls per mouse move | Too many requests; full strokes array replacement is simpler for polling |
| Canvas as base64 image in API | Larger payload; harder to diff; prevents future vector features |
| Separate canvas-only polling endpoint | Unnecessary complexity; existing room polling already delivers snapshot |
| WebSocket for real-time drawing | Explicitly forbidden by constitution |
| Guess history as separate endpoint | More API surface; no benefit since snapshot already polls |
| Client-side guess validation only | Circumventable; server MUST validate for security |
| Per-round scores separate from Room | Round scores on Room is simpler for snapshot; no extra joins |
| Correct guess ends round immediately | Spec says round continues (clarification); all correct guessers score 100 |
| Anonymous guess history | Clarification resolved: all guesses show submitter name |
