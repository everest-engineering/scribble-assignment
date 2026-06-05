# Requirements Quality Checklist: Result, Restart & Final Validation

**Purpose**: Validate the Scenario 4 spec before implementation.
**Created**: 2026-06-05
**Feature**: [spec.md](./spec.md)

## Requirement Completeness

- [ ] CHK001 Status extension, round-end, result contents, restart, and reset are
      each covered (FR-001…FR-010).
- [ ] CHK002 Result reveals word + final scores + full history to ALL (FR-003,004).
- [ ] CHK003 Restart clears strokes/guesses/scores/drawer, sets lobby, preserves
      players (FR-006,007).
- [ ] CHK004 Post-finish guesses are rejected (FR-009).

## Clarity & Consistency

- [ ] CHK005 Round ends on first correct guess (single round, no timer).
- [ ] CHK006 Restart advances the word deterministically (index-based, no
      randomness) — constitution III.
- [ ] CHK007 Navigation rules don't conflict: game→lobby on `lobby`, lobby→game on
      `playing`, result shown on `finished`.

## Scope & Boundaries

- [ ] CHK008 No multiple rounds/rotation/timers added; restart returns to a single
      fresh round setup.
- [ ] CHK009 Word becomes public only at `finished`, never earlier.

## Testability

- [ ] CHK010 Round-end, reveal, reject-after-finish, and restart reset are
      unit-testable on the store.
- [ ] CHK011 Full round + restart is verifiable in two browser tabs.

## Notes

- Check items off as completed: `[x]`.
