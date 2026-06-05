# Quickstart & Validation Guide: Scribble Guessing Game

Proves the feature works end-to-end. Run from the repo root. See [contracts/rooms-api.md](./contracts/rooms-api.md)
and [data-model.md](./data-model.md) for shapes; this guide is run/validation only.

## Prerequisites

- Node.js 18+, npm 9+
- Two browser tabs/windows (to simulate two players)

## Setup & run

```bash
# terminal 1 — backend (http://localhost:3001)
cd backend && npm install && npm run dev

# terminal 2 — frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```

Sanity check: `curl http://localhost:3001/health` → `{ "ok": true }`.

## Automated tests

```bash
cd backend && npm test     # roomStore + schema/contract behavior
cd frontend && npm test     # api client calls
```

## End-to-end manual validation (two tabs)

Maps to the spec's user stories (P1–P4) and success criteria (SC-001…SC-007).

1. **Room setup & lobby (US1)**
   - Tab A: create a room with a name → lands in lobby, shown as host, has a room code.
   - Tab B: join with that code and a name → appears in both tabs' roster within ~2s (SC-001).
   - Tab B: try joining a bogus code and an empty name → both rejected with clear messages (SC-003).
   - With 2 players present, only Tab A (host) sees an enabled Start control (FR-007).

2. **Game start & drawer (US2)**
   - Tab A starts the game → status becomes active; exactly one drawer is identified.
   - The drawer's tab shows the secret word; the guesser's tab does NOT (FR-011).
   - Restart and start again → same word for the same starting conditions (deterministic, SC-005).

3. **Gameplay (US3)**
   - Drawer draws on the canvas and clears it (FR-012).
   - Guesser submits an empty guess → rejected (SC-003). Submits a wrong guess → +0.
   - Guesser submits the word with different case/whitespace (e.g. `  ROCKET `) → scored correct,
     100 points (SC-004). Guess history matches in both tabs within ~2s (FR-016).

4. **Result & restart (US4)**
   - Both tabs show the same correct word, final scores, and full guess history (FR-018).
   - Host restarts → both tabs return to lobby; roster preserved; scores 0; round cleared (SC-007).

5. **Room isolation (cross-cutting)**
   - Create a second room in a third tab; actions there cause no change in the first room (SC-006).

## Build validation (before hand-off)

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must succeed (Principle V quality gate).
