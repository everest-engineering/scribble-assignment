# Tasks — Result, Restart & Final Validation

## Legend
- `[B]` = Backend implementation
- `[F]` = Frontend implementation
- `[T]` = Tests
- `[V]` = Validation

---

| ID | Phase | Task | Depends On | AC |
|----|-------|------|------------|----|
| 4.1 | `[B]` | Auto-transition to `"finished"` when all guessers have guessed correctly | 3.1 | AC4.1 |
| 4.2 | `[B]` | Implement `restartGame()`: reset round state, keep participants, set status to `"lobby"` | 2.1 | AC4.6, AC4.7 |
| 4.3 | `[B]` | Add `POST /rooms/:code/restart` endpoint (host-only guard) | 4.2 | AC4.5 |
| 4.4 | `[B]` | Reject guesses when status is `"finished"` | 4.1 | AC4.9 |
| 4.5 | `[T]` | Write tests for auto-finish, restart state reset, finished-guess rejection | 4.1–4.4 | AC4.1–AC4.9 |
| 4.6 | `[V]` | Run `npm test` in backend | 4.5 | — |
| 4.7 | `[F]` | Add `api.restartGame()`, `RoomStore.restartGame()` | 4.3 | AC4.5 |
| 4.8 | `[F]` | Update `ResultPanel` to render final word, scores, full guess history | 4.1 | AC4.2, AC4.3, AC4.4 |
| 4.9 | `[F]` | Update `GamePage` to detect `"finished"` status, show ResultPanel, show Restart button for host | 4.7, 4.8 | AC4.2, AC4.5 |
| 4.10| `[F]` | On restart success, navigate all players to `/lobby` (detect via polling) | 4.7 | AC4.6, AC4.7, AC4.8 |
| 4.11| `[F]` | Disable GuessForm when room status is `"finished"` | 4.7 | AC4.9 |
| 4.12| `[V]` | Full manual E2E test: two tabs → create → join → start → draw → guess correct → see result → restart → lobby preserved → start again | 4.8–4.11 | AC4.1–AC4.9 |
| 4.13| `[V]` | Run `npm run build` in both backend and frontend — no errors | 4.12 | — |

**Commit: `feat: add result display, restart flow, and final validation (Scenario 4)`**
