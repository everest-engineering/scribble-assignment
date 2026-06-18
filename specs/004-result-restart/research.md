# Phase 0 Research: Result, Restart & Final Validation

Open decisions were resolved in `/speckit.clarify` (Session 2026-06-18). Decisions with rationale and rejected alternatives.

## D1 — Result as a room lifecycle state

**Decision**: Widen `RoomStatus` to `"lobby" | "active" | "result"`. The host's End Round sets `status = "result"`.

**Rationale**: One additional enum value makes the result observable through the existing `GET /rooms/:code`
poll (FR-001/FR-005), mirroring how `active` was added in Group 1. Distinct states keep the lifecycle explicit.

**Alternatives considered**: A separate `ended` boolean — duplicates what the enum expresses. Deriving result
from "all guessed" — implicit and fragile; the host-ends decision (clarified) is explicit.

## D2 — Host-authoritative End and Restart

**Decision**: New `POST /rooms/:code/end` and `POST /rooms/:code/restart`, each taking `{ participantId }` and
refusing non-hosts with 403 (`endRound`/`restartGame` in the store throw `HttpError`).

**Rationale**: Consistent with host-only Start (Group 1) — lifecycle control is the host's, enforced
server-side so UI can't be bypassed (FR-002, FR-007). Matches the Group 1–3 service-level pattern.

**Alternatives considered**: Client-only gating — bypassable. Anyone-can-restart — contradicts host control.

## D3 — Reveal the word at result

**Decision**: In `toRoomSnapshot`, include `word` when the viewer is the drawer **or** `status === "result"`.
So during play only the drawer sees it (Group 2), and at result everyone does (FR-003).

**Rationale**: Reuses the existing snapshot `word` field and viewer-aware logic; the only change is widening the
condition. Final scores and full history are already in every snapshot (Group 3), so the result view needs no
new data beyond the word reveal (FR-004).

**Alternatives considered**: A separate result payload — redundant; the snapshot already carries scores+history.

## D4 — Restart reset set (preserve players, clear round)

**Decision**: `restartGame` sets `status = "lobby"`, clears `drawerId`, `secretWord`, and `guesses` (to `[]`),
and resets every participant's `score` to 0; **participants themselves are preserved** (FR-008, FR-009).

**Rationale**: Directly implements "players preserved, round state cleared", and resolves the Group 3
carry-forward note (restart must reset scores + clear guesses/drawer/word). Resetting scores to 0 makes the
next round start clean (the round is single, no carry-over).

**Alternatives considered**: Carrying scores across rounds — out of scope (no multi-round scoring). Dropping
and recreating participants — would lose identities/host.

## D5 — Client convergence on result and post-restart lobby

**Decision**: Reuse the ~2s poll (now on both lobby and game pages). `GamePage` watches `status`: shows the
result view when `result`, and navigates to `/lobby` when `status === "lobby"` (post-restart) — the mirror of
Group 1's auto-advance to `/game` on `active`.

**Rationale**: No new transport; the poll already syncs status to all. Auto-return closes the loop so no player
is stranded on the game screen after restart (FR-010).

**Alternatives considered**: Manual "back to lobby" button for each player — strands players who don't click;
the assignment says everyone returns.

## Summary of resulting changes

| Decision | Backend | Frontend | FRs |
|----------|---------|----------|-----|
| D1 result state | `models/game.ts`, `roomStore.ts` | `GamePage.tsx` | FR-001 |
| D2 end/restart endpoints | `schemas.ts`, `roomStore.ts`, `rooms.ts` | `api.ts`, `roomStore.ts`, `GamePage.tsx` | FR-001/002/006/007 |
| D3 reveal word | `roomStore.ts` (`toRoomSnapshot`) | `GamePage.tsx` | FR-003/004 |
| D4 restart reset | `roomStore.ts` (`restartGame`) | — | FR-008/009 |
| D5 convergence | — | `GamePage.tsx` | FR-005/010 |
