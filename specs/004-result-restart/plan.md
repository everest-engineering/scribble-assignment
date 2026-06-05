# Implementation Plan: Result, Restart & Final Validation

**Branch**: `scribble-lab` (spec dir `004-result-restart`) | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-result-restart/spec.md`

## Summary

Close the game loop: end the round on the first correct guess (`finished`), reveal
the word + final scores + full history to everyone, and add a host-only restart
that clears round state, preserves players, advances the deterministic word, and
returns all clients to the lobby via polling.

## Technical Context

**Language/Version**: TypeScript (Node 18+ / React 18).
**Primary Dependencies**: Express + Zod; React + React Router v6. No new deps.
**Storage**: In-memory `Map`.
**Testing**: Vitest (store) + manual two-tab end-to-end.
**Constraints**: Polling only; in-memory; deterministic word (index-based).

## Constitution Check

- **I. Brownfield-First** — PASS. Extends model/store/schemas/routes + GamePage /
  ResultPanel. One new endpoint; no new files or libraries.
- **II. Spec-Driven** — PASS. specify → clarify → plan complete; tasks trace FRs.
- **III. Deterministic Game Rules** — PASS. Restart advances `wordIndex` by one
  modulo the list; no randomness; scoring untouched.
- **IV. Polling-Only** — PASS. finished/lobby transitions detected by the 2s poll.
- **V. Incremental Validation** — PASS. Builds + tests + full two-tab round.
- **VI. AI Review Discipline** — PASS. Granular commits, reviewed, no co-author.

No violations → Complexity Tracking empty.

## State Model

### Backend (`backend/src/models/game.ts`)

```
RoomStatus = "lobby" | "playing" | "finished"   // extended
```

No new Room fields — restart mutates existing ones.

### Store (`backend/src/services/roomStore.ts`)

- `submitGuess`: on a correct guess, also set `room.status = "finished"`; reject
  guesses when status is already `finished`.
- `toRoomSnapshot`: reveal `word` when `status === "playing" && viewer is drawer`
  OR when `status === "finished"` (public to all).
- `restartGame(code, requesterId)`: host-only; set `status="lobby"`, `strokes=[]`,
  `guesses=[]`, reset all `scores` to 0, clear `drawerId`, and advance
  `wordIndex = (wordIndex + 1) % STARTER_WORDS.length`. Preserve participants.

### Frontend

- `api.ts`: extend snapshot `status` union with `"finished"`; add `restartGame`.
- `state/roomStore.ts`: add `restartGame()`.
- `GamePage.tsx`: when `finished`, show a result panel (word + final scores +
  history) and, for the host, a Restart button; poll already runs — when status
  returns to `lobby`, navigate everyone to `/lobby`.
- `ResultPanel.tsx`: when finished, also show the correct word + a "Final scores"
  emphasis (reuse the guess history it already renders).

## Data Flow

1. **End**: guesser submits correct word → `submitGuess` scores 100 + sets
   `finished` → snapshot now exposes `word` to all. Both tabs' poll shows the
   result within ~2s.
2. **Restart**: host clicks Restart → `POST /restart` → store resets round state,
   advances word, status `lobby` → host navigates to `/lobby`. Guessers' game-page
   poll sees `lobby` → navigate to `/lobby`.

## File-Level Plan

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Extend `RoomStatus` with `"finished"`. |
| `backend/src/services/roomStore.ts` | `submitGuess` ends round on correct + rejects when finished; snapshot reveals word when finished; `restartGame`. |
| `backend/src/api/schemas.ts` | Add restart body schema. |
| `backend/src/api/rooms.ts` | Add `POST /:code/restart` (host-only). |
| `backend/src/services/roomStore.test.ts` | Tests: correct guess → finished; word public when finished; finished rejects guess; restart resets + preserves players + advances word; non-host restart rejected. |
| `frontend/src/services/api.ts` | Snapshot `status` union; `restartGame`. |
| `frontend/src/state/roomStore.ts` | `restartGame()`. |
| `frontend/src/components/ResultPanel.tsx` | Show correct word + final scores when finished. |
| `frontend/src/pages/GamePage.tsx` | Result UI + host Restart; nav to `/lobby` when status returns to lobby; show result when finished. |

## Testing Strategy

- **Unit (vitest)**: correct guess sets `finished`; `word` present for guesser
  when finished; guess rejected when finished; `restartGame` clears strokes/
  guesses, zeroes scores, clears drawer, sets lobby, advances word, preserves
  participants; non-host restart rejected.
- **Manual two-tab (final validation)**: full round + result + restart loop.
- **Builds**: backend + frontend zero errors.

## Risks

- **Word reveal timing**: must only reveal to all when `finished` (not earlier) —
  covered by the snapshot condition + a unit test.
- **Restart race**: a poll mid-restart could briefly show stale data; acceptable
  (next poll corrects within ~2s), and restart is idempotent.
- **Status-driven navigation loops**: guard GamePage nav so it only redirects to
  lobby on `lobby` (not on `finished`), and LobbyPage only to game on `playing`.

## Project Structure

```text
specs/004-result-restart/
├── spec.md
├── plan.md
├── checklist.md
├── tasks.md
└── analysis.md
```

**Structure Decision**: Reuse existing layout; one new endpoint, no new dirs.

## Complexity Tracking

No constitution violations — none.
