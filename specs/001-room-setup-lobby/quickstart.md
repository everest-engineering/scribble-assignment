# Quickstart: Two-Tab Validation for Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Audience**: anyone validating this branch before opening the PR
**Maps to**: US1–US4, SC-001 through SC-006, Constitution Principle V (two-tab gate)

This is the canonical acceptance walkthrough. Run it on a clean clone of the
branch with both apps running locally. The walkthrough satisfies every Success
Criterion in `spec.md` without inspecting the code.

## Prerequisites

- Node.js 18+ and npm 9+
- Modern browser (Chrome, Safari, or Firefox current)
- Two browser tabs or windows — same browser is fine; private/incognito windows
  are explicitly allowed for the cross-room isolation step.

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

Sanity check:

```bash
curl -s http://localhost:3001/health
# → {"ok":true}
```

## US1 — Host creates a room (Spec SC-001)

1. In **Tab A**, open `http://localhost:5173`.
2. Click **Create Room**.
3. Enter player name `Alice` and submit.
4. **Expect**: the lobby appears with a 4-letter A–Z room code badge (e.g.,
   `ABCD`), and the participant list shows `Alice` clearly labeled as host.
5. **Stopwatch**: the whole flow completes in well under 10 seconds.

✅ SC-001 satisfied.

## US2 — Join existing room with validation (Spec SC-002)

### Happy path

1. Copy the code shown in Tab A's lobby.
2. In **Tab B**, open `http://localhost:5173` and click **Join Room**.
3. Enter player name `Bob` and the copied code. Submit.
4. **Expect**: Tab B lands on the lobby for the same room; the participant
   list shows `Alice` (host) and `Bob` (not host).

### Rejection paths — all must produce a visible error message and keep you on the Join screen

5. Return to Tab B's Join Room screen (use Back).
6. Submit with code blank → **Expect**: visible error message, no navigation.
7. Submit with code `   ` (three spaces) → **Expect**: visible error message,
   no navigation.
8. Submit with code `ZZZZ` (not an active room) → **Expect**: visible "Room
   not found" message, no navigation.
9. Submit with code `abcd` (lowercase) when the room code is `ABCD` →
   **Expect**: successful join; the Join screen normalizes input to uppercase
   before sending.

✅ SC-002 satisfied.

## US3 — Auto-polling lobby (Spec SC-003, SC-006)

1. Re-create the two-tab setup from US1 + US2 with Alice in Tab A and Bob in
   Tab B, both on the lobby.
2. Open a **Tab C**, repeat Join Room with name `Carol` and the same code.
3. **In Tab A and Tab B**, without pressing anything, **expect** `Carol` to
   appear in the participant list within ~3 seconds.
4. In Tab A, click **Back** (or navigate away from the lobby). Open the
   browser devtools Network tab. **Expect**: no further `/rooms/ABCD` requests
   are issued by Tab A after navigation. (Tab B and Tab C continue polling.)

✅ SC-003 and SC-006 satisfied.

## US4 — Host-only Start, ≥2-player quorum (Spec SC-005)

1. Set up Tab A as host of a fresh room (US1).
2. In Tab A — **alone in the room** — **expect** the Start control to be
   either hidden or visibly disabled, with explanatory text such as "Need at
   least 2 players to start".
3. Join Tab B as `Bob` (US2 happy path).
4. **In Tab A**, within ~3 seconds, **expect** the Start control to become
   actionable.
5. **In Tab B**, **expect** no Start control to be presented at all (guests
   cannot start).
6. Press Start in Tab A. **Expect**: the room exits the lobby state (the
   subsequent screen is owned by Scenario 2 — for this feature, simply that
   the lobby is left).

✅ SC-005 satisfied.

## Cross-cutting — Multi-room isolation (Spec SC-004)

1. In **Tab D**, create a second room as `Dave`. Note the new code — it must
   differ from Tab A's code.
2. Have `Eve` join Tab D's room from **Tab E**.
3. Observe both rooms' lobbies side by side for at least 60 seconds.
4. **Expect**: at no point does `Alice`, `Bob`, or `Carol` appear in Dave/Eve's
   lobby, nor vice versa. Participant counts stay isolated.

✅ SC-004 satisfied.

## Cross-cutting — Host survives refresh (Spec FR-014, Clarification Q1)

1. In Tab A's lobby (as host), reload the tab (`Cmd+R` / `Ctrl+R`).
2. **Expect**: after the page reloads, Tab A is back in the same lobby for
   the same room, still labeled as host, and the Start control's
   actionability matches the current player count.
3. Tab B and Tab C **expect** to remain unaffected.

✅ FR-014 satisfied.

## Cross-cutting — Polling failure resilience

1. With all three tabs on a lobby, stop the backend (`Ctrl+C` in terminal 1).
2. **Expect**: each tab surfaces a visible error in the status panel — no
   crashes, no blank pages, no infinite spinners.
3. Restart the backend (`npm run dev`).
4. **Expect**: subsequent polls succeed; if the room was wiped by the restart,
   the error becomes "Room not found" and remains visible (returning to Start
   is the user's choice).

## Test suites

Optional but recommended before opening the PR:

```bash
cd backend && npm test    # Vitest — schemas, roomStore (host assignment, A–Z code, isolation)
cd frontend && npm test   # Vitest — api base URL, useLobbyPolling, identity helper
```

## Sign-off checklist

- [ ] `cd backend && npm run build` — succeeded
- [ ] `cd frontend && npm run build` — succeeded
- [ ] `cd backend && npm test` — succeeded
- [ ] `cd frontend && npm test` — succeeded
- [ ] US1 walkthrough — passed (SC-001)
- [ ] US2 happy + 3 rejection paths + casing path — all passed (SC-002)
- [ ] US3 auto-refresh + polling stop on navigate — passed (SC-003, SC-006)
- [ ] US4 host-only + quorum gate — passed (SC-005)
- [ ] Multi-room isolation — 60 s, no leakage (SC-004)
- [ ] Host refresh — host status reclaimed (FR-014, Q1)
- [ ] Polling failure — visible error, no crash
