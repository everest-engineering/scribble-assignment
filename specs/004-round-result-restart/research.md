# Phase 0 Research: Round Result & Host Restart

Builds on features 001 (lobby/room/host), 002 (game start, drawer, word reveal), and 003 (guessing, scoring, guess history). This feature adds the end-of-round result state and the host restart. All decisions honor the constitution: in-memory only, REST polling (~2s), no new dependencies, no timers, no rewrite.

## Brownfield Discovery (Constitution I)

Files read before planning, and what each contributes:

- `backend/src/models/game.ts` — `RoomStatus = "lobby" | "playing"`; `Round { number, drawerId, word, guesses, correctPlayerIds }`; `Participant.score`; viewer-aware `RoundSnapshot`/`GuessSnapshot` already model the masking pattern.
- `backend/src/services/roomStore.ts` — `startGame` (sets status `playing`, creates round, resets scores to 0), `submitGuess`, and `toRoundSnapshot` (word drawer-only; correct guesses omit `text`). The `ended` state and end/restart functions slot in alongside these.
- `backend/src/api/rooms.ts` + `schemas.ts` — action endpoints `POST /:code/start` and `POST /:code/guess` follow a clear pattern: parse `participantId`, call the store, map `failure` → `HttpError(403/409/404)`. The new endpoints mirror this exactly.
- `frontend/src/services/api.ts` + `state/roomStore.ts` — typed `api.*` methods returning `{ room }`, with store methods updating the snapshot; the submitter gets the new snapshot immediately, others on their next poll.
- `frontend/src/routes.tsx` + `pages/*` — **page-per-status** pattern: `LobbyPage` navigates to `/game` when `status === "playing"`, and to `/` when there is no room. `GamePage` polls every 2s.
- `frontend/src/components/Scoreboard.tsx` + `ResultPanel.tsx` — already render `participants[].score` (desc) and `round.guesses`; reusable as-is for the result view.

### Three incomplete behaviors (today)

1. A round never ends — `RoomStatus` has no terminal/result value and no endpoint transitions out of `playing`.
2. The secret word is never revealed to guessers — `toRoundSnapshot` masks it for all non-drawers in every state.
3. There is no way to play again — nothing resets a finished room back to a fresh lobby.

### Two assumptions carried in

1. The host (room owner) is the sole controller of end + restart (Clarifications 2026-06-08; consistent with host-only `startGame`).
2. "All round state cleared" on restart includes resetting every `participant.score` to 0 (Clarifications 2026-06-08).

## Decision 1 — Represent the result as a third `RoomStatus` value (`"ended"`)

- **Decision**: Add `"ended"` to `RoomStatus` (`"lobby" | "playing" | "ended"`). The host's end-round transitions `playing → ended`; restart transitions `ended → lobby`.
- **Rationale**: The frontend already drives navigation off `room.status` (page-per-status). A new status value makes the result state propagate over the existing poll with **zero new sync machinery** — every player's poll observes `ended` and routes to `/results`. A boolean flag (`round.finished`) would require parallel navigation logic and muddy the single source of truth.
- **Alternatives considered**: (a) Boolean `Round.finished` flag — rejected: two sources of truth for "what screen am I on." (b) Keep `playing` and infer "ended" from a populated result object — rejected: ambiguous and breaks the clean status→page mapping.

## Decision 2 — Two host-only action endpoints (`POST .../end`, `POST .../restart`)

- **Decision**: `POST /rooms/:code/end` (host ends active round → `ended`) and `POST /rooms/:code/restart` (host → fresh `lobby`). Both take `{ participantId }` and return `{ room: RoomSnapshot }`, exactly like `/start`.
- **Rationale**: Mirrors the established `/start` and `/guess` action-endpoint shape (Constitution III — these are actions on the existing REST resource, not a new transport). Authorization and state guards live in `roomStore` and map to `HttpError` in the route, identical to `startGame`.
- **Failure mapping**:
  - `/end`: `403` not host, `409` not `playing`/no round, `404` room missing.
  - `/restart`: `403` not host, `404` room missing. (See Decision 4 for idempotency.)
- **Alternatives considered**: A single `POST /:code/transition { to }` endpoint — rejected: opaque, harder to authorize/validate per transition, and inconsistent with the existing one-verb-per-endpoint style.

## Decision 3 — Reveal word + unmask guesses **conditionally on `status === "ended"`**

- **Decision**: In `toRoundSnapshot`, when `room.status === "ended"`, include `word` for **every** viewer and include `text` on **every** guess (correct ones included). When `playing`, keep the existing behavior (word drawer-only; correct guesses omit `text`).
- **Rationale**: This is the precise point where FR-003/FR-005/FR-006 are satisfied, and gating on the new status keeps the `playing` projection **byte-for-byte unchanged** (Constitution V — regression-safe). Because the word is public once `ended`, the feature 002/003 secrecy invariant is intentionally and safely lifted (there is no longer anything to protect).
- **Alternatives considered**: A separate `ResultSnapshot` type/endpoint — rejected: duplicates the round shape and the poll channel for no benefit; the existing `RoundSnapshot` already carries word + guesses, it only needs the reveal gate.

## Decision 4 — Restart semantics: clear round, reset scores, preserve players; idempotent

- **Decision**: `restartRoom` sets `status = "lobby"`, `round = null`, every `participant.score = 0`, and leaves `participants` and `hostId` untouched. If the room is **already** `lobby`, restart is a **no-op success** (returns the current lobby snapshot).
- **Rationale**: Matches the input ("players preserved and all round state cleared") and Clarifications (scores reset to 0). The no-op-when-already-lobby behavior gives FR-014 idempotency for free and absorbs double-clicks / a late poll racing the navigation, without a 409 that the UI would have to special-case. A fresh `lobby` room with `round = null` is identical to a pre-`startGame` room, so a new game can be started immediately (FR-013).
- **Alternatives considered**: `409` on restart from `lobby` — rejected: forces the client to distinguish "already restarted" from real errors and complicates idempotency.

## Decision 5 — Host departure during the result state: rely on existing room-closure (no host transfer)

- **Decision**: Do **not** build a host-transfer mechanism. The existing `closeIfEmptyOrHostGone` (run on every poll/action) already deletes the room when the host is absent, ejecting remaining players via the store's 404 handling — the same behavior as features 001–003.
- **Rationale**: **Brownfield finding** — the spec's edge case mentions "feature 001 host-transfer rules," but the codebase has **no** host transfer; feature 001 *closes* the room when the host leaves. Building transfer now would be unrequested scope and risks violating Constitution IV. The existing closure path is a coherent, already-tested outcome for a host who leaves the result screen.
- **Follow-up**: The spec's host-transfer wording should be read as "existing host-departure handling applies" (= room closes). Flagged here so the discrepancy is explicit and traceable; no code is written for transfer.

## Decision 6 — Frontend: new `ResultsPage` at `/results`, reusing existing components

- **Decision**: Add `ResultsPage.tsx` (route `/results`) that polls every 2s, reveals `round.word` to all, renders the existing `Scoreboard` (final scores) and `ResultPanel` (full history), and shows a **host-only** Restart button. `GamePage` gains a host-only "End Round" button and a `navigate("/results")` effect when `status === "ended"`; `ResultsPage` navigates to `/lobby` when `status === "lobby"` and to `/` when there is no room.
- **Rationale**: Consistent with the established page-per-status pattern and reuses already-built components (Constitution I). Navigation driven entirely by the polled `status` means non-host players are carried into and out of the result state automatically (FR-007, FR-012).
- **Alternatives considered**: Rendering results conditionally inside `GamePage` — rejected: conflates two states in one component and diverges from the existing one-page-per-status convention.

## Resolved unknowns

| Question | Resolution |
|----------|------------|
| How does a round end? | Host-only `POST /rooms/:code/end` → `status = "ended"` (no timer/auto-end). |
| How is the result state represented & synced? | New `RoomStatus = "ended"`, carried by the existing GET poll; page-per-status navigation. |
| How are word/scores/history shown to all? | `toRoundSnapshot` reveals `word` + unmasks guesses when `ended`; scores already public on `participants[]`. |
| What does restart clear/preserve? | round → null, all scores → 0; participants + hostId preserved; status → lobby. |
| Restart idempotency? | No-op success when already `lobby`. |
| Host leaves during results? | Existing room-closure (no host transfer in codebase). |

No remaining `NEEDS CLARIFICATION`.
