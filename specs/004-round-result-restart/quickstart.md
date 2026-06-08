# Quickstart: Round Result & Host Restart

How to run the app and validate this feature (US1–US3) with two browsers. Builds on features 001/002/003 (this is the final scenario: result, restart & validation).

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
cd backend && npm test      # Vitest: end/restart transitions + ended-state snapshot reveal
```

## Two-browser acceptance script

Set up and play a round first (features 001/002/003): in Browser A create a room (host = drawer), join from Browser B with a valid name, host clicks **Start Game**. Both land on the game screen. In Browser B submit at least one **incorrect** and then the **correct** guess (read the word from Browser A's drawer screen) so there is a non-trivial history and B has **100** points.

### US1 — All players see the round result (P1)

1. In **Browser A** (host), click **End Round** → A transitions to the result screen showing the correct **word**, the **final scores** (B = 100, A = 0), and the **full guess history**. *(FR-001, FR-003, FR-004, FR-005)*
2. Watch **Browser B**: within ~2s B automatically moves to the result screen showing the **same** word, scores, and full history — no manual refresh. *(FR-002, FR-007, SC-003)*
3. Confirm the previously-masked **correct** guess now shows its text / "guessed the word!" alongside the revealed word — nothing is hidden once the round has ended. *(FR-006)*
4. Confirm the guesser in **Browser B** — who may never have known the word — now sees the correct word on the result screen. *(FR-003)*

### US2 — Host restarts to a fresh lobby (P1)

5. In **Browser A** (host), click **Restart** → A returns to the **lobby**; both players are still listed; the scoreboard/round are gone. *(FR-009, FR-010, FR-011)*
6. Confirm A can immediately click **Start Game** again — the lobby is a fresh pre-game lobby. *(FR-013)*
7. (Inspect, optional) After restart, `GET /rooms/:code` shows `status: "lobby"`, `round: null`, and every `participants[].score === 0`, with the same participant ids and host. *(FR-010, FR-011)*

### US3 — Everyone synchronized; restart is host-only (P2)

8. Watch **Browser B** after A restarts: within ~2s B returns to the **lobby** automatically, with both players still present — no manual refresh. *(FR-012, SC-004, SC-005)*
9. Reach the result screen again (play + End Round). In **Browser B** (non-host), confirm there is **no** Restart button — only the host can restart. *(FR-008, SC-007)*
10. (Idempotency) In **Browser A**, double-click **Restart** → the room ends in a single fresh lobby (no error, no duplicate state). *(FR-014)*

### Regression (features 001/002/003 intact)

11. Before ending the round (`status: "playing"`), guessers still see only blanks (`round.word` absent for guessers) and correct guesses are still masked in the feed — the reveal happens **only** in the `ended` state.
12. The room still closes if the host leaves at any point (remaining players ejected on next poll) — there is no host transfer. *(see research Decision 5)*

## Notes

- Sync latency is one ~2s poll cycle — the host (who clicked End/Restart) updates instantly; other players converge on their next poll.
- A round ends **only** when the host clicks End Round — there is no timer or auto-end. *(Clarifications 2026-06-08)*
- Restart returns to the **lobby** (not a next round) — multiple rounds / drawer rotation remain out of scope.
- Restarting the backend clears all rooms, scores, and history (in-memory only).
