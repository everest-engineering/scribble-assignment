# Quickstart: Result, Restart & Final Validation (Group 4)

Manual end-to-end validation that the result reveal, host restart, state reset, and game→lobby
auto-navigation work across multiple browser tabs. See [contracts/rooms-api.md](./contracts/rooms-api.md)
and [data-model.md](./data-model.md) for field details.

## Prerequisites

- Node 18+.
- Two or three browser tabs (host + guesser(s)).

## Setup

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev      # http://localhost:3001

# Terminal 2 — frontend
cd frontend && npm install && npm run dev     # http://localhost:5173
```

## Automated checks

```bash
cd backend && npm test          # roomStore (reveal + restart), schemas
cd backend && npm run build     # type-check
cd frontend && npm run build    # type-check
```

## Scenario walkthrough

Reach an ended round first (Groups 1–3): Tab A creates a room (drawer/host); Tab B joins (guesser); host
starts; the drawer draws; the guesser submits the correct word so `round.ended` becomes true.

1. **Result reveal (US1, FR-049/050)** — After the correct guess, both tabs show the secret word, the
   final scores, and the full guess history within ~2s. *Expected*: guesser now sees the word too.
2. **Controls locked (US1, FR-051)** — Confirm drawing/clear and guess input are disabled in all tabs.
3. **Non-host cannot restart (US2, FR-055, SC-002)** — Tab B (guesser) has no Restart control; if forced
   via API, server returns 403 and state is unchanged.
4. **Restart not allowed mid-round (FR-056)** — Before a correct guess, a host restart attempt returns
   409 and changes nothing. *(Test via API during an active round.)*
5. **Host restart (US2, FR-052/053/054)** — Tab A (host) clicks Restart. *Expected*: room returns to
   lobby; participants preserved; no word/strokes/guesses remain.
6. **Auto-navigation (US3, FR-060, SC-003)** — Within ~2s, all game-screen tabs land on `/lobby` with the
   same participant list, no manual refresh.
7. **Fresh start (FR-058, SC-004)** — Host starts again. *Expected*: new round, all scores 0, empty
   canvas, secret word drawer-only again (hidden from the guesser).
8. **Idempotent restart (FR-057)** — Restarting again while already in lobby succeeds without error.
9. **Room isolation (FR-061, SC-005)** — With a second room in parallel, ending/restarting room A does
   not change room B's status, participants, or round.

## Success criteria mapping

| Step | Success Criteria |
|------|------------------|
| 1 | SC-001 (shared result within ~2s) |
| 3 | SC-002 (non-host restart rejected) |
| 6 | SC-003 (all tabs return to lobby) |
| 7 | SC-004 (fresh round, no leakage from prior round) |
| 9 | SC-005 (room isolation) |
