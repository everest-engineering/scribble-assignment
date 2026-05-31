# Tasks — Room Setup & Lobby

## Legend
- `[D]` = Discovery / documentation
- `[A]` = Artifact creation
- `[B]` = Backend implementation
- `[F]` = Frontend implementation
- `[T]` = Tests
- `[V]` = Validation

---

| ID | Phase | Task | Depends On | AC |
|----|-------|------|------------|----|
| 1.1 | `[B]` | Add `hostId` to `Room`; extend `RoomStatus` with `"playing"` and `"finished"` | 0.9 | AC1.1 |
| 1.2 | `[B]` | Set `hostId` in `createRoom()`; expose `hostId` in `RoomSnapshot` | 1.1 | AC1.1 |
| 1.3 | `[B]` | Validate `playerName` is non-empty after trim in schemas | 1.1 | AC2.2 |
| 1.4 | `[B]` | Update join-room error message to `"Room not found"` for missing codes | 1.1 | AC1.2 |
| 1.5 | `[B]` | Add `POST /rooms/:code/start` with host guard + min-2-players check | 1.1 | AC1.6, AC1.7, AC1.8 |
| 1.6 | `[T]` | Write tests for host assignment, join validation, start-game guards | 1.2–1.5 | AC1.1–AC1.8 |
| 1.7 | `[V]` | Run `npm test` in backend | 1.6 | — |
| 1.8 | `[F]` | Add `hostId` to frontend `RoomSnapshot` type; add `api.startGame()` | 1.2, 1.5 | AC1.1 |
| 1.9 | `[F]` | Add `RoomStore.startGame()` method | 1.8 | AC1.1 |
| 1.10| `[F]` | Add lobby auto-polling (`setInterval` 2000ms + cleanup) in `LobbyPage` | 1.8 | AC1.5 |
| 1.11| `[F]` | Disable Start Game for non-host + <2 players; show host badge in participant list | 1.9 | AC1.6, AC1.7 |
| 1.12| `[F]` | Add client-side name trimming on Create+Join forms | 1.8 | AC2.1 |
| 1.13| `[F]` | Add client-side room code validation (non-empty) on Join form | 1.8 | AC1.3 |
| 1.14| `[T]` | Write/update frontend tests for API methods and new fields | 1.8 | — |
| 1.15| `[V]` | Manual test: two browser tabs → create + join → verify host badge, polling, start-guest gate | 1.10–1.13 | AC1.1–AC1.8 |

**Commit: `feat: add host tracking, start-game endpoint, and lobby polling (Scenario 1)`**
