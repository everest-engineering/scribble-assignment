# Requirements Quality Checklist: State Transitions & API Contracts

**Purpose**: Validate that state transition and API contract requirements are complete, clear, and testable
**Created**: 2026-05-20
**Feature**: Result, Restart And Final Validation — [spec.md](../spec.md), [contracts/api.md](../contracts/api.md)

## State Transition Completeness

- [ ] CHK001 Are all valid state transitions fully specified? (lobby→active, active→result, result→lobby) [Completeness, Spec §FR-001, §FR-008]
- [ ] CHK002 Are the conditions for each transition explicitly documented? (all-guessers-correct, timer-expiry, host-restart) [Completeness, Spec §FR-001]
- [ ] CHK003 Is the behavior for invalid transitions defined? (e.g., restart from lobby, restart when not host) [Edge Case, Spec §FR-007]
- [ ] CHK004 Is the "result" state entry point clearly specified for both trigger mechanisms? [Completeness, Spec §FR-001]

## Timer Requirements Clarity

- [ ] CHK005 Is the behavior when `timerDuration = 0` clearly distinguished from timer-enabled mode? [Clarity, Spec §FR-002]
- [ ] CHK006 Is the timer start time specified relative to a specific event? (e.g., when startGame completes) [Gap, Spec §FR-002]
- [ ] CHK007 Is the timer checked only on poll/action or does it run independently? [Clarity, Spec §FR-001]

## API Contract Completeness

- [ ] CHK008 Are all POST /:code/restart error responses documented with distinct error codes? [Completeness, contracts/api.md]
- [ ] CHK009 Is the restart request body validation schema specified with field types and constraints? [Clarity, contracts/api.md]
- [ ] CHK010 Is the response schema for the restart endpoint complete (all RoomSnapshot fields listed)? [Completeness, contracts/api.md]
- [ ] CHK011 Is the `secretWord` exposure rule defined for all three status values? (lobby: N/A, active: drawer-only, result: all) [Consistency, contracts/api.md]

## Authorization & Host Requirements

- [ ] CHK012 Are the host-restart authorization rules consistently specified across spec and contracts? [Consistency, Spec §FR-007, contracts/api.md]
- [ ] CHK013 Is the behavior for non-host players attempting restart defined? [Coverage, Spec §FR-007, contracts/api.md]
- [ ] CHK014 Is host identity persistence defined across restarts? (does hostId change?) [Clarity, Spec Assumptions §114]

## Edge Case & Failure Coverage

- [ ] CHK015 Is the behavior for restart while room is NOT in "result" state specified? [Edge Case, contracts/api.md]
- [ ] CHK016 Are concurrent restart requests addressed? (what if two host requests arrive near-simultaneously?) [Coverage, Gap]
- [ ] CHK017 Is the behavior when all players disconnect during result state specified? [Coverage, Gap]
- [ ] CHK018 Is the "all guessers" definition clarified? (does it include the drawer? only non-drawer participants?) [Ambiguity, Spec §FR-001]

## Measurability & Testability

- [ ] CHK019 Can "within one polling cycle" (SC-001, SC-003) be objectively verified? [Measurability, Spec §SC-001, §SC-003]
- [ ] CHK020 Is "redirected to the lobby" (SC-003) defined as a specific observable state? [Clarity, Spec §SC-003]
- [ ] CHK021 Can "no round-specific data visible" (SC-005) be verified against a defined list of data fields? [Measurability, Spec §SC-005]

## Assumptions & Dependencies

- [ ] CHK022 Is the assumption "players remain connected during result state" explicitly stated as a requirement boundary? [Assumption, Spec §115]
- [ ] CHK023 Is the room expiry assumption (indefinite persistence in result state) documented as a constraint? [Assumption, Spec §118]
