# Quickstart & Validation: Game Start & Drawer Flow

Two-browser validation for Scenario 2. Run after `/speckit.implement`. Each check maps to FR/SC.

## Prerequisites

```bash
cd backend && npm install && npm run dev    # :3001
cd frontend && npm install && npm run dev    # :5173
```
Open two independent sessions (normal + incognito): **Tab A = host/drawer**, **Tab B = joiner/guesser**.

## Validation scenarios

### V1 — Name validation on create  _(US1; FR-001..003; SC-001)_
1. Create Room → enter a blank or spaces-only name → submit.
   **Expect**: rejected with **"Enter a player name."**; no room created.
2. Enter "  Alice  " (surrounding spaces) → submit.
   **Expect**: proceeds; the lobby shows the name **trimmed** to "Alice".

### V2 — Name validation on join  _(US1; FR-001..003)_
1. Tab B → Join Room with a valid code but a blank name → submit.
   **Expect**: rejected with the same name message; does not join.
2. Join with "  Bob  " → **Expect**: joins; name shows as "Bob".

### V3 — Drawer assigned & visible to all  _(US2; FR-004..006; SC-002)_
1. With 2 players, host (Tab A) starts the game (Group 1 gating still applies).
2. **Expect**: both tabs reach the game screen; **both** clearly show the **drawer = the host's name**.
3. **Expect (Tab A)**: identified as the drawer. **Expect (Tab B)**: identified as a guesser.

### V4 — Secret word visible to drawer only  _(US4; FR-009, FR-010; SC-004)_
1. **Expect (Tab A / drawer)**: the secret word is shown (one of: rocket, pizza, castle, guitar, sunflower).
2. **Expect (Tab B / guesser)**: the word is **not** shown anywhere.
3. **Network check (Tab B)**: open DevTools → Network → the `GET /rooms/<code>?participantId=…` response
   for the guesser contains **no `word` field** (secrecy is in the data, not just the UI).

### V5 — Deterministic word, stable across polling  _(US3; FR-007, FR-008; SC-003)_
1. Note the word in Tab A. Let the lobby/game poll for ~10s (or refresh a few times).
   **Expect**: the word does **not** change within the round.
2. (Optional) Restart the backend and create a room with the **same code** — not generally reproducible since
   codes are random, but for a given live room the word is invariant. The unit test covers `selectWord` purity.

### V6 — No Group 1 regression  _(FR-011; SC-005)_
- Re-run Group 1 quickstart V1–V7 quickly (host badge, join errors, polling, host-only gated start,
  auto-advance, isolation) — all still pass.

### (Optional) V7 — Server-side word secrecy via curl  _(FR-010)_
```bash
# As a guesser id, the snapshot must not contain the word:
curl -s "localhost:3001/rooms/CODE?participantId=<guesser-id>" | grep -i word   # expect: only availableWords, never the secret "word"
```

## Pass criteria

V1–V6 behave as described (V7 optional). Any deviation is logged against the relevant FR and fixed or
recorded as a documented deviation (Principle V) before the group is marked done.

## Automated tests

```bash
cd backend && npm test     # incl. new selectWord / startGame-drawer / viewer-aware snapshot / name-validation tests
cd frontend && npm test
```
New service-level assertions come from the [contract test checklist](./contracts/rooms-api.md).
