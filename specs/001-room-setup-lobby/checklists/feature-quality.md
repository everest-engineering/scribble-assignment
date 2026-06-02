# Feature Quality Checklist: Room Setup & Lobby

**Purpose**: Validate the completeness, clarity, consistency, and measurability of requirements before implementation begins
**Created**: 2026-06-02
**Feature**: [spec.md](../spec.md)

---

## Requirement Completeness

- [ ] CHK001 Are the exact wording or minimum content requirements defined for each validation error message (empty name, empty code, non-alphanumeric code, room not found), or is the content left entirely to implementation? [Completeness, Spec §FR-003, FR-004, FR-005]
- [ ] CHK002 Are requirements defined for what a non-host player sees while waiting for the host to start — beyond "button is disabled or hidden"? [Completeness, Spec §FR-008]
- [ ] CHK003 Are requirements specified for how `participantId` is recovered from `sessionStorage` on Lobby mount, including what the app does if the stored ID no longer matches a valid participant in the room? [Completeness, Spec §Assumptions]
- [ ] CHK004 Does the spec resolve the "disabled or hidden" ambiguity in FR-008 — are both options intentionally permitted, or should one be mandated for consistency across host and non-host views? [Completeness, Spec §FR-008]
- [ ] CHK005 Is the behavior defined for a player who navigates directly to the Lobby URL without having created or joined a room in the current session? [Completeness, Gap]

---

## Requirement Clarity

- [ ] CHK006 Is "approximately 2-second interval" in FR-007 cross-referenced with the ±500ms drift tolerance stated in Assumptions, or does the FR stand alone with an imprecise bound? [Clarity, Spec §FR-007, Assumptions]
- [ ] CHK007 Is "clearly identified as the host" in US1 defined as a specific visual indicator in the Lobby UI, or is host identity implied solely by the enabled Start Game button? [Clarity, Spec §US1]
- [ ] CHK008 Is "the game transitions for all players" in US4 acceptance scenario 2 specified as a navigation event to a named screen, or is the destination and mechanism left undefined? [Clarity, Spec §US4 AC2]
- [ ] CHK009 Is "room isolation" in FR-006 scoped precisely — does it cover participant lists only, or also game state, room codes, host assignment, and word selection? [Clarity, Spec §FR-006]
- [ ] CHK010 Is the definition of "non-alphanumeric" consistent between FR-004 ("codes containing non-alphanumeric characters") and the Edge Cases section — do both use the same character set boundary? [Clarity, Spec §FR-004, Edge Cases]

---

## Requirement Consistency

- [ ] CHK011 Does FR-008 ("disabled or hidden") align with US4 acceptance scenario 3 ("hidden or visibly disabled and non-interactive")? The two phrasings permit different UI choices — is this intentional? [Consistency, Spec §FR-008, US4 AC3]
- [ ] CHK012 Do FR-007 ("approximately 2-second interval") and SC-002 ("appear within 2 seconds of joining") describe the same observable outcome using consistent language? [Consistency, Spec §FR-007, SC-002]
- [ ] CHK013 Is the sessionStorage persistence assumption consistent with the frontend `roomStore.ts` state model described in plan.md — are there two sources of truth for `participantId` (in-memory store and sessionStorage)? [Consistency, Spec §Assumptions, Plan §Technical Context]
- [ ] CHK014 Does the non-alphanumeric rejection requirement added to FR-004 cascade correctly into SC-003 ("100% of attempts to join with an invalid or empty code are rejected") — does "invalid" now explicitly include non-alphanumeric inputs? [Consistency, Spec §FR-004, SC-003]

---

## Acceptance Criteria Quality

- [ ] CHK015 Is SC-001 ("room creation in under 5 seconds") measurable without specifying a measurement baseline (hardware, network conditions, concurrent users)? [Measurability, Spec §SC-001]
- [ ] CHK016 Can SC-003 ("100% of attempts with invalid or empty code rejected") be exhaustively verified given that "invalid" now covers three distinct categories (empty, whitespace-only, non-alphanumeric) — are all three enumerated in acceptance scenarios? [Measurability, Spec §SC-003]
- [ ] CHK017 Is US1 acceptance scenario 3 (room isolation) independently testable without requiring the Join Room flow (US2) to be implemented? Creating two rooms alone may not surface participant cross-contamination. [Measurability, Spec §US1 AC3]
- [ ] CHK018 Are all four US4 acceptance scenarios (host disabled, host enabled, non-host disabled, non-host API rejected) each independently verifiable, or do they require a compound setup that bundles US1+US2+US4 together? [Measurability, Spec §US4]

---

## Scenario Coverage

- [ ] CHK019 Is there a requirement defining what happens to lobby polling once the room transitions to `"active"` status — should polling stop, redirect all clients, or continue until the next poll detects the status change? [Coverage, Gap, Spec §US3, US4]
- [ ] CHK020 Is behavior defined for a player who attempts to join a room that has already transitioned to `"active"` status? [Coverage, Gap]
- [ ] CHK021 Are requirements defined for the display order of participants in the lobby (join order, alphabetical, or implementation-defined)? [Coverage, Gap]
- [ ] CHK022 Are recovery requirements defined for the case where a poll fails repeatedly (not just transiently) — at what point, if ever, should the lobby surface an error to the user? [Coverage, Spec §US3 AC3, Gap]

---

## Edge Case Coverage

- [ ] CHK023 Is the maximum length of a player name specified, or is it unbounded? An unbounded name could affect UI layout and storage. [Edge Case, Gap]
- [ ] CHK024 Are requirements defined for what happens when `sessionStorage` is unavailable (private browsing mode, quota exceeded, or browser restrictions)? [Edge Case, Spec §Assumptions]
- [ ] CHK025 Is there a requirement addressing the maximum number of participants a room can hold, or is capacity intentionally unbounded for this lab? [Edge Case, Gap]
- [ ] CHK026 Is the behavior defined for a room code input that contains only whitespace after trimming combined with non-alphanumeric characters — does trim-then-validate produce a consistent and predictable error? [Edge Case, Spec §FR-004, Edge Cases]

---

## Non-Functional Requirements

- [ ] CHK027 Are there requirements for the lobby's behavior when the backend restarts and all in-memory room state is lost mid-session — should the frontend detect stale state and surface a recoverable error? [Non-Functional, Gap]
- [ ] CHK028 Is acceptable polling behavior defined under degraded client conditions (slow device, background tab throttling) where the 2-second interval may drift significantly beyond ±500ms? [Non-Functional, Spec §Assumptions]

---

## Dependencies & Assumptions

- [ ] CHK029 Is the assumption "host reassignment is out of scope" traceable to the constitution's out-of-scope list, or is it an undocumented spec-level decision that a reviewer might challenge? [Assumption, Spec §Assumptions]
- [ ] CHK030 Is the dependency on the existing `GET /rooms/:code` endpoint for polling documented with its current snapshot contract, so that future changes to the response shape are visible as breaking changes to this spec? [Dependency, Spec §Assumptions]
- [ ] CHK031 Does the assumption that `participantId` is a stable UUID (not regenerated if a player re-joins the same room) hold for the full room lifecycle defined in this scenario? [Assumption, Spec §Assumptions]

---

## Notes

- Check items off as completed: `[x]`
- Add inline findings after each item: e.g. `— spec updated to clarify wording`
- Items marked `[Gap]` indicate requirements absent from the spec; decide whether to add them or explicitly accept the gap before implementation
- Items marked `[Consistency]` may require coordinated edits across multiple artifact sections
