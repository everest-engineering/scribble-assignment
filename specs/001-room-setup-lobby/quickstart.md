# Quickstart Guide: Room Setup & Lobby

This document describes how to boot, run, and verify the Room Setup & Lobby feature.

## Booting the Services

You will need two separate terminal processes to run the backend and the frontend local development servers.

### 1. Start the Backend API Server
Navigate to the `backend/` directory, install dependencies (if not done already), and start the server:

```bash
cd backend
npm install
npm run dev
```
The server will run on [http://localhost:3001](http://localhost:3001).

### 2. Start the Frontend Development Server
Navigate to the `frontend/` directory, install dependencies, and start the app:

```bash
cd frontend
npm install
npm run dev
```
The application will run locally and show the local Vite network URL (e.g., [http://localhost:5173](http://localhost:5173)).

---

## Verifying Lobby Polling and Host Control (Manual Verification)

Follow these steps to verify that the room setup, validation, polling, and host transfer behaviors behave as specified:

1. **Open two separate browser sessions**: Open one standard tab and one Incognito/Private window (or two different browsers) at [http://localhost:5173](http://localhost:5173).
2. **Create Room (Host)**: 
   - In Browser A, click **Create Room**.
   - Input a valid nickname (e.g., `Alice`) and submit.
   - Verify that Alice lands in the lobby and sees a 6-character room code (e.g. `3x8F2P`) with the "Start Game" button visible but disabled (showing "At least 2 players required").
3. **Join Room (Player 2)**:
   - In Browser B, click **Join Room**.
   - Attempt to join with a blank name or invalid room code. Verify that a clear validation error is displayed.
   - Now input the correct code `3x8F2P` and nickname `Bob`. Submit.
   - Verify that Bob successfully enters the lobby.
4. **Verify Auto-Polling**:
   - Without refreshing Browser A manually, verify that Alice's participant list automatically updates within 2 seconds to show `Bob` has joined.
   - On Bob's screen (Browser B), verify that he cannot see or click the "Start Game" button, and only see a message saying "Waiting for host to start".
5. **Verify Host Controls**:
   - On Alice's screen (Browser A), the "Start Game" button should now be enabled.
   - Click **Start Game** on Browser A.
   - Verify that both Browser A and Browser B immediately transition to the `/game` page as the game starts.
6. **Verify Idle Disconnection**:
   - In a new session, join as a third player. 
   - Force close the third player's tab. 
   - Verify that after 10 seconds, the player is automatically removed from Alice and Bob's lobby lists.
