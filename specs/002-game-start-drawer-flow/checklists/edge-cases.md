# Edge Cases & Failure Modes Checklist: Game Start & Drawer Flow

**Purpose**: Validate requirements quality for edge cases, failure modes, and exceptional paths
**Created**: 2026-06-26
**Feature**: [spec.md](../spec.md)

## Requirement Completeness (Failure Paths)

- [ ] CHK001 Is the behavior defined when the `startGame` endpoint is called by a player who is not the host? [Completeness, spec.md §Edge Cases, Gap]
- [ ] CHK002 Is the behavior defined when `startGame` is called with fewer than 2 participants? [Completeness, spec.md §Edge Cases, Gap]
- [ ] CHK003 Is the behavior defined when `startGame` is called on a room already in "playing" status? [Completeness, Gap]
- [ ] CHK004 Is the behavior defined when the backend is restarted while a user is viewing the GamePage (no polling to detect 404)? [Completeness, spec.md §Edge Cases L84-L86]
- [ ] CHK005 Is the behavior defined when sessionStorage is unavailable (private browsing, storage quota exceeded)? [Completeness, Gap]

## Requirement Completeness (Data/State Edge Cases)

- [ ] CHK006 Is the behavior defined when `STARTER_WORDS` list is empty, undefined, or has fewer words than rounds? [Completeness, Gap]
- [ ] CHK007 Is the behavior defined when the drawer's participant ID from sessionStorage no longer exists on the server? [Completeness, Gap]
- [ ] CHK008 Is the behavior defined for concurrent `startGame` calls from multiple participants? [Completeness, Gap]
- [ ] CHK009 Is the behavior defined when the room is deleted (last player leaves) while a game is in progress? [Completeness, Gap]

## Requirement Completeness (Recovery Paths)

- [ ] CHK010 Is the recovery path defined when the GamePage's single fetch fails (network error, not just 404)? [Completeness, Gap]
- [ ] CHK011 Is the recovery path defined when sessionStorage data is corrupted or tampered with? [Completeness, Gap]
- [ ] CHK012 Is the recovery path defined when a participant re-joins a room that is already in "playing" status? [Completeness, Gap]
- [ ] CHK013 Is the recovery path defined when the drawer's tab crashes or is closed during the game? [Completeness, Gap]

## Requirement Clarity

- [ ] CHK014 Is "Room no longer available" message behavior specified — is it a toast, full-screen overlay, or redirect? [Clarity, spec.md §Edge Cases L85-L86]
- [ ] CHK015 Is the "re-fetches room state" behavior on page refresh specified with error handling? [Clarity, spec.md §Edge Cases L81-L82]
- [ ] CHK016 Is "navigates back to the home screen" defined — does it replace history or push? [Clarity, spec.md §Edge Cases L86]

## Consistency

- [ ] CHK017 Does the backend restart edge case mention "polling request" but the GamePage uses single fetch (not polling)? [Consistency, spec.md §Edge Cases L84-L85 vs Assumptions L159]
- [ ] CHK018 Is the behavior for a missing participantId in GET /rooms/:code consistent between the lobby scenario and the game scenario? [Consistency, contracts/api.md, Gap]

## Scenario Coverage

- [ ] CHK019 Is the behavior specified for the scenario where the word list index exceeds array bounds? [Coverage, Gap]
- [ ] CHK020 Is the behavior specified for the scenario where a guesser inspects the DOM for the secret word? [Coverage, spec.md SC-3]
- [ ] CHK021 Is the behavior specified for the scenario where the host rename's themselves mid-game (drawer label should update)? [Coverage, Gap]

## Dependencies & Assumptions

- [ ] CHK022 Is the assumption "no database, in-memory only" validated against the backend restart edge case (data loss)? [Assumption, spec.md §Edge Cases L84-L86, constitution]
- [ ] CHK023 Is the assumption "single fetch is sufficient" validated against the scenario where the server response is delayed or lost? [Assumption, spec.md Assumptions L159]
- [ ] CHK024 Is the dependency on `structuredClone` (deep copy of Room objects) documented? [Dependency, Gap]

## Notes

- Items marked [Gap] indicate missing edge case or recovery path requirements.
- The existing 4 edge cases cover basic scenarios; most gaps are around recovery paths and concurrent access.
- Cross-reference with api-contracts.md for missing error response schemas.
