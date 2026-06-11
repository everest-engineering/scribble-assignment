# Quickstart Validation: Result, Restart & Final Validation

## Prerequisites

- Backend running: `cd backend && npm run dev`
- Frontend running: `cd frontend && npm run dev`

## Validation Scenarios

### 1. Manual Reveal & End Round (Host Action)

1. Start a game with 2+ players
2. Host clicks "Reveal & End Round" button in the game UI
3. **Verify**: All participants see result state with correct word, scores, and guess history
4. **Expected Backend State**: `GET /api/rooms/:code` returns `status: "result"`

### 2. Guessing Continues After All Correct

1. Start a game with 3+ players
2. All guessers submit correct guesses
3. **Verify**: Room status stays `"playing"` — no auto-transition
4. **Verify**: Host still sees "Reveal & End Round" button

### 3. Host Restart

1. Round is in result state (from scenario 1)
2. Host clicks "Restart Game" button in the result view
3. **Verify**: All participants see the lobby view; players preserved; room status is `"lobby"`; no round data visible

### 4. Non-Host Cannot Reveal or Restart

1. Game is in "playing" state
2. Non-host calls `POST /api/rooms/:code/reveal?participantId=<guestId>`
3. **Verify**: Returns 403 error
4. Game is in "result" state
5. Non-host calls `POST /api/rooms/:code/restart?participantId=<guestId>`
6. **Verify**: Returns 403 error

## Test Commands

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Data Model Reference

See [data-model.md](./data-model.md) for entity changes.

## API Contracts

See [contracts/rest-api.md](./contracts/rest-api.md) for endpoint details.
