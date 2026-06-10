# Implementation Checklist: Result, Restart, and Final Validation

**Purpose**: Requirements quality validation — tests whether spec, plan, and data-model are complete, clear, and consistent enough to implement without ambiguity. Author-facing, pre-implementation.
**Created**: 2026-06-10
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)

**Focus**: Full coverage — API, frontend, and state machine, with mandatory-gate emphasis on access control and state transitions.

---

## 🔴 GATE: Access Control Requirements

*These items must pass before implementing FR-001/FR-001a and FR-008/FR-008a.*

- [ ] CHK001 - Is the definition of "host" unambiguous and consistent across all requirements? The spec says "first participant" — does the data model confirm `participants[0]` is always stable and never reordered? [Consistency, Spec §Key Entities, data-model.md]
- [ ] CHK002 - Is the error response for non-host callers specified with an HTTP status code? FR-001a and FR-008a say "returning an appropriate error" — is the specific status code (e.g., 403 vs 401) documented? [Clarity, Spec §FR-001a, Spec §FR-008a]
- [ ] CHK003 - Is the `playerName` validation for host checks consistent with the existing pattern used in `submitGuess`? Does the spec confirm no new identity mechanism is introduced? [Consistency, Spec §Clarifications, Assumption]
- [ ] CHK004 - Are requirements defined for what happens when `playerName` is missing or empty in the end/restart request body? FR-001a and FR-008a only address non-host mismatches — is the empty/missing case covered? [Coverage, Gap, Spec §FR-001a]
- [ ] CHK005 - Are UI requirements for access control defined for both roles? The spec says "End Game" button is host-only and "Play Again" is host-only — is the requirement for non-host view (button absent) explicitly stated for both? [Completeness, Spec §Assumptions, Spec §US-1, Spec §US-3]
- [ ] CHK006 - Is there a requirement covering the edge case where the host player leaves the room before ending the game? Does the spec define host reassignment or leave this explicitly out of scope? [Coverage, Gap]

---

## 🔴 GATE: State Machine Transition Requirements

*These items must pass before implementing `endGame()` and `restartGame()` in roomStore.*

- [ ] CHK007 - Is the complete valid state transition set explicitly enumerated? The spec implies `lobby → playing → result → lobby` — is the `lobby → result` direct path (without playing) intentionally blocked, and is this stated? [Completeness, Spec §Edge Cases, data-model.md §State Machine]
- [ ] CHK008 - Are the HTTP status codes for invalid-state rejections specified? FR-002 and FR-011 say "returning an appropriate error" — is the specific status code documented? [Clarity, Spec §FR-002, Spec §FR-011]
- [ ] CHK009 - Is it specified whether `endGame` is idempotent? If the endpoint is called twice in `"result"` state, should it return the existing result snapshot or a new error? [Clarity, Gap, Spec §FR-002]
- [ ] CHK010 - Is it specified whether `restartGame` is idempotent? If called twice in `"lobby"` state, should it error (FR-011) or succeed silently? [Clarity, Gap, Spec §FR-011]
- [ ] CHK011 - Are all fields cleared on restart explicitly enumerated and consistent across spec and data model? Spec §FR-009 lists `secretWord, drawerName, guesses, scores` — does data-model.md also list `strokes`? Is the discrepancy resolved? [Consistency, Spec §FR-009, data-model.md §restartGame]
- [ ] CHK012 - Are requirements defined for the `playing → result` transition's effect on the `strokes` field? FR-009 clears strokes on restart, but the spec does not state whether strokes are preserved or cleared when entering result state. [Completeness, Gap, Spec §FR-001]
- [ ] CHK013 - Is there a requirement for what the `toRoomSnapshot` function returns when `status === "result"` and `secretWord` is undefined? (e.g., if `endGame` were somehow called before a word was set.) [Edge Case, Coverage, data-model.md §toRoomSnapshot]

---

## API Requirements — Completeness & Clarity

- [ ] CHK014 - Are the success response shapes for `POST /rooms/:code/end` and `POST /rooms/:code/restart` fully specified? Contracts say `{ room: RoomSnapshot }` — is this consistent with all other room-mutating endpoints in the existing API? [Consistency, contracts/api.md]
- [ ] CHK015 - Is the HTTP status code for successful end/restart calls specified? The contracts show 200 but the existing `createRoom` uses 201. Is the choice of 200 documented and intentional? [Clarity, contracts/api.md, Spec §FR-001]
- [ ] CHK016 - Are requirements defined for the case where `code` in the path does not match any room? FR-003 and FR-012 address this — is the HTTP status code (404) explicitly stated in the spec, not just the contracts? [Completeness, Spec §FR-003, Spec §FR-012]
- [ ] CHK017 - Is the `playerName` trimming behaviour for end/restart body fields specified? The existing `guessSchema` does not trim `playerName`, but `createRoomSchema` does. Are the new schemas consistent with the existing pattern? [Consistency, Gap, contracts/api.md]
- [ ] CHK018 - Are requirements defined for concurrent calls — e.g., two host tabs both clicking "End Game" simultaneously? Should the second call succeed (idempotent) or fail (409)? [Coverage, Gap]

---

## Frontend Requirements — Result Screen Completeness

- [ ] CHK019 - Is "prominently displayed" for the secret word (FR-005, SC-002) quantified with any measurable criteria? Can this requirement be objectively verified, or is it subjective? [Measurability, Spec §FR-005, Spec §SC-002]
- [ ] CHK020 - Are requirements defined for participants who scored zero points? FR-006 says "final score for every participant" — does this include players who never guessed (0 points implicitly) or only those in the `scores` map? [Clarity, Spec §FR-006, Gap]
- [ ] CHK021 - Are loading/transitioning state requirements defined for the Result screen? Polling is async — is there a requirement for what is displayed between the client detecting `"result"` state and the Result screen rendering fully? [Coverage, Gap]
- [ ] CHK022 - Is the empty-state requirement for guess history (US-2 scenario 4) consistent with FR-007? FR-007 requires "full guess history in submission order" but does not mention the empty state explicitly — are these aligned? [Consistency, Spec §FR-007, Spec §US-2]
- [ ] CHK023 - Are requirements defined for how scores are displayed when multiple players have the same score? [Coverage, Edge Case, Gap]
- [ ] CHK024 - Is it specified whether the Result screen displays the drawer's name alongside the secret word? The screen shows `secretWord` and `drawerName` is available in the snapshot — is there a requirement about whether `drawerName` is displayed? [Completeness, Gap, data-model.md]

---

## Frontend Requirements — Navigation & Polling

- [ ] CHK025 - Are requirements defined for which pages participate in `"result"` state detection? The spec says "all polling clients" (FR-004) — does this include `LobbyPage` for players who are mid-join when the game ends? [Completeness, Spec §FR-004, Spec §Edge Cases]
- [ ] CHK026 - Is the polling behaviour of `ResultPage` itself specified? The spec defines polling for `GamePage` and `LobbyPage` detecting `"result"` and `"lobby"` — but does `ResultPage` also poll to detect when the host restarts? [Gap, Spec §FR-013]
- [ ] CHK027 - Are requirements defined for what happens if a client navigates directly to `/result` without a room in state? (e.g., page refresh on the result screen) [Coverage, Edge Case, Gap]
- [ ] CHK028 - Is it specified whether the `GamePage` polling loop stops after navigating to the Result screen, or continues running? A memory leak / duplicate navigation risk exists if not specified. [Clarity, Gap, plan.md]
- [ ] CHK029 - Are requirements defined for the transition from `ResultPage` back to `LobbyPage`? The spec covers detection of `"lobby"` state — but is the requirement that polling detects `"lobby"` on `ResultPage` (not on `LobbyPage`) stated explicitly? [Clarity, Spec §FR-013]

---

## State Machine — Frontend Consistency

- [ ] CHK030 - Is the `RoomSnapshot.status` type union update (`"result"` added) required in both frontend `api.ts` and backend `game.ts`? Does the spec or plan explicitly state both must be updated? [Completeness, Spec §Key Entities, data-model.md]
- [ ] CHK031 - Are requirements consistent between the spec ("lobby state on next poll") and the plan (polling loop detects `"lobby"` in ResultPage)? Do they agree on which component is responsible for triggering the navigation back to lobby? [Consistency, Spec §FR-013, plan.md]
- [ ] CHK032 - Are requirements defined for what the `"result"` state snapshot looks like when there is no `drawerName` (e.g., the word was never set)? Is this impossible by design, and is that constraint documented? [Edge Case, Coverage, data-model.md §toRoomSnapshot]

---

## Dependencies & Assumptions

- [ ] CHK033 - Is the dependency on `STARTER_WORDS[0]` for secret word assignment documented as an assumption? The spec assumes the word is already set when `endGame` is called — is there a guard or is this guaranteed by the game flow? [Assumption, Spec §Assumptions, plan.md]
- [ ] CHK034 - Is the assumption that `participants[0]` is immutable after room creation validated? The spec says "host is always the first entry and does not change" — is this invariant enforced in the data model or just assumed? [Assumption, Spec §Key Entities, data-model.md]
- [ ] CHK035 - Is the dependency on scores being carried from feature 003 (gameplay-interaction) explicitly stated as a prerequisite? FR-009 clears scores — but scores only exist if feature 003 is implemented. Is this ordering dependency documented? [Dependency, Spec §Assumptions]

---

## Round-Trip & Regression Requirements

- [ ] CHK036 - Are requirements defined for which fields the second round starts fresh? FR-009 lists fields to clear, but does it cover `strokes`? If a player draws in round 1 and the game restarts, does the new round start with an empty canvas? [Completeness, Spec §FR-009, data-model.md]
- [ ] CHK037 - Is the US-4 round-trip scenario (P4) testable independently? The acceptance scenario says "scores from previous round are not carried over" — is this requirement stated as a functional requirement (not just a user story scenario)? [Traceability, Spec §US-4, Spec §FR-009]
- [ ] CHK038 - Are requirements defined for what happens when players submit guesses after the host has clicked "End Game" but before their polling cycle detects `"result"` state? [Coverage, Edge Case, Gap]

## Notes

- 🔴 GATE items (CHK001–CHK013) should be resolved before writing `endGame()`, `restartGame()`, and their route handlers.
- Items marked `[Gap]` represent missing requirements that should either be resolved in the spec or explicitly documented as out-of-scope assumptions before implementation begins.
- CHK011 (strokes cleared on restart) is the highest-priority consistency gap — the spec and data model disagree on this point.
