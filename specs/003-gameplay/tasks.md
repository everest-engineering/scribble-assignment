# Tasks — Gameplay Interaction

## Legend
- `[B]` = Backend implementation
- `[F]` = Frontend implementation
- `[T]` = Tests
- `[V]` = Validation

---

| ID | Phase | Task | Depends On | AC |
|----|-------|------|------------|----|
| 3.1 | `[B]` | Implement `submitGuess()` in store: trim, case-insensitive compare, score 100, record | 2.1 | AC3.4–AC3.8 |
| 3.2 | `[B]` | Implement `saveStrokes()` in store: append stroke array to room | 2.1 | AC3.3 |
| 3.3 | `[B]` | Add guess + stroke schemas to `schemas.ts`; add POST endpoints to `rooms.ts` | 3.1, 3.2 | AC3.4, AC3.5 |
| 3.4 | `[B]` | Reject guesses from drawer (check participantId === drawerId) | 3.1 | AC3.11 |
| 3.5 | `[B]` | Reject duplicate correct guesses (score only first) | 3.1 | Edge case |
| 3.6 | `[T]` | Write tests for guess validation, scoring, stroke saving | 3.1–3.5 | AC3.4–AC3.11 |
| 3.7 | `[V]` | Run `npm test` in backend | 3.6 | — |
| 3.8 | `[F]` | Add `api.submitGuess()`, `api.saveStrokes()` to API service | 3.3 | AC3.4 |
| 3.9 | `[F]` | Add `submitGuess()`, `saveStrokes()` to RoomStore | 3.8 | AC3.4 |
| 3.10| `[F]` | Add game-state polling loop to GamePage | 2.7 | AC3.3, AC3.9 |
| 3.11| `[F]` | Replace canvas placeholder with HTML5 Canvas component: drawer can draw (mouse events), guessers see read-only rendered strokes, Clear Canvas button for drawer | 3.9 | AC3.1, AC3.2, AC3.3 |
| 3.12| `[F]` | Wire GuessForm submit to `roomStore.submitGuess()`; add client-side empty-guess guard | 3.9 | AC3.4, AC3.5 |
| 3.13| `[F]` | Update Scoreboard to render `room.scores` | 3.10 | AC3.10 |
| 3.14| `[F]` | Hide/disable guess input for drawer | 2.9 | AC3.11 |
| 3.15| `[V]` | Manual test: drawer draws, guesser guesses correct → score 100 + history syncs | 3.10–3.14 | AC3.1–AC3.11 |

**Commit: `feat: add drawing canvas, guess submission, scoring, and sync (Scenario 3)`**
