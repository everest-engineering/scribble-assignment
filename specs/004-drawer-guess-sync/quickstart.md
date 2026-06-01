## Quickstart — Drawer & Guess Sync

Manual steps to exercise the feature locally:

- Start backend: `cd backend && npm run dev`
- Start frontend: `cd frontend && npm run dev`
- Open three browser tabs: host (drawer) and two guessers.
- Host: create a room. The creator is the drawer for round 1.
- Host: start the game — the host sees the secret word.
- Guessers: submit guesses via the GuessForm. The client trims input and enforces a max length.
- All clients poll `/rooms/:code/guesses` to receive guess history updates and correctness flags.
- Correct guess handling: server marks the guess correct and awards 100 points to the guessing participant; Scoreboard displays updated scores.

Testing notes

- Integration tests simulate the flow: create room, join two players, start, submit wrong and correct guesses, assert guess history, scoring and canvas rehydration.
- For deterministic tests, polling jitter is set to `0`.

CLI & Test Snippets

- Run only backend integration tests for guesses:

```bash
cd backend
npm test -- --testPathPattern=src/api/guesses.integration.test.ts
```

- Run frontend tests that exercise polling behavior (use fake timers):

```bash
cd frontend
npm test -- --testPathPattern=src/state/roomStore.polling.test.ts
```

Curl examples

- Create room (host):

```bash
curl -s -X POST http://localhost:3000/rooms -H 'Content-Type: application/json' -d '{"playerName":"Host"}' | jq
```

- Submit a guess (POST):

```bash
curl -s -X POST http://localhost:3000/rooms/<CODE>/guesses -H 'Content-Type: application/json' -d '{"participantId":"<id>","text":"my guess"}' | jq
```

Expected successful response (201):

```json
{ "guessId": "uuid", "text": "my guess", "correct": false }
```

- Fetch recent guesses (GET):

```bash
curl -s http://localhost:3000/rooms/<CODE>/guesses?limit=50&offset=0 | jq
```

Examples for pagination params are in the performance guideline.
