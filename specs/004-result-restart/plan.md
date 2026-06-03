# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart/spec.md`

## Summary

Extend the room's lifecycle with a `"result"` state and two new host-only
state transitions: `end-round` (playing → result) and `restart` (result →
lobby). The result-state snapshot reveals the secret word and every guess
entry's literal text to all viewers — overriding the Scenarios 2 + 3
redaction rules — and reuses the existing scoreboard and guess-history
panels as the source of truth for final scores and history. Restart zeroes
every participant's score, empties the guess history, clears the current
round, and preserves the participants list and host designation.

Primary technical levers:

- Extend `RoomStatus` to `"lobby" | "playing" | "result"`.
- Add `POST /rooms/:code/end` (host-only, must be `playing`) and `POST /rooms/:code/restart` (host-only, must be `result`). Both reuse the existing `startRoomSchema` shape (`{participantId: string}`).
- Extend `toRoomSnapshot(room, viewerParticipantId)` with a single conditional: when `status === "result"`, deliver the real `secretWord` and the real `guess.text` to every viewer; Scenarios 2 + 3 visibility rules apply only when `status === "playing"`.
- Frontend: add `<EndRoundButton />` rendering inside the GamePage's drawer/host control area; add a new `/result` route + `ResultPage`; both GamePage and ResultPage drive navigation off `room.status` so any client transitioning into `"result"` (or back to `"lobby"` after restart) navigates automatically via the existing polling cadence.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+, ES Modules
**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6, Vite 5 (frontend). No additions.
**Storage**: In-memory `Map<string, Room>` on the backend; client-side identity in browser `localStorage` (from Scenario 1).
**Testing**: Vitest 3 in both `backend/` and `frontend/`; jsdom on the frontend.
**Target Platform**: localhost development; modern evergreen browser.
**Project Type**: Web application — `backend/` + `frontend/`.
**Performance Goals**: Polling cadence remains 2 s; state transitions (playing → result; result → lobby) visible to all participants within 3 s (Spec SC-001).
**Constraints**: No DB, no WS, no auth/sessions, no new top-level deps. Strict TS; no `any`. Zod at every API boundary. Constitution Principle IV: host-only end and restart are deterministic from `room.status` + the caller's `participantId`; no `Math.random()` in game logic.
**Scale/Scope**: Lab-scale — single round per room; restart returns to a fresh lobby that can accept new joiners and begin a new round.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Source | Status (Phase 0) | Status (Phase 1) |
|---|---|---|---|---|
| G1 | Every planned change traces to a US/FR/SC | Principle I | PASS — all changes map to US1–US2, FR-001…FR-015, SC-001…SC-012 | PASS |
| G2 | No out-of-scope items present | Principle II + Tech & Scope | PASS — no auto-end variants (Clarification Q1), no timers, no rotation, no cohort lock on restart | PASS |
| G3 | No new top-level deps | Principle II | PASS — Express, Zod, React, Router, Vite only | PASS |
| G4 | All API boundaries Zod-validated; no `any` | Principle III | PASS — new endpoints reuse `startRoomSchema` shape; discriminated unions for service returns | PASS |
| G5 | Deterministic / observable behavior across clients | Principle IV | PASS — state transitions are pure functions of `room.status` + caller's `participantId`; polling drives transition on every connected client; no `Math.random()` introduced | PASS |
| G6 | Self-review hooks in place | Principle V | PASS — granular commits per US, three-tab gate (with Network-tab inspection of `secretWord` and `guess.text` reveal in result state), both builds + tests | PASS |

No violations → Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── POST_rooms_code_end.md           # NEW endpoint
│   ├── POST_rooms_code_restart.md       # NEW endpoint
│   └── snapshot-visibility-rules.md     # Extends Scenarios 2 + 3 with the result-state full-reveal override
├── checklists/
│   └── requirements.md  # Already exists from /speckit-specify
└── tasks.md             # Phase 2 output (later)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # MODIFY — add POST /:code/end and POST /:code/restart
│   │   ├── router.ts         # (unchanged)
│   │   ├── schemas.ts        # MODIFY — alias startRoomSchema as endRoundSchema and restartRoomSchema (or simply reuse the same schema at the route)
│   │   └── schemas.test.ts   # (no new cases — schema is identical to startRoomSchema)
│   ├── models/
│   │   └── game.ts           # MODIFY — RoomStatus widens to "lobby" | "playing" | "result"
│   ├── services/
│   │   ├── roomStore.ts      # MODIFY — endRound() and restartRoom() services; toRoomSnapshot result-state override for word + guess text
│   │   └── roomStore.test.ts # MODIFY — new tests for endRound, restartRoom, and the result-state snapshot reveal
│   └── seed/starterData.ts   # (unchanged)
└── package.json              # (unchanged)

frontend/
├── src/
│   ├── services/
│   │   ├── api.ts            # MODIFY — widen status union to "lobby" | "playing" | "result"; add api.endRound and api.restart
│   │   └── api.test.ts       # MODIFY — endRound and restart request shape + error passthrough
│   ├── state/
│   │   └── roomStore.ts      # MODIFY — endRound() and restart() actions; hydrateSession placeholder widens status union
│   ├── pages/
│   │   ├── GamePage.tsx      # MODIFY — End Round button visible only when isHost && room.status === "playing"; status-watch effect navigates to /result when status flips
│   │   ├── ResultPage.tsx    # NEW — renders the round's secret word, the final scoreboard, the full guess history (all text revealed), and a host-only Restart button; status-watch effect navigates to /lobby when status flips back
│   │   ├── ResultPage.test.tsx # NEW — host/guest rendering, restart wiring, transition on status change
│   │   └── GamePage.test.tsx # MODIFY — End Round button visibility + click wiring + transition to /result on status === "result"
│   ├── components/
│   │   └── (no new components) # ResultPage reuses Scoreboard, RoomCodeBadge, and a small history list
│   └── routes/
│       └── index.tsx         # MODIFY — register /result route
└── package.json              # (unchanged)
```

**Structure Decision**: Same web app layout. One new page file pair (`ResultPage.tsx` + test) and one new route. No new components, no new directories, no new packages.

## Phase 0 — Outline & Research

See [research.md](./research.md). Summary of decisions:

- **Result state name**: `"result"`. Forward-compatible with any future "between rounds" sub-state if Scenario 5 ever happens; explicit and short.
- **End-round endpoint shape**: `POST /rooms/:code/end` with body `{participantId}`. Returns 200 + viewer-filtered snapshot on success; 404 / 403 / 409 errors.
- **Restart endpoint shape**: `POST /rooms/:code/restart` with body `{participantId}`. Returns 200 + viewer-filtered snapshot on success; 404 / 403 / 409 errors.
- **Schema reuse**: both endpoints take `{participantId: string}`, identical to `startRoomSchema`. The schemas module exports two named aliases (`endRoundSchema`, `restartRoomSchema`) that point at the same underlying schema; this keeps route handlers self-documenting without duplicating logic.
- **Idempotency interpretation**: the spec's FR-003 ("end while not playing → reject") and FR-010 ("restart while not result → reject") are taken literally. Both endpoints return 409 with a clear message on a wrong-state call. The edge case "press twice rapidly → no-op" is satisfied by client-side navigation: after the first successful end, the host's tab transitions to `/result` so a UI-driven second press is impossible; a console-driven second press correctly receives 409 with `"Cannot end a round that is not in progress"`.
- **Result-state reveal in `toRoomSnapshot`**: a single conditional addition — `if (status === "result")` short-circuits both the Scenario 2 `secretWord` redaction AND the Scenario 3 guess-text redaction to deliver real values to every viewer. The filter remains centralised in one function.
- **Restart side effects**: in this order — for each participant, `score = 0`; then `room.guesses = []`; then `room.currentRound = null`; then `room.status = "lobby"`. The order is documented but the operations are independent.
- **Frontend transition triggers**: both GamePage and ResultPage subscribe to `room.status` via the existing polling-driven snapshot. GamePage navigates to `/result` when status flips from `"playing"` to `"result"`. ResultPage navigates to `/lobby` when status flips from `"result"` to `"lobby"`. The host triggers the transition for themselves immediately via the endpoint's response; guests catch up on their next poll within ~2 s.
- **No new client routes besides `/result`**: the existing `/lobby` and `/game` continue to handle their respective states; the new `/result` route handles the new state.

## Phase 1 — Design & Contracts

See [data-model.md](./data-model.md), [contracts/](./contracts/), and [quickstart.md](./quickstart.md).

Phase 1 artifacts:

- `data-model.md` — `RoomStatus` widening; `Room.status` lifecycle; restart side-effect specification; client mirrors.
- `contracts/POST_rooms_code_end.md` — request/response, full error matrix.
- `contracts/POST_rooms_code_restart.md` — request/response, full error matrix.
- `contracts/snapshot-visibility-rules.md` — extends Scenarios 2 + 3's contracts with the result-state full-reveal override.
- `quickstart.md` — four-act walkthrough mapped to every SC; explicit Network-tab inspection step for the result-state reveal (third-party viewer's payload MUST now show the real `secretWord` and the real `guess.text` for previously-redacted entries).
- `CLAUDE.md` SPECKIT block updated to `specs/004-result-restart/plan.md`.

## Data Flow Summary

```text
End Round (host tab):
  Host clicks End Round
    -> roomStore.endRound()
    -> POST /rooms/ABCD/end { participantId: "host-id" }
    -> server validation:
       1. room exists else 404 "Room not found"
       2. participantId === room.hostParticipantId else 403 "Only the host can end the round"
       3. status === "playing" else 409 "Cannot end a round that is not in progress"
    -> service: room.status = "result"
    -> 200 { room: snapshotFor(host) }  // includes full secretWord + full guess.text
    -> store updates; GamePage status-watch effect detects "result"
    -> navigate /result

Polling (guesser tab):
  setInterval(2000) -> GET /rooms/ABCD?participantId=guest-id
    -> server: returns snapshotFor(guest) with status === "result", secretWord real, guess.text real for every entry
    -> store updates; GamePage detects "result"
    -> navigate /result

Result view (any viewer):
  Renders:
    - the round's secret word (always real now)
    - the scoreboard with each participant's final score
    - the guess history with the literal text of every entry (no <correct guess> placeholder anywhere)
    - host-only Restart button

Restart (host tab):
  Host clicks Restart
    -> roomStore.restart()
    -> POST /rooms/ABCD/restart { participantId: "host-id" }
    -> server validation:
       1. room exists else 404 "Room not found"
       2. participantId === room.hostParticipantId else 403 "Only the host can restart"
       3. status === "result" else 409 "Cannot restart from this state"
    -> service:
       - for each participant: participant.score = 0
       - room.guesses = []
       - room.currentRound = null
       - room.status = "lobby"
    -> 200 { room: snapshotFor(host) }
    -> store updates; ResultPage status-watch effect detects "lobby"
    -> navigate /lobby

Polling (guesser tab):
  Next poll snapshot has status === "lobby"
    -> ResultPage navigates to /lobby
    -> Existing Scenario 1 lobby flows resume

Subsequent Start (any time after restart):
  Host clicks Start (existing Scenario 2 flow)
    -> participants.length >= 2 check
    -> new currentRound, fresh secretWord (deterministic from room.code; same word as before, since selector is pure)
    -> all participants' scores still 0 (from restart)
    -> guesses still []
    -> status -> "playing"
    -> existing Scenarios 2 + 3 flows resume
```

## Implementation Sequence

1. **Backend type widening + result-state snapshot reveal**: `RoomStatus` += `"result"`; extend `toRoomSnapshot` so `status === "result"` short-circuits both the secretWord redaction and the guess-text redaction.
2. **Backend services**: `endRound(code, participantId)` and `restartRoom(code, participantId)` with discriminated union returns (`null | {error: "not-host"} | {error: "wrong-state"} | {room}`).
3. **Backend routes**: `POST /:code/end` and `POST /:code/restart` mapping sentinels to 404 / 403 / 409.
4. **Backend tests**: end + restart success + error paths; snapshot reveal in result state for word + guess text.
5. **Frontend types + api**: widen status union; add `api.endRound` and `api.restart`.
6. **Frontend store**: `endRound()` and `restart()` actions.
7. **Frontend GamePage**: add `End Round` button (host + playing only); add status-watch effect for `"result"` → `/result`.
8. **Frontend ResultPage (new)**: secret word card, scoreboard with finals, full guess history list (no redaction placeholder anywhere), host-only Restart button, status-watch effect for `"lobby"` → `/lobby`.
9. **Frontend route registration**: `/result` → `ResultPage`.
10. **Frontend tests**: GamePage End Round wiring + transition; ResultPage host/guest rendering + Restart wiring + transition.
11. **Validation**: both `npm run build`s; both `npm test`s; quickstart walkthrough.

## Risks

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | Snapshot result-state override accidentally leaks word during playing | Low | Override is a single `if (status === "result")` early-exit branch; existing Scenario 2 + 3 tests for playing state must continue to pass — they assert `secretWord: null` and `text: null` for non-privileged viewers |
| R2 | Restart leaves stale state on some field (e.g., updatedAt drifts, or `currentRound` keeps a reference to the old round) | Low | Restart is a single function with the four-step ordered reset; backend test asserts `currentRound === null`, `guesses === []`, every `participant.score === 0`, `status === "lobby"` |
| R3 | ResultPage doesn't re-poll after restart, host stays stuck on /result | Low | ResultPage uses the same `useLobbyPolling(room?.code ?? null)` hook the other game-area pages use; the host's own restart response immediately updates the store to `status === "lobby"` which triggers the transition effect before the next poll fires |
| R4 | A late-joiner during result state could read the secret word from the snapshot | None | The existing Scenario 1 `joinRoom` guard rejects non-lobby joins with 409 before any snapshot is delivered; the word reveal only happens for participants already in the room when the round ended |
| R5 | The host accidentally restarts twice and a guess in flight from the just-ended round lands in the new lobby | Low | Restart clears `guesses` to `[]`; the in-flight guess would land against a `status === "lobby"` room and Scenario 3's `submitGuess` returns `{error: "not-playing"}` → 409. Already covered. |
| R6 | Scenario 3's frontend redaction placeholder text appears in the result view because of stale snapshot caching | Low | The frontend reads the snapshot live; placeholder is decided client-side from `text === null`. The server now sends real text for every entry in result state, so `text === null` never happens. |
| R7 | Browser back button from /result returns user to /game in a half-broken state | Low | Each page's status-watch effect re-evaluates current `room.status` on mount and navigates accordingly; the user lands on the right page regardless of which one the URL points to |

## Testing Strategy

- **Backend unit (Vitest)**:
  - `endRound(code, hostId)` from `playing` state transitions to `result`; preserves `currentRound`, `guesses`, scores.
  - `endRound(code, nonHostId)` returns `{error: "not-host"}` (route maps to 403).
  - `endRound(code, hostId)` against `lobby` or `result` returns `{error: "wrong-state"}` (route maps to 409).
  - `endRound(code, ?)` against unknown code returns `null` (route maps to 404).
  - `restartRoom(code, hostId)` from `result` state resets every participant's score to 0, clears `guesses`, clears `currentRound`, sets `status` to `lobby`; participants list and host designation are preserved.
  - `restartRoom(code, nonHostId)` returns `{error: "not-host"}`.
  - `restartRoom(code, hostId)` against `lobby` or `playing` returns `{error: "wrong-state"}`.
  - `restartRoom(code, ?)` against unknown code returns `null`.
  - `toRoomSnapshot(room, anyViewerId)` when `status === "result"` returns the real `currentRound.secretWord` regardless of viewer.
  - `toRoomSnapshot(room, anyViewerId)` when `status === "result"` returns real `guess.text` for every entry, regardless of viewer.
  - `toRoomSnapshot(room, ?)` when `status === "playing"` still applies Scenarios 2 + 3 redaction unchanged (regression).
  - `joinRoom(code, name)` against `status === "result"` still returns `{error: "room-not-open"}` (regression — late join still blocked).

- **Frontend unit (Vitest + jsdom)**:
  - `api.endRound("ABCD", "host-id")` POSTs to `/rooms/ABCD/end` with `{participantId}`.
  - `api.restart("ABCD", "host-id")` POSTs to `/rooms/ABCD/restart` with `{participantId}`.
  - `RoomStore.endRound()` and `RoomStore.restart()` update state with the returned snapshot.
  - `GamePage` renders the End Round button only when `isHost && room.status === "playing"`; guest tabs never see the button; the host's click triggers `roomStore.endRound`.
  - `GamePage` navigates to `/result` when `room.status` transitions to `"result"` (both host and guest scenarios).
  - `ResultPage` (new):
    - any viewer sees the real `currentRound.secretWord` (no placeholder anywhere).
    - any viewer sees the full guess history with real text for every entry (no `<correct guess>` placeholder).
    - any viewer sees the scoreboard with the final scores.
    - host sees a Restart button; guests do not.
    - the host's Restart click triggers `roomStore.restart`.
    - navigates to `/lobby` when `room.status` transitions back to `"lobby"`.

- **Three-tab acceptance (manual)**: `quickstart.md` walkthrough — end-round transition, result-view reveal, **Network-tab inspection of formerly-redacted fields** (third-party viewer's payload now shows `secretWord` and `text` populated), host-only Restart with cleared round state, post-restart Start flow.

- **Build gate**: both `npm run build`s green; both `npm test`s green.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — nothing to track.
