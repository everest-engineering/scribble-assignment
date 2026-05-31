# Quickstart: Verifying Room Setup & Lobby

**Feature**: `001-room-setup-lobby`
**Date**: 2026-05-31

Use this guide to manually verify each user story after implementation.

## Prerequisites

Start both servers:

```bash
# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

Open `http://localhost:5173` in a browser.

---

## US1 — Create a Room as Host

1. Click **Create Room** on the start page.
2. Enter a player name (e.g., `Alice`) and submit.
3. **Expected**: You land on the Lobby page showing a 4-character room code
   and `Alice` in the participant list with a host indicator.
4. **Verify host designation**: Open DevTools → Application → Session/local
   storage, or inspect the network response for `POST /rooms`. Confirm
   `participantId` matches `room.hostId`.

**Validation gate (empty name)**:
- Clear the player name field and click submit.
- **Expected**: An inline error appears; no network request is made.

---

## US2 — Join a Room by Code

1. Note the room code from the host's lobby (e.g., `ABCD`).
2. Open a second browser tab (or incognito window) at `http://localhost:5173`.
3. Click **Join Room**, enter `Bob` and the room code, then submit.
4. **Expected**: Bob lands in the Lobby showing both Alice and Bob.
5. Switch back to Alice's tab — Bob should appear within ~3 seconds
   (polling brings him in).

**Validation gate (invalid code)**:
- Try joining with a made-up code (e.g., `ZZZZ`).
- **Expected**: An error message states the room was not found; stay on Join
  Room page.

**Validation gate (empty code)**:
- Leave the room code field blank and submit.
- **Expected**: An inline error appears; no network request is made.

---

## US3 — Live Lobby Polling

1. With Alice and Bob in the lobby, open a third tab.
2. Click **Join Room**, enter `Carol` and the same room code, then submit.
3. **Expected**: Within approximately 3 seconds, both Alice's and Bob's lobby
   tabs show `Carol` in the participant list without any manual refresh.
4. Confirm the page does NOT flicker or show a loading spinner between poll
   cycles when no new data arrives.

---

## US4 — Host Starts the Game

**Gate: fewer than 2 players**:
1. Create a new room in a fresh tab.
2. In the lobby with only 1 participant, confirm the **Start Game** button
   is disabled or missing.

**Gate: non-host cannot start**:
1. In a room with Alice (host) and Bob, view Bob's lobby tab.
2. Confirm Bob's tab shows no Start Game button (or it is non-interactive).

**Happy path**:
1. In a room with Alice (host) and Bob, click **Start Game** on Alice's tab.
2. **Expected**: Both Alice's and Bob's tabs transition to the game screen.

**Gate: join after start**:
1. After the game has started, attempt to join using the same room code.
2. **Expected**: An error message states the game is already in progress.

---

## Smoke Test Checklist

Run through these quickly after all tasks are complete:

- [ ] Create room — host lands in lobby with host indicator
- [ ] Empty player name blocked on create and join forms
- [ ] Empty room code blocked on join form
- [ ] Invalid room code shows "room not found" error
- [ ] Second player joins — appears in lobby of first player within 3 s
- [ ] Lobby updates silently (no full-page reload, no flicker)
- [ ] Start Game button absent/disabled for non-host
- [ ] Start Game button disabled when only 1 player present
- [ ] Host with ≥2 players can start game; both tabs go to game screen
- [ ] Join attempt on in-progress room is rejected with clear message
