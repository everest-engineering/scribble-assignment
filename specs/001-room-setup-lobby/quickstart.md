# Quickstart & Validation: Room Setup & Lobby

A runnable, two-browser validation guide proving Scenario 1 works end-to-end. Run this after
`/speckit.implement`. Each check maps to success criteria (SC-xxx) and functional requirements (FR-xxx).

## Prerequisites

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend && npm install && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```

Confirm `GET http://localhost:3001/health` (or `/`) responds OK before proceeding.

Open **two** browser windows side by side (use a normal + an incognito window so they are independent
sessions): **Tab A = host**, **Tab B = joiner**.

## Validation scenarios

### V1 — Host creation & host badge  _(US1; FR-001, FR-002; SC-001)_
1. Tab A → Create Room → enter "Alice" → continue.
2. **Expect**: lobby shows a unique room code; Alice is listed and visibly marked **host**.

### V2 — Join with valid code  _(US2; FR-003, FR-006)_
1. Tab B → Join Room → enter "Bob" + the code from V1 (try it **lowercase**).
2. **Expect**: Bob enters the same lobby; lowercase code still matched (FR-006). Bob is **not** marked host.

### V3 — Join errors are distinct  _(US2; FR-004, FR-005, FR-014; SC-002)_
1. Tab B (or a third) → Join Room → leave code empty → submit.
   **Expect**: message **"Enter a room code."**, no navigation.
2. → enter a made-up code like `ZZZZ` → submit.
   **Expect**: message **"No room with that code."** (distinct from the empty message), no navigation.

### V4 — Automatic lobby polling  _(US3; FR-008, FR-009; SC-003)_
1. With Tab A's lobby open and untouched, have Tab B join.
2. **Expect**: Bob appears in Tab A's participant list **within ~2 seconds without clicking Refresh**.
3. Confirm the manual **Refresh Room** button still works as a fallback.

### V5 — Host-only start, gated at 2 players  _(US4; FR-010, FR-011, FR-012)_
1. In a fresh room with only the host present: **Expect** the Start control is **disabled** and explains
   "Need at least 2 players to start." (or equivalent).
2. After a second player joins: **Expect** Start becomes **enabled in the host's tab**.
3. In the **non-host** tab: **Expect** no enabled Start control at any point.

### V6 — Start transitions everyone  _(US4; FR-013)_
1. Host (Tab A) clicks **Start Game**.
2. **Expect**: Tab A navigates to the game screen, and **Tab B auto-advances to the game screen within ~2s**
   (via its poll) with no manual action.

### V7 — Room isolation  _(FR-007; SC-005)_
1. Create a **second** room in two more sessions (Carol hosts, Dave joins).
2. **Expect**: room 1's lobby never shows Carol/Dave; room 2 never shows Alice/Bob; starting one room does
   not advance the other.

### V8 — Server-side enforcement (optional, via curl)  _(FR-012)_
```bash
# Replace CODE and IDs. Non-host start must be refused even though the UI hides the button.
curl -s -X POST localhost:3001/rooms/CODE/start -H 'Content-Type: application/json' \
  -d '{"participantId":"<a-non-host-id>"}'        # expect 403 "Only the host can start the game."
curl -s -X POST localhost:3001/rooms/CODE/start -H 'Content-Type: application/json' \
  -d '{"participantId":"<host-id-with-1-player>"}' # expect 409 "Need at least 2 players to start."
```

## Pass criteria

All of V1–V7 behave as described (V8 optional but recommended). Any deviation is logged against the relevant
FR and either fixed or recorded as a documented deviation per constitution Principle V before the group is
marked done.

## Automated tests

Existing Vitest suites should remain green; new contract assertions from
[contracts/rooms-api.md](./contracts/rooms-api.md) (the contract test checklist) are added in the tasks phase.

```bash
cd backend && npm test
cd frontend && npm test
```

## Validation results — 2026-06-17

| Item | Outcome |
|------|---------|
| V1–V7 (two-browser, incl. V7 room isolation) | ✅ Pass |
| Backend `npm test` | ✅ 9/9 passing |
| Frontend `npm test` | ✅ 2/2 passing |

**Deviations from spec:** none. Implementation matches FR-001…FR-014 and the clarified behaviors
(host-start auto-advance, "Enter a room code." / "No room with that code." wording). Feature Group 1
(Scenario 1) is complete.
