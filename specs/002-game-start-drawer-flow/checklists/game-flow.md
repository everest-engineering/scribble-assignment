# Requirements Quality Checklist: Game Start & Drawer Flow

**Purpose**: Validate specification completeness, clarity, consistency, and measurability for the game start and drawer flow feature.
**Created**: 2026-06-01
**Audience**: Implementor
**Depth**: Standard
**Scope**: All areas — name validation, game logic (drawer assignment + word selection), role-based visibility

## Requirement Completeness

- [ ] CHK001 - Are requirements specified for the player join ordering metric (e.g., joinedAt timestamp) that determines drawer assignment? [Completeness, Spec §FR-006]
- [ ] CHK002 - Are requirements for the word pool content (minimum size, word criteria) explicitly documented beyond the Assumptions section? [Completeness, Spec §FR-008, Assumptions L125]
- [ ] CHK003 - Are requirements specified for post-game-start participant behavior (can new players join mid-game, or are they blocked)? [Completeness, Spec §Assumptions L127]
- [ ] CHK004 - Are requirements specified for drawer reassignment when the drawer leaves (algorithm, word reselection)? [Completeness, Spec §Edge Cases L80]
- [ ] CHK005 - Are requirements specified for the case where all participants leave during gameplay? [Completeness, Spec §Edge Cases L80]
- [ ] CHK006 - Are requirements specified for the maximum display name character set (alphanumeric only, or any Unicode)? [Completeness, Spec §FR-003, Assumptions L124]

## Requirement Clarity

- [ ] CHK007 - Is the phrase "informative error message" quantified with specific criteria (content, format, placement)? [Clarity, Spec §FR-002, FR-003b]
- [ ] CHK008 - Is the phrase "immediate visible error message" quantified with a specific time threshold? [Clarity, Spec §SC-002]
- [ ] CHK009 - Does the spec define what "indication that a word is active" looks like for guessers (e.g., placeholder text, obscured word format)? [Clarity, Spec §FR-010]
- [ ] CHK010 - Is the deterministic word selection algorithm described with sufficient precision to implement without ambiguity? [Clarity, Spec §FR-008]
- [ ] CHK011 - Are the HTTP polling requirements (interval, timeout, error handling for failed polls) explicitly specified? [Clarity, Spec §FR-011]

## Requirement Consistency

- [ ] CHK012 - Does FR-003b (duplicate rejection) align with FR-001 (trimming) — is trimming guaranteed before duplicate comparison? [Consistency, Spec §FR-001 vs FR-003b]
- [ ] CHK013 - Do SC-001 and SC-003 both use "within 2 seconds" — is this consistent with the polling interval defined or implied elsewhere? [Consistency, Spec §SC-001, SC-003]
- [ ] CHK014 - Does the Edge Cases section's drawer disconnect behavior align with FR-006's definition of drawer assignment? [Consistency, Spec §FR-006 vs Edge Cases L80]
- [ ] CHK015 - Are the Key Entities ("Player", "Room", "Game State") defined consistently with how they are referenced in all requirements? [Consistency, Spec §Key Entities vs FRs]

## Acceptance Criteria Quality

- [ ] CHK016 - Can SC-001 ("join within 2 seconds") be objectively measured without implementation details? [Measurability, Spec §SC-001]
- [ ] CHK017 - Is SC-003's phrase "visible to all players within 2 seconds" verifiable without access to server-side timing? [Measurability, Spec §SC-003]
- [ ] CHK018 - Can SC-005 (deterministic behavior) be tested independently of other systems? [Measurability, Spec §SC-005]
- [ ] CHK019 - Is SC-006's "clear message" defined with sufficient detail to be testable? [Measurability, Spec §SC-006]

## Scenario Coverage

- [ ] CHK020 - Are requirements defined for the scenario where a non-creator player attempts to start the game? [Coverage, Spec §FR-005, Acceptance Scenario — Gap]
- [ ] CHK021 - Are requirements defined for the scenario where the room is in "playing" status and a player attempts to start again? [Coverage, Gap]
- [ ] CHK022 - Are requirements defined for the scenario where the word pool is empty or corrupted? [Coverage, Spec §Edge Cases L81, Gap]
- [ ] CHK023 - Are requirements defined for the scenario where a participant disconnects mid-poll (stale participantId)? [Coverage, Gap]
- [ ] CHK024 - Are requirements defined for the scenario of concurrent join attempts with the same name? [Coverage, Gap — race condition]

## Edge Case Coverage

- [ ] CHK025 - Are boundary conditions for maximum name length (exactly 20, exactly 21 characters) addressed? [Edge Cases, Spec §FR-003]
- [ ] CHK026 - Are requirements defined for names containing special characters, emoji, or non-ASCII Unicode? [Edge Cases, Spec §FR-001, FR-003 — Gap]
- [ ] CHK027 - Is the behavior defined when a room reaches "playing" status but all participants then leave before any drawing occurs? [Edge Cases, Spec §Edge Cases L80]
- [ ] CHK028 - Are requirements defined for what happens when the last participant tries to leave? [Edge Cases, Gap]

## Dependencies & Assumptions

- [ ] CHK029 - Are all external dependencies (word pool, polling mechanism) explicitly documented with their assumptions? [Assumptions, Spec §Assumptions L125, L129]
- [ ] CHK030 - Is the assumption about reusing existing room lobby infrastructure validated against the current implementation? [Assumption, Spec §Assumptions L130]
