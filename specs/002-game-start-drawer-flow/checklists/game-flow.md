# Game Flow & UX Quality Checklist: Game Start & Drawer Flow

**Purpose**: Validate requirements quality for game flow, user roles, and user-facing behavior
**Created**: 2026-06-26
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [ ] CHK001 Are requirements defined for what the drawer sees on the GamePage vs. what the guesser sees? [Completeness, spec.md FR-019]
- [ ] CHK002 Is the "Exit Game" or "Leave Game" user flow specified? [Completeness, Gap]
- [ ] CHK003 Are requirements defined for the loading state during GamePage mount (before room state is fetched)? [Completeness, Gap]
- [ ] CHK004 Is the transition from lobby to game screen defined in terms of user-observable behavior? [Completeness, spec.md US1, Assumptions L159]
- [ ] CHK005 Is the canvas placeholder behavior specified for both drawer and guesser views? [Completeness, spec.md Assumptions L155-L156]

## Requirement Clarity

- [ ] CHK006 Is the exact UI message text specified for the drawer ("Your word: [word]" vs "You are the drawer!" with secret word)? [Clarity, spec.md FR-019]
- [ ] CHK007 Is "clearly-identified drawer" defined with specific UI criteria (label, badge, positioning)? [Clarity, spec.md US1 L24]
- [ ] CHK008 Is the timing for guessers to see the drawer identity specified? [Clarity, spec.md SC-006]
- [ ] CHK009 Is the page refresh recovery UX specified — does the user see stale content, a spinner, or nothing during re-fetch? [Clarity, spec.md US1 AS3, FR-020]

## Requirement Consistency

- [ ] CHK010 Does SC-006 align with the architecture (single fetch, not polling)? [Consistency, spec.md SC-006 vs Clarifications L16]
- [ ] CHK011 Does SC-010's 2-second bound align with the single-fetch-on-mount design? [Consistency, spec.md SC-010 vs Assumptions L159]
- [ ] CHK012 Is the "immediately" in SC-007 defined consistently for both drawer (POST response) and guessers (lobby poll)? [Consistency, spec.md SC-007 vs SC-006]
- [ ] CHK013 Is the drawer role terminology ("drawer" vs "host") consistent across US1 and US2? [Consistency, spec.md US1 L24 vs US2 L51]

## Acceptance Criteria Quality

- [ ] CHK014 Can SC-006 "see who the drawer is" be objectively verified with a specific test procedure? [Measurability, spec.md SC-006]
- [ ] CHK015 Can SC-008 "never see the secret word" be verified via API inspection (not just UI)? [Measurability, spec.md SC-008]
- [ ] CHK016 Can SC-010 "returned to the correct view within 2 seconds" be measured without instrumentation? [Measurability, spec.md SC-010]
- [ ] CHK017 Can the acceptance scenario "player refreshes their browser" be automated, or is it manual-only? [Measurability, spec.md US1 AS3]

## Scenario Coverage

- [ ] CHK018 Is the user flow for a non-host player who tries to access the GamePage directly (without going through lobby) specified? [Coverage, Gap]
- [ ] CHK019 Is the user flow for the drawer vs. guesser differentiation on the lobby-to-game transition specified? [Coverage, spec.md US1 L29-L31]
- [ ] CHK020 Is the user flow for multiple rounds (beyond round 1) explicitly marked as out of scope? [Coverage, spec.md Assumptions L148-L149]

## Edge Cases

- [ ] CHK021 Is the behavior specified when a participant navigates to the GamePage with no room state and no sessionStorage? [Edge Case, Gap]
- [ ] CHK022 Is the behavior specified when a non-drawer participant tries to see the word via browser DevTools? [Edge Case, spec.md SC-3]
- [ ] CHK023 Is the behavior specified when the drawer identity in sessionStorage differs from the server's drawer identity? [Edge Case, Gap]
- [ ] CHK024 Is the behavior specified when the backend is restarted while a user is on the GamePage (no polling to detect 404)? [Edge Case, spec.md Edge Cases L84-L86]

## Notes

- Items marked [Gap] indicate missing game-flow requirements that may need to be added.
- Cross-reference with Spec Review checklist at `spec-review.md` for broader requirement quality concerns.
