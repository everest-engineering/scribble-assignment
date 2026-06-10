# Quickstart: Room Setup & Lobby

## Prerequisites

- Backend running: `cd backend && npm run dev` (port 3001)
- Frontend running: `cd frontend && npm run dev` (port 5173)
- Two browser tabs open to `http://localhost:5173`

## Scenario A — Host creates room, guest joins, auto-polling works

**Tab 1 (Host)**
1. Click **Create Room**, enter name `Alice`, submit.
2. Expect: lobby page loads, room code displayed (e.g. `ABCD`), Alice listed.
3. Observe: no Start button is enabled (only 1 player).

**Tab 2 (Guest)**
4. Click **Join Room**, enter name `Bob`, enter code `ABCD`, submit.
5. Expect: lobby page loads, both Alice and Bob listed.

**Tab 1 (Host) — auto-polling**
6. Wait up to 2 seconds without clicking anything.
7. Expect: Bob appears in the participant list automatically (no manual refresh needed).
8. Expect: Start button is now enabled.

## Scenario B — Validation: empty name rejected

1. Click **Create Room**, leave name blank, submit.
2. Expect: inline error "Name cannot be empty." — no navigation.

## Scenario C — Validation: invalid room code rejected

1. Click **Join Room**, enter name `Carol`, enter code `ZZZZ`, submit.
2. Expect: inline error "Room not found." — no navigation.

## Scenario D — Host-only Start button

1. In Tab 2 (Bob / guest): observe the lobby.
2. Expect: no Start button visible to Bob.
3. In Tab 1 (Alice / host): Start button visible and enabled (≥2 players).

## Scenario E — Room isolation

1. Create a second room in a third tab with name `Dan`.
2. Confirm the new room has a different code.
3. Confirm Dan's lobby shows only Dan — not Alice or Bob.

## Automated tests

```bash
cd backend && npm test
cd frontend && npm test
```

All existing tests should pass. New tests for name validation and hostId propagation should be
added as part of implementation.
