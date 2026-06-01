# Quickstart: Room Setup & Lobby

## Overview

This guide explains how to spin up the Room Setup & Lobby feature for local testing and development.

## Prerequisites

- Node.js installed.
- Ensure you are running both backend and frontend servers simultaneously.

## Running Locally

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

## Manual Verification Steps

1. Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
2. Type a username and click **Create Room**.
   - Verify you see a new 6-character room code.
   - Verify you are listed in the lobby.
3. Open an incognito window or second browser.
4. Navigate to the frontend URL.
5. Enter the room code generated in step 2 and a different username. Click **Join Room**.
   - Verify the second user enters the lobby.
   - Verify the first window updates automatically within 2 seconds to show the new user.
6. Close the second window.
   - Verify the first window removes the second user from the list automatically.
