# Quickstart & Acceptance Tests: Result, Restart, and Final Validation

**Feature**: `specs/004-result-restart`
**Date**: 2026-05-31

---

## Prerequisites

- Backend running: `cd backend && npm run dev` (port 3001)
- Frontend running: `cd frontend && npm run dev` (port 5173)
- Two browser tabs open side-by-side

---

## Two-Tab Acceptance Test

This test validates all three user stories (US1, US2, US3) end-to-end.

### Setup

1. **Tab A** (Alice — host): Navigate to `http://localhost:5173`. Click "Create Room". Enter name "Alice". Note the room code.
2. **Tab B** (Bob — guesser): Navigate to `http://localhost:5173`. Click "Join Room". Enter the room code and name "Bob". Join.
3. Both tabs show the Lobby with Alice and Bob listed.
4. **Tab A**: Click "Start Game". Both tabs navigate to the Game screen.
5. **Tab A**: The secret word is displayed (e.g., "apple").
6. **Tab B**: Submit the correct guess ("apple"). Both tabs should show the "Round Ended" state.

### US1: Result View Verification

Within ~4 seconds of Bob's correct guess:

- **Tab A and Tab B** both display:
  - [ ] The secret word ("apple") shown prominently
  - [ ] A scoreboard with Bob at 100 points and Alice at 0 points
  - [ ] The full guess history with Bob's guess marked as correct (✓)

- **Tab A** (host):
  - [ ] A "Restart" button is visible and interactive

- **Tab B** (Bob — non-host):
  - [ ] No "Restart" button or restart control is visible

**Validates**: SC-001, SC-002, FR-001, FR-002, FR-003

---

### US2: Host Restart

7. **Tab A** (Alice): Click the "Restart" button.
8. Confirm: Tab A immediately shows the lobby screen (within ~2 seconds).

**Server verification** (browser DevTools → Network tab):
- The `POST /rooms/:code/restart` response has:
  - `status: "lobby"`
  - `drawerId: ""`
  - `guesses: []`
  - `scores: {}`
  - `participants` still contains both Alice and Bob

- [ ] Tab A navigates to Lobby
- [ ] Lobby shows both Alice and Bob still listed

**Validates**: SC-003, SC-004, FR-004, FR-005, FR-006

---

### US3: All Participants Navigate Back to Lobby

9. Within ~4 seconds of Alice clicking Restart:
   - [ ] **Tab B** (Bob) automatically navigates to the Lobby screen
   - [ ] Tab B Lobby shows both Alice and Bob listed
   - [ ] No manual refresh was required

**Validates**: SC-003, SC-004, FR-007

---

### Non-Host Rejection Test (manual)

10. With the room in `"ended"` state (before restarting), open DevTools Console in Tab B and run:
    ```javascript
    fetch('http://localhost:3001/rooms/ABCD/restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: '<Bob_UUID>' })
    }).then(r => r.json()).then(console.log)
    ```
    Replace `ABCD` with the actual room code and `<Bob_UUID>` with Bob's participant ID (visible in localStorage or network requests).

- [ ] Response is `403` with `{ "message": "Only the host can restart" }`
- [ ] Room state is unchanged (Alice still sees the result view)

**Validates**: SC-005, FR-008

---

## Automated Test Scenarios

These map to unit tests in `backend/src/services/roomStore.test.ts`.

### `restartRoom` — Happy Path

```
Given: Room "ABCD" with status "ended", hostId = Alice's UUID
When: restartRoom("ABCD", Alice's UUID)
Then: Returned room has status "lobby", drawerId "", secretWord "",
      guesses [], scores {}, participants [Alice, Bob]
```

### `restartRoom` — Not Ended

```
Given: Room "ABCD" with status "active"
When: restartRoom("ABCD", Alice's UUID)
Then: HttpError(409, "Room is not ended")
```

### `restartRoom` — Not Host

```
Given: Room "ABCD" with status "ended", hostId = Alice's UUID
When: restartRoom("ABCD", Bob's UUID)
Then: HttpError(403, "Only the host can restart")
```

### `restartRoom` — Room Not Found

```
Given: No room with code "ZZZZ"
When: restartRoom("ZZZZ", some UUID)
Then: HttpError(404, "Room not found")
```

### `restartRoom` — Multiple Restarts

```
Given: Room "ABCD" with status "ended"
When: restartRoom twice (second after re-starting and re-ending the game)
Then: Both restarts succeed; each returns a clean lobby snapshot
```

---

## Frontend API Test Scenario

In `frontend/src/services/api.test.ts`:

```
Given: api.restartRoom("ABCD", "participant-uuid")
Then: Issues POST /rooms/ABCD/restart with body { participantId: "participant-uuid" }
```
