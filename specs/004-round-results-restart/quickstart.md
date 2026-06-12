# Quickstart: Round Results and Game Restart

## Prerequisites

- Backend dev server running: `cd backend && npm run dev` (port 3001)
- Frontend dev server running: `cd frontend && npm run dev` (port 5173)
- Two browser tabs (or more) for multiplayer validation

## Validation Scenarios

### Scenario 1: Host Manually Ends Round

1. Open `http://localhost:5173` in Tab A. Create a room as "Alice".
2. Join the same room in Tab B as "Bob".
3. In Tab A (host), click **Start Game**.
4. In Tab A, as the drawer, draw a stroke on the canvas.
5. In Tab B, submit an incorrect guess (e.g., `pizza`).
6. In Tab A, click an **End Round** button (to be added in implementation).

**Expected Outcome**: Both tabs transition to a results view within ~3 seconds. The secret word is visible to both Alice and Bob. Scores and guess history are displayed.

### Scenario 2: Automatic Round End (First Correct Guess)

1. Complete steps 1–3 from Scenario 1.
2. In Tab B, submit the correct word.

**Expected Outcome**: The room immediately transitions to `results` state on the first correct guess. Within ~3 seconds (on next poll), all tabs show the results view. The secret word, scores, and history are visible to all.

### Scenario 4: Non-Host Cannot End or Restart

1. Complete Scenario 1 so the room is in `results` state.
2. In Tab B (non-host), attempt to click **End Round** or **Restart**.

**Expected Outcome**: The action is rejected with a clear error message (e.g., "Only the host can perform this action"). The UI does not transition.

### Scenario 5: Restart Clears Round State

1. Complete Scenario 1 so the room is in `results` state.
2. In Tab A (host), click **Restart Game**.

**Expected Outcome**: Within ~3 seconds, both tabs show the lobby screen with Alice and Bob still present. The secret word, scores, guess history, and canvas are all cleared.

### Scenario 6: Join Rejected in Results State

1. Complete Scenario 1 so the room is in `results` state.
2. Open Tab C and attempt to join the room code.

**Expected Outcome**: The join attempt is rejected with a message that the game is already in progress.

## Verification Commands

### Backend health check

```bash
curl http://localhost:3001/
```

### Manual end round (host)

```bash
curl -X POST http://localhost:3001/rooms/ABCD/end \
  -H "Content-Type: application/json" \
  -d '{"participantId": "<host-id>"}'
```

### Manual restart (host)

```bash
curl -X POST http://localhost:3001/rooms/ABCD/restart \
  -H "Content-Type: application/json" \
  -d '{"participantId": "<host-id>"}'
```

### Poll room state

```bash
curl "http://localhost:3001/rooms/ABCD?participantId=<any-id>"
```

## Reference Artifacts

- Data model: [`data-model.md`](./data-model.md)
- API contracts: [`contracts/api.md`](./contracts/api.md)
- Feature spec: [`spec.md`](./spec.md)
