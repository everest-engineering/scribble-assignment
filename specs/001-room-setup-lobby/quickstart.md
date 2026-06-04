# Quickstart: Room Setup & Lobby Validation

This document provides step-by-step instructions to run, verify, and test the Room Setup & Lobby feature.

## Prerequisites
- Node.js (v18+)
- npm

## Setup Commands

Run the following commands in separate terminals:

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
By default, the backend runs on `http://localhost:3001`.

### 2. Start the Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
By default, the frontend runs on `http://localhost:5173`.

---

## Validation Scenarios

### Scenario 1: Create Room (Host Flow)
1. Navigate to `http://localhost:5173`.
2. Click **Create Room**.
3. Enter player name "Alice" and click **Create and Continue**.
4. **Expected Outcome**:
   - URL transitions to `/lobby`.
   - The lobby page displays a 4-letter room code (e.g., `ABCD`).
   - "Alice" appears in the participants list with a host badge/indicator next to her name.
   - The **Start Game** button is visible but disabled (since Alice is currently the only participant).

### Scenario 2: Join Room (Player Flow)
1. Open a new window (preferably Incognito/Private mode).
2. Navigate to `http://localhost:5173`.
3. Click **Join Room**.
4. Enter player name "Bob" and the room code generated in Scenario 1. Click **Join Lobby**.
5. **Expected Outcome**:
   - URL transitions to `/lobby`.
   - "Bob" joins the room and sees both "Alice (Host)" and "Bob" in the participant list.
   - Bob sees a status message: "Waiting for Host to start..." and does not see or have access to any start controls.
   - Within 2 seconds, Alice's screen automatically refreshes (via polling) to show "Bob" in the participant list, and her **Start Game** button becomes active.

### Scenario 3: Start Game
1. On Alice's screen (the Host), click the now-enabled **Start Game** button.
2. **Expected Outcome**:
   - Alice is redirected to the `/game` route.
   - Bob's screen, via polling, detects the room status change to `active` and automatically redirects him to `/game` as well.
