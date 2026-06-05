# Requirements Quality Checklist: Room Setup & Lobby

**Purpose**: Validate that the Scenario 1 spec is complete, clear, and consistent
before implementation.
**Created**: 2026-06-05
**Feature**: [spec.md](./spec.md)

## Requirement Completeness

- [ ] CHK001 Every acceptance scenario maps to at least one functional requirement
      (FR-001…FR-011).
- [ ] CHK002 Host creation, join validation, isolation, polling, and start-gating
      are each covered by a requirement.
- [ ] CHK003 Error messages are specified verbatim ("Room code is required";
      "Room not found — check your code and try again").
- [ ] CHK004 Polling cadence is quantified (~2s / 2000ms) and cleanup is required.

## Clarity & Consistency

- [ ] CHK005 No requirement conflicts with the constitution (polling-only,
      in-memory, no new deps).
- [ ] CHK006 The three clarifications are reflected in FRs (FR-009 hide control,
      FR-003 client-side check, FR-011 resilient poll).
- [ ] CHK007 Terms ("host", "participant", "snapshot") are used consistently with
      the starter code.

## Scope & Boundaries

- [ ] CHK008 No out-of-scope behavior is introduced (no auth, no DB, no rotation,
      no timers).
- [ ] CHK009 Name validation is explicitly deferred to Scenario 2.
- [ ] CHK010 Host reassignment on leave is explicitly out of scope.

## Testability

- [ ] CHK011 Each success criterion (SC-001…SC-005) is observable in two browser
      tabs or via a unit test.
- [ ] CHK012 Room isolation is unit-testable against `roomStore`.

## Notes

- Check items off as completed: `[x]`. This checklist gates the move to tasks.
