# Quickstart: Three-Tab Validation for Result, Restart & Final Validation

**Feature**: 004-result-restart
**Audience**: anyone validating this branch before opening the PR
**Maps to**: US1–US2, SC-001 through SC-012, Constitution Principle V (multi-tab gate)

This is the canonical acceptance walkthrough. Together with the
Scenarios 1, 2, and 3 quickstarts, it covers every Success Criterion in
`spec.md`.

## Prerequisites

- Node.js 18+ and npm 9+
- Modern browser (Chrome, Safari, or Firefox current)
- Three browser tabs or windows

## Build and start

```bash
cd backend && npm install && npm run build && npm run dev    # http://localhost:3001
cd frontend && npm install && npm run build && npm run dev   # http://localhost:5173
```

Sanity: `curl -s http://localhost:3001/health` → `{"ok":true}`.

## Setup — get to the game view with a meaningful guess history

1. In **Tab A**, create a room as `Alice`. Note the room code.
2. In **Tab B**, join as `Bob`.
3. In **Tab C**, join as `Carol`.
4. In Tab A (host), press Start. Within ~3 s all three tabs show the game
   view.
5. In Tab B, submit the correct word (assume `rocket`) and confirm Bob's
   score becomes `100`.
6. In Tab C, submit an incorrect guess (e.g., `banana`). Confirm Carol's
   score remains `0`.

You now have:

- Tab A: drawer (Alice, score 0)
- Tab B: guesser (Bob, score 100, one correct guess)
- Tab C: guesser (Carol, score 0, one incorrect guess)

## US1 — End Round + result-state reveal

### Host triggers End Round (SC-001, SC-005, SC-007)

7. In **Tab A** (host), locate the End Round control (the host is the
   only one who sees it; non-host tabs must not).
8. Press End Round.
9. **Expect (Tab A)**: within ~1 s Tab A transitions to the result view.
10. **Expect (Tab B and Tab C)**: within ~3 s both tabs also transition
    to the result view (their next polling tick after the server
    transitioned).

✅ SC-001 satisfied (transition within 3 s).

### Non-host cannot end (SC-005)

11. Reset to a fresh playing state (create a new room with a new pair of
    guessers, press Start again to start a fresh round) so the test
    target is once again `status === "playing"`.
12. In a guesser tab (say Tab B), open the browser console and issue a
    direct end-round request using Tab B's own `participantId`:

    ```js
    fetch("http://localhost:3001/rooms/ABCD/end", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        participantId: JSON.parse(localStorage.getItem("scribble:identity:ABCD")).participantId
      })
    }).then(r => r.json()).then(console.log)
    ```

    (replace `ABCD` with the real code).

13. **Expect**: HTTP 403 with `{"message": "Only the host can end the round"}`.
14. **Expect**: all tabs remain on the game view; `status` is still
    `"playing"`.

✅ SC-005 satisfied.

### Wrong-state end is rejected (SC-007)

15. Press End Round once successfully (host tab) to reach the result
    state in all tabs.
16. From the host's console, issue a second end-round request directly:

    ```js
    fetch("http://localhost:3001/rooms/ABCD/end", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        participantId: JSON.parse(localStorage.getItem("scribble:identity:ABCD")).participantId
      })
    }).then(r => r.json()).then(console.log)
    ```

17. **Expect**: HTTP 409 with `{"message": "Cannot end a round that is not in progress"}`.

✅ SC-007 satisfied.

### Result view shows the secret word (SC-002)

18. On the result view in any of the three tabs, **expect** a clearly
    rendered section displaying the round's secret word as a literal
    string (e.g., `rocket`). Every tab shows the same word.

✅ SC-002 satisfied.

### Result view shows the final scoreboard (SC-003)

19. On the result view, locate the scoreboard. **Expect** rows for each
    participant with their final score (Alice = 0, Bob = 100, Carol =
    0). Compare to the values that were visible on the in-play
    scoreboard just before End Round was pressed — they MUST match.

✅ SC-003 satisfied.

### Result view shows the full history with real text (SC-004) — **critical Network-tab check**

20. On the result view in **Tab C** (Carol, the third-party viewer who
    saw `<correct guess>` redactions during play), open dev tools →
    Network → click the most recent `GET /rooms/<code>` request → view
    the JSON response.
21. **Expect**: in `room.guesses`, Bob's correct entry has `"text":
    "rocket"` (NOT `"text": null`). Carol's incorrect entry still has
    `"text": "banana"`. `room.currentRound.secretWord` is `"rocket"`
    (NOT `null`).
22. Verify the DOM in Tab C correspondingly shows the literal text
    `rocket` for Bob's entry — no `<correct guess>` placeholder appears
    anywhere on the result view.

✅ SC-004 satisfied.

### Host refresh on result view (FR-014, edge case)

23. In Tab A (host), reload the page (Cmd+R / Ctrl+R).
24. **Expect**: after the page reloads, Tab A is back on the result view
    with the same word, scores, and history visible.

✅ Host refresh edge case satisfied.

## US2 — Restart returns everyone to the lobby

### Non-host cannot restart (SC-006)

25. In Tab B (guesser), still on the result view, open the console and
    issue a restart request with Bob's `participantId`:

    ```js
    fetch("http://localhost:3001/rooms/ABCD/restart", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        participantId: JSON.parse(localStorage.getItem("scribble:identity:ABCD")).participantId
      })
    }).then(r => r.json()).then(console.log)
    ```

26. **Expect**: HTTP 403 with `{"message": "Only the host can restart"}`.
27. **Expect**: all tabs remain on the result view.

✅ SC-006 satisfied.

### Host restarts (SC-009, SC-010)

28. In Tab A (host), press the Restart button.
29. **Expect (Tab A)**: within ~1 s Tab A transitions to the lobby view
    for the same room.
30. **Expect (Tab B, Tab C)**: within ~3 s both transition to the lobby
    view.
31. On the lobby view in any tab, **expect** the participant list to
    show the same three participants (Alice, Bob, Carol) in the same
    order. Alice is still the host.

✅ SC-009 satisfied.

### Round-state cleared (SC-010)

32. In Tab C, open dev tools → Network → look at the most recent `GET
    /rooms/<code>` response. **Expect**: `room.status === "lobby"`,
    `room.currentRound === null`, `room.guesses === []`, and every
    `room.participants[i].score === 0`.

✅ SC-010 satisfied.

### Wrong-state restart is rejected (SC-008)

33. From the host's console on the lobby view, issue a restart request:

    ```js
    fetch("http://localhost:3001/rooms/ABCD/restart", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        participantId: JSON.parse(localStorage.getItem("scribble:identity:ABCD")).participantId
      })
    }).then(r => r.json()).then(console.log)
    ```

34. **Expect**: HTTP 409 with `{"message": "Cannot restart from this state"}`.

✅ SC-008 satisfied.

### Fresh round after restart (SC-011)

35. In Tab A, press Start. With Bob and Carol present, the room
    transitions to playing in all three tabs.
36. **Expect**: every tab's scoreboard now shows all three players at
    `0`. The guess history is empty. The drawer is Alice. The secret
    word selector picks the same word as before (the room code is
    unchanged and the selector is deterministic) — that's expected and
    not a bug.
37. In Tab B, submit a guess. The full Scenario 3 flow applies
    unchanged.

✅ SC-011 satisfied.

## Cross-cutting — Polling stops on navigate (SC-012)

38. In Tab C, click "Exit Game" / navigate away from the result view (or
    just close Tab C). Open dev tools Network in Tab B → **expect** no
    further `/rooms/<code>` requests from Tab C after the navigation.

✅ SC-012 satisfied.

## Late join after restart (edge case)

39. After step 36, open a **Tab D**, choose Join Room, submit `Dave`
    and the room code. Tab D joins the room successfully and lands in
    the lobby alongside the existing players. Dave's score is `0`. This
    confirms that restart effectively reopens the room to new joiners.

## Test suites

Run both before opening the PR:

```bash
cd backend && npm test    # Vitest — endRound, restartRoom, snapshot result-state reveal, error matrix
cd frontend && npm test   # Vitest — api.endRound, api.restart, GamePage End Round button + transition, ResultPage rendering + Restart wiring + transition
```

## Sign-off checklist

- [ ] `cd backend && npm run build` — succeeded
- [ ] `cd frontend && npm run build` — succeeded
- [ ] `cd backend && npm test` — succeeded
- [ ] `cd frontend && npm test` — succeeded
- [ ] US1 End Round transition within 3 s on all tabs (SC-001)
- [ ] US1 result view shows the secret word literal to every viewer (SC-002)
- [ ] US1 result view shows final scores matching the in-play scoreboard (SC-003)
- [ ] US1 result view shows full guess history with real text in every entry (SC-004)
- [ ] US1 **Network-tab check**: third-party viewer's payload shows `secretWord` and `guess.text` populated (SC-004 enforcement)
- [ ] US1 non-host end-round attempt blocked with 403 (SC-005)
- [ ] US1 wrong-state end-round attempt blocked with 409 (SC-007)
- [ ] US2 non-host restart attempt blocked with 403 (SC-006)
- [ ] US2 wrong-state restart attempt blocked with 409 (SC-008)
- [ ] US2 restart transition within 3 s on all tabs (SC-009)
- [ ] US2 post-restart snapshot has cleared round state (SC-010)
- [ ] US2 post-restart Start begins a fresh round with all scores at 0 (SC-011)
- [ ] Polling stops when leaving the result view (SC-012)
