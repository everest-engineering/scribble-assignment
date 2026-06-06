# Quickstart: Gameplay Interaction (Group 3)

Manual end-to-end validation that drawing, clearing, guessing, scoring, shared history, and game-screen
polling work across two browser tabs. See [contracts/rooms-api.md](./contracts/rooms-api.md) and
[data-model.md](./data-model.md) for field details.

## Prerequisites

- Node 18+.
- Two browser tabs (or two windows).

## Setup

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev      # http://localhost:3001

# Terminal 2 — frontend
cd frontend && npm install && npm run dev     # http://localhost:5173
```

## Automated checks

```bash
cd backend && npm test          # gameRules, roomStore, schemas
cd backend && npm run build     # type-check
cd frontend && npm run build    # type-check
```

## Scenario walkthrough

Reach a started game first (Groups 1–2): Tab A creates a room and is the **drawer**; Tab B joins with the
room code as a **guesser**; the host starts the game so both land on `/game`.

1. **Drawer draws (US1, FR-033/036)** — In Tab A, draw on the canvas. Within ~2s, Tab B shows the same
   stroke. *Expected*: stroke appears in both tabs.
2. **Clear canvas (US1, FR-034/035)** — In Tab A, click **Clear**. Within ~2s, both canvases are empty.
   *Expected*: strokes removed everywhere.
3. **Guesser-only drawing (SC-006)** — Confirm Tab B has no drawing controls (read-only canvas) and Tab A
   has no guess input. *Expected*: roles enforce who can draw vs guess.
4. **Empty guess blocked (US2, FR-038)** — In Tab B, submit an empty/whitespace guess. *Expected*: blocked
   with a clear message; nothing added to history.
5. **Wrong guess (US2/US3, FR-039/040/041)** — In Tab B, guess a wrong word. *Expected*: appears in the
   shared history in both tabs within ~2s; guesser score stays 0.
6. **Correct guess, case-insensitive (US2/US3, FR-039/040/042)** — In Tab B, guess the secret word with
   different casing/whitespace (e.g. `  Apple `). *Expected*: marked correct in history; guesser score
   becomes 100; round ends.
7. **Round-ended lock (FR-042/048)** — After the correct guess, confirm guess input and drawing/clear
   controls are disabled in both tabs. *Expected*: no further guesses or strokes accepted (server returns
   409 if forced).
8. **Shared scoreboard (FR-041/047)** — Both tabs show the same scores (drawer 0, correct guesser 100).
9. **Polling convergence (US4, FR-044/045/046)** — Make a change in one tab; the other reflects it within
   ~2s without manual refresh. *Expected*: strokes, scores, and history stay in sync.
10. **Room isolation (SC-005)** — In two more tabs, create/join a second room and play. *Expected*: no
    strokes/guesses/scores leak between rooms.

## Success criteria mapping

| Step | Success Criteria |
|------|------------------|
| 1–2 | SC-001 (drawing visible to guessers ~2s), SC-004 (clear) |
| 4 | SC-002 (empty guess rejected) |
| 5–6 | SC-002/SC-003 (guess evaluated, scored) |
| 6–7 | SC-003 (correct ends round + scores) |
| 9 | SC-001 (polling sync) |
| 10 | SC-005 (room isolation) |
| 3 | SC-006 (role enforcement) |
