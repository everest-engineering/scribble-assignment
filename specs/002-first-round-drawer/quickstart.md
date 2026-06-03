---
description: "Manual validation guide for First Round — Drawer Assignment and Secret Word"
---

# Quickstart: First Round — Drawer Assignment and Secret Word

**Feature**: specs/002-first-round-drawer/spec.md
**Date**: 2026-06-02

**Prerequisites**: Feature 001 (Room Setup & Lobby) fully implemented and passing.

## Setup

1. Start the backend: `cd backend && npm run dev` — confirm `GET /health` returns `{ "ok": true }`
2. Start the frontend: `cd frontend && npm run dev` — confirm the app loads at `http://localhost:5173`
3. Open **Tab A** (host) and **Tab B** (guesser) in separate browser windows

---

## Validation Steps

### Step 1 — Create a room (Tab A)

1. Navigate to **Create Room**
2. Enter player name `Alice`
3. Click **Create and Continue** — confirm you land on the Lobby screen
4. Note the room code (e.g. `ROCKET`)

### Step 2 — Join the room (Tab B)

1. Navigate to **Join Room**
2. Enter player name `Bob` and the room code from Step 1
3. Click **Join Lobby** — confirm you land on the Lobby screen
4. In Tab A, Alice's lobby should show both Alice and Bob within ~2 seconds (polling)

### Step 3 — Start the game (Tab A)

1. In Tab A (Alice = host), click **Start Game**
2. Both tabs should navigate to the Game screen

### Step 4 — Validate drawer identity (both tabs)

| Check | Tab A (Alice — host/drawer) | Tab B (Bob — guesser) |
|-------|-----------------------------|-----------------------|
| Drawer is identified | Alice is labelled as the drawer | Alice is labelled as the drawer |
| Own role shown | "You are drawing" (or equivalent) | "You are guessing" (or equivalent) |

### Step 5 — Validate secret word visibility (both tabs)

| Check | Tab A (Alice — drawer) | Tab B (Bob — guesser) |
|-------|------------------------|-----------------------|
| Secret word | Full word text visible: **"rocket"** | Word text NOT visible; a non-revealing indicator shown |
| Network check | `currentWord: "rocket"` in response | `currentWord: null` in response |

> **Network check**: Open DevTools → Network tab → filter for the `/rooms/` request made when the game started. Confirm the `currentWord` field matches the expected value for each tab.

### Step 6 — Validate determinism

1. Refresh Tab A (host) — confirm the game screen restores correctly and still shows **"rocket"** as the secret word
2. Refresh Tab B (guesser) — confirm the game screen restores correctly and still shows the word is hidden
3. Start a brand-new room and game (Steps 1–3 again) — confirm the secret word is **"rocket"** again (same first word every time)

---

## Validation Table

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| 1 | Game screen loads for both tabs after host starts game | Both tabs show game screen | |
| 2 | Drawer label visible to all | Alice labelled as drawer on both tabs | |
| 3 | Guesser label visible to all | Bob labelled as guesser on both tabs | |
| 4 | Drawer sees secret word | Tab A shows "rocket" | |
| 5 | Guesser does not see secret word | Tab B shows hidden indicator, not "rocket" | |
| 6 | API response for guesser has `currentWord: null` | Confirmed via DevTools | |
| 7 | Deterministic word: same word in every game | "rocket" selected every time | |
| 8 | Page refresh (Tab A) restores drawer view with word | "rocket" still visible after refresh | |
| 9 | Page refresh (Tab B) restores guesser view without word | Word still hidden after refresh | |

All 9 checks must pass before proceeding to the next feature.
