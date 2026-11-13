# Quickstart Guide: Room Setup & Lobby

This guide explains how to start the development servers, run automated tests, and manually verify the lobby functionality.

---

## 1. Start Development Servers

To run both the backend and frontend, open two separate terminal tabs/windows:

### A. Start the Backend
```bash
cd backend
npm install
npm run dev
```
- Server URL: `http://localhost:3001`
- The backend runs using `tsx` to watch and execute TypeScript files dynamically.

### B. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
- Client URL: `http://localhost:5173`
- The frontend runs using Vite.

---

## 2. Manual Verification Scenarios

To verify room setup and lobby features end-to-end, follow these steps:

### Scenario A: Host Creation and Role Visibility
1. Open a browser window to `http://localhost:5173`.
2. Click **Create Room**, enter your name (e.g., `Alice`), and click **Create**.
3. You will be redirected to `/lobby`.
4. **Verification**:
   - Confirm that the room code is displayed.
   - Confirm that you are listed under "Participants" with a visual **Host** badge.
   - Confirm that the **Start Game** button is visible but **disabled** (since you are the only player).

### Scenario B: Auto-Polling and Guest Join
1. Copy the Room Code displayed in Alice's tab.
2. Open a new private/incognito browser window (or a different browser) and go to `http://localhost:5173/join-room`.
3. Enter the Room Code and a guest name (e.g., `Bob`), and click **Join**.
4. **Verification**:
   - Within ~2 seconds, Bob's lobby will display Alice (Host) and Bob.
   - Within ~2 seconds, Alice's lobby will automatically update to show Bob in the list without manual refresh.
   - On Alice's (Host) tab, the **Start Game** button will immediately transition from disabled to **enabled**.
   - On Bob's (Guest) tab, the **Start Game** button must **not** be visible. Instead, Bob should see the status message: `"Waiting for host to start..."`.

### Scenario C: Host Disconnection / Room Termination
1. Close Alice's tab, click the **Leave Room** button, or navigate back to the home page from Alice's window.
2. **Verification**:
   - On Bob's page, the next poll cycle should fail (since the room is destroyed) or detect that the room was terminated.
   - Bob should be immediately redirected back to the landing page with a message or notification that the room was closed/terminated by the host.

### Scenario D: Network Loss Banner
1. Open the browser's developer console on the Lobby page.
2. Under the **Network** tab, toggle the state to **Offline**.
3. **Verification**:
   - Within ~2 seconds, a connection warning banner should appear at the top of the Lobby page saying `"Connecting..."` or `"Network connection lost. Retrying..."`.
   - Toggle the network back to **Online**.
   - The banner should disappear automatically within 2 seconds once a poll request succeeds.

---

## 3. Running Automated Tests

To verify that tests are passing and meet the 80% coverage goals:

### A. Run Backend Tests
```bash
cd backend
npm run test
```

### B. Run Frontend Tests
```bash
cd frontend
npm run test
```
