# Quickstart: Manual Verification of Gameplay Interaction

This guide explains how to manually verify the Gameplay Interaction feature end-to-end.

## Setup

1. Start the backend development server:
   ```bash
   cd backend && npm run dev
   ```
2. Start the frontend development server:
   ```bash
   cd frontend && npm run dev
   ```
3. Open two browser windows:
   - Window A: `http://localhost:5173` (normal tab)
   - Window B: `http://localhost:5173` (incognito/private tab)

---

## Verification Scenarios

### 1. Room Creation and Joining
1. In **Window A**, enter name `"   Alice   "` and click **Create Room**. Verify the code is generated and Alice is listed as `"Alice"` (trimmed).
2. In **Window B**, enter name `"   Bob   "`, enter the room code, and click **Join Room**. Verify Bob is listed as `"Bob"` (trimmed).
3. In **Window A**, click **Start Game**.

### 2. Drawer Canvas Interaction (Window A)
1. Verify Alice's screen displays:
   - **Role**: `Drawer`
   - **Title**: `Draw: rocket`
   - **Main Panel**: An interactive canvas.
2. Click and drag on the canvas to draw lines. Verify the lines appear on screen.
3. Click the **Clear Canvas** button. Verify the canvas clears.
4. Verify there is no guess input form displayed or enabled for Alice.

### 3. Guess Validation & Rejection (Window B)
1. Verify Bob's screen displays:
   - **Role**: `Guesser`
   - **Title**: `Guess the Word!`
   - **Main Panel**: Canvas placeholder: `"Alice is drawing..."`
2. Try to click **Submit Guess** with an empty input or only spaces. Verify it is rejected by the client UI.
3. Type an incorrect guess with surrounding whitespace, e.g., `"   apple   "`, and submit.
4. Verify the guess is trimmed to `"apple"` and appears in the Activity log as incorrect.

### 4. Guess Scoring and Scoreboard Synchronization
1. Submit the correct guess case-insensitively, e.g., `"RoCkEt"`.
2. Verify:
   - The guess appears in the Activity log as correct.
   - **Scoreboard**: Bob's score updates to `100` in **both** Window A and Window B (synced within 2 seconds).
3. Submit `"rocket"` again. Verify Bob's score remains `100` (points only awarded once).
4. Verify both players see the guess history log in the exact same chronological submission order.
