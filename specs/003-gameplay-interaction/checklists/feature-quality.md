# Feature Quality Checklist: Gameplay Interaction

**Purpose**: Validate the completeness, clarity, consistency, and measurability of requirements before implementation begins
**Created**: 2026-06-03
**Feature**: [spec.md](../spec.md)

---

## Requirement Completeness

- [x] CHK001 Are the exact wording requirements defined for each validation error message (empty guess, drawer-attempting-to-guess, already-correct player blocked), or is message content left entirely to implementation? [Completeness, Spec §FR-007, FR-014]
- [x] CHK002 Is the behavior of the guess form defined between submission and server response — is the input disabled, the button spinning, or the state left to implementation? [Completeness, Gap]
- [x] CHK003 Are requirements defined for what all clients see when they first load the game screen if strokes already exist (mid-session join or page refresh) — is the full canvas state guaranteed to be present in the first poll? [Completeness, Spec §Assumptions]
- [x] CHK004 Is the stroke color and lineWidth default defined in the spec, or only in the data model — are the two sources of truth consistent? [Completeness, Spec §FR-001, data-model.md]
- [x] CHK005 Are requirements specified for what the drawer sees after clicking "Clear Canvas" — is there a visual confirmation beyond the canvas emptying, and is this defined? [Completeness, Gap]

---

## Requirement Clarity

- [x] CHK006 Is "free-form drawing input" in FR-001 scoped precisely — does the spec specify that strokes are captured as continuous pointer-path polylines, or could it include shapes, fills, or text? [Clarity, Spec §FR-001]
- [x] CHK007 Is "read-only view" in FR-002 defined in terms of what interaction is prevented (no pointer events, no drawing), or does it merely state the guesser "cannot draw"? [Clarity, Spec §FR-002]
- [x] CHK008 Is "a single action" in FR-003 for clearing the canvas defined as a named control (button), or is the affordance type left to implementation? The plan names it "Clear Canvas" — does the spec reflect this? [Clarity, Spec §FR-003]
- [x] CHK009 Is "ordered by submission time" in FR-011 defined as server-assigned timestamp order or client-arrival order? These can differ under network jitter. [Clarity, Spec §FR-011]
- [x] CHK010 Is "approximately 2-second interval" in FR-013 defined with the same precision as Feature 001 (including an acceptable drift tolerance), or does it stand alone with an imprecise bound? [Clarity, Spec §FR-013]

---

## Requirement Consistency

- [x] CHK011 Does SC-002 (client inline message + server 400 for empty guesses) align with FR-007 (which only mentions "inline validation message") — is the server-side rejection requirement also present in the FR, not just in the success criterion? [Consistency, Spec §SC-002, FR-007]
- [x] CHK012 Is the scoring rule in FR-009 (correct=100, incorrect=0) stated using identical language to the constitution's Engineering Standards ("correct guess scores exactly 100 points") — are the two sources consistent? [Consistency, Spec §FR-009, Constitution §Engineering Standards]
- [x] CHK013 Are FR-014 (block after correct) and the Edge Cases section now fully consistent following the recent update — do both describe the same block-on-correct / retry-on-incorrect rule without contradicting each other? [Consistency, Spec §FR-014, Edge Cases]
- [x] CHK014 Is the "~2s polling" cadence in FR-013 stated consistently with SC-001, SC-004, and SC-005, which all independently reference "approximately 2 seconds"? Are these cross-referenced or defined independently? [Consistency, Spec §FR-013, SC-001, SC-004, SC-005]

---

## Acceptance Criteria Quality

- [x] CHK015 Is SC-001 ("canvas visible within ~2s of a stroke") measurable without specifying a measurement method — how is "visible" defined and from whose perspective is it measured? [Measurability, Spec §SC-001]
- [x] CHK016 Can SC-003 ("100% of correct guesses recognized correctly") be verified independently, or does it require SC-002 (empty rejection) and FR-014 (block-after-correct) to be in place first? [Measurability, Spec §SC-003]
- [x] CHK017 Is SC-005 ("scoreboard consistent across all players within ~2s") independently verifiable with a two-tab setup, or does meaningful score divergence testing require 3+ tabs? [Measurability, Spec §SC-005, quickstart.md]
- [x] CHK018 Are all four FR-014 scenarios (drawer blocked, correct-player blocked, incorrect-player allowed, session-restored hidden state) each independently verifiable in the quickstart validation table? [Measurability, Spec §FR-014, quickstart.md]

---

## Scenario Coverage

- [x] CHK019 Are requirements defined for what a player who joins mid-game (after strokes already exist) sees on their first load — is the current canvas state guaranteed to be delivered immediately? [Coverage, Gap]
- [x] CHK020 Is behavior defined for what happens to lobby polling once the room transitions to "active" — does polling stop, redirect, or continue until the next status change is detected? [Coverage, Gap]
- [x] CHK021 Are requirements defined for a player who submits a guess and then refreshes before the server responds — is the in-flight guess lost or retried? [Coverage, Spec §Assumptions, Gap]
- [x] CHK022 Are recovery requirements defined for repeated polling failures during gameplay — at what point, if ever, should the game screen surface a persistent error to the user? [Coverage, Gap]

---

## Edge Case Coverage

- [x] CHK023 Is behavior defined for a stroke with a single point (a tap without dragging) — is it a valid stroke rendered as a dot, or does the spec require a minimum of two points? [Edge Case, Spec §data-model.md Validation Rules]
- [x] CHK024 Is the maximum number of strokes per round defined, or is the list unbounded? An unbounded stroke list could create increasingly large polling responses over a long round. [Edge Case, Gap]
- [x] CHK025 Is behavior defined for a guesser who submits a guess at the same instant the drawer clears the canvas — are concurrent backend writes handled consistently? [Edge Case, Gap]
- [x] CHK026 Are requirements defined for the guess form's behavior when the network request fails mid-submit — is an error surfaced to the user, and is the local input state preserved? [Edge Case, Gap]

---

## Non-Functional Requirements

- [x] CHK027 Are requirements defined for canvas rendering performance when the stroke list is large — the spec places no cap on stroke count per round, which could cause incremental redraws to degrade. [Non-Functional, Gap]
- [x] CHK028 Is the maximum number of points per stroke (payload size for POST /stroke) specified to prevent excessively large requests from long, slow pointer gestures? [Non-Functional, Gap]

---

## Dependencies & Assumptions

- [x] CHK029 Is the assumption that GET /rooms/:code delivers the full stroke list on every poll (not a delta/patch) documented as an explicit design decision in the spec, traceable to research.md Decision 1? [Assumption, Spec §Assumptions, research.md]
- [x] CHK030 Does the assumption "canvas rendering fidelity is implementation-defined" conflict with FR-002's requirement that "all strokes are correctly transmitted and displayed" — is there a risk that different browsers produce visually inconsistent canvases from the same stroke data? [Assumption, Spec §Assumptions, FR-002]
- [x] CHK031 Is the assumption that scores persist for the duration of the active round traceable to a spec requirement or constitution principle — and is the lifecycle boundary (when do scores reset) unambiguously defined? [Assumption, Spec §Assumptions, FR-012]

---

## Notes

- Check items off as completed: `[x]`
- Add inline findings after each item: e.g. `— spec updated to clarify wording`
- Items marked `[Gap]` indicate requirements absent from the spec; decide whether to add them or explicitly accept the gap before implementation
- Items marked `[Consistency]` may require coordinated edits across multiple artifact sections
