## Scenario 2 — Game Start & Drawer Flow

### Dependencies
- Scenario 1 complete (room has hostId, start endpoint exists)

### Task List

| # | Task | File(s) | Depends On | Status |
|---|------|---------|------------|--------|
| 2.1 | Add `drawerId`, `secretWord`, `round` to `Room` and `RoomSnapshot` models | `backend/src/models/game.ts` | 1.1 | ✅ |
| 2.2 | Update `startGame()` to assign host as drawer, pick deterministic word, set round=1 | `backend/src/services/roomStore.ts` | 2.1 | ✅ |
| 2.3 | Update `toRoomSnapshot()` to include word only when `viewerParticipantId === drawerId` | `backend/src/services/roomStore.ts` | 2.1, 2.2 | ✅ |
| 2.4 | Update frontend API types to include drawerId, secretWord, round | `frontend/src/services/api.ts` | 2.1 | ✅ |
| 2.5 | Add lobby name re-validation on start (trim all names, reject if empty) | `backend/src/services/roomStore.ts` | — | ✅ |
| 2.6 | Update GamePage to show role indicator, secret word for drawer, waiting state for guessers | `frontend/src/pages/GamePage.tsx` | 2.4 | ✅ |
| 2.7 | Verify builds pass | — | 2.1–2.6 | ✅ |
