# Quickstart: Phase 4 Result State and Restart

## Prerequisites

- Install dependencies in both apps.
- Use branch `005-result-restart-flow`.

## Start the backend

```bash
cd backend
npm run dev
```

Backend expected URL: `http://localhost:3001`

## Start the frontend

```bash
cd frontend
npm run dev
```

Frontend expected URL: `http://localhost:5173`

## Manual Validation Flow

### Story 1: Shared result reveal

1. Open the app in two browser sessions and create a room from the first session.
2. Join the same room from the second session.
3. Start the game as the host from the first session.
4. Submit one or more incorrect guesses.
   Expected: history appears for both players; scores stay `0`.
5. Submit the correct guess from the guesser session.
   Expected: both sessions enter the result view within about 2 seconds.
6. Compare both sessions.
   Expected:
   - both show the same revealed secret word
   - both show the same final scores
   - both show the full guess history including the correct winning guess text
   - drawer canvas stays locked and cannot accept new drawing input
7. Refresh both sessions while the room is still in result.
   Expected: both still show the same revealed result view.

### Story 2: Host-only restart

1. Stay in the finished room from Story 1.
2. In the non-host session, inspect the restart control.
   Expected: restart is visible but disabled with a host-only reason.
3. In the host session, click restart.
   Expected: host returns to `/lobby` immediately.
4. Wait up to 2 seconds in the non-host session.
   Expected: non-host also returns to `/lobby`.
5. Compare the restarted lobby in both sessions.
   Expected:
   - room code is unchanged
   - same participants are still present
   - no secret word, winner, scores, or guess history is shown
6. Start a new round again if needed.
   Expected: the room behaves like a fresh lobby-to-game transition.

### Error and isolation checks

1. Try to restart before the room reaches result.
   Expected: restart is not available or request is rejected.
2. Create and finish a second room in another browser pair.
   Expected: result reveal and restart in room A never affect room B.
3. Refresh during or just after restart.
   Expected: clients converge on the same clean lobby state without stale result
   data lingering.

## Build Validation

```bash
cd backend
npm run build
npm test
```

```bash
cd frontend
npm run build
```
