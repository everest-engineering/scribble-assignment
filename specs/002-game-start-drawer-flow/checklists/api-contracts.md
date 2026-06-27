# API Contracts Quality Checklist: Game Start & Drawer Flow

**Purpose**: Validate requirements quality for API contracts and data-model definitions
**Created**: 2026-06-26
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [ ] CHK001 Are error response schemas defined for all API failure modes (non-host start, <2 players, room not found)? [Completeness, contracts/api.md]
- [ ] CHK002 Is the sessionStorage contract fully specified — key names, write triggers, read triggers, clear triggers? [Completeness, contracts/api.md]
- [ ] CHK003 Are request body validation rules specified for the start game endpoint? [Completeness, spec.md FR-016, contracts/api.md]
- [ ] CHK004 Is the behavior of `secretWord` for non-drawer participants defined as field absence (not `null`, not empty string)? [Completeness, contracts/api.md L54]

## Requirement Clarity

- [ ] CHK005 Is the condition for `secretWord` inclusion in the snapshot specified with exact equality logic (`viewerParticipantId === room.drawerId`)? [Clarity, spec.md FR-018, data-model.md L19]
- [ ] CHK006 Is the exact response shape documented for both drawer and guesser (including which fields are present vs absent)? [Clarity, contracts/api.md L22-L54]
- [ ] CHK007 Is the "when navigated away" trigger for sessionStorage clearing defined with specific route names? [Clarity, contracts/api.md L94-L95]
- [ ] CHK008 Is the `playerId` vs `participantId` terminology distinction clarified? [Clarity, contracts/api.md L62-L64, spec.md L111]

## Requirement Consistency

- [ ] CHK009 Does the data model's `secretWord` optionality (`secretWord?`) agree with the API contract's conditional presence? [Consistency, data-model.md L19 vs contracts/api.md L26/L48]
- [ ] CHK010 Are the sessionStorage key names (`scribble_roomCode`, `scribble_participantId`) consistent between contracts and spec references? [Consistency, contracts/api.md L94-L95]
- [ ] CHK011 Does the `startGame` POST response example include `secretWord` for the drawer, consistent with FR-018? [Consistency, contracts/api.md L80 vs spec.md FR-018]
- [ ] CHK012 Does the `currentRound` field name match between data model and API contract examples? [Consistency, data-model.md L9 vs contracts/api.md L24]

## Coverage

- [ ] CHK013 Is the API response format for 403 (non-host start) and 400 (<2 players) error responses documented? [Coverage, contracts/api.md, Gap]
- [ ] CHK014 Is the behavior defined when `participantId` is missing/empty in the `GET /rooms/:code` query? [Coverage, Gap]
- [ ] CHK015 Is the behavior defined when sessionStorage is unavailable (private browsing, storage quota exceeded)? [Coverage, Gap]
- [ ] CHK016 Is the GET endpoint response for `status === "lobby"` vs `status === "playing"` differentiated? [Coverage, contracts/api.md L13-L30]

## Edge Cases

- [ ] CHK017 Is the behavior defined when `startGame` is called on a room already in "playing" status? [Edge Case, Gap]
- [ ] CHK018 Is the behavior defined when `STARTER_WORDS` is empty or undefined? [Edge Case, Gap]
- [ ] CHK019 Is the behavior defined when the drawer ID in sessionStorage no longer matches any participant? [Edge Case, Gap]
- [ ] CHK020 Is the behavior defined when room data is stale (concurrent modification between fetch and render)? [Edge Case, Gap]

## Dependencies & Assumptions

- [ ] CHK021 Is the dependency on `STARTER_WORDS` list existence and ordering documented in the spec or contracts? [Dependency, data-model.md L28]
- [ ] CHK022 Is the assumption that `GET /rooms/:code` already returns `availableWords` and `roles` documented? [Assumption, contracts/api.md L27-L28]

## Notes

- Items marked [Gap] indicate missing contract specifications that may need to be added before implementation.
- Cross-reference with data-model.md for entity field definitions and validation rules.
