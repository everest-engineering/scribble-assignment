# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `scribble-lab` (no separate branch for this lab — same convention as `001-room-setup-lobby`)

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Scenario 2 — Game Start & Drawer Flow. Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round 1 begins with the host as the clearly-identified drawer (Priority: P1)

When the host presses Start in a valid lobby, the room transitions out of the lobby state into "Round 1" and the host is named as the drawer. Every participant — drawer or guesser — can see **who** is drawing, so the room has an unambiguous shared understanding of roles for the round.

**Why this priority**: Without a designated, visible drawer, no gameplay can proceed. This is the entry condition for every subsequent scenario (drawing, guessing, scoring).

**Independent Test**: With Alice (host) and Bob in a lobby, Alice presses Start. Both clients render "Round 1 — Alice is drawing". Alice's participant tile shows a "Drawer" badge. Bob's tile does not.

**Acceptance Scenarios**:

1. **Given** a lobby with the host plus at least one other participant, **When** the host starts the game, **Then** all participants see the room enter "Round 1" with the host shown as the drawer within ~2s.
2. **Given** the round has begun, **When** any participant polls the room, **Then** the snapshot exposes `roundNumber: 1` and a single `drawerParticipantId` equal to the host's id.
3. **Given** a non-host participant, **When** they look at the participant list during round 1, **Then** the host's tile carries a clear "Drawer" indicator and no other tile does.

---

### User Story 2 - The secret word is visible only to the drawer (Priority: P1)

The round has a secret word. The drawer needs to see it (so they know what to draw). Every other participant must **not** see it — neither in the rendered UI nor in any data the client receives — otherwise the game is broken.

**Why this priority**: Visibility leakage destroys the game's premise. Treated as a P1 correctness requirement, not a polish item.

**Independent Test**: After the host starts the game, the host's screen shows the word prominently (e.g., "Your word: ROCKET"). Bob's screen shows a placeholder (e.g., five underscores `_ _ _ _ _ _` for "rocket") and no inspection of Bob's snapshot payload reveals the cleartext word.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the drawer fetches a snapshot, **Then** the snapshot includes the secret word in plain text.
2. **Given** a round is active, **When** a guesser fetches a snapshot, **Then** the snapshot does **not** include the secret word in any form, but does include a masked length indicator equal to the word's character count.
3. **Given** a guesser inspects their network responses, **When** they search for the cleartext word, **Then** the word does not appear in any field of the payload.

---

### User Story 3 - The secret word is selected deterministically (Priority: P2)

Picking the round's word must be reproducible: given the same room and the same round number, the system always returns the same word. This makes the gameplay testable, the bug reports actionable, and the "fairness" perception consistent across reloads.

**Why this priority**: Determinism is what lets graders re-run a scenario and compare outcomes. It's a P2 because the game would technically function with random selection, but verification and grading would become flaky.

**Independent Test**: Reset the backend, create a fresh room (Alice + Bob), start the game. Note the word. Reset again with the same player order. The word for round 1 is identical.

**Acceptance Scenarios**:

1. **Given** the backend's starter word list, **When** round 1 begins for any room, **Then** the chosen word is always the first entry of the list ("rocket" in the current seed).
2. **Given** two independent rooms start their respective round 1s, **When** their drawers fetch snapshots, **Then** both see the same word (since both are round 1 against the same starter list).

---

### Edge Cases

- **Start clicked twice / two POSTs land in the same tick**: The room must not advance to "Round 2" and must not re-roll the word. The second Start is a no-op that returns the existing round payload.
- **Start while the round is already active**: Same as above — idempotent. No 4xx; the host gets the current round snapshot back.
- **A new player joins after Start**: Out of scope for this feature. Behavior may be undefined for now; documented as an assumption.
- **Empty starter word list**: Defensive guard. The system must refuse to start with a clear error rather than crash or pick `undefined`.
- **Player display names with surrounding whitespace** (precondition): The existing trim + non-empty validation from Scenario 1 continues to apply. No regressions allowed.
- **Round 1 begins with exactly 2 players**: The non-host is automatically the (sole) guesser. They must still see the masked word and the drawer indicator.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the host starts the game in a valid lobby (≥2 participants, host requester), the room MUST transition from `lobby` status to an active-round status (e.g., `round`) with a `round` payload containing `roundNumber: 1`, `drawerParticipantId`, and a server-chosen secret word.
- **FR-002**: The drawer for round 1 MUST be the room's host (i.e., `room.drawerParticipantId === room.hostParticipantId` at the start of round 1).
- **FR-003**: Every participant's snapshot MUST expose `roundNumber` and `drawerParticipantId`. Each `ParticipantView` MUST carry an `isDrawer: boolean` derived from `participant.id === drawerParticipantId`.
- **FR-004**: The secret word for round N MUST be chosen deterministically as `availableWords[(N - 1) mod availableWords.length]`. For round 1 against the current starter list, this is `"rocket"`.
- **FR-005**: The secret word MUST appear in the snapshot's `secretWord` field **only** when the viewer is the drawer. For every other viewer, `secretWord` MUST be absent (or `null`) from the payload — no client-side filtering allowed.
- **FR-006**: Guesser-facing snapshots MUST include a `maskedWord` field containing a length-only indicator (e.g., `"______"` for a 6-letter word). The drawer's snapshot MAY include the same field for UI uniformity, but the cleartext `secretWord` remains the source of truth for them.
- **FR-007**: The Start endpoint MUST be idempotent once a round is active for the room: subsequent host-initiated Start requests return the **existing** round (same `drawerParticipantId`, same `secretWord`) and do not advance the round.
- **FR-008**: Re-polling a snapshot during an in-progress round MUST return the same `drawerParticipantId` and the same `secretWord` (for the drawer) every time, until the round ends (round-end is out of scope here).
- **FR-009**: Player display names MUST already be trimmed and rejected when empty/whitespace-only — covered by `001-room-setup-lobby` FR-005/FR-009. This feature MUST NOT regress that validation.
- **FR-010**: If the starter word list is empty, the Start endpoint MUST return a clear server error (no crash, no silent `undefined` word).

### Key Entities *(include if feature involves data)*

- **Round**: Represents the active round. Attributes: `roundNumber` (positive integer, 1-based), `drawerParticipantId` (foreign key to the participant playing the drawer role), `secretWord` (plain string, server-side source of truth).
- **Room** (extended from Scenario 1): Adds a nullable `round` field. While `round` is set, `status` is `"round"`; while `round` is `null`, `status` is `"lobby"`.
- **ParticipantView** (extended): Adds an `isDrawer` flag derived per snapshot from the round's `drawerParticipantId`.
- **MaskedWord**: A derived view of the secret word that exposes only its character length (e.g., `"______"` for a 6-letter word). Sent to guessers; never to leak the cleartext.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the host presses Start in a 2-player lobby, **both** participants' UIs display "Round 1 — [host's name] is drawing" within 2 seconds.
- **SC-002**: In 10 independent runs against a freshly reset backend with the current starter word list, round 1's secret word is `"rocket"` 10/10 times.
- **SC-003**: Across 10 consecutive snapshot polls by a guesser during an active round, the cleartext secret word appears in **0** payloads, while the masked-length indicator appears in 10/10 payloads.
- **SC-004**: Issuing two Start requests in quick succession (e.g., 200ms apart) produces exactly **one** round and the same word in both responses.
- **SC-005**: The drawer's UI displays the cleartext word in **100%** of in-round polls; the guesser's UI never does.

## Assumptions

- The starter word list (`STARTER_WORDS`) contains at least one entry; current seed has five (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`).
- "Host" and "first player" refer to the same participant — established by Scenario 1's design where the room creator is the host.
- Late joins **during** an active round are out of scope for this feature; only Scenario 1's lobby-phase joins are guaranteed.
- Round transitions beyond round 1 (round 2, round 3, …) are out of scope here; only the **first** round and its drawer/word assignment are specified.
- Round termination, scoring, and word reveal are deferred to later scenarios (`Scenario 3 — Gameplay Interaction` and beyond).
- Polling cadence and resilience from Scenario 1 (~2s, visibility-aware, transient-error tolerant) carry forward unchanged.
- Authentication remains absent — the drawer is identified by `participantId`, which the client holds in `sessionStorage` per Scenario 1.
- The masking convention is "one underscore per character, joined by spaces" only as a UI default; the underlying data field is a string whose **length** matches the word.
