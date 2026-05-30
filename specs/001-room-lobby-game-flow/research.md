# Research: Room Setup and Lobby

## Decision: Use in-memory rooms and HTTP polling

- The lab forbids WebSockets, databases, authentication, and persistent sessions.
- Room state remains in a backend in-memory map keyed by normalized room code.
- Lobby synchronization uses HTTP polling about every 2 seconds.

## Rationale

- Polling is simple, testable, and matches the project constraints.
- In-memory storage is enough for the lab-sized room flow.
- Host tracking belongs on the room so start permissions can be enforced consistently.

## Alternatives Considered

- WebSockets: rejected because real-time push is out of scope.
- Persistent room/session storage: rejected because storage beyond memory is out of scope.
- Any-player start: rejected because Scenario 1 requires host-only start.

## Scope

- Included: create, join, host tracking, validation, room isolation, lobby polling, host-only start.
- Excluded: drawer assignment, drawing, guesses, scoring, results, and restart. Those are handled by later feature folders.
