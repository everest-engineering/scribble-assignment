# Quickstart: Two-Tab Validation for Game Start & Drawer Flow

**Feature**: 002-game-start-drawer
**Audience**: anyone validating this branch before opening the PR
**Maps to**: US1–US2, SC-001 through SC-008, Constitution Principle V (two-tab gate)

This is the canonical acceptance walkthrough. Run it on a clean clone of the
branch with both apps running locally. Together with the two-tab walkthrough
from Scenario 1's quickstart, it covers every Success Criterion in `spec.md`
without inspecting the code.

## Prerequisites

- Node.js 18+ and npm 9+
- Modern browser (Chrome, Safari, or Firefox current)
- Two browser tabs or windows; private/incognito windows allowed.

## Build and start

```bash
# Backend (terminal 1)
cd backend
npm install
npm run build         # Build gate — must succeed
npm run dev           # serves on http://localhost:3001

# Frontend (terminal 2)
cd frontend
npm install
npm run build         # Build gate — must succeed
npm run dev           # serves on http://localhost:5173
```

Sanity check `curl -s http://localhost:3001/health` → `{"ok":true}`.

## US2 — Player name validation (Spec SC-004, SC-005)

> Running this first means later steps don't have to invent fake names.

1. From the Start screen in **Tab A**, click **Create Room**.
2. Submit with the name field empty → **Expect**: visible error message;
   the form stays on the Create Room screen; no room is created.
3. Submit with the name field set to `   ` (three spaces) → **Expect**:
   same as above.
4. Submit with `  Alice  ` (with surrounding whitespace) → **Expect**:
   the room is created and the lobby shows the host as `Alice` (no leading
   or trailing whitespace).
5. In **Tab B**, click **Join Room**.
6. Submit with the name field empty → **Expect**: visible error; no
   participant added.
7. Submit with `   ` → **Expect**: visible error; no participant added.
8. Submit with `  Bob  ` and Tab A's room code → **Expect**: lobby in
   Tab B shows `Alice` (host) and `Bob`, both without whitespace.

✅ SC-004 and SC-005 satisfied.

## US1 — Game start + drawer + word (Spec SC-001, SC-002, SC-003, SC-006, SC-008)

### Start the game

1. With both tabs in the same lobby (`Alice` host in Tab A, `Bob` in Tab B),
   in **Tab A** press **Start**.
2. **Expect** (Tab A): within ~1 second, the screen transitions from the
   Lobby to the Game view.
3. **Expect** (Tab B): within ~3 seconds (one polling tick + render), the
   screen also transitions from the Lobby to the Game view, without
   anyone clicking anything in Tab B.

✅ SC-001 satisfied (transition within 3 s).

### Drawer indicator

4. In both tabs, look at the Game view. **Expect**: each tab shows
   `Alice` clearly labelled as the drawer (the exact label can be a
   "Drawer:" prefix, a badge next to her name, or both — but it MUST be
   visually unmistakable).

### Word visibility

5. **In Tab A only**, **expect** the secret word to be displayed
   prominently in a "Your word" region. It MUST be one of: `rocket`,
   `pizza`, `castle`, `guitar`, `sunflower`.
6. **In Tab B**, **expect** the same word-region to instead show a fixed
   placeholder such as `"Waiting for the drawer to begin…"`. The actual
   secret word MUST NOT appear anywhere in Tab B's UI.
7. Open the browser developer tools in Tab B → Network tab → click the
   most recent `/rooms/<code>` request → view the JSON response.
   **Expect**: `room.currentRound.secretWord` is `null` (NOT a string).
   This proves the secrecy is enforced at the server, not just hidden in
   the UI.

✅ SC-002 satisfied (0% non-drawer word leakage in any UI region or
network payload).

### Determinism check

8. Refresh **Tab A** (the drawer's tab). **Expect**: after the reload,
   Tab A is back on the Game view showing the same `Alice` as drawer and
   the same secret word — not a different STARTER_WORDS value.
9. Refresh **Tab B** (the guesser's tab). **Expect**: after the reload,
   Tab B is back on the Game view with the placeholder unchanged.

✅ SC-003 and SC-008 satisfied (identical word across fetches; same role
restored after refresh).

### Idempotent re-press

10. In Tab A, attempt to press Start again. The Start control should
    either be absent (the LobbyPage has been left), or — if you crafted
    a direct API call via the developer-tools console — the response
    should be 200 with the same `currentRound` as before. **Expect**: no
    second word is generated; the round is unchanged.

✅ FR-010 satisfied.

### Non-host start attempt

11. In **Tab B**, open the browser console and attempt to call the start
    endpoint directly with Tab B's own `participantId`:
    ```js
    fetch("http://localhost:3001/rooms/ABCD/start", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({participantId: localStorage.getItem("scribble:identity:ABCD")})
    }).then(r => r.json()).then(console.log)
    ```
    (replacing `ABCD` with the real code and adjusting the localStorage
    parse if needed)
12. **Expect**: HTTP 403 with `{"message": "Only the host can start the game"}`.
    The room is still `playing` (already started by the host) and the word
    is unchanged.

✅ SC-006 satisfied.

## Late-join blocked (Spec SC-007)

13. Open a **Tab C**, navigate to the Start screen, click Join Room,
    submit with `Carol` and the room code from Tab A.
14. **Expect**: a visible error message containing
    `"Room is no longer open to new players"`. Tab C remains on the Join
    Room screen. No new participant appears in Tabs A or B.

✅ SC-007 satisfied.

## Cross-cutting — Polling cadence carries through

15. Back in Tab B (guesser), monitor the Network tab over a 10-second
    window. **Expect**: a `/rooms/<code>` request every ~2 seconds; the
    response continues to show `currentRound.secretWord: null`.

✅ FR-013 satisfied (polling carries through to the game view).

## Test suites

Run both before opening the PR:

```bash
cd backend && npm test    # Vitest — selectWord determinism, startRoom (host/quorum/idempotency),
                          # snapshot filtering, schemas (name + start)
cd frontend && npm test   # Vitest — api.startGame, RoomStore.startGame, LobbyPage transition effect,
                          # GamePage drawer-vs-guesser rendering, name validation in forms
```

## Sign-off checklist

- [ ] `cd backend && npm run build` — succeeded
- [ ] `cd frontend && npm run build` — succeeded
- [ ] `cd backend && npm test` — succeeded
- [ ] `cd frontend && npm test` — succeeded
- [ ] US2 name validation (4 reject paths + 2 trim paths) — passed (SC-004, SC-005)
- [ ] US1 game-start transition — both tabs within ~3 s (SC-001)
- [ ] US1 drawer indicator — visible to both tabs
- [ ] US1 word visibility — drawer sees word, guesser sees placeholder
- [ ] US1 server-side enforcement — guesser's network payload has `secretWord: null` (SC-002)
- [ ] US1 determinism — same word after refresh in both tabs (SC-003, SC-008)
- [ ] FR-010 idempotent re-press — no second word
- [ ] SC-006 non-host start attempt blocked with 403
- [ ] SC-007 late-join blocked with visible message
- [ ] FR-013 polling carries through on the Game view
