## Scenario 4 — Result, Restart & Final Validation

### State Model Changes

No new fields. The existing `"finished"` status and `guesses`/`scores` fields serve the result state.

**Backend — Room additions:**
- No new fields; restart is a mutation (reset specific fields, preserve participants + host)

### File-Level Changes

| File | Change |
|------|--------|
| `backend/src/services/roomStore.ts` | Add `restartGame()` function |
| `backend/src/api/schemas.ts` | Add restart action schema |
| `backend/src/api/rooms.ts` | Add POST /rooms/:code/restart |
| `frontend/src/services/api.ts` | Add restart API method |
| `frontend/src/state/roomStore.ts` | Add restart action |
| `frontend/src/pages/GamePage.tsx` | Show result state when finished; conditional restart button |
