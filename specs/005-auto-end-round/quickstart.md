# Quickstart & Validation: Auto-end Round on Correct Guess

Two-browser validation for increment 005. Run after `/speckit.implement`. Maps to FR/SC.

## Prerequisites

```bash
cd backend && npm install && npm run dev    # :3001
cd frontend && npm install && npm run dev    # :5173
```
Two sessions: **Tab A = host/drawer**, **Tab B = guesser**. Create (A), join (B), host starts.

## Validation scenarios

### V1 — Correct guess auto-ends the round for everyone  _(US1; FR-001, FR-002; SC-001, SC-002)_
1. Tab B (guesser) submits the **correct** word (peek the word on Tab A, the drawer).
2. ✅ Tab B moves to the **Round Over / result** view immediately; Tab A follows within ~2s.
3. ✅ Both show the **revealed word**, and Tab B's **score is 100** on the scoreboard.

### V2 — Incorrect guess keeps the round going  _(US1; FR-003; SC-003)_
1. In a fresh round, Tab B submits a **wrong** guess.
2. ✅ The round stays active (no result view); the guess shows in the history; play continues.

### V3 — No guesses after the round ends  _(FR-004)_
- After V1, the guess box is gone in the result view. (Optional curl: `POST /rooms/CODE/guess` once status is
  `result` → 409 "The round is not active.")

### V4 — Host End Round fallback still works  _(FR-005; SC-004)_
1. In a round where **no one** guesses correctly, Tab A (host) presses **End Round**.
2. ✅ Both tabs move to the result view (word revealed) — the manual path is unchanged.

### V5 — Restart still works (no regression)  _(FR-006; SC-005)_
1. From any result (auto-ended or host-ended), Tab A presses **Restart**.
2. ✅ Both return to the lobby with players preserved and a clean state; a new round can start.

## Pass criteria

V1–V5 behave as described. Any deviation logged against the relevant FR and fixed or recorded (Principle V).

## Automated tests

```bash
cd backend && npm test     # incl. new auto-end tests (correct → result, incorrect → active, guess-after-end → 409)
cd frontend && npm test
```
New service-level assertions come from the [contract test checklist](./contracts/rooms-api.md).

## Validation results — 2026-06-18

| Item | Outcome |
|------|---------|
| V1–V5 (auto-end on correct, incorrect keeps playing, no guess after end, host End Round fallback, restart) | ✅ Pass (two browsers) |
| Backend `npm test` | ✅ 22/22 passing |
| Frontend `npm test` | ✅ 2/2 passing |

**Decision recorded (Principle VII):** this increment **supersedes the Group 4 "host ends it explicitly"
clarification** for the correct-guess case — a correct guess now auto-ends the round to the result state.
The host **End Round** action is retained as a fallback for rounds nobody solves. Addresses the evaluator's
Scenario 3 Major Finding. No regression to Groups 1–4 (existing tests updated for the new flow remain green).
