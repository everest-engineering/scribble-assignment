# Spec Quality Checklist — 004-result-restart-validation

**Purpose**: Validate specification quality for Result, Restart & Final Validation feature
**Created**: 2026-06-26
**Audience**: Implementation (developer pre-code validation)
**Depth**: Standard
**Coverage**: Full — API, UX, game logic, edge cases

## Requirement Completeness

- [ ] CHK001 - Are error response body schemas defined for all 400/403/404 responses from new endpoints? [Completeness, Gap; Spec §FR-040, FR-041, FR-048, FR-051]
- [ ] CHK002 - Is the "visual indication" on the Skip Round button (badge/pulse) specified with concrete visual properties? [Completeness, Spec §FR-058]
- [ ] CHK003 - Are requirements defined for what happens when the "Host disconnected" popup is dismissed without claiming host? [Completeness, Gap]
- [ ] CHK004 - Are requirements defined for dismissing the "Drawer disconnected" popup (dismiss vs persistent)? [Completeness, Gap]
- [ ] CHK005 - Are requirements defined for the `skipSuggested` field being reset/cleared after skip-round or restart? [Completeness, Spec §FR-057, FR-059]
- [ ] CHK006 - Are validation requirements defined for the `participantId` field in all new endpoint request bodies? [Completeness, Gap]

## Requirement Clarity

- [ ] CHK007 - Is the 30-second disconnect threshold explicitly specified as an implementation constant (server-side, not client-configurable)? [Clarity, Spec §FR-045]
- [ ] CHK008 - Is the "clear error message" for name length >20 chars specified with concrete wording or format? [Clarity, Spec §FR-053]
- [ ] CHK009 - Is "local dismissal" of the result overlay precisely defined (session-only vs survives page refresh)? [Clarity, Spec §FR-038]
- [ ] CHK010 - Is the order of precedence between `hostDisconnected` and `drawerDisconnected` when drawer=host specified in FRs (currently only in edge cases)? [Clarity, Spec §Edge Cases]

## Requirement Consistency

- [ ] CHK011 - Does the "Notify Host" behavior (FR-055/FR-056) conflict with the "always visible to host" Skip Round button (FR-052)? [Consistency; Spec §FR-052, FR-055]
- [ ] CHK012 - Is SC-023 (host sees badge) consistent with FR-052 (button always visible to host)? [Consistency; Spec §SC-023, FR-052]
- [ ] CHK013 - Do the duplicate acceptance scenario numbers in User Story 5 (two items labeled "2.") cause ambiguity? [Consistency, Spec §User Story 5]
- [ ] CHK014 - Are restart requirements consistent between result overlay (FR-042) and edge case descriptions (restart after all dismissed)? [Consistency; Spec §FR-042, Edge Cases]

## Acceptance Criteria Quality

- [ ] CHK015 - Can SC-017 ("identical data within one polling cycle") be objectively verified across different network conditions? [Measurability, Spec §SC-017]
- [ ] CHK016 - Can SC-020 ("independent dismiss without affecting others") be verified in acceptance scenarios without contradicting the polling-based sync model? [Measurability, Spec §SC-020]
- [ ] CHK017 - Is "clear error message" in SC-025 measurable (what qualifies as "clear")? [Measurability, Spec §SC-025]

## Scenario Coverage

- [ ] CHK018 - Are requirements defined for the "original host returns after claim-host" scenario (their `lastSeenAt` updates, but `hostId` unchanged)? [Coverage, Spec §Edge Cases]
- [ ] CHK019 - Are requirements defined for what happens when a participant calls `claim-host` but is not in the room's participants list? [Coverage, Spec §FR-048]
- [ ] CHK020 - Are requirements defined for the `skipSuggested: true` + `drawerDisconnected: false` state (host could request skip when drawer is connected)? [Coverage, Gap]
- [ ] CHK021 - Are requirements defined for the "last player claims host then exits" scenario? [Coverage, Gap]
- [ ] CHK022 - Are requirements defined for `lastSeenAt` on initial participant creation (value on first join before first poll)? [Coverage, Spec §FR-044]

## Edge Case Coverage

- [ ] CHK023 - Is the edge case for a participant who has never polled (no `lastSeenAt`) handled in the disconnect detection? [Edge Case, Spec §FR-045]
- [ ] CHK024 - Is the edge case for calling `suggest-skip` multiple times by the same or different players addressed? [Edge Case, Spec §FR-056]
- [ ] CHK025 - Is the edge case for concurrent `claim-host` requests from two different participants addressed? [Edge Case, Gap]
- [ ] CHK026 - Is the edge case for the 30-second threshold edge (29s vs 31s) specified in any SC? [Edge Case, Spec §SC-021]

## Non-Functional Requirements

- [ ] CHK027 - Are timeout/network-failure requirements defined for API calls from the result overlay buttons (restart, claim-host, skip-round)? [Gap]
- [ ] CHK028 - Are idempotency requirements defined for all new POST endpoints (multiple identical calls)? [Gap]

## Dependencies & Assumptions

- [ ] CHK029 - Is the assumption that `lastSeenAt` is updated only on `GET /:code` (not POST endpoints) explicitly documented? [Assumption, Spec §FR-044]
- [ ] CHK030 - Is the assumption that participants share the same clock/server time (or is clock skew acceptable for 30s threshold) documented? [Assumption, Gap]
- [ ] CHK031 - Is the dependency on the existing `advanceRound()` function's behavior (word cycling, drawer rotation) explicitly referenced? [Assumption, Spec §FR-050]
