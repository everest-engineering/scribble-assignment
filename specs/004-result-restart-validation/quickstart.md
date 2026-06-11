# Quickstart: Result, Restart & Final Validation

## Prerequisites

- Backend running: `cd backend && npm run dev` (port 3001)
- Frontend running: `cd frontend && npm run dev` (port 5173)
- Two browser tabs open at `http://localhost:5173`
- Spec 003 (gameplay interaction) must be fully implemented — drawing, guessing, scoring, round end

## Scenario 1: View Round Results

1. **Tab A** (host): Create room → Start game → Draw a few lines
2. **Tab B** (guesser): Join room
3. **Tab B**: Submit a few incorrect guesses, then the correct secret word
4. **Both tabs**: See results screen (`round_end` state) with:
   - Secret word revealed
   - Each participant's name and cumulative score
   - Guesser who guessed correctly visually distinguished
5. **Tab A (host)**: See "Ended Early" indicator if you ended the round early

**Expected**: Results appear within 2 seconds of round ending. All participants see consistent data.

**Validation command**:
```bash
curl -s http://localhost:3001/api/rooms/ABCD | jq '.room.status'
# Should return "round_end"
curl -s http://localhost:3001/api/rooms/ABCD | jq '.room.roundResult'
# Should show roundResult object with scores and correctGuessers
```

## Scenario 2: Return to Lobby

1. After seeing results (Scenario 1), **Tab A (host)** clicks "Back to Lobby"
2. **Both tabs**: See lobby screen within 2 seconds
3. **Tab B (non-host)**: "Back to Lobby" button should not be visible/clickable
4. **Tab B**: See a "Waiting for host to return to lobby..." message while waiting

**Expected**: Host-only back-to-lobby action. All participants arrive in lobby showing the full participant list.

**Validation command**:
```bash
curl -s http://localhost:3001/api/rooms/ABCD | jq '.room.status'
# Should return "lobby"
```

## Scenario 3: Start New Round

1. From lobby (Scenario 2), **Tab A (host)** clicks "Start New Round"
2. **Both tabs**: See game screen within 2 seconds
3. **Tab A**: Verify the drawer is different from the previous round
4. **Tab A**: See a new secret word (different from previous round)
5. **Both tabs**: Canvas is blank (cleared)

**Expected**: New round starts with different drawer, different word, blank canvas. Cumulative scores carried forward.

**Validation command**:
```bash
curl -s http://localhost:3001/api/rooms/ABCD | jq '.room.status, .room.roundCounter, .room.drawerId'
# Should show "playing", incremented roundCounter, new drawerId
```

## Scenario 4: Multi-Round Play (N rounds)

1. Repeat Scenario 1-3 for N rounds (where N = participant count)
2. After the Nth round ends, the results screen should show "Game Complete — Final Standings"
3. **Both tabs**: See final standings ranked by cumulative score, with winner highlighted

**Expected**: After N rounds, no "Back to Lobby" or "Start New Round" actions are available. Room reaches terminal `game_over` state.

**Validation command**:
```bash
curl -s http://localhost:3001/api/rooms/ABCD | jq '.room.status, .room.finalStandings'
# Should show "game_over" and finalStandings array
```

## Scenario 5: Leave Room

1. After a round ends (or from lobby, or from final standings)
2. **Tab B** clicks "Leave Room"
3. **Tab B**: Redirected away from room page
4. **Tab A**: See Tab B removed from participant list within 3 seconds

**Expected**: Smooth exit. Remaining participants see updated list.

**Validation command**:
```bash
curl -s http://localhost:3001/api/rooms/ABCD | jq '.room.participants | length'
# Should be reduced by 1
```

## Scenario 6: Host Transfer

1. Have 3 participants in a room (Tabs A, B, C — host is Tab A)
2. Play one round, return to lobby
3. **Tab A (host)** clicks "Leave Room"
4. **Tabs B, C**: Within 3 seconds, see that Tab A has left and a new host is assigned
5. **New host**: Can start the next round

**Expected**: Host transfers to the next participant by join order. Game can continue.

**Validation command**:
```bash
curl -s http://localhost:3001/api/rooms/ABCD | jq '.room.hostId'
# Should show the new host's UUID
```

## Scenario 7: Network Error Handling

1. Simulate network failure (stop the backend)
2. **Tab A (host)**: Click "Back to Lobby" or "Start New Round"
3. **Tab A**: See inline error message
4. **Tab A**: Click the action again after restarting backend
5. **Both tabs**: Transition succeeds

**Expected**: Error displayed inline. No data loss. Action is retryable.

## API Contract References

- Return to lobby: [contracts/api-v1.md](contracts/api-v1.md#post-roomscodereturn-to-lobby)
- Start new round: [contracts/api-v1.md#post-roomscodestart-round)
- Leave room: [contracts/api-v1.md#post-roomscodeleave)
- Extended room snapshot: [contracts/api-v1.md#get-roomscode-extended)

## Data Model References

- Room extended fields: [data-model.md](data-model.md#room-extended-fields)
- State transitions diagram: [data-model.md](data-model.md#state-transitions)
- Validation rules table: [data-model.md](data-model.md#validation-rules)
