# Specification Quality Checklist: Gameplay Rules

**Purpose**: Validate gameplay interaction requirements for completeness, clarity, consistency, and constitution alignment
**Created**: 2026-06-12
**Feature**: ../spec.md

## Constitution Alignment

- [ ] CHK001 - Are scoring requirements deterministic and aligned with Constitution Principle III (no randomness in scoring)? [Constitution Alignment, Spec §FR-007, Constitution §III]
- [ ] CHK002 - Are canvas action requirements aligned with Constitution Principle IV (no WebSockets — canvas is local-only, not synced via polling)? [Constitution Alignment, Spec §FR-001, Constitution §IV]
- [ ] CHK003 - Does the spec avoid introducing any persistent storage or authentication, per Constitution Principle V? [Constitution Alignment, Spec §FR-001–FR-010, Constitution §V]

## Requirement Completeness

- [ ] CHK004 - Are requirements for the canvas data model (what constitutes a draw action, clear action, initial empty state) specified with sufficient detail for testable implementation? [Completeness, Spec §FR-001]
- [ ] CHK005 - Are requirements for score initialization (all players at 0 at round start) clearly and testably specified? [Completeness, Spec §FR-008, SC-006]
- [ ] CHK006 - Does the spec require that incorrect guesses still appear in shared guess history (not just correct ones)? [Completeness, Spec §FR-005, §FR-007]
- [ ] CHK007 - Are requirements for duplicate guess handling (same player submitting identical guess twice) explicitly addressed? [Coverage, Spec Edge Cases]
- [ ] CHK008 - Are canvas clear requirements scoped to not reset guess history or scores? [Completeness, Spec §FR-009]
- [ ] CHK009 - Are requirements defined for how the frontend renders the guess history (ordering, freshness, scroll behavior)? [Gap, Spec §FR-005]
- [ ] CHK010 - Are requirements for the guess endpoint response format (success payload, validation error shape) specified? [Completeness, Gap]
- [ ] CHK011 - Are requirements defined for concurrent guess submissions from multiple guessers? [Coverage, Spec Edge Cases]

## Requirement Clarity

- [ ] CHK012 - Is the drawer-only canvas visibility constraint stated as a requirement (currently only documented as an assumption)? [Clarity, Spec §FR-001, Assumptions]
- [ ] CHK013 - Are guess normalization rules (trim, case-insensitive comparison) consistently worded across all related requirements? [Consistency, Spec §FR-002, §FR-003, §FR-004]
- [ ] CHK014 - Is the "100 points for correct / 0 for incorrect" scoring rule specified as an immutable formula with no exceptions or modifiers? [Clarity, Spec §FR-007]
- [ ] CHK015 - Is the "rejected with visible message" requirement for empty guesses specified with unambiguous acceptance criteria? [Clarity, Spec §FR-003, US2-AC3]
- [ ] CHK016 - Can "immediately" in FR-001 (drawer sees canvas changes) be quantified or tested objectively? [Measurability, Spec §FR-001]
- [ ] CHK017 - Does the polling requirement (FR-006) specify whether guessers and drawer use the same room snapshot endpoint or separate polling paths? [Clarity, Spec §FR-006]
- [ ] CHK018 - Does the spec define what canvas state looks like for the initial empty canvas vs. after draw or clear actions? [Clarity, Spec §FR-001]

## Requirement Consistency

- [ ] CHK019 - Are polling sync requirements consistent between the lobby polling (Constitution §IV: ~2s) and gameplay polling? [Consistency, Spec §FR-006, SC-004, Constitution §IV]
- [ ] CHK020 - Are round-end guess rejection requirements (FR-010) consistent with the room state lifecycle defined in the data model? [Consistency, Spec §FR-010, data-model.md]
- [ ] CHK021 - Do the success criteria (SC-001 through SC-007) each map to at least one functional requirement (FR-001 through FR-010)? [Traceability, Spec §SC-001–SC-007, §FR-001–FR-010]

## Acceptance Criteria Quality

- [ ] CHK022 - Are all acceptance scenarios (US1-AC1 through US3-AC3) independently testable without requiring mocking or special setup? [Measurability, Spec User Scenarios]
- [ ] CHK023 - Can each measurable outcome (SC-001 through SC-007) be objectively verified in a two-browser test? [Measurability, Spec §SC-001–SC-007]
- [ ] CHK024 - Is the polling cadence in SC-004 ("within approximately 2 seconds") precise enough to serve as a pass/fail acceptance criterion? [Measurability, Spec §SC-004]

## Assumptions & Dependencies

- [ ] CHK025 - Is the assumption that "drawings are visible locally to the drawer" validated as an intentional design constraint (not an oversight)? [Assumption, Spec Assumptions]
- [ ] CHK026 - Is the assumption that "duplicate guess suppression is not required" documented as an explicit design decision with rationale? [Assumption, Spec Assumptions]
- [ ] CHK027 - Is the assumption that "no negative penalties for incorrect guesses" documented as a deliberate scoring simplicity choice? [Assumption, Spec Assumptions]

## Notes

- Items marked [Gap] indicate missing requirements that may need spec updates before implementation
- Items marked [Measurability] indicate acceptance criteria that may need tightening for objective pass/fail determination
