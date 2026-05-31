## Scenario 4 — Result, Restart & Final Validation

### Dependencies
- Scenario 3 complete (gameplay loop works, correct guess detected)

### Task List

| # | Task | File(s) | Depends On | Status |
|---|------|---------|------------|--------|
| 4.1 | Add `restartGame()` to roomStore (reset round state, preserve participants + host) | `backend/src/services/roomStore.ts` | 3.2 | ✅ |
| 4.2 | Add POST /rooms/:code/restart route with host-only validation | `backend/src/api/rooms.ts` | 4.1 | ✅ |
| 4.3 | Update frontend API with restart method | `frontend/src/services/api.ts` | 4.2 | ✅ |
| 4.4 | Add restart action to RoomStore | `frontend/src/state/roomStore.ts` | 4.3 | ✅ |
| 4.5 | Show result state (word, scores, guess history) when status === "finished" | `frontend/src/pages/GamePage.tsx` | 3.10, 3.11 | ✅ |
| 4.6 | Show restart button for host, waiting message for guessers | `frontend/src/pages/GamePage.tsx` | 4.4 | ✅ |
| 4.7 | Handle restart redirect back to lobby | `frontend/src/pages/GamePage.tsx` | 4.6 | ✅ |
| 4.8 | Verify builds pass and two-tab validation | — | 4.1–4.7 | ✅ |
