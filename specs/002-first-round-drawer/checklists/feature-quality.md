# Feature Quality Checklist: First Round — Drawer Assignment and Secret Word

**Purpose**: Validate the quality, clarity, and completeness of requirements across all dimensions before implementation
**Created**: 2026-06-02
**Feature**: [spec.md](../spec.md)

---

## Requirement Completeness

- [x] CHK001 - Are requirements defined for what ALL participants see when the game screen first loads (not just the drawer's experience)? [Completeness, Spec §FR-002] — FR-002 and US1 scenarios 1–2 both cover all-participant view ✓
- [x] CHK002 - Is the visual form of "clearly-identified drawer" specified (e.g., label, badge, named section) or left open to implementation? [Completeness, Spec §FR-002] — Intentionally left to implementation; plan.md provides default guidance; accepted gap ✓
- [x] CHK003 - Are requirements defined for what a participant sees when the game transitions to active but their client has not yet fetched the updated snapshot? [Completeness, Gap] — FR-006 covers "immediately on load"; transient millisecond state on localhost not worth specifying; accepted gap ✓
- [x] CHK004 - Is the non-revealing indicator for guessers specified as a string, a visual element, or a pattern (e.g., blank tiles vs. a message)? [Completeness, Spec §FR-005] — Intentionally left to implementation; plan.md supplies the default string; accepted gap ✓
- [x] CHK005 - Are requirements defined for what happens if `currentWord` is `null` at render time (e.g., due to a timing edge on session restore)? [Completeness, Edge Case] — Null = safe state (no word shown); consistent with guesser path; accepted gap ✓

---

## Requirement Clarity

- [x] CHK006 - Is "clearly-identified drawer" defined with a measurable or observable criterion (e.g., the drawer's name appears in a labelled element visible without scrolling)? [Clarity, Spec §FR-002] — quickstart.md Step 4 validation table provides the observable criterion; accepted gap in spec ✓
- [x] CHK007 - Is "immediately" in FR-006 ("reflect drawer identity and word visibility immediately") quantified or bounded by the 1-second threshold stated in SC-001? [Clarity, Spec §FR-006, SC-001] — SC-001 bounds it to 1s; FR-006 + SC-001 together are sufficient ✓
- [x] CHK008 - Is the term "non-revealing indicator" (FR-005) defined consistently with the implementation guidance in plan.md, or is it left ambiguous for the implementer? [Clarity, Spec §FR-005] — plan.md supplies the default string; spec intentionally abstract; accepted gap ✓
- [x] CHK009 - Is "deterministically selected" (FR-003) clarified to mean `STARTER_WORDS[0]` specifically, or only that the selection must be reproducible? [Clarity, Spec §FR-003] — FR-003 says "first word from the starter seed list" — specific enough; concrete value in plan.md/research.md; accepted gap ✓
- [x] CHK010 - Is the phrase "without requiring any additional interaction" in FR-006 specific enough to distinguish session-restore behaviour (which does require an async fetch) from UI interaction? [Clarity, Spec §FR-006] — "no user action" is the clear intent; async fetch is transparent infrastructure; accepted gap ✓

---

## Requirement Consistency

- [x] CHK011 - Is the drawer identity requirement (FR-002: all participants see the drawer) consistent with the US1 acceptance scenario that only checks each player's own role label rather than a shared drawer-identity element? [Consistency, Spec §FR-002, US1] — US1 scenario 1 covers all-participant drawer label; scenarios 2–3 cover individual roles; consistent ✓
- [x] CHK012 - Are the success criteria SC-002 (word visible to drawer) and SC-003 (word not shown to guesser) consistent with FR-004 and FR-005 respectively, with no gaps or contradictions between requirement and criterion? [Consistency, Spec §SC-002, SC-003, FR-004, FR-005] — Direct 1-to-1 alignment; no contradictions ✓
- [x] CHK013 - Is the "host = drawer" rule stated consistently across spec.md (FR-001: "host MUST be designated"), plan.md (drawerId = hostId), and the Assumptions section? [Consistency, Spec §FR-001, Assumptions] — All three state the same rule consistently ✓
- [x] CHK014 - Does the spec's Assumptions section align with the constitution §IV (no drawer rotation, no multi-round) without contradicting any functional requirement? [Consistency, Assumption] — Assumptions explicitly exclude rotation and multi-round; fully aligned ✓

---

## Acceptance Criteria Quality

- [x] CHK015 - Is SC-001 ("within 1 second") measurable in the lab validation context described in quickstart.md, or does it require tooling not available in manual testing? [Measurability, Spec §SC-001] — Snapshot already in store when navigate() fires; 1s is observable manually on localhost ✓
- [x] CHK016 - Is SC-004 ("same word selected every time") testable with the manual steps in quickstart.md (Steps 6 and 3-second restart test), or does it need a more precise repeatability criterion? [Measurability, Spec §SC-004] — quickstart.md Step 6 covers this with a second game start ✓
- [x] CHK017 - Does SC-005 ("page refresh restores correct role and word visibility without any additional action") account for the async fetch that session restore triggers? Is "no additional action" from the user's perspective defined accurately? [Measurability, Spec §SC-005] — "No user action" is the clear intent; async fetch is transparent; quickstart Steps 8–9 validate it ✓
- [x] CHK018 - Are all 5 success criteria (SC-001–SC-005) verifiable with the 9 checks listed in quickstart.md without requiring automated tooling? [Measurability, Coverage] — SC-001→checks 1,4; SC-002→check 4; SC-003→checks 5,6; SC-004→check 7; SC-005→checks 8,9 ✓

---

## Scenario Coverage

- [x] CHK019 - Is the primary flow (host starts game → both tabs navigate to game screen → drawer sees word, guesser does not) fully specified across all acceptance scenarios in US1 and US2? [Coverage, Spec §US1, US2] — US1 scenario 1 + US2 scenarios 1–2 together cover the full primary flow ✓
- [x] CHK020 - Is the session-restore flow (participant refreshes /game → role and word visibility restored) covered by at least one acceptance scenario with explicit expected outcomes? [Coverage, Spec §SC-005, Edge Case] — SC-005 + Edge Cases section + quickstart Steps 8–9 cover this ✓
- [x] CHK021 - Are requirements specified for the state of the game screen during the brief window between navigation to /game and the session-restore fetch completing (e.g., loading state, blank, redirect)? [Coverage, Gap] — Transient state (milliseconds on localhost); FR-006 covers "immediately"; accepted gap ✓
- [x] CHK022 - Is there a requirement for what happens when a guesser's session restore fetch returns `currentWord: null` — does the spec distinguish between "guesser correctly hidden" and "fetch failed"? [Coverage, Exception Flow] — Both cases produce same observable outcome (null = no word shown); no distinction needed; accepted gap ✓

---

## Edge Case Coverage

- [x] CHK023 - Is the minimum-player edge case (exactly 2 players: 1 drawer + 1 guesser) explicitly addressed in requirements, or only in the spec Assumptions? [Edge Case, Spec §Assumptions] — Edge Cases section explicitly covers this case with expected behavior ✓
- [x] CHK024 - Is the single-word-list edge case (word list has exactly 1 word) addressed in spec requirements, or implicitly handled by the `STARTER_WORDS[0]` selection rule? [Edge Case, Spec §Assumptions] — Edge Cases section covers this; FR-003 guarantees selection succeeds; accepted ✓
- [x] CHK025 - Are requirements defined for what a guesser sees if they navigate directly to `/game` without having been in the lobby (e.g., no session in storage)? [Edge Case, Gap] — Session restore returning false → navigate to /; consistent with LobbyPage pattern; accepted gap ✓

- [x] CHK026 - Does the spec address the race condition where the host's `startRoom` response arrives at the frontend with `currentWord` before the non-host's polling response does — are requirements consistent for both paths to the game screen? [Edge Case, Spec §US2] — Both paths produce identical snapshot data; no requirement inconsistency; accepted gap ✓

---

## Non-Functional Requirements

- [x] CHK027 - Is the 1-second threshold in SC-001 the only non-functional performance requirement, or are there latency requirements for session restore (SC-005) that should also be quantified? [Non-Functional, Spec §SC-001, SC-005] — SC-005 restore latency is implicitly same standard; no separate threshold needed for lab context; accepted gap ✓
- [x] CHK028 - Are there requirements that the `currentWord` field is never exposed in network responses to guessers — stated as a privacy/data-isolation requirement, not just a UI-layer concern? [Non-Functional, Spec §FR-005] — FR-005 says "MUST NOT be displayed"; data-model.md makes network-layer enforcement explicit; accepted gap in spec ✓
- [x] CHK029 - Are accessibility requirements defined for the drawer identity label and word display (e.g., screen-reader visibility, colour contrast)? [Non-Functional, Gap] — Out of scope for this lab; accepted gap ✓

---

## Dependencies & Assumptions

- [x] CHK030 - Is the dependency on feature 001 (room setup and lobby) explicitly stated as a prerequisite, and are the interfaces it provides (participantId, hostId, session restore) clearly named in the spec? [Dependency, Spec §Assumptions] — Assumptions section names feature 001, participantId, hostId, and session restore explicitly ✓
- [x] CHK031 - Is the assumption that `STARTER_WORDS[0]` equals `"rocket"` documented as a concrete value in the spec (or only in plan.md), so a reviewer can verify the claim without reading implementation files? [Assumption, Spec §FR-003] — FR-003 says "first word from the starter seed list"; concrete value in plan.md/research.md; accepted gap ✓
- [x] CHK032 - Is the assumption that "host" and "first player" are always the same participant validated against the feature 001 implementation, or stated as an assumption that could break if feature 001 changes? [Assumption, Spec §Assumptions] — Assumptions section states this explicitly and ties it to hostId established at room creation ✓

---

## Notes

- CHK002 and CHK006 together surface the I1 finding from `/speckit-analyze`: the drawer identity placement is underspecified for all-participants visibility
- CHK009 surfaces the gap between the spec's abstract "deterministically selected" and the concrete `STARTER_WORDS[0]` decision in plan.md — if the spec is the authoritative source, the value should appear there
- CHK028 is the most critical non-functional gap: word privacy is enforced in the backend projection, but the spec only describes it as a UI concern ("displayed only on drawer's screen")
- Items marked incomplete require spec updates before implementation begins
