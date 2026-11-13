# Quickstart & Validation Guide: Fix Gaps and Assumptions

## Running the Application

### 1. Run the Backend
From the repository root:
```bash
cd backend
npm install
npm run dev
```
Verify the server starts and listens on port `3001`.

### 2. Run the Frontend
From the repository root:
```bash
cd frontend
npm install
npm run dev
```
Verify the Vite dev server starts and listens on port `5173`.

---

## Verification Plan

### Automated Tests
Run tests for both frontend and backend to verify nothing is broken:
```bash
cd backend && npm test
cd frontend && npm test
```

### Manual Step-by-Step Validation
1. Open a browser window to `http://localhost:5173/`. Verify the landing page loads with the Scribble logo and copy.
2. Click **Create Room**, enter a custom name `Alice`, and click create.
3. Verify the browser redirects to `/lobby` and the participant list displays `Alice` (not `"Player"`). Note the 4-letter room code (e.g. `ABCD`).
4. Open a second browser window (incognito or different browser) to `http://localhost:5173/`.
5. Click **Join Room**, enter the room code `ABCD` and a custom name `Bob`, and click join.
6. Verify the second window redirects to `/lobby`.
7. Go back to the first window (Alice) and click the **Refresh** button. Verify `Bob` now appears in Alice's participant list.
