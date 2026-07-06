# Feature Specification: Join Validation with Clear Error Messages

**Feature Branch**: `002-join-validation`

**Created**: 2026-07-06

**Status**: Ready

**Input**: User description: "F002: join validation with clear error messages — invalid/empty codes are rejected with clear feedback: 'Invalid room code. Please try again with correct one.'"

## Clarifications

### Session 2026-07-06

- Q: Should empty player names also be validated? → A: No, scope is strictly room code validation. Empty player names currently default to "Player" — that behavior is unchanged.
- Q: Should the error message be exactly "Invalid room code. Please try again with correct one." for all invalid code scenarios? → A: Yes, use that exact message for both empty and non-existent codes.
- Q: Should validation happen on both frontend (before API call) and backend? → A: Yes. Frontend catches empty/whitespace codes early for instant feedback; backend validates all inputs as defense-in-depth.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reject Empty Room Code (Priority: P1)

As a player, when I try to join a room with an empty room code I want to see a clear error message so that I understand the code is required.

**Why this priority**: Core validation — the first thing a player will hit if they submit the form without entering a code. Must provide actionable feedback.

**Independent Test**: Can be tested by leaving the room code field blank and submitting the join form. The error message "Invalid room code. Please try again with correct one." must appear.

**Acceptance Scenarios**:

1. **Given** a player is on the Join Room screen, **When** they leave the room code field empty and click "Join Lobby", **Then** they see the error message "Invalid room code. Please try again with correct one." and are not redirected.
2. **Given** a player is on the Join Room screen, **When** they enter only whitespace characters in the room code field and click "Join Lobby", **Then** they see the same error message and are not redirected.

### User Story 2 - Reject Non-Existent Room Code (Priority: P1)

As a player, when I enter a room code that does not match any existing room I want to see a clear error message so that I know the code is wrong.

**Why this priority**: Core validation — essential for usability when a player mistypes or uses an expired code.

**Independent Test**: Can be tested by entering a valid-looking but non-existent code (e.g., "ZZZZ") and submitting. The error message must appear.

**Acceptance Scenarios**:

1. **Given** a player is on the Join Room screen, **When** they enter a room code that does not match any existing room and click "Join Lobby", **Then** they see the error message "Invalid room code. Please try again with correct one." and are not redirected.
2. **Given** a player is on the Join Room screen, **When** they enter a code that is exactly 4 characters but non-existent and click "Join Lobby", **Then** they see the same error message.

### User Story 3 - Valid Room Code Still Works (Priority: P1)

As a player, when I enter a valid room code I want to successfully join the room so that existing functionality is preserved.

**Why this priority**: Regression prevention — validation changes must not break the happy path.

**Independent Test**: Create a room in another tab, then use its code on the Join Room page. The join must succeed.

**Acceptance Scenarios**:

1. **Given** an existing room with code "ABCD", **When** a player enters "ABCD" and a player name and clicks "Join Lobby", **Then** they are successfully redirected to the lobby.
2. **Given** an existing room with code "ABCD", **When** a player enters "abcd" (lowercase) and clicks "Join Lobby", **Then** the join succeeds (case-insensitive).

---

### Edge Cases

- Room code field with only whitespace characters: treated as empty, same error message
- Room code with mixed case: normalized to uppercase before validation, case-insensitive matching preserved
- Room code that looks valid but is for a different game: same error as non-existent code
- Rapid repeated submissions: no double-join, error state clears on new submission attempt

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST reject a join request with an empty or whitespace-only room code and display "Invalid room code. Please try again with correct one."
- **FR-002**: The system MUST reject a join request for a room code that does not match any existing room and display "Invalid room code. Please try again with correct one."
- **FR-003**: The error message MUST be the exact string "Invalid room code. Please try again with correct one." for all invalid code scenarios.
- **FR-004**: The error MUST be surfaced on the Join Room page as visible text near the form, not as a browser alert or console message.
- **FR-005**: Validation MUST be applied both client-side (before API call) and server-side (on the API endpoint).
- **FR-006**: A valid room code with matching room MUST continue to allow joining successfully.
- **FR-007**: Case-insensitive room code matching MUST continue to work (lowercase input matches uppercase room code).

### Key Entities *(include if feature involves data)*

- **Room**: Contains room code, list of participants. No data model changes in this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Submitting empty room code shows error message within 100ms (client-side validation, no network request)
- **SC-002**: Submitting non-existent room code shows error message from API response
- **SC-003**: Error message text matches "Invalid room code. Please try again with correct one." in all invalid code scenarios
- **SC-004**: Valid join still succeeds and redirects to lobby
- **SC-005**: All existing tests continue to pass

## Assumptions

- The error message is intentionally generic ("Invalid room code") to avoid leaking information about which codes exist.
- Player name validation is out of scope — empty names default to "Player" as before.
- Backend returns HTTP 400 for empty/invalid codes and HTTP 404 for non-existent rooms, both with the same message.
- The frontend already has a mechanism (`form__error` element) to display errors — no new UI components needed.
