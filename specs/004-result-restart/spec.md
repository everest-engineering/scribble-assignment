# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `scribble-lab` *(spec directory `004-result-restart`)*

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Result state visible to everyone after a round ends (Priority: P1)

When the active round ends, every participant — drawer and guessers alike — sees a shared **Result** view containing the cleartext correct word, the final scoreboard, and the full ordered guess history from that round. This is the moment when the secret word is finally revealed to non-drawers. The result view is read-only: no new guesses are accepted in this state.

**Why this priority**: This is the payoff of the entire game loop built in features 001–003. Without a result state, a "completed" round is indistinguishable from an in-progress one, and there is no closure for guessers. It is the smallest possible slice that demonstrates an end-to-end game.

**Independent Test**: Open two browser tabs (host = drawer, guest = guesser), start a round, submit the correct guess from the guest tab, then trigger round-end. Within ≤ 2 seconds, **both tabs** display: the cleartext word `rocket`, scores `Alice 0 — Bob 100`, and the full chronological guess feed. Neither tab shows a guess input.

**Acceptance Scenarios**:

1. **Given** an active round where Bob has guessed correctly once and Alice (drawer) has the secret word `rocket`, **When** the round ends (host clicks **End Round**), **Then** within one poll cycle both tabs show a banner *"Round 1 ended — the word was ROCKET"*, a scoreboard `Alice 0 — Bob 100`, and the chronological feed of every guess from the round.
2. **Given** the round is in result state, **When** any guesser attempts `POST /rooms/:code/guesses`, **Then** the server rejects with `409` (no active round) and the feed is unchanged.
3. **Given** the round is in result state, **When** a non-drawer polls `GET /rooms/:code`, **Then** the response now includes the cleartext `secretWord` (the reveal is intentional and final).
4. **Given** a participant joins / refreshes during the result state, **When** they receive the room snapshot, **Then** they see the same banner, word, scoreboard, and feed as everyone else.
5. **Given** an active round with zero correct guesses, **When** the host ends the round, **Then** the result banner still reveals the word and the scoreboard shows all zeros.

---

### User Story 2 — Host restart returns everyone to lobby with state cleared (Priority: P2)

In the result state, **only the host** sees a **Restart** action. When the host presses it, every tab — within one poll cycle — returns to the **lobby** state. Participants are preserved with the same IDs and join order; round state (word, scores, guess history, locked-out list, drawer assignment) is fully cleared. The host can then start a fresh round from a clean lobby.

**Why this priority**: Restart turns the game from a one-shot demo into something that can be played repeatedly in a single session. It is genuinely independent of US1 — if US1 ships first, the room is already in a usable terminal state; restart is the next obvious follow-up.

**Independent Test**: With US1 in place, end a round, then press **Restart** in the host tab. Verify within ≤ 2 seconds that both tabs show the lobby (participant list intact, no round panel, no scoreboard, no result banner). Verify the host can immediately start a new round and the secret word is freshly selected via `selectWordForRound`.

**Acceptance Scenarios**:

1. **Given** a room in result state with `Alice (host), Bob` and finished round 1 (scores `0-100`, word `rocket`), **When** Alice presses **Restart**, **Then** within one poll cycle both tabs show `status: lobby`, `round: null`, the participant list `[Alice (host), Bob]` (unchanged), and the **Restart** button is gone.
2. **Given** Alice has just restarted, **When** Alice presses **Start Game** again, **Then** the lobby → round transition works exactly as in feature 002 (round 1, host is drawer, secret word picked deterministically). The new round's `scores`, `guesses`, and `lockedParticipantIds` are all freshly initialised — no carry-over from the previous round.
3. **Given** the room is in result state, **When** **Bob** (non-host) attempts `POST /rooms/:code/restart`, **Then** the server returns `403` and the room stays in result state.
4. **Given** the room is in result state, **When** any participant attempts restart against an **unknown** room code, **Then** the server returns `404`.
5. **Given** the room is in **lobby** (not result state), **When** the host attempts restart, **Then** the server returns `409` (nothing to restart) and the room is unchanged.
6. **Given** Alice presses **Restart** twice in rapid succession (network retry), **Then** the second request is idempotent: the room remains in lobby with the same participant list; no error is shown.

---

### Edge Cases

- **End round called by a non-host**: server returns `403`; round continues normally.
- **End round called on a lobby-state room**: server returns `409` (no active round); room unchanged.
- **End round called on an unknown room**: server returns `404`.
- **End round called twice (host retries)**: idempotent. The second call returns `200` with the same result snapshot; the room stays in `result` state and no state changes.
- **Polling during the transition**: a participant whose poll arrives mid-transition either sees the pre-end state OR the post-end state — never a partial state. The transition is a single atomic mutation server-side.
- **Restart preserves host identity**: `hostParticipantId` does not change across restart. The original host remains the host.
- **Restart clears the drawer assignment**: after restart, `participants[].isDrawer` is `false` for everyone until the next `Start Game`.
- **Guess history is discarded on restart**: the previous round's guesses do not persist into the new round and are not retrievable.
- **Sessions across restart**: the same `participantId` continues to work — `sessionStorage` rehydration (feature 001) still locates the room.
- **Empty participants edge**: restart is allowed even if only the host is left in the room (no 2-player gate at restart — the 2-player gate is enforced only on **Start Game**, per feature 001 / FR-006).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The room MUST support a third lifecycle state `result` in addition to `lobby` and `round`. State transitions are: `lobby → round` (via Start, feature 002), `round → result` (via End Round, this feature), `result → lobby` (via Restart, this feature). No other transitions are valid.
- **FR-002**: The server MUST expose an `End Round` endpoint that accepts `{ participantId }`, requires the caller to be the **host**, and transitions the room from `status: round` to `status: result`. The endpoint MUST return `403` for non-host callers, `409` if the room is not currently in `round`, and `404` for unknown rooms.
- **FR-003**: In the `result` state, every viewer's `RoomSnapshot.round` MUST include the cleartext `secretWord` (the secret-word reveal is intentional and final at round-end), the full ordered `guesses[]` history, the final `scores` map, and the locked-out list — exactly the same shape every viewer saw during the round, **plus** the now-revealed `secretWord` for non-drawers.
- **FR-004**: In the `result` state, the server MUST reject any `POST /rooms/:code/guesses` with `409` (no active round). The guess history and scores MUST NOT change while in `result`.
- **FR-005**: The server MUST expose a `Restart` endpoint that accepts `{ participantId }`, requires the caller to be the **host**, and transitions the room from `status: result` back to `status: lobby`. The endpoint MUST return `403` for non-host callers, `409` if the room is not currently in `result`, and `404` for unknown rooms.
- **FR-006**: On a successful Restart, the room's `round` field MUST be set to `null`. Participants MUST be preserved unchanged (same IDs, same names, same join order, same `hostParticipantId`). `participants[].isDrawer` MUST become `false` for every participant.
- **FR-007**: Both End Round and Restart MUST be **idempotent** with respect to repeated calls in the **same** terminal state: a second End Round in `result` state returns `200` with the unchanged snapshot; a second Restart in `lobby` state returns `200` with the unchanged snapshot.
- **FR-008**: Every participant MUST observe the round-end transition and the restart transition within **≤ 2 seconds** via the existing polling channel. No new transport is added.
- **FR-009**: The frontend MUST render a distinct **Result view** when `room.status === "result"`. The view MUST show: a round-ended banner with the cleartext word, the final scoreboard for all participants, and the chronological guess feed. The view MUST NOT render the drawer canvas, the guess input, or the lobby's Start button.
- **FR-010**: The host's tab MUST render an **End Round** button while `status: round` and a **Restart** button while `status: result`. Both buttons MUST be hidden / absent on non-host tabs. The frontend MUST NOT rely on client-side enforcement alone — the server is authoritative (per FR-002 and FR-005).

### Key Entities *(data involved)*

- **Room status** *(extended)*: `"lobby" | "round" | "result"`. The new `"result"` value is the only addition versus features 001–003.
- **Round in result state**: keeps every field it had during the round (`roundNumber`, `drawerParticipantId`, `secretWord`, `guesses`, `scores`, `lockedParticipantIds`), with the difference that `secretWord` is **always** included in every viewer's snapshot — not gated on drawer identity.
- **No new entities**: the feature reuses the `Room`, `Round`, and `Guess` entities defined in features 001–003. Restart deletes the `Round` instance entirely.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After End Round is called, **all** viewer tabs display the cleartext correct word, the final scores, and the full guess history within **≤ 2 seconds** in **9 of 10** measured rounds on a typical laptop on localhost.
- **SC-002**: After Restart is called, **all** viewer tabs display `status: lobby` with the unchanged participant list and **no** round panel within **≤ 2 seconds** in **9 of 10** measured restarts.
- **SC-003**: For any 10 consecutive `GET /rooms/:code?participantId=<guesser>` polls during the `result` state, the cleartext secret word appears in **10 of 10** responses (full reveal contract).
- **SC-004**: A non-host who attempts End Round or Restart receives HTTP `403` in **10 of 10** attempts and the room state does **not** change in any of those attempts.
- **SC-005**: After a Restart followed immediately by a new Start Game, the new round's `scores` map contains `0` for every participant and the new `guesses[]` array has length `0` — verified across **10 of 10** restart-then-start cycles.
- **SC-006**: End Round and Restart MUST each complete server-side within **≤ 100 ms** at the 95th percentile on localhost (consistent with the existing room operations' implicit budget).

## Assumptions

- Built strictly on top of features 001 + 002 + 003. No new transport, no database, no auth, no WebSockets.
- The polling cadence (~2s, visibility-aware) from feature 001 is reused unchanged.
- **Round-end is explicit (host-triggered)**: the host clicks **End Round** to terminate the round. Auto-end-on-first-correct-guess is **out of scope** for this feature (it could be a future enhancement). This is the minimum that makes the spec independently testable without coupling restart to a guessing condition.
- **Cumulative scoring across rounds is out of scope**: per the README's "Explicitly Out Of Scope" list ("multiple rounds, drawer rotation, timers"). Each round's scores are independent and discarded on restart. The README's Scenario 4 wording ("everyone returns to the lobby with players preserved and all round state cleared") explicitly confirms this.
- **Drawer rotation is out of scope**: after a restart-then-start cycle, the host is once again the drawer (same deterministic assignment as feature 002).
- The Result view re-uses the existing `GuessPanel` scoreboard and feed components — they already render correctly in a read-only state when no submit input is rendered.
- The secret-word reveal at round-end is **final**: once a round transitions to `result`, every viewer sees the cleartext word until the room is restarted (at which point the entire `round` is destroyed).
- No persistence: closing all tabs and restarting the backend wipes the room and any result state (consistent with the in-memory store from feature 001).
