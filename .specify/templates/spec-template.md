# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Demonstrated independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific Scribble capability, e.g., "allow a host to create a room with a trimmed player name"]
- **FR-002**: System MUST [validation behavior, e.g., "reject empty or whitespace-only player names with clear feedback"]
- **FR-003**: Users MUST be able to [key interaction, e.g., "join an existing room by code"]
- **FR-004**: System MUST [state requirement, e.g., "keep each room isolated in backend memory"]
- **FR-005**: System MUST [sync behavior, e.g., "refresh shared room state through HTTP polling"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST select the drawer using [NEEDS CLARIFICATION: drawer assignment rule not specified - host, first player, or another deterministic rule?]
- **FR-007**: System MUST refresh shared state every [NEEDS CLARIFICATION: polling cadence not specified]

### Constitution Constraints *(mandatory)*

- **CC-001**: Feature MUST use TypeScript and ES Modules in both `frontend/` and `backend/`.
- **CC-002**: Feature MUST use HTTP REST requests and polling for synchronization.
- **CC-003**: Feature MUST keep all room/game state in memory only; databases and persistent storage are out of scope.
- **CC-004**: Feature MUST NOT add WebSockets, Socket.io, server-sent events, authentication, sessions, JWT, OAuth, deployment, Docker, or unrelated dependencies.
- **CC-005**: Backend request and response boundaries MUST use Zod validation.

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Players can create or join a room in under 1 minute"]
- **SC-002**: [Measurable metric, e.g., "Two browser tabs see updated lobby state within about 2 seconds"]
- **SC-003**: [User outcome metric, e.g., "Players receive clear feedback for invalid room codes or empty input"]
- **SC-004**: [Validation metric, e.g., "Correct guesses score deterministically and appear in synced history"]

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- [Assumption about target users, e.g., "Users have stable internet connectivity"]
- [Assumption about scope boundaries, e.g., "Mobile support is out of scope for v1"]
- [Assumption about data/environment, e.g., "Room state resets when the backend restarts"]
- [Dependency on existing system/service, e.g., "Uses the starter word list from backend seed data"]
