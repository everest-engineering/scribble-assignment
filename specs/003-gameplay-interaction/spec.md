# Feature Specification: Gameplay Interaction

**Feature Branch**: `scribble-lab` *(spec directory `003-gameplay-interaction`)*

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Submit a guess and see it in everyone's history (Priority: P1)

A guesser types a word into a guess input, presses submit, and within ~2 seconds **every participant** (drawer + every guesser) sees the new entry in a shared guess feed labelled with the guesser's name and a status of **Correct** or **Wrong**. The cleartext secret word is **never** revealed to non-drawers — not in the feed, not anywhere in the polling payload.

**Why this priority**: This is the only piece of this slice that creates multiplayer interaction. Without it the round from feature 002 is a static display. Submit-and-sync is the MVP.

**Independent Test**: Open two browser tabs (host = drawer, guest = guesser), start the round, submit a guess from the guest tab, and observe the new entry appear in **both** tabs within one ~2s poll cycle. The drawer's tab has no submit input. No real-time push: synchronization rides on the existing ~2s lobby polling channel.

**Acceptance Scenarios**:

1. **Given** Alice (drawer) and Bob (guesser) are in an active round, **When** Bob submits `"  Rocket  "`, **Then** within one poll cycle both tabs show a feed entry `Bob — Rocket — Correct` (trimmed, original casing preserved for display).
2. **Given** the same round, **When** Bob submits `"Cat"`, **Then** both tabs show `Bob — Cat — Wrong` within one poll cycle and the cleartext secret word does not appear in the guesser's payload anywhere.
3. **Given** the drawer's tab, **When** the round is active, **Then** there is no guess input visible — and a server-side guess submitted by the drawer is rejected.
4. **Given** an empty or whitespace-only guess, **When** the guesser presses submit, **Then** the server rejects it with `400` and the feed is unchanged.
5. **Given** Bob has already guessed correctly once this round, **When** Bob attempts another guess, **Then** the server rejects it (no double-scoring) and the feed is unchanged.

---

### User Story 2 — Scoring on correct guesses (Priority: P2)

When a guess is correct the guesser's room-scoped score is incremented by exactly **100**. Incorrect guesses add **0**. All scores start at **0** when the round begins. The scoreboard is visible to every participant and updates within one poll cycle.

**Why this priority**: Scoring is the gameplay payoff but is meaningless without US1's submit pipeline. Building it independently still delivers visible value on top of an existing US1.

**Independent Test**: With US1 in place, submit one correct guess and verify the guesser's score jumps from `0` to `100` in all tabs within one poll. Submit five wrong guesses and verify the score does not budge.

**Acceptance Scenarios**:

1. **Given** scores `{Alice: 0, Bob: 0}` at round start, **When** Bob submits the correct guess, **Then** the next snapshot shows `{Alice: 0, Bob: 100}` for every viewer.
2. **Given** Bob's score is already `100`, **When** a duplicate correct guess attempt is rejected (per US1 #5), **Then** the score stays at `100` (no compounding).
3. **Given** any participant's view, **When** the round is active, **Then** a scoreboard row exists for every participant including the drawer (drawer's score is `0` and does not change in this slice).

---

### User Story 3 — Drawer canvas: draw and clear (Priority: P3)

The drawer has an interactive canvas where they can sketch with the mouse/trackpad and a **Clear** button that wipes the canvas. The canvas is **local** to the drawer's screen — no synchronization to guessers in this slice. Non-drawers see a static placeholder ("Waiting for the drawer…") instead of a canvas.

**Why this priority**: A canvas without sync is functionally a doodle pad. It demonstrates UI plumbing but does not affect the multiplayer interaction. It is explicitly the last priority so the team can ship US1+US2 first.

**Independent Test**: Open the drawer's tab during an active round; verify a canvas is mounted, that mouse-drag strokes appear locally, that **Clear** empties the canvas. Open a guesser tab and verify no canvas is rendered.

**Acceptance Scenarios**:

1. **Given** Alice's drawer view, **When** Alice drags the mouse across the canvas, **Then** a freehand stroke is rendered locally.
2. **Given** Alice has drawn strokes, **When** Alice clicks **Clear**, **Then** the canvas is empty.
3. **Given** Bob's guesser view, **When** the round is active, **Then** no canvas is rendered (placeholder text only).
4. **Given** Alice refreshes her tab mid-round, **When** she returns, **Then** the canvas is empty (no persistence required) and she still sees the cleartext secret word.

---

### Edge Cases

- **Guess submitted in the lobby (no active round)**: server returns `409` (no round in progress); feed unchanged.
- **Guess submitted for an unknown room**: server returns `404` (Room not found).
- **Guess submitted with an unknown `participantId`**: server returns `403` (Participant is not in the room).
- **Drawer submits a guess** (even if their own word): server returns `403`; the drawer cannot self-score.
- **Trim semantics**: Both leading/trailing whitespace and internal redundant whitespace are normalised to a single comparison form (trim + collapse-internal). Display form retains original casing but trimmed.
- **Case-insensitive equality**: `"Rocket"`, `"ROCKET"`, `"rocket"`, `"  rocket  "` all match the secret `"rocket"`.
- **Max guess length**: 50 characters (Unicode codepoints). Server rejects with `400` if exceeded; client disables the submit button when the trimmed length is `0` or `> 50`.
- **Guess after a correct guess by the same player**: rejected with `409` (per US1 #5). A different player may still guess and score.
- **Two players guess correctly**: each gets `+100`. Round does not end in this slice — both correct guessers can accumulate one `+100` each, then are locked out.
- **Network failure on submit**: client surfaces a transient error; no entry is added to the feed; polling continues.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Guessers MUST be able to submit a guess for the current round via an HTTP endpoint that accepts `{ participantId, text }`.
- **FR-002**: The server MUST trim leading/trailing whitespace from the guess and reject any guess whose trimmed length is `0` or greater than `50`, returning HTTP `400`.
- **FR-003**: The server MUST compare guesses to the secret word using **case-insensitive equality on the trimmed text** (`trimmed.toLowerCase() === secret.toLowerCase()`).
- **FR-004**: The server MUST reject a guess from the drawer of the current round with HTTP `403`, and MUST reject a guess from a participant who has already guessed correctly in the current round with HTTP `409`.
- **FR-005**: On a correct guess from an eligible guesser, the server MUST increment that participant's room-scoped score by exactly `100` and MUST mark that participant as locked out from further guessing in the current round. Incorrect guesses MUST add `0`.
- **FR-006**: The room snapshot MUST expose the round's full guess history (ordered oldest → newest) and per-participant scores. The history entry MUST include `participantId`, `displayName`, `text` (the trimmed, original-cased guess), `isCorrect`, and `submittedAt`. The cleartext secret word MUST NOT appear in any non-drawer payload (existing FR-005 from feature 002 still holds).
- **FR-007**: Every participant MUST observe a new guess entry and the resulting score change within **≤ 2 seconds** via the existing polling channel — no new transport (no WebSockets) is added.
- **FR-008**: The guesser UI MUST disable the submit button when the trimmed input length is `0` or `> 50` and MUST clear the input on a successful submit. The drawer UI MUST NOT render a guess input.
- **FR-009**: All scores MUST start at `0` for every participant at the moment a round begins. Score state lives in the room and is reset only by starting a new round (out of scope here).
- **FR-010**: The drawer's tab MUST render an interactive canvas supporting freehand drawing and a Clear control. The canvas contents MUST NOT be transmitted to the server or to other participants in this feature.

### Key Entities *(data involved)*

- **Guess**: a single submission attempt within a round. Attributes: `id` (server-generated), `participantId`, `displayName`, `text` (trimmed, original case), `isCorrect`, `submittedAt`.
- **Round (extended)**: in addition to the fields from feature 002, a round now owns an ordered `guesses: Guess[]` list, a `scores: { [participantId: string]: number }` map (entries default to `0` for every current participant at round start), and a `lockedParticipantIds: Set<string>` (participants who have already guessed correctly and may not guess again this round).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the moment a guesser presses **Submit** to the moment every other tab shows the new feed entry, the observed delay is **≤ 2 seconds** in **9 of 10** measured submissions on a typical laptop on localhost.
- **SC-002**: For inputs `"Rocket"`, `"ROCKET"`, `"rocket"`, `"  rocket  "` against the secret `"rocket"`, **4 of 4** are recorded as correct; for `"rockets"`, `"rock et"`, `""`, `"   "`, **0 of 4** are recorded as correct (the empty / whitespace-only ones are also rejected at the HTTP layer with `400`).
- **SC-003**: After exactly one correct guess by Bob in a 2-player room, the snapshot reports `scores.Bob === 100` and `scores.Alice === 0` for every viewer (drawer, guesser, anonymous). No additional `+100` is awarded on any subsequent guess attempt by Bob in the same round.
- **SC-004**: Across 10 consecutive polling snapshots by a guesser during an active round with at least 5 wrong guesses recorded, the cleartext secret word appears in **0** payloads, while every recorded guess appears in **10/10** payloads.
- **SC-005**: A drawer who attempts to `POST /rooms/:code/guesses` with their own `participantId` receives HTTP `403` in **10 of 10** attempts and **0** new feed entries are created.

## Assumptions

- Built strictly on top of the room-state foundation from features 001 + 002; no new transport, no database, no auth.
- Polling cadence (~2s, visibility-aware) is reused from feature 001 — no new client clock is added.
- Scores are room-scoped and ephemeral; they vanish with the in-memory room.
- Canvas content is **local-only** for this slice — no server endpoint accepts strokes. Sync of canvas content is explicitly out of scope and would be a separate feature.
- Round-ending logic (e.g., "first correct guess ends the round" or "timer expiry") is **out of scope**. Multiple correct guesses simply accumulate one `+100` per guesser; the round remains active until a future feature adds termination rules.
- Maximum guess length of 50 characters covers every reasonable word in the starter dictionary with substantial headroom.
- Only the trimmed-and-lowercased form is compared; internal whitespace is **not** collapsed in the comparison — `"rock et"` does NOT match `"rocket"`. (This contradicts an earlier note in the edge cases — see the Open Questions section below.)

## Open Questions *(must resolve before `/speckit.plan`)*

> Listed here so they are visible without `[NEEDS CLARIFICATION]` markers in the requirements themselves; defaults already chosen are noted.

1. **Internal whitespace handling**: The simplest, most common Scribble rule is `trim + lowercase`, with internal whitespace preserved as-is (so `"rock et"` ≠ `"rocket"`). The default above follows this rule. Confirm or override.
2. **Drawer score behaviour**: Default = the drawer's score stays at `0` for this round (they cannot guess). Confirm.
3. **Round termination**: Default = a correct guess does NOT end the round in this slice; future feature handles end-of-round. Confirm.
