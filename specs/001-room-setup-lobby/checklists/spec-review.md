# Specification Review Checklist: Room Setup and Lobby

**Purpose**: Validate specification completeness, clarity, consistency, and cross-artifact alignment before implementation
**Created**: 2026-05-19
**Feature**: specs/001-room-setup-lobby/spec.md
**Cross-Reference**: specs/001-room-setup-lobby/data-model.md, specs/001-room-setup-lobby/contracts/api.md

## Requirement Completeness

- [ ] CHK001 Are room code format and length explicitly specified in a functional requirement (currently only in assumptions)? [Completeness, Spec §Assumptions]
- [ ] CHK002 Is the lobby refresh cadence (2 seconds) specified as a functional requirement rather than an assumption? [Completeness, Spec §Assumptions vs FR-008]
- [ ] CHK003 Is a requirement defined for case-insensitive room code matching? [Completeness, Gap — contracts mention it but spec FRs do not]
- [ ] CHK004 Is the host indicator display behavior specified (icon, label, position)? [Completeness, Gap — US1 AS-2 implies it but no FR]
- [ ] CHK005 Is the start button visibility for non-host players specified in a functional requirement? [Completeness, Gap — only in US3 acceptance scenario]
- [ ] CHK006 Are requirements defined for the lobby transition when game starts (what happens to players who haven't navigated)? [Completeness, Gap]
- [ ] CHK007 Is the "completed" status defined in the spec's entity description consistent with the scope of this feature? [Completeness, Spec §Key Entities — mentions "active/completed" but only "lobby/active" used in this scenario]
- [ ] CHK008 Is a requirement defined for rejecting joins when the room is at max capacity? [Completeness, Spec §FR-012 — capacity stated but join rejection not explicit in FR-006]
- [ ] CHK009 Are requirements defined for backend restart recovery (rooms lost, player experience)? [Completeness, Gap — listed as edge case but no answer specified]

## Requirement Clarity

- [ ] CHK010 Is the term "clear message" in FR-003 and FR-004 quantified with specific wording or criteria? [Clarity, Spec §FR-003, FR-004]
- [ ] CHK011 Is "within a few seconds" in US3 acceptance scenario 1 quantified with a specific time threshold? [Clarity, Spec §US3 AS-1 — SC-003 uses "within 3 seconds" but acceptance scenario uses "a few seconds"]
- [ ] CHK012 Is "automatically refresh" in FR-008 described with specific behavioral expectations (cadence, trigger, stop condition)? [Clarity, Spec §FR-008]
- [ ] CHK013 Is "unique room code" in FR-001 defined with specific collision resolution behavior? [Clarity, Spec §FR-001]
- [ ] CHK014 Is "isolate rooms" in FR-005 specified with concrete boundaries of what isolation means (data, actions, visibility)? [Clarity, Spec §FR-005]

## Requirement Consistency

- [ ] CHK015 Do the room status values in the spec entities ("lobby/active/completed") match the data-model ("lobby | active")? [Consistency, Spec §Key Entities vs data-model.md]
- [ ] CHK016 Does the data-model's `RoomSnapshot` include `availableWords` and `roles` fields that are not mentioned in the spec entity description? [Consistency, data-model.md §RoomSnapshot vs Spec §Key Entities]
- [ ] CHK017 Does the 503 error code for max rooms in contracts align with FR-012's capacity limit? [Consistency, contracts/api.md vs Spec §FR-012]
- [ ] CHK018 Is the timing threshold consistent between US3 acceptance scenario 1 ("a few seconds") and SC-003 ("within 3 seconds")? [Consistency, Spec §US3 AS-1 vs SC-003]
- [ ] CHK019 Does the data-model's Room allow "active" status but the spec feature only implements "lobby" → "active" transition? [Consistency, data-model.md vs Spec scope]

## Acceptance Criteria Quality

- [ ] CHK020 Are success criteria SC-001 through SC-006 all measurable with observable, verifiable outcomes? [Measurability, Spec §SC-001 to SC-006]
- [ ] CHK021 Is SC-003's "within 3 seconds" achievable given the ~2s refresh cadence from assumptions? [Measurability, Spec §SC-003 vs Assumptions]
- [ ] CHK022 Can SC-004 and SC-005 be tested independently of a game implementation? [Testability, Spec §SC-004, SC-005]
- [ ] CHK023 Are room isolation tests (SC-006) defined with multi-tab procedures as referenced in the constitution? [Testability, Spec §SC-006]

## Scenario Coverage

- [ ] CHK024 Are acceptance scenarios defined for all three positive flows (create, join, start)? [Coverage, Spec §US1-3]
- [ ] CHK025 Are exception scenarios defined for each validation path (empty code, invalid code, wrong code, full room, active room)? [Coverage, Spec §US2 AS-2/3, Edge Cases]
- [ ] CHK026 Is a scenario defined for the max-capacity rejection path (101st room or 9th participant)? [Coverage, Gap]
- [ ] CHK027 Is a scenario defined for the lobby auto-refresh across multiple simultaneous joins? [Coverage, Spec §US3 AS-1]
- [ ] CHK028 Is a scenario defined for attempting to start with exactly one player? [Coverage, Spec §US3 AS-2]

## Edge Case Coverage

- [ ] CHK029 Are edge cases defined for room code whitespace handling and casing? [Edge Case, Spec §Edge Cases — mentioned as question but no answer specified]
- [ ] CHK030 Is the behavior defined when a host creates a room, leaves, and the room is empty (room cleanup trigger)? [Edge Case, Spec §Edge Cases + FR-013]
- [ ] CHK031 Is the behavior defined when the backend is restarted mid-session and clients attempt to fetch stale rooms? [Edge Case, Spec §Edge Cases — question asked, no requirement specified]
- [ ] CHK032 Is the behavior defined when a player attempts to join a room that has already transitioned to "active"? [Edge Case, Spec §Edge Cases + contracts §403]
- [ ] CHK033 Are requirements defined for concurrent room creation near the 100-room limit? [Edge Case, Gap — race condition]

## Cross-Artifact Consistency

- [ ] CHK034 Does the data-model's `Room.hostId` field align with the spec's FR-002 (creator as host)? [Cross-check, data-model.md vs Spec §FR-002]
- [ ] CHK035 Do the API contract error codes cover all rejection paths implied by spec FRs (FR-003 through FR-013)? [Cross-check, contracts/api.md vs Spec §FR]
- [ ] CHK036 Does the data-model's `Participant.name` constraint (1-16 alphanumeric, trimmed) match FR-011? [Cross-check, data-model.md vs Spec §FR-011]
- [ ] CHK037 Do the data-model state transitions match the spec's acceptance scenario outcomes for start game? [Cross-check, data-model.md §State transitions vs Spec §US3 AS-3]
- [ ] CHK038 Does the contracts' `POST /rooms/:code/start` response (status "active") align with the data-model's state machine? [Cross-check, contracts/api.md vs data-model.md]
- [ ] CHK039 Does the data-model's max-100 concurrent rooms constraint have a matching contract error response? [Cross-check, data-model.md vs contracts/api.md §503]

## Assumptions & Dependencies

- [ ] CHK040 Are the assumptions about transient in-memory storage documented as a design constraint, not a gap? [Assumptions, Spec §Assumptions]
- [ ] CHK041 Is the assumption "no WebSockets" documented as a binding constraint that affects lobby refresh implementation? [Assumption, Spec §Assumptions]
- [ ] CHK042 Is the dependency on browser session (no auth) documented as a scope boundary? [Dependency, Spec §Assumptions]
