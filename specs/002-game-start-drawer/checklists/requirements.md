# Specification Quality Checklist: Game Start & Drawer Flow

**Purpose**: Validate the game start and drawer flow spec for completeness, clarity, consistency, measurable acceptance, and scope coverage.
**Created**: 2026-06-09
**Feature**: ../spec.md

## Requirement Completeness

- [ ] CHK029 - Is the `POST /rooms/:code/start` endpoint clearly specified with validation rules? [Completeness, Spec §FR-009..FR-012]
- [ ] CHK030 - Is drawer assignment (host becomes drawer) explicitly stated? [Completeness, Spec §FR-013]
- [ ] CHK031 - Is deterministic word selection defined with a concrete formula? [Completeness, Spec §FR-014]
- [ ] CHK032 - Is secret word visibility (drawer-only during gameplay) specified? [Completeness, Spec §FR-015]
- [ ] CHK033 - Are score initialisation requirements specified? [Completeness, Spec §FR-017]

## Requirement Clarity

- [ ] CHK034 - Is the room status model extension defined clearly? [Clarity, Clarifications]
- [ ] CHK035 - Is the difference between drawer and guesser roles explained unambiguously? [Clarity, Spec §FR-016]
- [ ] CHK036 - Are the HTTP error responses for invalid start attempts specified with status codes and body format? [Clarity, Spec §FR-010..FR-012]

## Requirement Consistency

- [ ] CHK037 - Do the user stories, functional requirements, and success criteria align on game start behaviour? [Consistency]
- [ ] CHK038 - Is the word selection formula consistent with the starter data (5 words)? [Consistency, Spec §FR-014]

## Acceptance Criteria Quality

- [ ] CHK039 - Are measurable success criteria defined for role assignment and word visibility? [Acceptance Criteria, Spec §SC-007..SC-010]
- [ ] CHK040 - Is the 2-second polling update requirement for status transition measurable? [Measurability, Spec §SC-007]

## Scenario Coverage

- [ ] CHK041 - Do user stories cover host start, drawer word visibility, and status transition? [Coverage]
- [ ] CHK042 - Are alternate flows covered for non-host start attempts and too-few-players scenarios? [Coverage]

## Edge Case Coverage

- [ ] CHK043 - Is the already-started room rejection covered? [Edge Case]
- [ ] CHK044 - Is the drawer refresh scenario covered? [Edge Case]
- [ ] CHK045 - Is the secret word leak prevention via API covered? [Edge Case]

## Dependencies & Assumptions

- [ ] CHK046 - Is the dependency on the existing room model and starter data documented? [Dependencies]
- [ ] CHK047 - Is the assumption about the `RoomSnapshot` extension documented? [Assumptions]
- [ ] CHK048 - Is the frontend `LobbyPage` update assumption documented? [Assumptions]
