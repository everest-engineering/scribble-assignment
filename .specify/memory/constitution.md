<!--
Sync Impact Report:
- Version change: [INITIAL] -> 1.0.0
- List of modified principles:
  * PRINCIPLE_1_NAME: TypeScript First
  * PRINCIPLE_2_NAME: ES Modules Standard
  * PRINCIPLE_3_NAME: In-Memory Only
  * PRINCIPLE_4_NAME: No WebSockets
  * PRINCIPLE_5_NAME: No Authentication
- Added sections: Core Principles, Additional Constraints, Governance
- Templates requiring updates:
  * .specify/templates/plan-template.md (✅ updated)
  * .specify/templates/spec-template.md (✅ updated)
  * .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: None
-->
# Scribble Game Constitution

## Core Principles

### I. TypeScript First
Every file and component MUST use strict TypeScript. The use of `any` is strictly prohibited; if a type is truly dynamic, `unknown` MUST be used. All interfaces, API responses, and parameters must be explicitly typed.

### II. ES Modules Standard
The codebase strictly relies on standard relative and absolute ES module imports. In the Node.js backend, relative imports MUST include the `.js` file extension (e.g. `import { getRoom } from "./roomStore.js"`).

### III. In-Memory Only
No databases or persistent storage layers (SQL, NoSQL, SQLite, Redis) are allowed. All room data is stored in-memory using JavaScript Maps. The memory footprint for active game rooms must be minimal, and inactive rooms must be cleared.

### IV. No WebSockets
All synchronization between frontend clients and the backend MUST use HTTP polling. The polling interval on the client must be set to approximately 2 seconds. Real-time push protocols (WebSockets, Server-Sent Events, Socket.io) are strictly forbidden.

### V. No Authentication
No authentication, sessions, JWT tokens, cookies, or OAuth integrations are allowed. Player identity is transient and established via a `participantId` generated upon joining or creating a room.

## Additional Constraints

### Tech Stack Constraints
- Backend: Node.js, Express, TypeScript, Zod for parsing.
- Frontend: React (v18), React Router (v6), Vite.
- Styling: Vanilla CSS classes residing in `app.css`.

## Development Workflow
Features must be implemented checkpoint by checkpoint. Every checkpoint requires:
1. Discovery notes update.
2. Specification update with acceptance criteria.
3. Architecture plan update.
4. Actionable task checklist update.
5. Incremental implementation with corresponding unit tests.
6. Validation in multiple browser sessions.

## Governance
This constitution supersedes all other coding practices. Any changes to these principles require version bump and documentation of rationale.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
