# Research: Round Results and Game Restart

## Decision: No new technology choices required

**Rationale**: Feature 004 is a behavioral extension of the existing Express + React + TypeScript stack established in features 001–003. All technical dependencies are already resolved.

## Technical Context (Confirmed)

- **Language/Version**: TypeScript 5.x (Node.js 20+, ES Modules)
- **Primary Dependencies**: Express 4.x (backend), React 18 + React Router 6 + Vite (frontend)
- **Storage**: In-memory only (`Map<string, Room>` in `roomStore.ts`)
- **Testing**: Vitest (backend), browser-based validation (frontend)
- **Target Platform**: Local web server + browser
- **Project Type**: Web application (backend/frontend split)
- **Performance Goals**: HTTP polling ~2s interval, sub-200ms API response times
- **Constraints**: No WebSockets, no databases, no authentication

## Alternatives Considered

| Topic | Alternative | Decision | Rationale |
|-------|-------------|----------|-----------|
| Round-end trigger | Dedicated SSE channel | Reuse existing polling | Constitution forbids real-time protocols |
| Results screen route | New `/results` route | Reuse `/game` route | Matches Q&A in spec; minimizes routing changes |
| Result data structure | New `resultScreen` object | Reuse `currentWord`, `scores`, `guessHistory` | Spec Q&A explicitly chose reuse; simpler migration |

## Outcome

All NEEDS CLARIFICATION items resolved. Proceed to Phase 1 design.
