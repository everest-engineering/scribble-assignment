# Requirements Checklist: Result, Restart & Final Validation

## Quality Gate

### Spec Completeness
- [ ] All user stories include priority labels (P1/P2)
- [ ] Every acceptance scenario uses Given/When/Then format
- [ ] Independent test exists for each user story
- [ ] Edge cases documented
- [ ] Functional requirements enumerated (FR-001 through FR-009)
- [ ] Success criteria measurable and time-bound
- [ ] Assumptions clearly stated
- [ ] All `[NEEDS CLARIFICATION]` markers resolved before implementation

### FR → Acceptance Scenario Mapping
- [ ] FR-001: Auto-end when all guessers guess correctly → US1 AS1
- [ ] FR-002: Manual end round by drawer (idempotent) → US1 AS2
- [ ] FR-003: Secret word revealed to all in result → US2 AS1
- [ ] FR-004: Display word, scores, history → US2 AS2, AS3
- [ ] FR-005: Host-only restart endpoint → US3 AS1
- [ ] FR-006: Preserve participants on restart → US3 AS2
- [ ] FR-007: Clear round state on restart (scores preserved) → US3 AS3
- [ ] FR-008: Auto-detect result on GamePage → US4 AS1
- [ ] FR-009: Reject non-host restart → US3 AS4
- [ ] FR-010: submitGuess response includes status → US4 AS1 (faster transition)
- [ ] FR-011: Auto-end guard for empty guesser list → US1 AS1 edge case

## Implementation Checklist

### Backend
- [X] T001: RoomStatus includes "result"
- [X] T002: endRound(), restartGame(), auto-end in submitGuess
- [X] T003: endRoundSchema, restartGameSchema
- [X] T004: POST /:code/end-round, POST /:code/restart
- [X] T005: toRoomSnapshot reveals secretWord in result state

### Frontend
- [X] T006: RoomSnapshot.status includes "result"
- [X] T007: endRound(), restartGame() API methods
- [X] T008: endRound(), restartGame() store methods
- [X] T009: ResultView component
- [X] T010: Result view CSS
- [X] T011: GamePage result detection + End Round button

### Build
- [X] T012: Backend build passes
- [X] T012: Frontend build passes
