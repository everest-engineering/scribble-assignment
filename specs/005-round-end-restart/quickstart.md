# quickstart.md — Round End Restart

## Local manual test

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open the app, create a room, invite or simulate multiple players, play a round to completion so the results view appears.
4. Trigger host restart (use backend endpoint or simulate restart) and verify players are returned to the lobby with scores preserved and round state cleared.

## Example API commands

Fetch last round summary (replace `<CODE>`):

```bash
curl -sS "http://localhost:4000/rooms/<CODE>/last-round-summary" \
	-H "Accept: application/json"
```

Sample successful response (200):

```json
{
  "roundId": "r123",
  "correctWord": "apple",
  "finalScores": [{ "playerId": "p1", "score": 100 }],
  "guessHistory": [
    {
      "playerId": "p1",
      "guess": "apple",
      "correct": true,
      "timestamp": "2026-06-01T12:34:56Z"
    }
  ],
  "drawerId": "p2"
}
```

Trigger a host restart (replace `<CODE>`):

```bash
curl -X POST "http://localhost:4000/rooms/<CODE>/restart" \
	-H "Accept: application/json"
```

Sample successful response (200):

```json
{
  "status": "ok",
  "room": {
    "code": "ABCD",
    "players": [{ "id": "p1", "name": "Alice", "score": 100 }]
  }
}
```

## Automated tests

- Add unit tests for `ResultsPage` at `frontend/src/components/ResultsPage.test.tsx`.
- Add integration test for restart behavior in `backend/src/api` (e.g., `restart.integration.test.ts`).

## Notes

- Frontend component: `ResultsPage` should accept props matching `RoundSummary` and have an explicit `Return to Lobby` action.
- Backend: add `GET /rooms/:code/last-round-summary` and `POST /rooms/:code/restart` endpoints or reuse existing room endpoints.
