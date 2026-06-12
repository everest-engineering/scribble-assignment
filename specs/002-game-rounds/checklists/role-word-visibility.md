# Role & Word Visibility Checklist: Game Rounds

**Purpose**: Validate requirements quality for role assignment (drawer/guesser), role-gated word visibility, and role-based rendering — covers FR-001 to FR-016
**Created**: 2026-06-08
**Feature**: `specs/002-game-rounds/spec.md`

## Requirement Completeness

- [x] CHK001 Does the spec define exactly how "exactly one drawer" is guaranteed when the host and drawer roles might diverge in future versions? [Completeness, Spec §FR-001, Assumption line 103]
- [x] CHK002 Are the requirements for role display on the game screen specified for all possible viewer states (drawer, guesser, unauthenticated viewer)? [Completeness, Spec §FR-003]
- [x] CHK003 Is the word-visibility requirement explicitly specified for the "finished" state — does the drawer still see the word after round ends? [Completeness, Spec §FR-005]
- [x] CHK004 Are the requirements for word selection from the starter list specified when the list contains exactly one word? [Completeness, Spec §FR-012]
- [x] CHK005 Does the data model specify whether `word` on `RoomSnapshot` is omitted entirely (`undefined`) or set to `null` for guessers? [Completeness, data-model.md §RoomSnapshot]
- [x] CHK006 Is the drawer identity visibility requirement (FR-011) specified for both the "playing" and "finished" states? [Completeness, Spec §FR-011]
- [x] CHK007 Are the requirements for what guessers see in the canvas area after the round finishes vs during play clearly distinguished? [Completeness, Spec §FR-007, §FR-013]

## Requirement Clarity

- [x] CHK008 Is "clearly indicate each player's role" (FR-003) quantified with specific UI placement, sizing, or labeling requirements? [Clarity, Spec §FR-003, Clarifications 2026-06-09]
- [x] CHK009 Is the term "Drawer is drawing..." (FR-007) specified as the exact string, or is the copywriting left open to interpretation? [Clarity, Spec §FR-007]
- [x] CHK010 Is "banner above the canvas area" (Clarifications line 114) defined with measurable positioning, padding, or margin values? [Clarity, Spec §Clarifications 2026-06-09]
- [x] CHK011 Is the selection mechanism for the secret word explicitly defined — does "may be random" (FR-012) permit any random algorithm or is `Math.random()` the specific implementation? [Clarity, Spec §FR-012, §Q&A line 116]
- [x] CHK012 Are the role string values "drawer" and "guesser" explicitly specified as the canonical values, or could they vary across endpoints? [Clarity, Spec §FR-001, data-model.md §ParticipantRole]
- [x] CHK013 Does the spec clarify what "status message indicating the drawer is drawing" (FR-007) looks like for non-English or internationalised deployments? [Clarity, Spec §Clarifications 2026-06-09]

## Requirement Consistency

- [x] CHK014 Does FR-011 ("inform participants of the drawer's identity") conflict with the assumption that the host is always the drawer — i.e., is "drawer identity" the same as "host identity"? [Consistency, Spec §FR-011, Assumption line 103]
- [x] CHK015 Are the role-population rules consistent between the data model ("drawer if host and playing/finished") and the contract examples? [Consistency, data-model.md §ParticipantSnapshot, contracts/api.md]
- [x] CHK016 Does the "word" field visibility rule in the contract examples match the logic defined in the data model — both for drawer view and guesser view? [Consistency, data-model.md §RoomSnapshot, contracts/api.md]
- [x] CHK017 Are the participants array fields consistent between the start-game response (includes `availableWords`, `roles`) and the get-room response (omits those arrays)? [Consistency, data-model.md §RoomSnapshot]
- [x] CHK018 Does the assumption "host is always drawer" conflict with FR-001's "exactly one participant as drawer" if the host leaves mid-game and a new host is elected? [Consistency, Spec §FR-001, Assumption line 103]

## Acceptance Criteria Quality

- [x] CHK019 Can the acceptance criteria for US-1 AS-2 ("clearly see whether they are the drawer or a guesser") be objectively verified without subjective interpretation? [Measurability, Spec §US-1 AS-2]
- [x] CHK020 Are the success criteria SC-001 through SC-003 (2-second timings) specified with a measurement methodology — is it end-to-end or server-side only? [Measurability, Spec §SC-001–SC-003]
- [x] CHK021 Is SC-004 ("no guesser ever sees the secret word") testable in an automated regression suite, or does it rely on manual inspection? [Acceptance Criteria, Spec §SC-004]
- [x] CHK022 Do the acceptance scenarios for US-2 cover the case where the drawer's view is polled before role assignment is complete? [Acceptance Criteria, Spec §US-2]

## Scenario Coverage

- [x] CHK023 Are requirements specified for role and word visibility when a participant polls the room while the game is in the "lobby" state? [Coverage, Spec §Assumptions, data-model.md §RoomSnapshot]
- [x] CHK024 Are requirements defined for the drawer seeing the word when the room transitions to "finished" state mid-round? [Coverage, Spec §FR-005, §FR-011]
- [x] CHK025 Are requirements specified for word visibility when the room has zero participants and is deleted? [Coverage, Spec §Edge Cases]
- [x] CHK026 Are the scenario classes (primary, alternate, exception) covered for role assignment — e.g., what happens if the host is the only participant when start is attempted? [Scenario Coverage, Spec §US-1, §Edge Cases]

## Edge Case Coverage

- [x] CHK027 Is the requirement for the "empty word list" edge case (Edge Cases line 65) specified — what error message or status is returned? [Edge Case, Spec §FR-014]
- [x] CHK028 Are requirements defined for role-based word visibility when `participantId` query parameter is missing or invalid on `GET /rooms/:code`? [Edge Case, Spec §FR-015, contracts/api.md]
- [x] CHK029 Is the requirement for word visibility during a race condition — where the drawer disconnects simultaneously with a guesser's poll — addressed? [Edge Case, Spec §FR-016, Clarifications 2026-06-09]

## Non-Functional Requirements

- [x] CHK030 Is the guarantee level for word non-leakage (SC-004) specified as a functional invariant or a best-effort constraint? [Non-Functional, Spec §SC-004]
- [x] CHK031 Are performance requirements (2-second visibility, SC-001–SC-003) specified for the polling cadence — does meeting this require the poll interval to be ≤2s? [Non-Functional, Spec §SC-003, Clarifications 2026-06-09]

## Dependencies & Assumptions

- [x] CHK032 Is the dependency on the host always being the drawer explicitly documented as a design constraint that would need revision for multi-round support? [Assumption, Spec §Assumptions line 103]
- [x] CHK033 Is the assumption that "players behave honestly" (line 106) documented with its implications — that no technical screen-sharing prevention is in scope? [Assumption, Spec §Assumptions line 106]
- [x] CHK034 Is the dependency on the starter word list being non-empty explicitly validated as a precondition? [Assumption, Spec §Edge Cases line 65]

## Ambiguities & Conflicts

- [x] CHK035 Is there a conflict between FR-010 ("persist word for duration of round") and the data model that has no explicit "round" entity — does persistence mean "on Room.word" or a separate Round object? [Ambiguity, Spec §FR-010, data-model.md]
- [x] CHK036 Does "deterministically from the starter word list" (FR-012) create ambiguity when read alongside the Q&A clarification that selection "may be random"? [Ambiguity, Spec §FR-012, §Q&A line 116]
- [x] CHK037 Is the term "round" used interchangeably with "game" (e.g., "Round 1" in quickstart vs "game round" in spec) without explicit definitions? [Ambiguity, Spec §Title, Spec §Key Entities]
