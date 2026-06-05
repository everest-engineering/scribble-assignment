# Quickstart Validation: Gameplay Interaction

**Feature**: 003-gameplay-interaction — Scenario 3
**Prereqs**: Scenarios 1 and 2 passing. Both servers running.

```bash
cd backend  && npm run dev   # port 3001
cd frontend && npm run dev   # port 5173
```

---

## Setup

1. **Tab A**: Create room as "Alice" → Lobby.
2. **Tab B**: Join as "Bob" → Lobby.
3. **Tab A (host)**: Click **Start Game** → both tabs navigate to `/game`.
4. Confirm: Tab A shows "You are drawing" + secret word "rocket". Tab B shows drawer name, no word.

---

## US1 — Drawing Canvas

1. In **Tab A** (Alice / drawer): click and drag several strokes on the canvas.
2. Expected: strokes appear on Alice's canvas immediately.
3. Within ~2 s, confirm **Tab B** (Bob / guesser) shows the same drawing.
4. In **Tab B**, try to draw — confirm the canvas is view-only (no strokes appear).

---

## US2 — Clear Canvas

1. With drawing visible in both tabs, click **Clear Canvas** in **Tab A**.
2. Expected: Alice's canvas is immediately blank.
3. Within ~2 s, confirm **Tab B** also shows a blank canvas.
4. In **Tab B**, confirm there is no Clear Canvas button.

---

## US3 — Guess Submission and Validation

1. In **Tab B** (Bob / guesser):
   - Submit empty guess → confirm error message, no entry in history.
   - Submit `"  castle  "` → confirm it appears trimmed as "castle" in history, marked incorrect.
   - Submit `"  ROCKET  "` → confirm it appears as "rocket" in history, marked correct.
2. In **Tab A** (drawer): confirm the guess form is absent or non-interactive.

---

## US4 — Guess History Sync

1. After US3 guesses: confirm both **Tab A** and **Tab B** show the same 2 guesses
   (castle and rocket) in the same order, within ~2 s of submission.
2. Confirm the correct guess (rocket) is visually distinguished.

---

## US5 — Scoring

1. On game start: confirm both tabs show all player scores as 0.
2. After Bob submits "castle" (wrong): confirm Bob's score is still 0 in both tabs.
3. After Bob submits "rocket" (correct): confirm Bob's score is 100 in both tabs within ~2 s.
4. Alice's score remains 0 throughout (drawers don't score).

---

## Build Verification

```bash
cd backend  && npm run build   # exit 0
cd frontend && npm run build   # exit 0
```
