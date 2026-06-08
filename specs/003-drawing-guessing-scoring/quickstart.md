# Quickstart: Active Round Drawing, Guessing & Scoring

How to run the app and validate this feature (US1–US3) with two browsers. Builds on features 001/002.

## Prerequisites

- Node.js (version per existing `package.json`); dependencies already installed (`npm install` in `backend/` and `frontend/` if not).
- No database, env vars, or services required — state is in-memory and resets on backend restart.

## Run

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend && npm run dev

# Terminal 2 — frontend (Vite dev server)
cd frontend && npm run dev
```

Open the printed frontend URL. For multiplayer testing use **two browsers** (or a normal + an incognito window) so each has its own participant identity.

## Build gate (must pass before a PR — Constitution)

```bash
cd backend && npm run build
cd frontend && npm run build
cd backend && npm test      # Vitest: guess/score + guessEvaluation units
```

## Two-browser acceptance script

Set up a round first (features 001/002): in Browser A create a room (host = drawer), join from Browser B with a valid name, host clicks **Start Game**. Both land on the game screen; A is the drawer and sees the word, B is a guesser.

### US1 — Guess submission & scoring (P1)

1. In **Browser B** (guesser), submit an **incorrect** guess → it appears in the Activity feed as verbatim text; B's scoreboard entry stays **0**. *(FR-003 recorded, FR-005 incorrect = 0)*
2. Submit an **empty / spaces-only** guess → rejected with "Please enter a guess."; **not** added to the feed. *(FR-003)*
3. Read the word from **Browser A** (drawer's screen), then in **Browser B** submit it with odd casing and surrounding spaces (e.g. `"  RoCkEt "`) → accepted as correct; B's score becomes **100**. *(FR-002 trim, FR-004 case-insensitive, FR-005 = 100)*
4. In **Browser B** submit the correct word **again** → score stays **100** (no double award). *(FR-007)*
5. In **Browser A** (drawer), try to submit a guess → blocked/`403`; the drawer never scores. *(FR-014)*

### US2 — Shared guess history sync (P1)

6. After B's guesses, watch **Browser A**: within ~2s the Activity feed shows the same guesses in the same order. *(FR-009, FR-010, SC-004)*
7. Confirm the **correct** guess shows as "✅ Priya guessed the word!" (player name only) on **both** screens — the word text is **never** shown in the feed to anyone. *(FR-011, SC-008)*
8. Both scoreboards show B at **100** and the drawer at **0** within a poll cycle. *(FR-008, FR-009)*

### US3 — Drawer canvas (P2)

9. In **Browser A** (drawer), draw strokes on the canvas → they render on A's screen. *(FR-012)*
10. Click **Clear** → the canvas returns to blank on A's screen. *(FR-013)*
11. Confirm **Browser B** (guesser) does **not** receive A's drawing — guessers see only the "Waiting for the drawer…" placeholder (canvas is drawer-local). *(FR-015)*

### Regression (features 001/002 intact)

12. The drawer still sees the secret word; guessers still see only blanks (`round.word` absent for guessers). The room still closes if the host/drawer leaves (remaining players ejected on next poll).

## Notes

- Sync latency is one ~2s poll cycle — the submitter updates instantly; others converge on their next poll.
- A correct guess does **not** end the round; other guessers can still earn 100 each. *(FR-016)*
- Restarting the backend clears all rooms, scores, and guess history (in-memory only).
