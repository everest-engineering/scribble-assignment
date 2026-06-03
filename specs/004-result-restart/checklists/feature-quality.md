# Feature Quality Checklist: Result, Restart & Final Validation

**Purpose**: Validate the completeness, clarity, consistency, and measurability of requirements before implementation begins
**Created**: 2026-06-03
**Feature**: [spec.md](../spec.md)

---

## Requirement Completeness

- [x] CHK001 Are requirements defined for the visual empty state of the guess history on the result screen when a round ends with zero guesses — is the spec's edge case ("shows an empty state message") traceable to FR-004? [Completeness, Spec §FR-004, Edge Cases]
- [x] CHK002 Are requirements defined for what all players see during the transition between the active game UI and the result view — is there a defined intermediate state (e.g., loading indicator) or is the switch assumed to be instantaneous? [Completeness, Gap]
- [x] CHK003 Is FR-001 complete in specifying both the trigger (button click) and the scope of the "End Round" action — does it also require confirmation or is a single click sufficient? [Completeness, Spec §FR-001]
- [x] CHK004 Are requirements defined for what the "End Round" button looks like in disabled or loading state while the end-round request is in flight — is optimistic UI or blocking required? [Completeness, Gap]
- [x] CHK005 Is FR-004 complete in specifying the full content of the result screen — does it cover sort order for the scoreboard (descending), empty-guess handling, and the label format for correct/incorrect guesses? [Completeness, Spec §FR-004]

---

## Requirement Clarity

- [x] CHK006 Is "prominently displayed" in FR-004 defined with measurable criteria (e.g., a heading, a specific visual treatment), or is the presentation of the revealed word left entirely to implementation? [Clarity, Ambiguity, Spec §FR-004]
- [x] CHK007 Is "within the next polling cycle (~2 seconds)" in FR-003 and FR-007 consistent with the "2 polling cycles (~4 seconds maximum)" bound in SC-001 and SC-002 — do the FR and SC describe the same guarantee or different ones? [Clarity, Spec §FR-003, FR-007, SC-001, SC-002]
- [x] CHK008 Is "all result data visible" in FR-008 (session restore) scoped to the same content as FR-004 (word, scoreboard, guess history), or does it imply a broader definition of "data"? [Clarity, Spec §FR-008, FR-004]
- [x] CHK009 Is "all round state" in FR-006 (cleared on restart) enumerated explicitly — does the spec list every field that must be cleared (currentWord, drawerId, strokes, guesses, scores) or use a vague aggregate term? [Clarity, Spec §FR-006]
- [x] CHK010 Is the host-only restriction for both FR-001 ("End Round") and FR-005/FR-006 ("Restart") stated in terms of the same identity mechanism — `hostId` — without ambiguity about how host identity is established? [Clarity, Spec §FR-001, FR-005, FR-006, Assumptions]

---

## Requirement Consistency

- [x] CHK011 Is the polling timing stated consistently across FR-003 ("within the next polling cycle ~2s"), SC-001 ("within 2 polling cycles ~4s max"), FR-007 ("next polling cycle ~2s"), and SC-002 ("within 2 polling cycles ~4s max") — or do the FRs and SCs describe different latency bounds? [Consistency, Spec §FR-003, FR-007, SC-001, SC-002]
- [x] CHK012 Does the Assumptions section ("restart resets scores to 0 for all participants") align with FR-006 and the plan (which reset `scores = {}` — an empty map, not zero-keyed entries) — is the representation of "zeroed scores" consistent across spec and plan? [Consistency, Spec §Assumptions, FR-006, plan.md]
- [x] CHK013 Are the host-only controls (End Round button, Restart button) consistently described as requiring the same identity check across FR-001, FR-002, FR-005, FR-006, and the acceptance scenarios in US1 and US2? [Consistency, Spec §FR-001, FR-002, FR-005, FR-006]
- [x] CHK014 Is the word privacy rule stated consistently between the Key Entities section ("exposed when status is 'ended'") and FR-009 ("revealed on the result screen") — are both anchored to the same state transition trigger? [Consistency, Spec §FR-009, Key Entities]

---

## Acceptance Criteria Quality

- [x] CHK015 Can SC-001 ("100% of end-round actions result in all connected players seeing the result screen") be verified in a two-tab setup, or does "all connected players" imply testing with 3+ tabs? [Measurability, Spec §SC-001, quickstart.md]
- [x] CHK016 Can SC-003 ("result screen correct for 100% of rounds including zero-guess rounds") be verified distinctly from SC-001 — does the quickstart define a separate check for the zero-guess scenario? [Measurability, Spec §SC-003, quickstart.md]
- [x] CHK017 Is SC-004 ("0% of non-host sessions see host-only controls") independently verifiable for BOTH the End Round button AND the Restart button — does the quickstart have explicit checks for each? [Measurability, Spec §SC-004, quickstart.md]
- [x] CHK018 Is SC-005 ("100% session restore success on result screen") defined with a specific recovery method (return to result view, data intact) rather than just "page refresh succeeds"? [Measurability, Spec §SC-005, FR-008]

---

## Scenario Coverage

- [x] CHK019 Are requirements defined for what non-host players do while waiting on the result screen if the host never restarts — is the indefinite wait an accepted limitation, or should a fallback be specified? [Coverage, Spec §Edge Cases, Gap]
- [x] CHK020 Are requirements defined for a player who navigates directly to the game URL while the room status is "ended" (e.g., via browser history bookmarked URL) — does session restore correctly detect "ended" and land them on the result screen? [Coverage, Spec §FR-008, Edge Cases]
- [x] CHK021 Is the behavior defined for what happens when a guesser submits a guess at the exact moment the host clicks "End Round" — is the guess processed (if it arrives before the status change) or rejected with 400 (if after)? [Coverage, Spec §Edge Cases, Gap]
- [x] CHK022 Are requirements defined for the LobbyPage behavior after a restart — does the spec confirm that the existing polling in LobbyPage will correctly show the re-populated participant list immediately after redirect? [Coverage, Spec §FR-007, Assumptions]

---

## Edge Case Coverage

- [x] CHK023 Is the "host closes tab before restarting" scenario in the spec's Edge Cases explicitly accepted as a known limitation with no mitigation requirement, or should there be an owner-transfer or fallback mechanism specified? [Edge Case, Spec §Edge Cases]
- [x] CHK024 Are requirements defined for what happens to the polling interval on GamePage after the room transitions to "ended" — does polling continue at ~2s, stop, or change cadence on the result screen? [Edge Case, Spec §FR-003, Gap]
- [x] CHK025 Is behavior defined for a player who is mid-session-restore (sessionStorage read in progress) when the room status changes from "active" to "ended" — is eventual consistency via the next poll sufficient, or does this require explicit handling? [Edge Case, Gap]
- [x] CHK026 Are requirements defined for the "Restart" button's behavior while the restart request is in flight — is it disabled to prevent double-submit, or is duplicate restart handling addressed at the backend? [Edge Case, Gap]

---

## Non-Functional Requirements

- [x] CHK027 Is there a requirement that the result screen renders within a specific time after the "ended" status is detected by the client — or is the only timing guarantee the 2s polling cadence defined in SC-001? [Non-Functional, Spec §SC-001]
- [x] CHK028 Is the result screen required to remain fully accessible (all data readable) for an unbounded duration between the host ending the round and restarting — or is there an implicit timeout assumption? [Non-Functional, Assumption, Gap]

---

## Dependencies & Assumptions

- [x] CHK029 Is the assumption that the existing ~2s polling loop from Feature 003 (GamePage) will deliver "ended" status to all clients documented as a dependency — and is it explicit that no new polling mechanism is required? [Assumption, Spec §Assumptions, plan.md]
- [x] CHK030 Is the assumption that `Scoreboard` and `ResultPanel` components (from Feature 003) already accept the correct prop interfaces for the result screen validated against their current signatures — `scores: Record<string, number>` and `guesses: Guess[]`? [Dependency, Spec §Assumptions, plan.md Slice 5]
- [x] CHK031 Is it assumed that `room.hostId` is always the ID of a currently active participant — and is there a requirement about what happens if the host's participant record is somehow absent from `room.participants` on the result screen? [Assumption, Spec §Assumptions, FR-005]

---

## Notes

- Check items off as completed: `[x]`
- Add inline findings after each item: e.g. `— spec updated to clarify wording`
- CHK007 and CHK011 flag a real inconsistency between FR timing ("next polling cycle ~2s") and SC timing ("2 polling cycles ~4s max") — the SC is the more conservative and correct bound; consider aligning the FR wording
- CHK012 flags a representation gap: spec says "reset to 0" but plan uses `scores = {}`; both produce correct UI output via `?? 0`, but spec precision could be improved
- Items marked `[Gap]` indicate requirements absent from the spec; decide whether to add them or explicitly accept the gap before implementation
