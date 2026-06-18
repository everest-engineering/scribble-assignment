# Quickstart & Validation: Result, Restart & Final Validation

Two-browser validation for Scenario 4 (the final group). Run after `/speckit.implement`. Each check maps to FR/SC.

## Prerequisites

```bash
cd backend && npm install && npm run dev    # :3001
cd frontend && npm install && npm run dev    # :5173
```
Two independent sessions: **Tab A = host/drawer**, **Tab B = guesser**. Create (A), join (B), host starts, play a bit (B guesses).

## Validation scenarios

### V1 — Host ends the round → result for all  _(US1; FR-001..005; SC-001)_
1. Tab A (host): click **End Round**.
2. ✅ Both tabs enter the **result** view within ~2s.
3. ✅ Both tabs show the **correct word revealed** (including Tab B, who couldn't see it during play — SC-002),
   the **final scores**, and the **full guess history** — identical on both.

### V2 — Only the host can end  _(US1; FR-002; SC-003)_
- ✅ Tab B (non-host) has no End Round control. (Optional curl: `POST /rooms/CODE/end` with a non-host id → 403.)

### V3 — Host restarts → clean lobby, players preserved  _(US2; FR-006..010; SC-004)_
1. Tab A (host): from the result view, click **Restart**.
2. ✅ Both tabs return to the **lobby** within ~2s (no one stranded on the game screen).
3. ✅ Both players are still listed (Alice as host, Bob present) — none lost/duplicated.
4. ✅ Round state is clear: no drawer/word shown; scoreboard back to 0; guess history empty.

### V4 — Only the host can restart  _(US2; FR-007; SC-003)_
- ✅ Tab B (non-host) has no Restart control. (Optional curl: `POST /rooms/CODE/restart` with a non-host id → 403.)

### V5 — Full game end-to-end + replay  _(SC-005)_
1. From the post-restart lobby, host **starts** again (Group 1 gating applies — needs 2 players).
2. ✅ A new round begins (drawer assigned, fresh word, scores 0); play → end → result works again.

### V6 — No regression  _(FR-011; SC-006)_
- Groups 1–3 still work: host/lobby/start/auto-advance, name validation, drawer + deterministic word +
  drawer-only word during play, drawing, guessing, scoring.

### (Optional) V7 — Server enforcement via curl  _(FR-002, FR-007)_
```bash
curl -i -X POST localhost:3001/rooms/CODE/end     -H 'Content-Type: application/json' -d '{"participantId":"<non-host-id>"}'  # 403
curl -i -X POST localhost:3001/rooms/CODE/restart -H 'Content-Type: application/json' -d '{"participantId":"<non-host-id>"}'  # 403
```

## Pass criteria

V1–V6 behave as described (V7 optional). Any deviation logged against the relevant FR and fixed or recorded
as a documented deviation (Principle V) before the group is marked done.

## Automated tests

```bash
cd backend && npm test     # incl. new endRound / restartGame / result-word-reveal tests
cd frontend && npm test
```
New service-level assertions come from the [contract test checklist](./contracts/rooms-api.md).
