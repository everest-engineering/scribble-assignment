# Implementation Readiness Checklist: Game Start & Drawer Flow

**Purpose**: Validate full artifact set (spec → plan → tasks) quality before starting implementation
**Created**: 2026-06-03
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [tasks.md](../tasks.md)
**Depth**: Lightweight author scan (pre-`/speckit.implement`)

> ⚠️ **MANDATORY GATE** items (marked below) must all pass before implementation begins.
> All other items are standard coverage — failures are advisory but should be resolved if possible.

---

## Requirement Completeness

- [x] CHK001 — Is the polling cleanup requirement (`clearInterval` on unmount) documented in the spec, or does it appear only in plan.md constraints and tasks.md T006? [Completeness, Gap]
- [x] CHK002 — Is the error-navigation behaviour ("navigate to `/` on fetch error") specified as a functional requirement in spec.md, or is it an undocumented implementation decision that first appears in T006? [Completeness, Gap]
- [x] CHK003 — Are requirements defined for the transient state where the game has started (`status = "playing"`) but the polling request has not yet returned — what should the drawer and guessers see? [Completeness, Spec §US2]

## Requirement Clarity

- [x] CHK004 — Is "clearly displayed to the drawer" (US2, Acceptance Scenario 1) quantified with specific visual or layout criteria (e.g., font size, prominence, label), or is it open to interpretation? [Clarity, Spec §US2-SC1]
- [x] CHK005 — Does "not displayed anywhere on the screen" (US2, Acceptance Scenario 2) explicitly exclude partial reveals such as word-length hints, blank tiles, or character counts? [Clarity, Spec §US2-SC2]
- [x] CHK006 — Is the term "exactly one participant is marked as the drawer" consistently defined across all three user stories — does every acceptance scenario reference the same condition? [Consistency, Spec §US1]

## Security Requirement Quality ⚠️ MANDATORY GATE

- [x] CHK007 ⚠️ — Does the spec define redaction behaviour for **all three** caller cases: (1) `participantId` matches drawer, (2) `participantId` does not match drawer, and (3) no `participantId` provided? [Completeness, Spec §US2-SC3/SC4]
- [x] CHK008 ⚠️ — Are the exact conditions under which `currentWord` is included vs. set to `null` unambiguously specified — including what constitutes a match (strict equality, case sensitivity) and how a missing query param is treated? [Clarity, Spec §US2 / data-model.md §Redaction Logic]
- [x] CHK009 ⚠️ — Does the spec explicitly require that redaction happens server-side (not via client-side filtering of a full payload that contained the word)? [Completeness, Spec §US2]
- [x] CHK010 ⚠️ — Are requirements defined to ensure `currentWord` cannot be inferred from other API endpoints, error responses, or room-list payloads? [Coverage, Gap]

## Acceptance Criteria Quality

- [x] CHK011 — Can SC-002 ("role labels visible within one screen refresh") be objectively verified without a defined timing threshold (e.g., ≤2 seconds)? [Measurability, Spec §Success Criteria]
- [x] CHK012 — Do the "Independent Test" procedures in each user story describe observable outcomes only, or do they assume specific implementation details that would couple the acceptance test to the current design? [Clarity, Spec §US1/US2/US3]

## Scenario & Edge Case Coverage

- [x] CHK013 — Is there a defined requirement for the edge case where `hostId` does not match any participant in the room when `startRoom` runs? [Coverage, Spec §Edge Cases]
- [x] CHK014 — Is the "drawer disconnects or navigates away mid-round" edge case resolved with a concrete requirement, or does it remain an open question in the spec? [Completeness, Spec §Edge Cases]
- [x] CHK015 — Are requirements specified for a participant who joins a room already in `"playing"` status — do they receive role and word information, and if so, under what conditions? [Coverage, Spec §Edge Cases]

## Task Readiness

- [x] CHK016 — Does every task in tasks.md reference the exact file path and the specific function, interface, or component to be modified, leaving no ambiguity about where the change lands? [Completeness, tasks.md]
- [x] CHK017 — Is the dependency ordering declared in tasks.md (T001 → T002/T003 → T004 → T005/T006 → T007 → T008 → …) consistent with all stated blocking constraints, with no circular or missing dependencies? [Consistency, tasks.md §Dependencies]
- [x] CHK018 — Is T012's acceptance criterion sufficiently specific to guide a single unambiguous implementation — does it distinguish between a compile-time type check and a runtime shape assertion? [Clarity, tasks.md T012]
- [x] CHK019 — Does T008 specify the exact condition for including `currentDrawerId` in the snapshot (i.e., only when `status === "playing"`), matching the data-model.md definition? [Consistency, tasks.md T008 / data-model.md §RoomSnapshot]

## Cross-Artifact Consistency

- [x] CHK020 — Are the new fields consistently marked as optional (`?`) across all artifact references: spec clarifications, data-model.md field table, and tasks.md T002/T003? [Consistency]
- [x] CHK021 — Does `data-model.md`'s `RoomSnapshot` definition (`currentWord?: string | null`) match the type described in tasks.md T002 and T003, with no discrepancies in optionality or nullability? [Consistency, data-model.md §RoomSnapshot / tasks.md T002/T003]
- [x] CHK022 — Does plan.md's constitution check explicitly cover the `setInterval` cleanup constraint (Principle III: HTTP Polling) in a way that aligns with the requirement stated in tasks.md T006? [Consistency, plan.md §Constitution Check]

## Constraint Coverage

- [x] CHK023 — Is the "no new runtime dependencies" constraint reflected as an explicit restriction in tasks.md task descriptions, or only in plan.md's constraint list? [Completeness, plan.md §Constraints]
- [x] CHK024 — Is the `roundNumber` never-increment rule documented as an explicit constraint in tasks.md (not only in spec.md clarifications), so an implementer reading tasks.md in isolation would not inadvertently add increment logic? [Completeness, Spec §Clarifications]

---

## Notes

- ⚠️ CHK007–CHK010 are **mandatory gates** — all four must pass before any implementation task begins.
- CHK002 and CHK013 are the highest-priority advisory items; gaps here could lead to undocumented behaviour being silently encoded into implementation.
- Check items off as completed: `[x]`
- Add inline comments for any items that identify a gap or require spec amendment before proceeding.
