# Requirements Quality Checklist: Lobby & Host Management

**Purpose**: Validate completeness, clarity, consistency, and measurability of requirements across spec.md, plan.md, data model, and API contracts
**Created**: 2026-06-08
**Feature**: `specs/001-lobby-host-management/spec.md`

**Note**: This checklist tests the REQUIREMENTS themselves — not the implementation. Each item asks whether the requirements are well-written, complete, and unambiguous.

## Requirement Completeness

- [x] CHK001 Are all player name validation rules (empty reject, whitespace reject, trim, max 30 chars) specified in a single authoritative location? [Completeness, Spec §FR-003/FR-004/FR-012]
- [x] CHK002 Are error response formats (field names, HTTP status codes, error message text) specified for all API failure scenarios? [Completeness, Contracts]
- [x] CHK003 Are requirements documented for room cleanup when all participants depart? [Completeness, Spec §Edge Cases, Data Model §Host Transitions]
- [x] CHK004 Is the snapshot derivation contract (which fields are stored vs derived at snapshot time) explicitly documented in requirements? [Completeness, Data Model §ParticipantSnapshot]
- [x] CHK005 Are host transfer requirements documented for the scenario when the host leaves? [Completeness, Spec §Edge Cases vs §Assumptions — both agree v2 scope]
- [x] CHK006 Are the polling fallback behaviors specified (retry on network error, max retries, backoff)? [Completeness, Spec §FR-013]
- [x] CHK007 Is the coexistence behavior of manual "Refresh" button and auto-polling specified? [Completeness, Spec §Clarifications 2026-06-09]

## Requirement Clarity

- [x] CHK008 Is "clear error message" (FR-005) defined with specific error text or format requirements? [Clarity, Spec §FR-005, Contracts]
- [x] CHK009 Is "subtle loading state" (FR-008) defined with specific visual properties (position, animation, opacity)? [Clarity, Spec §FR-008]
- [x] CHK010 Is "approximately 2-second intervals" (FR-007) specified with acceptable tolerance range? [Clarity, Spec §FR-007]
- [x] CHK011 Is it explicitly specified whether "at least 2 players" (FR-010) includes or excludes the host in the count? [Clarity, Spec §FR-010, Clarifications 2026-06-09]
- [x] CHK012 Is the "inline error message" placement and dismissal behavior (when to clear) specified in requirements? [Clarity, Spec §Clarifications 2026-06-09]
- [x] CHK013 Is "game view" (US4 Scenario 4) defined with specific layout or state requirements distinct from lobby? [Clarity, Spec §Clarifications 2026-06-09]

## Requirement Consistency

- [x] CHK014 Is the description of Participant's host status consistent between spec.md ("isHost flag"), data model (derived at snapshot), and plan.md? [Consistency, Spec, Data Model, Plan]
- [x] CHK015 Do the edge case description (host leaves → transfer) and assumptions (transfer out of scope) agree on scope? [Consistency, Spec §Edge Cases vs §Assumptions]
- [x] CHK016 Are room status transitions consistent between the data model state diagram and API contract response status values? [Consistency, Data Model §State Transitions vs Contracts]
- [x] CHK017 Is the terminology consistent between "game round begins" (US4-1) and "game view" (US4-4) referring to the same transition? [Consistency, Spec §Clarifications 2026-06-09]

## Acceptance Criteria Quality

- [x] CHK018 Can SC-001 (room creation within 2 seconds) be objectively verified without dedicated timing infrastructure? [Measurability, Spec §SC-001 — measured end-to-end via GET]
- [x] CHK019 Can SC-002 (joiner visible within 3 seconds) be objectively verified against the polling interval specification? [Measurability, Spec §SC-002, §Clarifications 2026-06-09]
- [x] CHK020 Is "no visual flicker" (US3-2) defined with testable criteria (DOM stability, no layout shift)? [Acceptance Criteria, Spec §US3-2]
- [x] CHK021 Is "last known state is preserved" (US3-3) specified in terms of which state elements remain visible versus stale? [Acceptance Criteria, Spec §US3-3]

## Scenario Coverage

- [x] CHK022 Are requirements defined for the polling endpoint behavior when the room is deleted between poll cycles? [Coverage, Spec §FR-014, §FR-021]
- [x] CHK023 Are requirements defined for concurrent start game requests (two rapid host clicks)? [Coverage, Spec §FR-015]
- [x] CHK024 Are requirements defined for the lobby state when a player navigates away and returns to the lobby? [Coverage, Spec §FR-016]
- [x] CHK025 Are requirements defined for what happens when the creator's browser tab is hard-refreshed during polling? [Coverage, Spec §FR-017, §Clarifications 2026-06-09]

## Edge Case Coverage

- [x] CHK026 Are requirements defined for name validation at the exact 30-character boundary? [Edge Case, Spec §FR-012]
- [x] CHK027 Are requirements defined for join attempts with an empty string (not missing) room code? [Edge Case, Spec §FR-005, §US2-3]
- [x] CHK028 Is the behavior defined when polling returns a 404 (room deleted mid-session)? [Edge Case, Spec §FR-014, §FR-021]
- [x] CHK029 Are requirements defined for the lobby display under high participant count (50+) scaling to spec's "hundreds" target? [Edge Case, Spec §FR-018]

## Non-Functional Requirements

- [x] CHK030 Are polling error recovery paths specified for network timeout and server error scenarios? [Non-Functional, Spec §FR-013, §FR-019]
- [x] CHK031 Is the in-memory room lifecycle documented for cleanup on server restart (Constitution IV compliance)? [Non-Functional, Plan §Server Lifecycle, Spec §Assumptions]
- [x] CHK032 Are concurrency requirements documented for Zod validation on server (must not corrupt room state)? [Non-Functional, Spec §FR-020, Data Model §Validation Rules]
- [x] CHK033 Is the polling interval's impact on server load documented against the "dozens of rooms, hundreds of participants" scale target? [Non-Functional, Plan §Polling Load Assessment]

## Dependencies & Assumptions

- [x] CHK034 Is the assumption "error messages are client-side validated where possible" validated against which validations MUST be server-side? [Assumption, Data Model §Validation Rules]
- [x] CHK035 Is the assumption "stable internet connectivity" reflected in any degradation or offline requirements? [Assumption, Spec §US3-3]
- [x] CHK036 Are dependencies on the existing room store's `structuredClone` pattern documented for start game state mutation? [Dependency, Plan §Key Dependencies]

## Ambiguities & Conflicts

- [x] CHK037 Does US4 Scenario 4 ("lobby transitions to the game view") define the same state as US4 Scenario 1 ("the game round begins") or are these distinct transitions? [Conflict, Spec §Clarifications 2026-06-09]
- [x] CHK038 Is the polling interval tolerance "approximately 2s" vs acceptance criterion "within 3 seconds" (SC-002) reconciled? [Ambiguity, Spec §SC-002, §Clarifications 2026-06-09]

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline with each item
- Items prefixed `[Gap]` indicate missing requirements that should be considered for addition
- Cross-reference spec.md sections when verifying each item
- This checklist is for author self-review before submitting for peer review
