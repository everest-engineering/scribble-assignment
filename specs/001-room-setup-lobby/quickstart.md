# Quickstart: Validating Room Setup & Lobby

Manual validation procedure for Scenario 1. Run after implementation is complete.

## Prerequisites

- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`
- Two browser tabs (or two browsers) open

---

## Test 1 — Create Room (User Story 1)

1. Open Tab 1 at `http://localhost:5173`.
2. Click **Create Room**.
3. Enter a player name (e.g., `Alice`) and click **Create and Continue**.
4. **Verify**: You land on the Lobby screen.
5. **Verify**: The room code badge is displayed (4 uppercase characters).
6. **Verify**: `Alice` appears in the participant list.
7. **Verify**: A **Start Game** button is visible.
8. **Verify**: The Start Game button is **disabled** and shows "Need at least 2 players to start".

---

## Test 2 — Reject Empty Name on Create

1. Go to **Create Room**.
2. Leave the name field blank and click **Create and Continue**.
3. **Verify**: An error message is displayed. You remain on the Create Room screen.

---

## Test 3 — Join Room (User Story 2)

1. Using the room code from Test 1, open Tab 2 at `http://localhost:5173`.
2. Click **Join Room**.
3. Enter a player name (e.g., `Bob`) and the room code, then click **Join Lobby**.
4. **Verify**: Tab 2 lands on the Lobby screen showing both `Alice` and `Bob`.
5. **Verify**: Tab 2 does **not** have a Start Game button (or it is permanently disabled).

---

## Test 4 — Reject Invalid Room Code

1. Click **Join Room**.
2. Enter `ZZZZ` (non-existent code) and any player name.
3. **Verify**: An error message is displayed. You remain on the Join Room screen.

---

## Test 5 — Lobby Auto-Polling (User Story 3)

1. Tab 1 is on the Lobby screen showing only `Alice`.
2. Tab 2 joins the room (Test 3).
3. **On Tab 1 — do not click anything**.
4. **Verify within 3 seconds**: `Bob` appears in Tab 1's participant list without any manual action.
5. **Verify**: There is no "Refresh Room" button on either tab.

---

## Test 6 — Poll Failure Handling (FR-013)

1. Start both tabs in the Lobby.
2. Stop the backend (`Ctrl+C`).
3. **Verify within 3 seconds**: An error message appears inline in the lobby.
4. **Verify**: The lobby screen stays visible (no crash or redirect yet).
5. Restart the backend.
6. **Verify within 3 seconds**: The error message disappears and the participant list refreshes.

---

## Test 7 — Host Starts Game (User Story 4)

1. Tab 1 (Alice, host) and Tab 2 (Bob) are both in the lobby.
2. On Tab 1, click **Start Game**.
3. **Verify**: Tab 1 navigates to the game screen.
4. **Verify within 3 seconds**: Tab 2 also navigates to the game screen automatically.

---

## Test 8 — Non-Host Cannot Start

1. On Tab 2 (Bob, non-host), confirm Start Game is absent or permanently disabled.
2. Confirm no interaction on Tab 2 can trigger game start.

---

## Test 9 — Multi-Room Isolation (User Story 5)

1. Tab 1 creates Room A (code e.g. `AAAA`). Tab 2 creates Room B (code e.g. `BBBB`).
2. Tab 3 joins Room A.
3. **Verify**: Room B's participant list shows only Tab 2's player — Tab 3 is not there.
4. **Verify**: Room A's participant list shows Tab 1 and Tab 3's players — Tab 2 is not there.

---

## Pass Criteria

All 9 tests must pass before proceeding to Scenario 2.
