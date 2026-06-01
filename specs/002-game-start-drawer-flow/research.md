# Phase 0: Research

## Decision 1: Game State Transition Mechanism
**Decision:** Use a REST endpoint for the host to start the game, relying on the existing HTTP polling in the frontend to propagate the state change (`'Lobby'` to `'Game'`). 
**Rationale:** The constitution strictly forbids WebSockets. HTTP polling is the mandated pattern for state synchronization.
**Alternatives considered:** Long-polling or Server-Sent Events (SSE). Rejected as simple HTTP polling is mandated.

## Decision 2: Secret Word Selection Logic
**Decision:** The backend will hold a hardcoded dictionary array in-memory. Upon starting, the backend selects 3 words and assigns them to the new round state.
**Rationale:** Database usage is prohibited. An in-memory array is sufficient and minimal.
**Alternatives considered:** Fetching words from an external public API. Rejected to maintain simplicity and self-containment.

## Decision 3: Secure Delivery of the Secret Word
**Decision:** The backend API will conditionally omit `wordOptions` and `secretWord` from the room state JSON payload if the requesting player's ID does not match the `drawerId`.
**Rationale:** Prevents cheating via network inspection. This strictly enforces the security requirement.
**Alternatives considered:** Encrypted payload fields. Rejected as simply omitting the data is more secure and simpler.
