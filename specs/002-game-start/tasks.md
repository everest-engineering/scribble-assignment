# Tasks — Game Start & Drawer Flow

## Legend
- `[B]` = Backend implementation
- `[F]` = Frontend implementation
- `[T]` = Tests
- `[V]` = Validation

---

| ID | Phase | Task | Depends On | AC |
|----|-------|------|------------|----|
| 2.1 | `[B]` | Add `Guess`, `Stroke` types to `game.ts`; extend `Room` with game-round fields (`drawerId`, `secretWord`, `guesses`, `scores`, `strokes`) | 1.5 | AC2.3 |
| 2.2 | `[B]` | Implement `startGame()` in store: assign drawer=host, pick word deterministically, init scores | 2.1 | AC2.3, AC2.4, AC2.5 |
| 2.3 | `[B]` | Update `toRoomSnapshot()` to filter `secretWord` — only visible to drawer (or when finished) | 2.2 | AC2.6 |
| 2.4 | `[B]` | Add duplicate-start guard: return 400 if already playing | 2.2 | Edge case |
| 2.5 | `[T]` | Write tests for drawer assignment, word determinism, viewer visibility | 2.2–2.4 | AC2.3–AC2.6 |
| 2.6 | `[V]` | Run `npm test` in backend | 2.5 | — |
| 2.7 | `[F]` | Extend frontend `RoomSnapshot` with all game-round fields | 2.1 | AC2.3 |
| 2.8 | `[F]` | Update `LobbyPage` start to call `startGame()` and navigate to `/game` on success | 2.2 | AC2.3 |
| 2.9 | `[F]` | Update `GamePage`: show role badge, conditionally show word/guess form | 2.7 | AC2.4, AC2.6, AC2.7 |
| 2.10| `[F]` | Add name validation to CreateRoomPage and JoinRoomPage (disable submit for empty) | 1.12 | AC2.2 |
| 2.11| `[V]` | Manual test: create room, start game → drawer sees word, guesser doesn't → empty name rejected | 2.8–2.10 | AC2.1–AC2.7 |

**Commit: `feat: add game start flow with drawer assignment and word visibility (Scenario 2)`**
