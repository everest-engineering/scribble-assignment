# Quickstart: Two-Tab Validation for Gameplay Interaction

**Feature**: 003-gameplay-interaction
**Audience**: anyone validating this branch before opening the PR
**Maps to**: US1–US3, SC-001 through SC-010, Constitution Principle V (two-tab gate)

This is the canonical acceptance walkthrough. Together with Scenarios 1 and
2's quickstarts, it covers every Success Criterion in `spec.md` without
inspecting the code.

## Prerequisites

- Node.js 18+ and npm 9+
- Modern browser (Chrome, Safari, or Firefox current)
- Three browser tabs or windows (needed for the redaction step and the
  multi-guesser sync step)

## Build and start

```bash
cd backend && npm install && npm run build && npm run dev    # http://localhost:3001
cd frontend && npm install && npm run build && npm run dev   # http://localhost:5173
```

Sanity: `curl -s http://localhost:3001/health` → `{"ok":true}`.

## Setup — get to the game view

1. In **Tab A**, create a room as `Alice`. Note the room code (e.g., `ABCD`).
2. In **Tab B**, join the same room as `Bob`.
3. In **Tab C**, join as `Carol`.
4. In Tab A (host), press Start. Within ~3 s all three tabs show the game view.
5. Confirm Tab A (Alice = drawer) sees a secret word in the "Your word"
   card; Tabs B and C see the placeholder. (Scenario 2 territory; included
   as setup.)

## US1 — Guess submission, validation, and scoring cap

(All assertions below assume Tab A's secret word is `rocket`.)

### Empty / whitespace rejection (SC-003)

6. In **Tab B**, submit an empty guess. **Expect**: visible "Enter a guess"
   error; the GuessForm stays open; no history entry appears.
7. Submit a whitespace-only guess (`"   "`). **Expect**: same as step 6.

### Correct guess + cap (SC-002, US1 acceptance §1 + §2)

8. In **Tab B**, submit `"RoCkEt"` (mixed case + no whitespace).
   **Expect**: the guess is accepted; Bob's score in the scoreboard becomes
   `100`; Tab B's history shows Bob's entry with the literal text `"RoCkEt"`
   and a "correct" marker.
9. From **Tab B**, submit `"rocket"` a second time (the literal word, lowercase).
   **Expect**: the guess is accepted; Bob's score stays at `100` (cap rule —
   Q1 clarification); Tab B's history now shows two entries from Bob, both
   marked correct, both showing real text from Bob's own perspective.

### Incorrect guess (SC-002)

10. In **Tab B**, submit `"pizza"`. **Expect**: accepted; recorded as
    incorrect; Bob's score is still `100`.

### Drawer cannot guess (SC-004)

11. In **Tab A**, confirm that no GuessForm input is rendered on the drawer
    side. If you bypass the UI via the browser console and POST directly
    with Alice's `participantId`:
    ```js
    fetch("http://localhost:3001/rooms/ABCD/guess", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        participantId: JSON.parse(localStorage.getItem("scribble:identity:ABCD")).participantId,
        text: "rocket"
      })
    }).then(r => r.json()).then(console.log)
    ```
    **Expect**: HTTP 403 with `{"message": "Only guessers can submit guesses"}`.
    The history is unchanged.

### Guess before round starts (SC-005)

12. (Optional, requires a fresh room.) Create a new room in a separate
    tab, do NOT press Start, then attempt to submit a guess via the
    console (the UI won't show GuessForm on the lobby). **Expect**: HTTP
    409 with `{"message": "Round has not started"}`.

✅ US1 / SC-002 / SC-003 / SC-004 / SC-005 satisfied.

## US2 — Synced history + scoreboard via polling

### Multi-tab history visibility (SC-001)

13. Reset to the state at the end of step 10 (Tab A = drawer, Tab B = `Bob`
    with score 100, Tab C = `Carol` with score 0).
14. In **Tab C**, submit `"banana"`. **Expect**: within ~3 s,
    Tabs A, B, AND C all show two entries in their history list, in
    submission order: Bob's entries first (from steps 8 and 9 and 10), then
    Carol's `"banana"`. The scoreboard shows Alice (drawer), Bob = 100,
    Carol = 0.

### Redaction of correct-guess text (SC-010 — the critical check)

15. Re-examine the history in **Tab C** (Carol's perspective). Bob's
    correct entries from steps 8 and 9 MUST appear with the placeholder
    `<correct guess>` (or whatever placeholder the frontend renders), NOT
    the literal text `RoCkEt` or `rocket`. Carol's own `"banana"` entry
    still shows the real text.
16. In Tab C, open the browser dev tools → Network tab → click the most
    recent `GET /rooms/ABCD?participantId=…` request → view JSON response.
    **Expect**: in `room.guesses`, each of Bob's correct entries has
    `"text": null`. Carol's incorrect `"banana"` entry has `"text": "banana"`.
17. In **Tab A** (drawer), check the history. **Expect**: Bob's correct
    entries show the literal real text (`RoCkEt`, `rocket`) — the drawer
    is privileged per FR-016.
18. In **Tab B** (Bob), check the history. **Expect**: Bob's own correct
    entries show the literal real text — the original guesser is privileged.

✅ SC-001 / SC-010 satisfied (the only place this is verifiable end-to-end
is in the Network-tab JSON, hence the explicit step 16).

### Polling stop on navigate (SC-009)

19. In Tab C, click "Exit Game" (or navigate back). Open dev tools →
    Network. **Expect**: no further `/rooms/ABCD` requests are issued by
    Tab C.

✅ SC-009 satisfied.

## US3 — Drawer canvas (drawer-local)

### Draw + clear on the drawer's screen (SC-008)

20. In **Tab A** (drawer), click and drag inside the canvas region.
    **Expect**: visible freehand strokes appear under the cursor path.
21. Click the **Clear** control. **Expect**: within 1 s the canvas is
    blank again.

### Drawer-locality (SC-007)

22. While the drawer is drawing in Tab A, watch Tabs B and C. **Expect**:
    neither Tab B nor Tab C shows any strokes or clear actions at any
    point. (The canvas region in non-drawer tabs is either absent or
    shows a fixed placeholder per Scenario 2's setup.)
23. Open dev tools in Tab B → Network. **Expect**: no
    `canvas` / `stroke` / `draw` requests appear; the only traffic is the
    existing snapshot polling.

✅ SC-007 / SC-008 satisfied.

## Cross-cutting — score init on start

24. (Optional regression check.) Create a new room, join with a second
    player, have the second player guess (which will fail with 409 since
    the round hasn't started yet). Press Start. After start, both
    players' scores in the scoreboard are `0`. Submit a correct guess
    from the guesser. Score becomes `100`.

✅ FR-010 / "all scores start at 0" satisfied.

## Test suites

```bash
cd backend && npm test    # Vitest — submitGuess, snapshot filtering, scoring cap, schema, score init
cd frontend && npm test   # Vitest — api.submitGuess, GuessForm, Scoreboard, GamePage history rendering, CanvasBoard
```

## Sign-off checklist

- [ ] `cd backend && npm run build` — succeeded
- [ ] `cd frontend && npm run build` — succeeded
- [ ] `cd backend && npm test` — succeeded
- [ ] `cd frontend && npm test` — succeeded
- [ ] US1 empty / whitespace rejection (SC-003)
- [ ] US1 correct guess scores 100; second correct keeps score at 100 (SC-002)
- [ ] US1 incorrect guess scores 0
- [ ] US1 drawer cannot guess — 403 via console (SC-004)
- [ ] US1 guess before round start — 409 via console (SC-005)
- [ ] US2 multi-tab history visibility within 3 s (SC-001)
- [ ] US2 **Network-tab inspection**: third-party JSON shows `text: null` for correct entries (SC-010)
- [ ] US2 drawer's history shows real text for all correct entries (FR-016 drawer privilege)
- [ ] US2 polling stops when leaving the game view (SC-009)
- [ ] US3 drawer draws, then clears within 1 s (SC-008)
- [ ] US3 non-drawer tabs see no strokes at any point (SC-007)
