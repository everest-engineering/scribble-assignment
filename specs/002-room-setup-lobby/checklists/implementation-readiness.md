# Implementation Readiness Checklist: Room Setup & Lobby

**Purpose**: Lightweight self-review to confirm spec, plan, and tasks are complete and consistent before moving to the next feature
**Created**: 2026-06-01
**Depth**: Lightweight (15–20 items)
**Audience**: Author (self-review)
**Feature**: [spec.md](../spec.md)

---

## Requirement Completeness

- [ ] CHK001 Are all five user stories (US1–US5) covered by at least one functional requirement (FR-001–FR-008)? [Completeness, Spec §FR]
- [ ] CHK002 Are all edge cases from the Edge Cases section traceable to a functional requirement or explicit spec note? [Completeness, Spec §Edge Cases]
- [ ] CHK003 Is the "Drop Below 2 Players" edge case explicitly referenced in a functional requirement (currently only in Edge Cases prose)? [Gap, Spec §FR-006]
- [x] CHK004 Are joining-a-started-room restrictions (status `"game"`) specified as a requirement, or intentionally excluded? [Coverage, Gap] — **FIXED**: Implemented 409 Conflict response when joinRoom checks room.status === "game"

---

## Requirement Clarity

- [ ] CHK005 Is "automatically" in FR-001 ("System MUST automatically track the host") clarified — does it mean on `POST /rooms` with no extra input, or is explicit host designation required? [Clarity, Spec §FR-001]
- [ ] CHK006 Is the term "immediately" in FR-007 ("immediately terminate the room") quantified or bounded? [Clarity, Spec §FR-007]
- [ ] CHK007 Is "temporary" in FR-008 ("temporary connection warning banner") defined — is there a timeout or is it purely tied to poll recovery? [Clarity, Spec §FR-008]

---

## Requirement Consistency

- [ ] CHK008 Does SC-001 ("within 2.5 seconds") align with the FR-004 polling interval of exactly 2000ms including network latency margin? [Consistency, Spec §SC-001 / §FR-004]
- [ ] CHK009 Are the leave endpoint HTTP verb (`DELETE`) consistent across spec.md, plan.md, data-model.md, and contracts/rooms-api.md? [Consistency]
- [ ] CHK010 Does the plan.md constitution check section match the constitution principle for test coverage (90%) with no remaining stale values? [Consistency, Plan §Constitution Check]

---

## Acceptance Criteria Quality

- [ ] CHK011 Can SC-002 ("non-host participants never see the Start Game button") be objectively verified without relying on runtime inspection? [Measurability, Spec §SC-002]
- [ ] CHK012 Is SC-004 ("validation error within 200ms") independently achievable from SC-003 (which is bounded by polling) — is this distinction documented? [Clarity, Spec §SC-003 / §SC-004]

---

## Scenario & Edge Case Coverage

- [x] CHK013 Are requirements defined for what happens when a guest tries to join a room that is already in `"game"` status (post-start)? [Coverage, Gap] — **FIXED**: POST /rooms/:code/join now returns 409 Conflict with error message "Room is already in game"
- [ ] CHK014 Are requirements specified for duplicate player names within the same room — is this intentionally allowed or should it be rejected? [Gap, Spec §Edge Cases]
- [ ] CHK015 Are requirements defined for the maximum number of participants per room, or is this intentionally unbounded? [Completeness, Gap]

---

## Dependencies & Assumptions

- [ ] CHK016 Is the assumption of in-memory storage explicitly noted as a trade-off (no persistence across server restart) in the spec or plan? [Assumption, Plan §Technical Context]
- [ ] CHK017 Is the assumption "a lobby consists of a single round" documented as a constraint on future features (e.g., no multi-round expansion path defined)? [Assumption, Spec §Assumptions]

---

## Plan & Tasks Consistency

- [ ] CHK018 Do all tasks in tasks.md map to at least one FR or user story — are T028 (CSS verify) and T029 (quickstart run) intentionally untraceable as polish tasks? [Traceability, Tasks §Phase 8]
- [ ] CHK019 Is the project structure in plan.md (now corrected to show `src/`-level test files) consistent with the actual file locations in the repository? [Consistency, Plan §Project Structure]

## Notes

- Check items off as completed: `[x]`
- Add inline findings for any `[Gap]` items — they may need spec updates before the next feature begins
- Items marked `[Gap]` are missing from the current requirements and may need an explicit decision (in-scope, out-of-scope, or deferred)
